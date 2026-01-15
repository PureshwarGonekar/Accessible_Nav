const { pool } = require('../config/db');

const migrate = async () => {
    try {
        console.log('Adding columns to profiles table...');

        await pool.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_needs TEXT');
        console.log('Added custom_needs column.');

        await pool.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact TEXT');
        console.log('Added emergency_contact column.');

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
