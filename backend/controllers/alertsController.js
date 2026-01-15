const { pool } = require('../config/db');

// --- Mock Data Generator (The "Fake Reality" Engine) ---
const generateMockAlerts = (userLat, userLng) => {
  if (!userLat || !userLng) return [];

  const _r = (min, max) => Math.random() * (max - min) + min;
  const _loc = (offset) => ({
    lat: parseFloat(userLat) + _r(-offset, offset),
    lng: parseFloat(userLng) + _r(-offset, offset)
  });

  const mockData = [];

  // 🧱 A. Physical Barriers
  mockData.push({
    id: 'mock_p1',
    category: 'PHYSICAL',
    type: 'BLOCKED_RAMP',
    title: 'Curb Ramp Blocked',
    message: 'Construction material dumped on the curb cut.',
    severity: 'high',
    location_lat: _loc(0.002).lat,
    location_lng: _loc(0.002).lng,
    metadata: { surface: 'concrete', affects: ['Wheelchair', 'Stroller'] },
    suggestion: 'Use the driveway 20m ahead.',
    created_at: new Date().toISOString()
  });

  mockData.push({
    id: 'mock_p2',
    category: 'PHYSICAL',
    type: 'NARROW_PATH',
    title: 'Narrow Sidewalk',
    message: 'path narrows to < 90cm due to fencing.',
    severity: 'medium',
    location_lat: _loc(0.003).lat,
    location_lng: _loc(0.003).lng,
    metadata: { width_cm: 85 },
    suggestion: 'Proceed with caution or use opposite sidewalk.',
    created_at: new Date().toISOString()
  });

  // 🚧 B. Temporary & Dynamic
  mockData.push({
    id: 'mock_t1',
    category: 'TEMPORARY',
    type: 'PARKED_VEHICLE',
    title: 'SUV Blocking Path',
    message: 'Large vehicle parked fully on the footpath.',
    severity: 'medium',
    location_lat: _loc(0.0015).lat,
    location_lng: _loc(0.0015).lng,
    metadata: { expiry: new Date(Date.now() + 3600000).toISOString() }, // Expires in 1hr
    suggestion: 'Go around via the parking lane (watch for traffic).',
    created_at: new Date().toISOString()
  });

  // 🚶 C. Crowd Issues
  if (Math.random() > 0.3) {
    mockData.push({
      id: 'mock_c1',
      category: 'CROWD',
      type: 'HIGH_CROWD',
      title: 'Dense Market Crowd',
      message: 'Weekly market active. High pedestrian density.',
      severity: 'low',
      location_lat: _loc(0.004).lat,
      location_lng: _loc(0.004).lng,
      metadata: { density: 'high', time_sensitive: true },
      suggestion: 'Avoid if sensitive to crowds or noise.',
      created_at: new Date().toISOString()
    });
  }

  // 😓 E. Fatique/Comfort
  mockData.push({
    id: 'mock_e1',
    category: 'COMFORT',
    type: 'STEEP_SLOPE',
    title: 'Steep Application',
    message: 'Gradient > 8% for next 50 meters.',
    severity: 'medium',
    location_lat: _loc(0.0025).lat,
    location_lng: _loc(0.0025).lng,
    metadata: { slope_percent: 10 },
    suggestion: 'Assistance recommended for manual wheelchairs.',
    created_at: new Date().toISOString()
  });

  return mockData;
};

const getAlerts = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    // 1. Fetch Real alerts from DB
    const dbResult = await pool.query('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50');
    // Normalize DB alerts to match our Rich structure if needed, or leave as is
    const realAlerts = dbResult.rows.map(a => ({
      ...a,
      category: 'Reported', // Default for legacy DB items
      suggestion: 'Verify on arrival.'
    }));

    // 2. Generate Mocks based on User Location
    let mockAlerts = [];
    if (lat && lng) {
      mockAlerts = generateMockAlerts(lat, lng);
    }

    // 3. Combine
    const allAlerts = [...mockAlerts, ...realAlerts];

    res.json(allAlerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const createAlert = async (req, res) => {
  const { type, message, location_lat, location_lng, severity } = req.body;
  try {
    const newAlert = await pool.query(
      'INSERT INTO alerts (type, message, location_lat, location_lng, severity) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [type, message, location_lat, location_lng, severity]
    );
    res.status(201).json(newAlert.rows[0]);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getAlerts, createAlert };
