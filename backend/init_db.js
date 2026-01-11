const fs = require('fs');
const path = require('path');
const { pool } = require('./config/db');

const initDb = async () => {
  try {
    const sqlPath = path.join(__dirname, 'tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running SQL schema...');
    await pool.query(sql);
    console.log('Database initialized successfully.');
    
    // Seed some alerts if empty
    const alertCount = await pool.query('SELECT COUNT(*) FROM alerts');
    if (parseInt(alertCount.rows[0].count) === 0) {
        console.log('Seeding initial alerts...');
        await pool.query(`
            INSERT INTO alerts (type, message, location_lat, location_lng, severity) VALUES 
            ('Construction', 'Road work on Main St', 40.7128, -74.0060, 'medium'),
            ('Crowd', 'High pedestrian traffic near Park', 40.7138, -74.0070, 'low'),
            ('Accident', 'Minor collision, blocked lane', 40.7118, -74.0050, 'high');
        `);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
};

initDb();
