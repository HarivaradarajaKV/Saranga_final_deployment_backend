const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
        sslmode: 'require'
    }
});

async function applyMissingTables() {
    try {
        console.log('Starting to create missing tables...');
        
        // Test connection first
        await pool.query('SELECT NOW()');
        console.log('Database connection successful');
        
        // Read and execute the SQL file
        const sqlPath = path.join(__dirname, 'add_missing_tables.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');
        
        await pool.query(sql);
        console.log('Successfully created missing tables and applied RLS policies');
        
    } catch (error) {
        console.error('Failed to create missing tables:', error);
    } finally {
        await pool.end();
    }
}

applyMissingTables()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    }); 