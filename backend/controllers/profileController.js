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
  const { mobility_type, guidance_preference, custom_needs, emergency_contact } = req.body;

  try {
    // Check if profile exists, if not create logic (though table constraints usually imply 1:1 with user)
    // Actually, simple update is fine if row exists. If not, we might need INSERT.
    // Assuming row exists from trigger or creation. If not, the previous code only did UPDATE.
    // Let's stick to UPDATE but handle the fields.

    // We need to build the query dynamically or just update all
    const updatedProfile = await pool.query(
      `UPDATE profiles 
       SET mobility_type = $1, 
           guidance_preference = COALESCE($2, guidance_preference), 
           custom_needs = $3, 
           emergency_contact = $4, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $5 
       RETURNING *`,
      [JSON.stringify(mobility_type), guidance_preference, custom_needs, emergency_contact, req.user.id]
    );

    // If no row updated, maybe insert?
    if (updatedProfile.rowCount === 0) {
      const newProfile = await pool.query(
        `INSERT INTO profiles (user_id, mobility_type, guidance_preference, custom_needs, emergency_contact)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [req.user.id, JSON.stringify(mobility_type), guidance_preference || 'visual', custom_needs, emergency_contact]
      );
      return res.json(newProfile.rows[0]);
    }

    res.json(updatedProfile.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getProfile, updateProfile };
