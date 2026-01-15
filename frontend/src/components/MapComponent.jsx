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
import { ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import api from '../api';

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
  iconSize: [35, 35],
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

  console.log("nearbyHazards", nearbyHazards);

  const getLatLng = (loc) => {
    if (!loc) return null;
    if (typeof loc === 'object' && loc.lat && loc.lng) return [parseFloat(loc.lat), parseFloat(loc.lng)];
    if (Array.isArray(loc)) return loc;
    return [baseLat, baseLng];
  };

  const startPos = useMemo(() => getLatLng(startCoords) || [baseLat, baseLng], [startCoords]);
  const endPos = useMemo(() => getLatLng(endCoords), [endCoords]);

  // Handle Validation Vote
  const handleVote = async (reportId, vote) => {
    try {
      await api.post(`/reports/${reportId}/validate`, { vote });
      alert('Thank you for validating this report!');
      // Ideally, we'd trigger a parent re-fetch here, but WebSockets should handle it
    } catch (err) {
      console.error("Vote failed", err);
      alert(err.response?.data?.message || "Failed to submit vote.");
    }
  };

  const getMarkerIcon = (type, trustScore = 1.0) => {
    // Determine Color based on Trust Score
    let colorFilter = '';
    if (trustScore >= 0.7) {
      // Red - Confirmed (Default icon is usually blue/orange, so we stick to robust icons or tint)
      // For simplicity with image icons, we can't easily tint them without CSS classes.
      // But we can use style prop in Marker? No.
      // We'll trust the icon type itself mostly.
    } else if (trustScore < 0.4) {
      // Gray - Low confidence
      colorFilter = 'grayscale(100%) opacity(0.6)';
    }

    let iconUrl = warningIconImg;
    let iconSize = [32, 32];

    switch (type) {
      case 'Crowd': iconUrl = crowdIconImg; break;
      case 'Construction': iconUrl = constructionIconImg; break;
      case 'Obstacle': iconUrl = warningIconImg; break;
      case 'Slope': iconUrl = warningIconImg; break;
      case 'Rest': return new L.Icon.Default();
      case 'Info': return new L.Icon.Default();
      default: iconUrl = warningIconImg;
    }

    return L.icon({
      iconUrl,
      iconSize: iconSize,
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
      className: trustScore < 0.4 ? 'marker-low-trust' : (trustScore >= 0.7 ? 'marker-high-trust' : '')
    });
  };

  // Fit bounds if coords change
  useEffect(() => {
    if (mapRef.current && (startCoords || endCoords || (stops && stops.length > 0))) {
      const bounds = L.latLngBounds();
      if (startCoords) bounds.extend([startCoords.lat, startCoords.lng]);
      if (endCoords) bounds.extend([endCoords.lat, endCoords.lng]);

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
      {/* CSS for low trust markers */}
      <style>{`
        .marker-low-trust {
            filter: grayscale(100%) opacity(0.7);
        }
        .marker-high-trust {
            border: 2px solid red; /* doesn't work well on img tag directly */
            /* Using drop-shadow for effect */
            filter: drop-shadow(0 0 5px red);
        }
      `}</style>

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
            key={JSON.stringify(routeGeometry)}
            data={routeGeometry}
            style={{ color: 'hsl(var(--primary))', weight: 5, opacity: 0.7 }}
          />
        )}

        {/* Fallback Polyline */}
        {endPos && !routeGeometry && (
          <Polyline positions={[startPos, endPos]} color="hsl(var(--primary))" weight={5} opacity={0.4} dashArray="10, 10" />
        )}

        {/* Obstacles (Route-based) */}
        {obstacles.map((obs, idx) => {
          if (!obs || typeof obs.lat === 'undefined' || typeof obs.lng === 'undefined') return null;
          return (
            <Marker key={idx} position={[obs.lat, obs.lng]} icon={getMarkerIcon(obs.type, obs.trust_score)}>
              <Popup>
                {/* ... popup content ... */}
                <div style={{ maxWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong>{obs.type || 'Obstacle'}</strong>
                    {obs.trust_score && (
                      <span style={{ fontSize: '0.7rem', color: obs.trust_score > 0.7 ? 'green' : (obs.trust_score < 0.4 ? 'gray' : 'orange'), fontWeight: 'bold' }}>
                        {Math.round(obs.trust_score * 100)}% Trust
                      </span>
                    )}
                  </div>

                  {obs.photo_url && (
                    <div style={{ marginBottom: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <img
                        src={obs.photo_url.startsWith('http') ? obs.photo_url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${obs.photo_url}`}
                        alt="Obstacle"
                        style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '120px', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  <div style={{ fontSize: '0.9rem' }}>{obs.message}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Detailed Hazards (New Community Reports) */}
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
                icon={getMarkerIcon(hazard.type, hazard.trust_score)}
              >
                <Popup>
                  <div style={{ maxWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong>{hazard.type}</strong>
                      {hazard.trust_score && (
                        <span style={{ fontSize: '0.7rem', color: hazard.trust_score > 0.7 ? 'green' : (hazard.trust_score < 0.4 ? 'gray' : 'orange'), fontWeight: 'bold' }}>
                          {Math.round(hazard.trust_score * 100)}% Trust
                        </span>
                      )}
                    </div>

                    {hazard.photo_url && (
                      <div style={{ marginBottom: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <img
                          src={hazard.photo_url.startsWith('http') ? hazard.photo_url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${hazard.photo_url}`}
                          alt="Obstacle"
                          style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '120px', objectFit: 'cover' }}
                        />
                      </div>
                    )}

                    <div style={{ fontSize: '0.9rem', marginBottom: '10px' }}>{hazard.details}</div>

                    {hazard.isReal && (
                      <div style={{ paddingTop: '8px', borderTop: '1px solid #ddd' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px', color: '#555' }}>Is this still here?</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleVote(hazard.id, 'confirm')}
                            style={{ flex: 1, padding: '4px', border: '1px solid green', background: 'rgba(0,255,0,0.1)', color: 'green', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                          >
                            <ThumbsUp size={12} /> Yes
                          </button>
                          <button
                            onClick={() => handleVote(hazard.id, 'deny')}
                            style={{ flex: 1, padding: '4px', border: '1px solid red', background: 'rgba(255,0,0,0.1)', color: 'red', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                          >
                            <ThumbsDown size={12} /> No
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
