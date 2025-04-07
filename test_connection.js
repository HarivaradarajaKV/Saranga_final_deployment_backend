const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

// Create a new pool with explicit SSL configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
        sslmode: 'require'
    }
});

async function testSupabaseConnection() {
    try {
        // Test basic connection
        const { rows: [{ now }] } = await pool.query('SELECT NOW()');
        console.log('✅ Successfully connected to Supabase!');
        console.log('Current database time:', now);

        // Get database version and server info
        const { rows: [serverInfo] } = await pool.query('SELECT version()');
        console.log('\nServer Information:', serverInfo.version);

        // Test if we're connected to Supabase by checking connection info
        const { rows: [connInfo] } = await pool.query(`
            SELECT 
                current_database() as database,
                current_user as user,
                inet_server_addr() as server_ip,
                inet_server_port() as server_port
        `);
        console.log('\nConnection Details:');
        console.log('Database:', connInfo.database);
        console.log('User:', connInfo.user);
        console.log('Server IP:', connInfo.server_ip);
        console.log('Server Port:', connInfo.server_port);

        // Verify if auth schema exists (Supabase specific)
        const { rows: [{ exists: authExists }] } = await pool.query(`
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.schemata 
                WHERE schema_name = 'auth'
            );
        `);
        console.log('\n✅ Auth Schema Check:', authExists ? 'Present (Confirmed Supabase)' : 'Not Present');

    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        console.error('Error details:', error);
    } finally {
        await pool.end();
    }
}

console.log('Testing Supabase Connection...\n');
testSupabaseConnection(); 