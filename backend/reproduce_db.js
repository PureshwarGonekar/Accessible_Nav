const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

console.log("Checking environment variables...");
if (process.env.DATABASE_URL) {
    console.log("DATABASE_URL is set:", process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@')); // Hide password
} else {
    console.log("DATABASE_URL is NOT set. Using individual vars.");
    console.log("DB_USER:", process.env.DB_USER);
    console.log("DB_HOST:", process.env.DB_HOST);
    console.log("DB_NAME:", process.env.DB_NAME);
    console.log("DB_PORT:", process.env.DB_PORT);
}

const connectionConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'accessible_nav_db',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
    };

console.log("Attempting to connect with config:", JSON.stringify({ ...connectionConfig, password: '****', connectionString: connectionConfig.connectionString ? '***' : undefined }, null, 2));

const pool = new Pool(connectionConfig);

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
