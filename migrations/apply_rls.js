const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env.production' });

// Encode special characters in the password
const password = encodeURIComponent(process.env.DB_PASSWORD);
const connectionString = `postgresql://${process.env.DB_USER}:${password}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function applyRLSPolicies() {
    try {
        console.log('Starting to apply RLS policies...');
        
        // Test connection first
        await pool.query('SELECT NOW()');
        console.log('Database connection successful');
        
        // Read and execute the entire policy file as a single statement
        const policiesPath = path.join(__dirname, 'add_rls_policies.sql');
        const policiesSQL = await fs.readFile(policiesPath, 'utf8');
        
        await pool.query(policiesSQL);
        console.log('Successfully applied RLS policies');
        
    } catch (error) {
        console.error('Failed to apply RLS policies:', error);
        if (error.code === '42P01') {
            console.error('One or more tables do not exist. This is expected if you haven\'t run the full migration yet.');
        } else if (error.code === '42601') {
            console.error('SQL syntax error. Please check the RLS policy file format.');
        }
    } finally {
        await pool.end();
    }
}

applyRLSPolicies()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    }); 