import React, { useState, useEffect } from 'react';
import { AlertTriangle, CloudRain, Users, AlertOctagon, Loader } from 'lucide-react';

import api from '../api';

const AlertsFeed = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // Get Location for Localized Mock Data
        let lat, lng;
        try {
          const loc = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve(pos.coords),
              (err) => reject(err)
            );
          });
          lat = loc.latitude;
          lng = loc.longitude;
        } catch (e) {
          console.warn("Location access denied for alerts, using default");
          lat = 20.5937; lng = 78.9629;
        }

        const { data } = await api.get(`/alerts?lat=${lat}&lng=${lng}`);

        // Helper to calc distance in meters
        const getDistance = (lat1, lon1, lat2, lon2) => {
          if (!lat1 || !lon1 || !lat2 || !lon2) return null;
          const R = 6371e3; // metres
          const φ1 = lat1 * Math.PI / 180;
          const φ2 = lat2 * Math.PI / 180;
          const Δφ = (lat2 - lat1) * Math.PI / 180;
          const Δλ = (lon2 - lon1) * Math.PI / 180;
          const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return Math.round(R * c);
        };

        const mappedAlerts = data.map(alert => {
          const dist = getDistance(lat, lng, alert.location_lat, alert.location_lng);
          return {
            id: alert.id,
            type: (alert.type || 'obstacle').toLowerCase(),
            title: alert.title || alert.message,
            message: alert.message,
            time: new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            icon: getIconForType(alert.type || 'obstacle'),
            color: getColorForSeverity(alert.severity),
            metadata: alert.metadata,
            suggestion: alert.suggestion,
            distance: dist // Store distance
          };
        });

        setAlerts(mappedAlerts);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch alerts', err);
        setLoading(false);
      }
    };

    fetchAlerts();
    // Optional: Poll every minute
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const getIconForType = (type) => {
    const lower = type.toLowerCase();
    if (lower.includes('rain') || lower.includes('weather')) return CloudRain;
    if (lower.includes('crowd')) return Users;
    if (lower.includes('accident') || lower.includes('blocked')) return AlertOctagon;
    return AlertTriangle;
  };

  const getColorForSeverity = (severity) => {
    const lower = (severity || 'medium').toLowerCase();
    if (lower === 'high') return 'hsl(var(--danger))';
    if (lower === 'low') return 'hsl(var(--info))';
    return 'hsl(var(--warning))';
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ color: 'hsl(var(--primary))' }}>Real-time Hurdles</h2>
        <p style={{ color: 'hsl(var(--text-muted))' }}>Live updates on city accessibility obstacles.</p>
      </div>

      {loading && (
        <div className="flex-center" style={{ padding: '60px', flexDirection: 'column', gap: '20px' }}>
          <Loader className="spin" size={40} color="hsl(var(--primary))" />
          <p style={{ color: 'hsl(var(--text-muted))' }}>Scanning for local hazards...</p>
        </div>
      )}

      {!loading && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {alerts.map(alert => (
            <div key={alert.id} className="card" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: alert.color.replace(')', ', 0.1)'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: alert.color,
                flexShrink: 0
              }}>
                <alert.icon size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '1rem' }}>{alert.title}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', whiteSpace: 'nowrap', marginLeft: '8px' }}>{alert.time}</span>
                </div>

                {/* Chips for Category/Type */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                    {alert.type.toUpperCase().replace('_', ' ')}
                  </span>

                  {/* Location/Distance Chip */}
                  {alert.distance !== null && (
                    <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: 'hsl(var(--success))', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      📍 {alert.distance < 1000 ? `${alert.distance}m` : `${(alert.distance / 1000).toFixed(1)}km`} away
                    </span>
                  )}

                  {alert.metadata && Object.entries(alert.metadata).map(([k, v]) => (
                    <span key={k} style={{ fontSize: '0.7rem', border: '1px solid rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '4px', color: 'hsl(var(--text-muted))' }}>
                      {k}: {v.toString()}
                    </span>
                  ))}
                </div>

                <div style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))', marginBottom: '8px' }}>
                  {alert.message || 'Reported by community'}
                </div>

                {/* Suggestion Box */}
                {alert.suggestion && (
                  <div style={{ background: 'rgba(0,255,0,0.05)', border: '1px solid rgba(0,255,0,0.1)', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'hsl(var(--success))', marginBottom: '2px' }}>
                      💡 Suggestion
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>{alert.suggestion}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertsFeed;
