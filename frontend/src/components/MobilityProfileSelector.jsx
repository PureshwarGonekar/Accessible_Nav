import React from 'react';

export const profiles = [
    { id: 'Wheelchair', label: 'Wheelchair User', icon: '♿', desc: 'Avoids stairs, narrow paths, blocked ramps.' },
    { id: 'Walker', label: 'Walker / Crutches', icon: '🚶‍♂️', desc: 'Avoids slopes, crowds, uneven terrain.' },
    { id: 'Temporary', label: 'Temporary Injury', icon: '🦵', desc: 'Fewer steps, smoother surfaces.' },
    { id: 'Fatigue', label: 'Fatigue / Chronic', icon: '😓', desc: 'Frequent rest spots, shorter segments.' },
    { id: 'Cognitive', label: 'Cognitive Disability', icon: '🧠', desc: 'Simplified instructions, less complex routes.' },
    { id: 'Elderly', label: 'Elderly User', icon: '👵', desc: 'Large text, slower audio, extra confirmation.' },
];

const MobilityProfileSelector = ({ selectedProfile, onSelect }) => {
    return (
        <div className="mobility-selector" style={{ padding: '0', background: 'transparent', marginBottom: '10px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: 'hsl(var(--text-main))' }}>Select Mobility Profile</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                {profiles.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => onSelect(p.id)}
                        style={{
                            padding: '12px',
                            border: selectedProfile === p.id ? '1px solid hsl(var(--primary))' : '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            background: selectedProfile === p.id ? 'hsl(var(--primary))' : 'rgba(128,128,128,0.1)',
                            color: selectedProfile === p.id ? 'white' : 'hsl(var(--text-main))',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            transition: 'all 0.2s ease',
                            boxShadow: selectedProfile === p.id ? '0 4px 12px rgba(100, 80, 255, 0.3)' : 'none'
                        }}
                    >
                        <span style={{ fontSize: '24px', marginBottom: '4px' }}>{p.icon}</span>
                        <strong style={{ fontSize: '13px' }}>{p.label}</strong>
                    </button>
                ))}
            </div>
            <div style={{ marginTop: '12px', fontSize: '0.9rem', color: 'hsl(var(--text-muted))', minHeight: '20px' }}>
                {profiles.find(p => p.id === selectedProfile)?.desc}
            </div>
        </div>
    );
};

export default MobilityProfileSelector;
