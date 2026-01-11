import React from "react";
import { Accessibility, Activity, Zap, Volume2, Eye, Vibrate } from "lucide-react";

import api from '../api';

const ProfileSetup = ({ onComplete, savedProfile }) => {
  const [preferences, setPreferences] = React.useState({
    wheelchair: false,
    walker: false,
    fatigue: false,
    avoidCrowds: false,
    avoidSlopes: false,
    guidance: "visual", // 'audio', 'haptic', 'visual'
  });

  React.useEffect(() => {
    if (savedProfile && savedProfile.mobility_type) {
      // Database uses snake_case JSON or similar, let's parse safely
      // Note: Backend might send mobility_type as JSON object or array. 
      // Our controller saved it as JSON array of strings ["Wheelchair", ...] 
      // Wait, let's strict check how controller saves it.
      // Controller: JSON.stringify(mobility_type) where mobility_type is passed from body.
      // So if we pass array, it saves array.
      // Frontend state 'preferences' is object with booleans.
      // We should map back and forth or change backend to store object.
      // Let's map to array for backend to match controller comment: ["Wheelchair", "Fatigue"]
      // But for now, let's just assume we send the Preferences Object directly as JSON?
      // Controller: mobility_type = $1. If we send object, it saves object.
      // Let's send the preferences object directly, it's easier.
      // But verify if `mobility_type` column is JSONB. Yes it is.
      
      const mobility = typeof savedProfile.mobility_type === 'string' 
          ? JSON.parse(savedProfile.mobility_type) 
          : savedProfile.mobility_type;

      if (mobility) {
        setPreferences(prev => ({ ...prev, ...mobility }));
      }
    }
     // Also check guidance_preference
     if (savedProfile && savedProfile.guidance_preference) {
        setPreferences(prev => ({ ...prev, guidance: savedProfile.guidance_preference }));
     }
  }, [savedProfile]);

  const togglePreference = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    try {
        await api.put('/profile', {
            mobility_type: preferences, // Saving the whole object
            guidance_preference: preferences.guidance
        });
        onComplete(preferences);
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

      <div className="input-group">
        <label
          className={`mobility-option ${
            preferences.wheelchair ? "selected" : ""
          }`}
          onClick={() => togglePreference("wheelchair")}
        >
          <div className="icon-wrapper">
            <Accessibility size={24} />
          </div>
          <div>
            <strong>Wheelchair User</strong>
            <div
              style={{ fontSize: "0.85rem", color: "hsl(var(--text-muted))" }}
            >
              Avoids stairs & narrow paths
            </div>
          </div>
        </label>

        <label
          className={`mobility-option ${preferences.walker ? "selected" : ""}`}
          onClick={() => togglePreference("walker")}
        >
          <div className="icon-wrapper">
            <Activity size={24} />
          </div>
          <div>
            <strong>Walker / Crutches</strong>
            <div
              style={{ fontSize: "0.85rem", color: "hsl(var(--text-muted))" }}
            >
              Needs smooth surfaces
            </div>
          </div>
        </label>

        <label
          className={`mobility-option ${preferences.fatigue ? "selected" : ""}`}
          onClick={() => togglePreference("fatigue")}
        >
          <div className="icon-wrapper">
            <Zap size={24} />
          </div>
          <div>
            <strong>Fatigue Sensitive</strong>
            <div
              style={{ fontSize: "0.85rem", color: "hsl(var(--text-muted))" }}
            >
              Shortest distance priority
            </div>
          </div>
        </label>
      </div>

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
