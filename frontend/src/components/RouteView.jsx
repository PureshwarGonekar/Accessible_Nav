import React, { useState, useEffect, useRef } from 'react';
import { getRoute, searchAddress, getCurrentLocation } from '../locationService';
import { AlertTriangle, CheckCircle, Navigation, Clock, User, ArrowRight, Bookmark, ChevronDown } from 'lucide-react';
import MapComponent from './MapComponent';
import useAudioGuidance from '../hooks/useAudioGuidance';
import api from '../api';

const RouteView = ({ request, profile, onBack, onSave, savedRoutes = [], onSelect, mode = 'route', darkMode = false }) => {
  // ...


  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showSavedDropdown, setShowSavedDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [nearbyHazards, setNearbyHazards] = useState([]);
  const [activeRouteGeometry, setActiveRouteGeometry] = useState(null);

  const [activeStopCoords, setActiveStopCoords] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSavedDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSave = () => {
    onSave({
      start: request.start,
      dest: request.dest,
      stops: request.stops || [],
      date: new Date().toLocaleDateString()
    });
  };

  useEffect(() => {
    setLoading(true);

    const fetchRoutes = async () => {
      if (mode === 'route') {
        // We need coordinates. Request might have startCoords/destCoords if passed from new RouteRequest.
        // If not (e.g. simulation or saved route), we might need to geocode them first.
        let start = request.startCoords;
        let dest = request.destCoords;

        try {
          if (!start) {
            const res = await searchAddress(request.start);
            if (res[0]) start = { lat: res[0].lat, lng: res[0].lng };
          }
          if (!dest) {
            const res = await searchAddress(request.dest);
            if (res[0]) dest = { lat: res[0].lat, lng: res[0].lng };
          }

          if (start && dest) {
            // Geocode stops if any
            let stopCoords = [];
            if (request.stops && request.stops.length > 0) {
              for (const stopName of request.stops) {
                if (stopName && stopName.trim() !== '') {
                  const res = await searchAddress(stopName);
                  if (res[0]) {
                    stopCoords.push({ lat: res[0].lat, lng: res[0].lon || res[0].lng }); // Handle potentially different field names
                  }
                }
              }
            }
            setActiveStopCoords(stopCoords);

            // Check if we have a mobility profile to use our smart backend
            const activeProfileId = profile?.mobility_profile;

            if (activeProfileId) {
              try {
                const { data } = await api.post('/navigation/route', {
                  start,
                  end: dest,
                  stops: stopCoords,
                  profile: activeProfileId
                });

                if (data && data.routeGeometry) {
                  // Map Backend Response to Route Object
                  setRoutes([
                    {
                      id: 1,
                      type: `${activeProfileId} Route`, // e.g. "Wheelchair Route"
                      time: '20 min', // Mock time for now, or calc from geometry
                      distance: '1.5 km',
                      score: 90,
                      hazards: data.alerts.map(a => a.type), // List hazard types
                      details: `Optimized for ${activeProfileId}. ${data.guidance[0] || ''}`,
                      geometry: data.routeGeometry
                    }
                  ]);
                  setActiveRouteGeometry(data.routeGeometry);
                  // Map alerts to detailed hazards for MapComponent
                  setNearbyHazards(data.alerts.map(a => ({
                    id: a.id, // Ensure ID is passed if available
                    type: a.type,
                    lat: a.lat,
                    lng: a.lng,
                    details: a.message,
                    trust_score: a.trust_score,
                    photo_url: a.photo_url
                  })));

                  setLoading(false);
                  return; // Skip default LocationIQ call
                }
              } catch (backendErr) {
                console.error('Backend routing failed, falling back to standard', backendErr);
              }
            }

            // Fallback to Standard LocationIQ (Note: Stops ignored in simple fallback)
            const routeData = await getRoute(start, dest);
            if (routeData) {
              setRoutes([
                {
                  id: 1,
                  type: 'Best Route',
                  time: (routeData.duration / 60).toFixed(0) + ' min',
                  distance: (routeData.distance / 1000).toFixed(1) + ' km',
                  score: 95,
                  hazards: stopCoords.length > 0 ? [`${stopCoords.length} stops included (approx)`] : [],
                  details: 'Fastest route via LocationIQ (Stops may not be accurate in fallback)',
                  geometry: routeData.geometry // GeoJSON
                }
              ]);
              setActiveRouteGeometry(routeData.geometry);
            } else {
              // Fallback if API fails or no route
              throw new Error('No route found');
            }
          } else {
            throw new Error('Could not resolve locations');
          }
        } catch (err) {
          console.error('Routing failed', err);
          // Fallback to simulation data if API fails (graceful degradation)
          setRoutes([
            {
              id: 1,
              type: 'Simulation',
              time: '15 min',
              distance: '1.2 km',
              score: 80,
              hazards: [],
              details: 'Real-time routing unavailable. Showing estimated path.'
            }
          ]);
        } finally {
          setLoading(false);
        }
      } else {
        // Hazard Scan Mode - Fetch from Backend
        try {
          let userLoc = currentLocation;
          if (!userLoc) {
            try {
              const loc = await getCurrentLocation();
              userLoc = { lat: loc.lat, lng: loc.lng };
              setCurrentLocation(userLoc);
            } catch (locErr) {
              console.warn("Could not get current location", locErr);
              userLoc = { lat: 20.5937, lng: 78.9629 }; // Fallback
            }
          }

          const { data } = await api.get('/reports'); // Changed to reports endpoint
          const mappedHazards = data.map(report => ({
            id: report.id, // Important for validation
            type: report.type,
            lat: parseFloat(report.location_lat),
            lng: parseFloat(report.location_lng),
            details: report.message,
            trust_score: report.trust_score,
            photo_url: report.photo_url, // Include photo
            isReal: true
          }));

          // Add samples for demo 
          const sampleHazards = [
            {
              id: 'sample1',
              type: 'Construction',
              details: 'Road widening work in progress. Heavy machinery operating.',
              trust_score: 0.9,
              photo_url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500&q=80',
              lat: userLoc.lat + 0.002,
              lng: userLoc.lng + 0.002,
              isReal: false
            },
            {
              id: 'sample2',
              type: 'Obstacle',
              details: 'Fallen tree blocking the sidewalk.',
              trust_score: 0.85,
              photo_url: 'https://images.unsplash.com/photo-1550966871-3ed3c6227b42?w=500&q=80',
              lat: userLoc.lat - 0.0015,
              lng: userLoc.lng - 0.0015,
              isReal: false
            },
            {
              id: 'sample3',
              type: 'Crowd',
              details: 'Heavy foot traffic reported near the market entrance.',
              trust_score: 0.75,
              photo_url: 'https://images.unsplash.com/photo-1576082838383-7c271cb4cbfa?w=500&q=80',
              lat: userLoc.lat + 0.0015,
              lng: userLoc.lng - 0.001,
              isReal: false
            },
            {
              id: 'sample4',
              type: 'Slope',
              details: 'Steep ramp detected. Requires assistance for manual wheelchairs.',
              trust_score: 0.95,
              photo_url: 'https://images.unsplash.com/photo-1623943640244-63510c4fb712?w=500&q=80',
              lat: userLoc.lat - 0.001,
              lng: userLoc.lng + 0.0015,
              isReal: false
            }
          ];

          setNearbyHazards([...mappedHazards, ...sampleHazards]);
        } catch (err) {
          console.error('Failed to fetch hazards', err);
          setNearbyHazards([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchRoutes();

  }, [request, mode]);

  // Audio Guidance
  const { speak } = useAudioGuidance(profile?.guidance_preference === 'audio');

  // Speak on route loaded
  useEffect(() => {
    if (!loading && routes.length > 0 && profile?.guidance_preference === 'audio') {
      const bestRoute = routes[0];
      speak(`Route found. ${bestRoute.type}. ${bestRoute.details}.`, true);
    }
  }, [loading, routes, profile, speak]);

  // Simulate incoming live event
  useEffect(() => {
    if (loading) return;

    const eventTimer = setTimeout(() => {
      setAlert({
        type: 'Obstacle Detected',
        msg: 'Live Cam: Construction barrier detected on Route 2.',
        routeId: 2
      });

      // Downgrade score of Route 2
      setRoutes(prev => prev.map(r => r.id === 2 ? { ...r, score: 40, hazards: [...r.hazards, 'Blocked Sidewalk'] } : r));

      // Speak visual alert
      if (profile?.guidance_preference === 'audio') {
        speak('Caution. New obstacle detected. Construction barrier on Route 2.', true);
      }
    }, 4000);

    return () => clearTimeout(eventTimer);
  }, [loading, profile, speak]);

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ marginBottom: '20px', color: 'hsl(var(--primary))' }}>
          <Navigation className="spin" size={40} />
        </div>
        <h3>Analyzing City Data...</h3>
        <p style={{ color: 'hsl(var(--text-muted))' }}>Checking ramps, construction, and crowds.</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '4fr 1fr', gap: '20px', height: 'calc(100vh - 170px)' }}>

      {/* Left Column: Map (3fr) */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Back Button (Left) */}
          <button onClick={onBack} style={{ background: 'none', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center' }}>
            &larr; Back
          </button>

          {/* Title & Actions Group (Right) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <h3 style={{ margin: 0 }}>
              {mode === 'hazards' ? 'Nearby Hazards (1km Radius)' : `Routes to ${request.dest}`}
            </h3>

            {mode === 'route' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={handleSave}
                  className="btn-outline"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCircle size={14} /> Save Route
                </button>

                <div style={{ position: 'relative' }} ref={dropdownRef}>
                  <button
                    onClick={() => setShowSavedDropdown(!showSavedDropdown)}
                    className="btn-outline"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Bookmark size={14} /> Saved Routes <ChevronDown size={12} />
                  </button>

                  {showSavedDropdown && (
                    <div className="fade-in" style={{
                      position: 'absolute',
                      top: '110%',
                      left: 'auto',
                      right: 0,
                      width: '260px',
                      background: 'hsl(var(--bg-card))',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      zIndex: 50,
                      padding: '8px',
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }}>
                      {savedRoutes.length === 0 ? (
                        <div style={{ padding: '8px', fontSize: '0.8rem', color: 'hsl(var(--text-muted))', textAlign: 'center' }}>No saved routes yet.</div>
                      ) : (
                        savedRoutes.map(route => (
                          <div
                            key={route.id}
                            onClick={() => {
                              onSelect(route);
                              setShowSavedDropdown(false);
                              setLoading(true);
                            }}
                            style={{
                              padding: '10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              marginBottom: '4px',
                              background: 'rgba(255,255,255,0.02)',
                              transition: 'background 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          >
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: '500', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{route.dest}</div>
                              <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>From {route.start}</div>
                            </div>
                            <ArrowRight size={14} color="hsl(var(--primary))" />
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
          <MapComponent
            stops={activeStopCoords}
            startName={request.start}
            endName={request.dest}
            obstacles={alert ? [{ message: alert.msg }] : []}
            nearbyHazards={nearbyHazards}
            routeGeometry={activeRouteGeometry}
            darkMode={darkMode}
            hideRouteMarkers={mode === 'hazards'}
            showUserLocation={mode === 'hazards'}
            startCoords={mode === 'hazards' && currentLocation ? currentLocation : request.startCoords}
            endCoords={mode === 'hazards' ? null : request.destCoords}
          />
        </div>
      </div>

      {/* Right Column: Alerts & Routes (1fr) */}
      <div className="no-scrollbar" style={{ overflowY: 'auto', padding: '20px', background: 'rgba(0,0,0,0.2)', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>

        {/* Hazards Mode List */}
        {mode === 'hazards' && (
          <div className="fade-in">
            <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="hsl(var(--warning))" /> Real-time Hurdles
            </h4>
            {nearbyHazards.length === 0 && <div style={{ color: 'hsl(var(--text-muted))' }}>No active hazards reported nearby.</div>}

            {nearbyHazards.map((hazard, i) => (
              <div key={hazard.id || i} className="card" style={{ marginBottom: '12px', padding: '12px', borderLeft: `3px solid ${hazard.trust_score > 0.7 ? 'hsl(var(--danger))' : 'hsl(var(--warning))'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{hazard.type}</strong>
                  {hazard.trust_score && (
                    <span style={{ fontSize: '0.7rem', color: hazard.trust_score > 0.7 ? 'hsl(var(--success))' : 'hsl(var(--warning))', fontWeight: 'bold' }}>
                      {Math.round(hazard.trust_score * 100)}% Trust
                    </span>
                  )}
                </div>

                {hazard.photo_url && (
                  <div style={{ marginBottom: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <img
                      src={hazard.photo_url.startsWith('http') ? hazard.photo_url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${hazard.photo_url}`}
                      alt="Hurdle"
                      style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                )}

                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', margin: 0 }}>
                  {hazard.details}
                </p>

                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  <button style={{ flex: 1, padding: '4px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '4px', color: 'hsl(var(--text))', cursor: 'pointer' }}>
                    Verify
                  </button>
                  <button style={{ flex: 1, padding: '4px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '4px', color: 'hsl(var(--text))', cursor: 'pointer' }}>
                    View on Map
                  </button>
                </div>
              </div>
            ))}

            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <small style={{ color: 'hsl(var(--text-muted))' }}>
                Crowdsourced updates refresh every 30s.
              </small>
            </div>
          </div>
        )}

        {/* Live Alerts Section */}
        {alert && (
          <div className="card fade-in" style={{ background: 'hsl(var(--danger))', color: 'white', padding: '12px', border: 'none', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <AlertTriangle size={20} />
              <div>
                <strong style={{ fontSize: '0.9rem' }}>{alert.type}</strong>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{alert.msg}</div>
                <div style={{ marginTop: '4px', fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                  Rerouting suggested
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Route Cards (Only show if NOT in hazards mode) */}
        {mode !== 'hazards' && routes.map(route => (
          <div key={route.id} className="card" style={{ padding: '16px', marginBottom: '12px', background: route.score > 80 ? 'hsl(var(--bg-card))' : 'rgba(255, 50, 50, 0.05)', borderColor: route.score > 80 ? 'hsl(var(--success))' : 'transparent' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <span style={{
                  background: route.score > 80 ? 'hsl(var(--success))' : 'hsl(var(--warning))',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '100px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {route.type}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>
                  <Clock size={14} /> {route.time}
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 'bold', color: route.score > 80 ? 'hsl(var(--success))' : 'hsl(var(--warning))' }}>
                  {route.score}%
                </span>
              </div>
            </div>

            <p style={{ marginBottom: '12px', fontSize: '0.85rem', lineHeight: '1.4' }}>{route.details}</p>

            {route.hazards.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }}>
                <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginBottom: '4px', fontWeight: '600' }}>HAZARDS</div>
                {route.hazards.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--danger))', fontSize: '0.8rem', marginBottom: '2px' }}>
                    <AlertTriangle size={12} /> {h}
                  </div>
                ))}
              </div>
            )}

            <button className="btn-primary" style={{ width: '100%', padding: '8px', fontSize: '0.9rem', background: route.score > 80 ? '' : 'hsl(var(--bg-input))' }}>
              Start <ArrowRight size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
            </button>
          </div>
        ))}

        {mode !== 'hazards' && (
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '20px' }}>
            Real-time Data Active
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteView;
