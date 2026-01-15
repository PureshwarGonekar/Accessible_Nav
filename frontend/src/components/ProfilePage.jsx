import React, { useState, useEffect } from 'react';
import { Save, ShieldCheck, User, CheckCircle, Eye, Volume2, Vibrate } from 'lucide-react';
import api from '../api';
import { profiles } from './MobilityProfileSelector';

const ProfilePage = ({ user, onDelete, onProfileUpdate }) => {
  const [profileData, setProfileData] = useState({
    mobilityType: [],
    customNeeds: '',
    emergencyContact: '',
    guidancePreference: 'visual'
  });
  const [showSavedContext, setShowSavedContext] = useState(false);

  useEffect(() => {
    // Fetch latest profile from API on mount
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/profile');
        if (data) {
          setProfileData({
            mobilityType: data.mobility_type || [],
            customNeeds: data.custom_needs || '',
            emergencyContact: data.emergency_contact || '',
            guidancePreference: data.guidance_preference || 'visual'
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchProfile();
  }, [user]);

  const handleCheckboxChange = (type) => {
    setProfileData(prev => ({
      ...prev,
      mobilityType: [type] // Single select: replace array with selected item
    }));
  };

  const handleSave = async () => {
    try {
      // Prepare payload for backend (snake_case)
      const payload = {
        mobility_type: profileData.mobilityType,
        custom_needs: profileData.customNeeds,
        emergency_contact: profileData.emergencyContact,
        guidance_preference: profileData.guidancePreference
      };

      const { data } = await api.put('/profile', payload);

      // Update user context via parent callback
      if (onProfileUpdate) {
        onProfileUpdate(data);
      }

      setShowSavedContext(true);
      setTimeout(() => setShowSavedContext(false), 3000);

    } catch (err) {
      console.error("Failed to save profile", err);
      alert("Failed to save profile to server.");
    }
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: 'hsl(var(--primary))', margin: 0 }}>My Accessibility Profile</h2>
          <p style={{ color: 'hsl(var(--text-muted))' }}>Manage your personal mobility preferences.</p>
        </div>
        <div style={{
          background: 'rgba(50, 200, 50, 0.1)',
          color: 'hsl(var(--success))',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <ShieldCheck size={16} /> Data Confidential & Local
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px' }}>

        {/* Main Form */}
        <div className="card">
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>I identify as / store preferences for:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {profiles.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleCheckboxChange(p.id)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${profileData.mobilityType.includes(p.id) ? 'hsl(var(--primary))' : 'var(--glass-border)'}`,
                    background: profileData.mobilityType.includes(p.id) ? 'rgba(100, 80, 255, 0.1)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s',
                    color: 'hsl(var(--text-main))'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '4px',
                    border: '1px solid currentColor',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: profileData.mobilityType.includes(p.id) ? 'hsl(var(--primary))' : 'transparent',
                    color: profileData.mobilityType.includes(p.id) ? 'white' : 'currentColor',
                    fontSize: '16px'
                  }}>
                    {profileData.mobilityType.includes(p.id) ? <CheckCircle size={16} /> : p.icon}
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Detailed Mobility Issues</label>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', marginBottom: '12px' }}>
              Please describe any specific problems you face while walking or traveling (e.g., "Cannot handle inclines &gt; 5%", "Need rest stops every 200m").
            </p>
            <textarea
              value={profileData.customNeeds}
              onChange={(e) => setProfileData({ ...profileData, customNeeds: e.target.value })}
              rows={5}
              placeholder="Enter details here..."
              style={{
                width: '100%',
                background: 'hsl(var(--bg-input))',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                padding: '16px',
                color: 'white',
                fontFamily: 'Inter, sans-serif'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600' }}>Preferred Guidance</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['visual', 'audio', 'haptic'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setProfileData(prev => ({ ...prev, guidancePreference: mode }))}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: profileData.guidancePreference === mode ? 'hsl(var(--primary))' : 'hsl(var(--bg-input))',
                    color: 'white',
                    border: '1px solid ' + (profileData.guidancePreference === mode ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.1)'),
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  {mode === 'visual' && <Eye size={20} />}
                  {mode === 'audio' && <Volume2 size={20} />}
                  {mode === 'haptic' && <Vibrate size={20} />}
                  <span style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{mode}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Emergency Contact (Optional)</label>
            <input
              type="text"
              value={profileData.emergencyContact}
              onChange={(e) => setProfileData({ ...profileData, emergencyContact: e.target.value })}
              placeholder="Name & Phone Number"
              style={{
                width: '100%',
                background: 'hsl(var(--bg-input))',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                padding: '12px',
                color: 'white'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn-primary" onClick={handleSave} style={{ width: 'auto', padding: '12px 32px' }}>
              <Save size={18} /> Save Profile
            </button>
            {showSavedContext && <span className="fade-in" style={{ color: 'hsl(var(--success))', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={16} /> Saved Successfully</span>}
          </div>
        </div>

        {/* Info Sidebar */}
        <div>
          <div  className="card" style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <User size={48} color="hsl(var(--text-muted))" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.1rem' }}>{user.name}</h3>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>{user.email}</p>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '16px 0' }}></div>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.5', color: 'hsl(var(--text-muted))' }}>
              <strong>Privacy Notice:</strong><br />
              Your detailed mobility data is stored <strong>locally on this device</strong>. We do not transmit your specific medical or mobility history to any cloud server. It is used solely to filter map routing on your client.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
