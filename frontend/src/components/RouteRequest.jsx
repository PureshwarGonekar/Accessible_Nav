import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search, ArrowUpDown, Plus, X, ArrowRight, Loader } from 'lucide-react';
import { getCurrentLocation, searchAddress } from '../locationService';

const RouteRequest = ({ onSearch, profile, savedRoutes = [] }) => {
  const [start, setStart] = useState('Current Location');
  const [startCoords, setStartCoords] = useState(null);

  const [dest, setDest] = useState('');

  const [destCoords, setDestCoords] = useState(null);

  const [initialUserPos, setInitialUserPos] = useState(null); // For biasing start searches

  const [stops, setStops] = useState([]); // Array of { value, coords } objects

  const [isSearching, setIsSearching] = useState(false);

  const [destSuggestions, setDestSuggestions] = useState([]);
  const [startSuggestions, setStartSuggestions] = useState([]);

  const [stopSuggestions, setStopSuggestions] = useState([]);
  const [activeSuggestionField, setActiveSuggestionField] = useState(null); // 'start', 'dest', or 'stop-Index'
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  // Debounce helper
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeSuggestionField === 'dest' && dest && dest.length > 2) {
        setIsFetchingSuggestions(true);
        // Bias by start location if available
        const biasLat = startCoords ? startCoords.lat : null;
        const biasLng = startCoords ? startCoords.lng : null;

        searchAddress(dest, biasLat, biasLng).then(results => {
          setDestSuggestions(results);
          setIsFetchingSuggestions(false);
        });
      } else if (activeSuggestionField === 'start' && start && start !== 'Current Location' && start.length > 2) {
        setIsFetchingSuggestions(true);
        searchAddress(start, initialUserPos?.lat, initialUserPos?.lng).then(results => {
          setStartSuggestions(results);
          setIsFetchingSuggestions(false);
        });
      } else if (activeSuggestionField && activeSuggestionField.startsWith('stop-')) {
        const index = parseInt(activeSuggestionField.split('-')[1]);
        const stopValue = stops[index]?.value;

        if (stopValue && stopValue.length > 2) {
          setIsFetchingSuggestions(true);
          // Bias by previous stop or start
          const prev = index > 0 ? stops[index - 1].coords : startCoords;

          searchAddress(stopValue, prev?.lat, prev?.lng).then(results => {
            setStopSuggestions(results);
            setIsFetchingSuggestions(false);
          });
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [dest, start, stops, activeSuggestionField]);

  // Initial Location
  useEffect(() => {
    // Get current location strictly for biasing purposes
    getCurrentLocation()
      .then(pos => {
        setInitialUserPos({ lat: pos.lat, lng: pos.lng });
        if (start === 'Current Location') {
          setStartCoords({ lat: pos.lat, lng: pos.lng });
        }
      })
      .catch(err => console.warn('Location access denied', err));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!dest) return;

    setIsSearching(true);
    onSearch({
      start,
      startCoords,
      dest,
      destCoords,
      // Pass full stop objects if possible, or just values. 
      // Current onSearch expects mapped strings? 
      // Let's pass the array of objects {value, coords} so RouteView doesn't have to re-geocode if we already found them!
      // But RouteView logic currently expects strings and does geocoding. 
      // Let's pass strings for compatibility OR update RouteView.
      // RouteView currently does: for (const stopName of request.stops) ... searchAddress(stopName).
      // If we pass coords, we can skip that.
      // Let's update onSearch to pass simple structure but include coords if we have them.
      // Actually, maintaining current contract (strings) is safer for now unless we refactor RouteView significantly.
      // We will rely on RouteView to geocode for verification, OR we can pass coords if we have them.
      // Let's stick to existing contract: stops: stops.map(s => s.value)
      stops: stops.map(s => s.value)
    });
    setIsSearching(false);
  };

  const handleFlip = () => {
    const tempStart = start;
    const tempStartCoords = startCoords;
    setStart(dest);
    setStartCoords(destCoords);
    setDest(tempStart);
    setDestCoords(tempStartCoords);
  };

  const handleSelectSuggestion = (field, item) => {
    if (field === 'dest') {
      setDest(item.display_name);
      setDestCoords({ lat: item.lat, lng: item.lng });
      setDestSuggestions([]);
    } else if (field === 'start') {
      setStart(item.display_name);
      setStartCoords({ lat: item.lat, lng: item.lng });
      setStartSuggestions([]);
    } else if (field.startsWith('stop-')) {
      const index = parseInt(field.split('-')[1]);
      const newStops = [...stops];
      newStops[index].value = item.display_name;
      newStops[index].coords = { lat: item.lat, lng: item.lng };
      setStops(newStops);
      setStopSuggestions([]);
    }
    setActiveSuggestionField(null);
  };

  const handleUseCurrentLocation = () => {
    setStart('Current Location');
    setStartSuggestions([]);
    getCurrentLocation()
      .then(pos => setStartCoords({ lat: pos.lat, lng: pos.lng }))
      .catch(err => {
        alert('Could not get location.');
        setStart('');
      });
  };

  return (
    <div className="card fade-in" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: 'hsl(var(--primary))', margin: 0 }}>Where to?</h2>
        <div style={{ fontSize: '0.8rem', padding: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px' }}>
          Profile: {profile?.wheelchair ? 'Wheelchair' : profile?.walker ? 'Walker' : 'Standard'}
        </div>
      </div>

      <form onSubmit={handleSearch}>
        {/* Start Location */}
        <div className="input-group" style={{ marginBottom: '12px', position: 'relative' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <MapPin size={20} style={{ position: 'absolute', left: '16px', color: 'hsl(var(--primary))' }} />
            <input
              type="text"
              className="input-field"
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
                setActiveSuggestionField('start');
              }}
              onFocus={() => setActiveSuggestionField('start')}
              style={{ paddingLeft: '48px', flex: 1 }}
              placeholder="Start Location"
            />
          </div>
          {/* Start Suggestions */}
          {activeSuggestionField === 'start' && (startSuggestions.length > 0 || start === '' || isFetchingSuggestions) && (
            <div className="suggestions-dropdown" style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'hsl(var(--bg-card))', border: '1px solid rgba(255,255,255,0.1)',
              zIndex: 20, borderRadius: '8px', overflow: 'hidden',
              marginTop: '4px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}>
              {start !== 'Current Location' && !isFetchingSuggestions && start.length < 3 && (
                <div
                  onClick={handleUseCurrentLocation}
                  style={{ padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(var(--primary))' }}
                >
                  <Navigation size={14} /> Use Current Location
                </div>
              )}
              {isFetchingSuggestions && (
                <div style={{ padding: '12px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                  <Loader className="spin" size={16} /> Loading...
                </div>
              )}
              {!isFetchingSuggestions && startSuggestions.length === 0 && start.length > 2 && (
                <div style={{ padding: '12px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>No location found</div>
              )}
              {!isFetchingSuggestions && startSuggestions.map((item, i) => (
                <div key={i} onClick={() => handleSelectSuggestion('start', item)} style={{ padding: '12px', cursor: 'pointer', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontWeight: '500', color: 'hsl(var(--text-primary))' }}>{item.main_text}</div>
                  <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                    {item.secondary_text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Flip Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px', marginRight: '8px' }}>
          <button
            type="button"
            onClick={handleFlip}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none', borderRadius: '50%', width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'hsl(var(--text-muted))'
            }}
          >
            <ArrowUpDown size={16} />
          </button>
        </div>

        {/* Stops */}
        {stops.map((stop, index) => (
          <div key={index} className="input-group" style={{ marginBottom: '12px', position: 'relative' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: '20px', width: '6px', height: '6px', borderRadius: '50%', background: 'hsl(var(--text-muted))' }}></div>
              <input
                type="text"
                className="input-field"
                placeholder={`Stop ${index + 1}`}
                value={stop.value}
                onChange={(e) => {
                  const newStops = [...stops];
                  newStops[index].value = e.target.value;
                  setStops(newStops);
                  setActiveSuggestionField(`stop-${index}`);
                }}
                onFocus={() => setActiveSuggestionField(`stop-${index}`)}
                style={{ paddingLeft: '48px', flex: 1 }}
              />
              <button
                type="button"
                onClick={() => {
                  const newStops = stops.filter((_, i) => i !== index);
                  setStops(newStops);
                }}
                style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', padding: '0 8px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Stop Suggestions */}
            {activeSuggestionField === `stop-${index}` && (stopSuggestions.length > 0 || isFetchingSuggestions) && (
              <div className="suggestions-dropdown" style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'hsl(var(--bg-card))', border: '1px solid rgba(255,255,255,0.1)',
                zIndex: 20, borderRadius: '8px', overflow: 'hidden',
                marginTop: '4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}>
                {isFetchingSuggestions && (
                  <div style={{ padding: '12px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                    <Loader className="spin" size={16} /> Loading...
                  </div>
                )}
                {!isFetchingSuggestions && stopSuggestions.length === 0 && stop.value.length > 2 && (
                  <div style={{ padding: '12px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>No location found</div>
                )}
                {!isFetchingSuggestions && stopSuggestions.map((item, i) => (
                  <div key={i} onClick={() => handleSelectSuggestion(`stop-${index}`, item)} style={{ padding: '12px', cursor: 'pointer', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontWeight: '500', color: 'hsl(var(--text-primary))' }}>{item.main_text}</div>
                    <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                      {item.secondary_text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Add Stop Button */}
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => setStops([...stops, { value: '', coords: null }])}
            style={{ background: 'none', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '20px', padding: '6px 12px', color: 'hsl(var(--text-muted))', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={14} /> Add Stop
          </button>
        </div>

        {/* Destination */}
        <div className="input-group" style={{ marginBottom: '24px', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <Navigation size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--secondary))' }} />
            <input
              type="text"
              className="input-field"
              value={dest}
              onChange={(e) => {
                setDest(e.target.value);
                setActiveSuggestionField('dest');
              }}
              onFocus={() => setActiveSuggestionField('dest')}
              style={{ paddingLeft: '48px' }}
              placeholder="Enter Destination"
            />
          </div>
          {/* Dest Suggestions */}
          {activeSuggestionField === 'dest' && (destSuggestions.length > 0 || isFetchingSuggestions) && (
            <div className="suggestions-dropdown" style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              background: 'hsl(var(--bg-card))', border: '1px solid rgba(255,255,255,0.1)',
              zIndex: 20, borderRadius: '8px', overflow: 'hidden', marginTop: '4px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}>
              {isFetchingSuggestions && (
                <div style={{ padding: '12px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                  <Loader className="spin" size={16} /> Loading...
                </div>
              )}
              {!isFetchingSuggestions && destSuggestions.length === 0 && dest.length > 2 && (
                <div style={{ padding: '12px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>No location found</div>
              )}
              {!isFetchingSuggestions && destSuggestions.map((item, i) => (
                <div key={i} onClick={() => handleSelectSuggestion('dest', item)} style={{ padding: '12px', cursor: 'pointer', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontWeight: '500', color: 'hsl(var(--text-primary))' }}>{item.main_text}</div>
                  <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                    {item.secondary_text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={isSearching}
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
        >
          {isSearching ? <><Loader className="spin" size={20} /> Finding Route...</> : <><Search size={20} /> Find Safe Route</>}
        </button>
      </form>

      {/* Close suggestions on background click */}
      {activeSuggestionField && (
        <div onClick={() => setActiveSuggestionField(null)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
      )}
    </div>
  );
};

export default RouteRequest;
