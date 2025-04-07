const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

// Always use Supabase connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
        sslmode: 'require'
    },
    max: 20,
    idleTimeoutMillis: 300000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000
});

// Verify connection immediately
async function verifyConnection() {
    try {
        const client = await pool.connect();
        
        // Test basic connection
        const { rows: [{ now }] } = await client.query('SELECT NOW()');
        console.log('✅ Successfully connected to Supabase!');
        console.log('Current database time:', now);

        // Verify if this is Supabase by checking auth schema
        const { rows: [{ exists: authExists }] } = await client.query(`
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.schemata 
                WHERE schema_name = 'auth'
            );
        `);
        
        if (authExists) {
            console.log('✅ Confirmed Supabase connection (auth schema present)');
        } else {
            console.warn('⚠️ Warning: Connected to database but auth schema not found');
        }

        client.release();
    } catch (error) {
        console.error('❌ Failed to connect to Supabase:', error.message);
        throw error;
    }
}

// Handle pool errors
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    console.error('Attempting to recover from pool error');
});

// Handle pool connection
pool.on('connect', () => {
    console.log('New database connection established');
});

// Handle pool removal
pool.on('remove', () => {
    console.log('Database connection pool removed');
});

// Verify connection on startup
verifyConnection().catch(err => {
    console.error('Initial connection verification failed:', err);
});

module.exports = pool; 