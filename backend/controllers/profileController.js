const { pool } = require('../config/db');

const getProfile = async (req, res) => {
  try {
    const profile = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.user.id]);
    
    if (profile.rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateProfile = async (req, res) => {
  const { mobility_type, guidance_preference } = req.body;

  try {
    const updatedProfile = await pool.query(
      'UPDATE profiles SET mobility_type = $1, guidance_preference = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3 RETURNING *',
      [JSON.stringify(mobility_type), guidance_preference, req.user.id]
    );

    res.json(updatedProfile.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getProfile, updateProfile };
