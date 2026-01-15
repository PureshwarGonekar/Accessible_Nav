import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle, GeoJSON, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import crowdIconImg from '../assets/icons/avoid-crowds.png';
import constructionIconImg from '../assets/icons/under-construction.png';
import warningIconImg from '../assets/icons/warning.png';
import greenMarker from '../assets/icons/green_marker.png'; // Assuming this exists for start
import redMarker from '../assets/icons/red_marker.png';     // Assuming this exists for end
import stopMarker from '../assets/icons/stop_marker.png';

// Fix for default Leaflet markers in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom Icons
const StartIcon = new L.Icon({
  iconUrl: greenMarker,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const EndIcon = new L.Icon({
  iconUrl: redMarker,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const StopIcon = new L.Icon({
  iconUrl: stopMarker,
  iconSize: [35, 35], // Slightly smaller than start/end
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

const UserIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',
  iconSize: [20, 20],
  className: 'user-location-pulse'
});

// Helper component to update map view when props change
function ChangeView({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;

    const target = L.latLng(center);
    const current = map.getCenter();

    // Only update if distance is significant (> 100 meters) or zoom is very different
    // This prevents re-centering when user is just tweaking the view or when rounding errors occur
    if (current.distanceTo(target) > 100 || Math.abs(map.getZoom() - zoom) > 2) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

const MapComponent = ({ startCoords, endCoords, obstacles = [], nearbyHazards = [], routeGeometry, startName, endName, stops = [], darkMode = false, hideRouteMarkers = false, showUserLocation = false }) => {
  // Center of India (fallback)
  const baseLat = 20.5937;
  const baseLng = 78.9629;
  const mapRef = useRef(null);

  const getLatLng = (loc) => {
    if (!loc) return null;
    if (typeof loc === 'object' && loc.lat && loc.lng) return [parseFloat(loc.lat), parseFloat(loc.lng)];
    if (Array.isArray(loc)) return loc;

    // Fallback for simulation strings if needed, though we try to avoid this now
    if (typeof loc === 'string') {
      let hash = 0;
      for (let i = 0; i < loc.length; i++) hash = loc.charCodeAt(i) + ((hash << 5) - hash);
      const latOffset = (hash % 100) / 10000;
      const lngOffset = (hash % 100) / 10000;
      return [baseLat + latOffset, baseLng + lngOffset];
    }
    return [baseLat, baseLng];
  };

  const startPos = useMemo(() => getLatLng(startCoords) || [baseLat, baseLng], [startCoords]);
  const endPos = useMemo(() => getLatLng(endCoords), [endCoords]);

  const getMarkerIcon = (type) => {
    let iconUrl = warningIconImg;
    let iconSize = [32, 32];

    switch (type) {
      case 'Crowd': iconUrl = crowdIconImg; break;
      case 'Construction': iconUrl = constructionIconImg; break;
      case 'Obstacle': iconUrl = warningIconImg; break;
      case 'Slope': iconUrl = warningIconImg; break;
      case 'Rest': return new L.Icon.Default(); // Use default blue pin for rest spots
      case 'Info': return new L.Icon.Default();
      default: iconUrl = warningIconImg;
    }

    return L.icon({
      iconUrl,
      iconSize: iconSize,
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  // Fit bounds if coords change
  useEffect(() => {
    if (mapRef.current && (startCoords || endCoords || (stops && stops.length > 0))) {
      const bounds = L.latLngBounds();
      if (startCoords) bounds.extend([startCoords.lat, startCoords.lng]);
      if (endCoords) bounds.extend([endCoords.lat, endCoords.lng]);

      // Include stops in bounds
      if (stops && stops.length > 0) {
        stops.forEach(s => {
          if (s.lat && s.lng) bounds.extend([s.lat, s.lng]);
        });
      }

      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [startCoords, endCoords, stops, routeGeometry]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0 }}>
      <MapContainer
        center={startCoords ? [startCoords.lat, startCoords.lng] : [baseLat, baseLng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          url={darkMode
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          }
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* Zoom Control */}
        <ZoomControl position="bottomright" />

        {/* Start Marker */}
        {startCoords && !hideRouteMarkers && (
          <Marker position={[startCoords.lat, startCoords.lng]} icon={StartIcon}>
            <Popup className="custom-popup">
              <strong>Start</strong><br />{startName || "Origin"}
            </Popup>
          </Marker>
        )}

        {/* User Location Marker (Pulse) */}
        {startCoords && showUserLocation && (
          <Marker position={[startCoords.lat, startCoords.lng]} icon={UserIcon}>
            <Popup className="custom-popup">
              <strong>You are here</strong>
            </Popup>
          </Marker>
        )}

        {/* Stop Markers */}
        {stops && stops.map((stop, i) => (
          stop.lat && stop.lng ? (
            <Marker key={i} position={[stop.lat, stop.lng]} icon={StopIcon}>
              <Popup className="custom-popup">
                <strong>Stop {i + 1}</strong>
              </Popup>
            </Marker>
          ) : null
        ))}

        {/* End Marker */}
        {endCoords && !hideRouteMarkers && (
          <Marker position={[endCoords.lat, endCoords.lng]} icon={EndIcon}>
            <Popup className="custom-popup">
              <strong>Destination</strong><br />{endName || "Destination"}
            </Popup>
          </Marker>
        )}

        {/* Render Route Geometry if available */}
        {routeGeometry && (
          <GeoJSON
            key={JSON.stringify(routeGeometry)} // Force re-render on change
            data={routeGeometry}
            style={{ color: 'hsl(var(--primary))', weight: 5, opacity: 0.7 }}
          />
        )}

        {/* Fallback Polyline if no geometry but we have end points */}
        {endPos && !routeGeometry && (
          <Polyline positions={[startPos, endPos]} color="hsl(var(--primary))" weight={5} opacity={0.4} dashArray="10, 10" />
        )}

        {/* Obstacles */}
        {obstacles.map((obs, idx) => (
          <Marker key={idx} position={[startPos[0] + 0.001, startPos[1] + 0.001]}>
            <Popup>{obs.message}</Popup>
          </Marker>
        ))}

        {/* Detailed Hazards */}
        {nearbyHazards && nearbyHazards.length > 0 && (
          <>
            <Circle
              center={startPos}
              radius={1000}
              pathOptions={{ fillColor: 'red', color: 'red', opacity: 0.1, fillOpacity: 0.05 }}
            />
            {nearbyHazards.map((hazard, hIdx) => (
              <Marker
                key={`haz-${hIdx}`}
                position={[hazard.lat, hazard.lng]}
                icon={getMarkerIcon(hazard.type)}
              >
                <Popup>
                  <strong>{hazard.type}</strong><br />
                  {hazard.details}
                </Popup>
              </Marker>
            ))}
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
