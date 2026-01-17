const { Pool } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres.uzpvpteleiynwlbapnvu:Pureshwar129@3.108.251.216:5432/postgres';

console.log("Attempting to connect to Supavisor Pooler via IP...");

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000 // fail fast
});

pool.connect()
    .then(client => {
        console.log('✅ Connected');
        client.release();
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Connection failed');
        fs.writeFileSync('error.log', JSON.stringify({
            message: err.message,
            code: err.code,
            stack: err.stack,
            details: err
        }, null, 2));
        process.exit(1);
    });
