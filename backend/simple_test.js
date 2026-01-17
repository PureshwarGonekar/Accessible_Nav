const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:Pureshwar129@db.uzpvpteleiynwlbapnvu.supabase.co:5432/postgres';

console.log("Attempting to connect with hardcoded string...");

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect()
    .then(client => {
        console.log('✅ Successfully connected to the database!');
        return client.query('SELECT NOW()')
            .then(res => {
                console.log('Current Database Time:', res.rows[0].now);
                client.release();
                process.exit(0);
            })
            .catch(err => {
                console.error('❌ Error executing query:', err);
                client.release();
                process.exit(1);
            });
    })
    .catch(err => {
        console.error('❌ Connection failed:', err);
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        if (err.stack) console.error('Stack:', err.stack);
        process.exit(1);
    });
