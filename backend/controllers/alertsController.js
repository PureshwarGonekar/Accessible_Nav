const { pool } = require('../config/db');

const getAlerts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50');
    res.json(result.rows);
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
