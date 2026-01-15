import React from 'react';

const profiles = [
    { id: 'Wheelchair', label: 'Wheelchair User', icon: '♿', desc: 'Avoids stairs, narrow paths, blocked ramps.' },
    { id: 'Walker', label: 'Walker / Crutches', icon: '🚶‍♂️', desc: 'Avoids slopes, crowds, uneven terrain.' },
    { id: 'Temporary', label: 'Temporary Injury', icon: '🦵', desc: 'Fewer steps, smoother surfaces.' },
    { id: 'Fatigue', label: 'Fatigue / Chronic', icon: '😓', desc: 'Frequent rest spots, shorter segments.' },
    { id: 'Cognitive', label: 'Cognitive Disability', icon: '🧠', desc: 'Simplified instructions, less complex routes.' },
    { id: 'Elderly', label: 'Elderly User', icon: '👵', desc: 'Large text, slower audio, extra confirmation.' },
];

const MobilityProfileSelector = ({ selectedProfile, onSelect }) => {
    return (
        <div className="mobility-selector" style={{ padding: '10px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom: '10px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Select Mobility Profile</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                {profiles.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => onSelect(p.id)}
                        style={{
                            padding: '8px',
                            border: selectedProfile === p.id ? '2px solid #007bff' : '1px solid #ddd',
                            borderRadius: '6px',
                            background: selectedProfile === p.id ? '#e7f1ff' : '#f9f9f9',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start'
                        }}
                    >
                        <span style={{ fontSize: '20px' }}>{p.icon}</span>
                        <strong style={{ fontSize: '12px' }}>{p.label}</strong>
                    </button>
                ))}
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                {profiles.find(p => p.id === selectedProfile)?.desc}
            </div>
        </div>
    );
};

export default MobilityProfileSelector;
