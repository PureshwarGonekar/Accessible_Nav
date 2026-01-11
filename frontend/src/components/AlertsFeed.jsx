import React, { useState, useEffect } from 'react';
import { AlertTriangle, CloudRain, Users, AlertOctagon } from 'lucide-react';

import api from '../api';

const AlertsFeed = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const { data } = await api.get('/alerts');
        // Map backend fields to frontend UI
        // Backend: { type, message, severity, created_at }
        // Frontend expects: { id, type, title, time, icon, color }
        const mappedAlerts = data.map(alert => ({
          id: alert.id,
          type: alert.type.toLowerCase(),
          title: alert.message,
          time: new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          icon: getIconForType(alert.type),
          color: getColorForSeverity(alert.severity)
        }));
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

        <div style={{ display: 'grid', gap: '16px' }}>
            {alerts.map(alert => (
                <div key={alert.id} className="card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '12px', 
                        background: alert.color.replace(')', ', 0.1)'), 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: alert.color
                    }}>
                        <alert.icon size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong>{alert.title}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>{alert.time}</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'hsl(var(--text-muted))' }}>
                            Reported by community members • Verified
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default AlertsFeed;
