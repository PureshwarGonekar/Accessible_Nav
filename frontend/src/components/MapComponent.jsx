import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import crowdIconImg from '../assets/icons/avoid-crowds.png';
import constructionIconImg from '../assets/icons/under-construction.png';
import warningIconImg from '../assets/icons/warning.png';

// Fix for default Leaflet markers in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
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

const MapComponent = ({ startCoords, endCoords, obstacles = [], nearbyHazards = [], routeGeometry, startName, endName }) => {
  // Center of India (fallback)
  const baseLat = 20.5937;
  const baseLng = 78.9629;

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
      default: iconUrl = warningIconImg;
    }

    return L.icon({
      iconUrl,
      iconSize: iconSize,
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', zIndex: 0 }}>
      <MapContainer center={startPos} zoom={13} style={{ height: '100%', width: '100%' }}>
        <ChangeView center={startPos} zoom={endPos ? 13 : 15} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={startPos}>
          <Popup>{startName || 'Start Location'}</Popup>
        </Marker>

        {endPos && (
          <Marker position={endPos}>
            <Popup>{endName || 'Destination'}</Popup>
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
