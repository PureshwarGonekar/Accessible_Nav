-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  mobility_profile VARCHAR(50) DEFAULT 'Standard',
  preferences JSONB DEFAULT '{}',
  trust_rating DECIMAL DEFAULT 0.5, -- User reliability score 0.0 to 1.0
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mobility_type JSONB DEFAULT '[]',
  guidance_preference VARCHAR(50) DEFAULT 'visual',
  custom_needs TEXT, -- Added for recent features
  emergency_contact TEXT, -- Added for recent features
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Saved Routes Table
CREATE TABLE IF NOT EXISTS saved_routes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  start_location VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  stops JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Active Reports (Community Hurdles)
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  message TEXT,
  location_lat DECIMAL NOT NULL,
  location_lng DECIMAL NOT NULL,
  photo_url TEXT,
  expected_duration VARCHAR(50),
  affects_wheelchair BOOLEAN DEFAULT FALSE,
  trust_score DECIMAL DEFAULT 0.5,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'resolved', 'false_report'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Validations (Votes on Reports)
CREATE TABLE IF NOT EXISTS validations (
  id SERIAL PRIMARY KEY,
  report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  vote VARCHAR(10) NOT NULL, -- 'confirm' or 'deny'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(report_id, user_id) -- One vote per user per report
);

-- 6. Alerts (Legacy/System Alerts)
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  location_lat DECIMAL,
  location_lng DECIMAL,
  severity VARCHAR(20) DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
