-- Enable UUID extension if needed (optional, keeping IDs simple serial for now)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Profiles Table (Linked to User)
CREATE TABLE IF NOT EXISTS profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mobility_type JSONB DEFAULT '[]', -- Stores array like ["Wheelchair", "Fatigue"]
  guidance_preference VARCHAR(50) DEFAULT 'visual', -- 'visual', 'audio', 'haptic'
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Saved Routes Table
CREATE TABLE IF NOT EXISTS saved_routes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  start_location VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  stops JSONB DEFAULT '[]', -- Array of stop strings
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX idx_saved_routes_user ON saved_routes(user_id);

-- 4. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'Construction', 'Crowd', 'Accident'
  message TEXT NOT NULL,
  location_lat DECIMAL,
  location_lng DECIMAL,
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
