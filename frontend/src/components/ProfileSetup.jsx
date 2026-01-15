import React from "react";
import { Accessibility, Activity, Zap, Volume2, Eye, Vibrate } from "lucide-react";

import api from '../api';

import MobilityProfileSelector from './MobilityProfileSelector';

const ProfileSetup = ({ onComplete, savedProfile }) => {
  const [preferences, setPreferences] = React.useState({
    guidance: "visual",
  });
  const [activeProfile, setActiveProfile] = React.useState(null);

  React.useEffect(() => {
    if (savedProfile) {
      if (savedProfile.mobility_profile) {
        setActiveProfile(savedProfile.mobility_profile);
      }
      if (savedProfile.guidance_preference) {
        setPreferences(prev => ({ ...prev, guidance: savedProfile.guidance_preference }));
      }
    }
  }, [savedProfile]);

  const handleProfileSelect = (profileId) => {
    setActiveProfile(profileId);
  };

  const handleSubmit = async () => {
    try {
      if (!activeProfile) {
        alert('Please select a mobility profile.');
        return;
      }
      await api.put('/profile', {
        mobility_profile: activeProfile,
        guidance_preference: preferences.guidance
      });
      onComplete({ mobility_profile: activeProfile, ...preferences });
    } catch (err) {
      console.error('Failed to save profile', err);
      alert('Failed to save profile. Please try again.');
    }
  };

  return (
    <div className="card fade-in">
      <h2 style={{ marginBottom: "20px", color: "hsl(var(--primary))" }}>
        Step 1: Mobility Profile
      </h2>
      <p style={{ marginBottom: "24px", color: "hsl(var(--text-muted))" }}>
        Tell us about your needs so we can find the safest route for you.
      </p>

      <MobilityProfileSelector
        selectedProfile={activeProfile}
        onSelect={handleProfileSelect}
      />

      <h3 style={{ marginBottom: "16px", marginTop: "24px" }}>
        Preferred Guidance
      </h3>
      <div style={{ display: "flex", gap: "10px", marginBottom: "32px" }}>
        {["visual", "audio", "haptic"].map((mode) => (
          <button
            key={mode}
            onClick={() =>
              setPreferences((prev) => ({ ...prev, guidance: mode }))
            }
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "var(--radius-md)",
              background:
                preferences.guidance === mode
                  ? "hsl(var(--primary))"
                  : "hsl(var(--bg-input))",
              color: "white",
              border:
                "1px solid " +
                (preferences.guidance === mode
                  ? "hsl(var(--primary))"
                  : "rgba(255,255,255,0.1)"),
            }}
          >
            {mode === "visual" && <Eye size={20} />}
            {mode === "audio" && <Volume2 size={20} />}
            {mode === "haptic" && <Vibrate size={20} />}
            <div
              style={{
                fontSize: "0.8rem",
                marginTop: "4px",
                textTransform: "capitalize",
              }}
            >
              {mode}
            </div>
          </button>
        ))}
      </div>

      <button className="btn-primary" onClick={handleSubmit}>
        Save Profile & Continue
      </button>
    </div>
  );
};

export default ProfileSetup;
