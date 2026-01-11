const { pool } = require('../config/db');

const saveRoute = async (req, res) => {
  const { start, dest, stops } = req.body;

  try {
    const newRoute = await pool.query(
      'INSERT INTO saved_routes (user_id, start_location, destination, stops) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, start, dest, JSON.stringify(stops || [])]
    );

    res.status(201).json(newRoute.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getSavedRoutes = async (req, res) => {
  try {
    const routes = await pool.query(
      'SELECT * FROM saved_routes WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    // Map DB fields to frontend expected format if needed, but for now just return rows
    const formattedRoutes = routes.rows.map(route => ({
      id: route.id,
      start: route.start_location,
      dest: route.destination,
      stops: route.stops,
      date: new Date(route.created_at).toLocaleDateString()
    }));

    res.json(formattedRoutes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const deleteRoute = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM saved_routes WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ message: 'Route deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { saveRoute, getSavedRoutes, deleteRoute };
