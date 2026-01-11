import React, { useState, useEffect } from 'react';
import { Save, ShieldCheck, User, CheckCircle } from 'lucide-react';

const ProfilePage = ({ user, onDelete }) => {
  const [profileData, setProfileData] = useState({
    mobilityType: [],
    customNeeds: '',
    emergencyContact: ''
  });
  const [showSavedContext, setShowSavedContext] = useState(false);

  useEffect(() => {
    // Load existing profile from user object if available
    if (user && user.profile) {
      setProfileData({
        mobilityType: user.profile.mobilityType || [],
        customNeeds: user.profile.customNeeds || '',
        emergencyContact: user.profile.emergencyContact || ''
      });
    }
  }, [user]);

  const handleCheckboxChange = (type) => {
    setProfileData(prev => {
      const exists = prev.mobilityType.includes(type);
      return {
        ...prev,
        mobilityType: exists 
          ? prev.mobilityType.filter(t => t !== type) 
          : [...prev.mobilityType, type]
      };
    });
  };

  const handleSave = () => {
    // Update local storage
    const storedUsers = JSON.parse(localStorage.getItem('user_db') || '[]');
    const updatedUsers = storedUsers.map(u => {
      if (u.email === user.email) {
        return { ...u, profile: profileData };
      }
      return u;
    });
    
    localStorage.setItem('user_db', JSON.stringify(updatedUsers));
    setShowSavedContext(true);
    setTimeout(() => setShowSavedContext(false), 3000);
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
              {['Wheelchair User', 'Walker / Crutches', 'Visual Impairment', 'Hearing Impairment', 'Fatigue / Chronic Pain', 'Stroller / Parent'].map(type => (
                <div 
                  key={type}
                  onClick={() => handleCheckboxChange(type)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${profileData.mobilityType.includes(type) ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.1)'}`,
                    background: profileData.mobilityType.includes(type) ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ 
                    width: '18px', 
                    height: '18px', 
                    borderRadius: '4px', 
                    border: '1px solid currentColor',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: profileData.mobilityType.includes(type) ? 'hsl(var(--primary))' : 'transparent',
                    color: 'black'
                  }}>
                    {profileData.mobilityType.includes(type) && <CheckCircle size={14} color="white" />}
                  </div>
                  {type}
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
              onChange={(e) => setProfileData({...profileData, customNeeds: e.target.value})}
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
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Emergency Contact (Optional)</label>
            <input 
              type="text"
              value={profileData.emergencyContact}
              onChange={(e) => setProfileData({...profileData, emergencyContact: e.target.value})}
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
            {showSavedContext && <span className="fade-in" style={{ color: 'hsl(var(--success))', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={16}/> Saved Successfully</span>}
          </div>
        </div>

        {/* Info Sidebar */}
        <div>
          <div className="card" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <User size={48} color="hsl(var(--text-muted))" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.1rem' }}>{user.name}</h3>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>{user.email}</p>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '16px 0' }}></div>
            <p style={{ fontSize: '0.85rem', lineHeight: '1.5', color: 'hsl(var(--text-muted))' }}>
              <strong>Privacy Notice:</strong><br/>
              Your detailed mobility data is stored <strong>locally on this device</strong>. We do not transmit your specific medical or mobility history to any cloud server. It is used solely to filter map routing on your client.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
