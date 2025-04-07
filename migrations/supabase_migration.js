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

async function executePlainSQL(statement) {
    try {
        await pool.query(statement);
        console.log('Successfully executed:', statement.substring(0, 50) + '...');
    } catch (error) {
        if (error.code === '42P07') {
            console.log('Table already exists, continuing...');
        } else {
            throw error;
        }
    }
}

async function executeDollarQuotedStatement(statement) {
    try {
        await pool.query(statement);
        console.log('Successfully executed dollar-quoted statement');
    } catch (error) {
        if (error.code === '42P07') {
            console.log('Object already exists, continuing...');
        } else {
            throw error;
        }
    }
}

async function runMigration() {
    try {
        console.log('Starting Supabase migration...');
        
        // Test connection first
        await pool.query('SELECT NOW()');
        console.log('Database connection successful');
        
        // Read the database.sql file
        const schemaPath = path.join(__dirname, '..', 'database.sql');
        const schemaSQL = await fs.readFile(schemaPath, 'utf8');
        
        // Split by semicolons but preserve dollar-quoted blocks
        const statements = [];
        let currentStatement = '';
        let inDollarQuote = false;
        let dollarQuoteTag = '';

        const lines = schemaSQL.split('\n');
        for (const line of lines) {
            // Skip empty lines and comments
            if (line.trim() === '' || line.trim().startsWith('--')) {
                continue;
            }

            // Check for dollar quote start/end
            const dollarQuoteMatch = line.match(/\$([^$]*)\$/g);
            if (dollarQuoteMatch) {
                for (const match of dollarQuoteMatch) {
                    if (!inDollarQuote) {
                        inDollarQuote = true;
                        dollarQuoteTag = match;
                    } else if (match === dollarQuoteTag) {
                        inDollarQuote = false;
                        dollarQuoteTag = '';
                    }
                }
            }

            currentStatement += line + '\n';

            // If we're not in a dollar quote and find a semicolon, split the statement
            if (!inDollarQuote && line.trim().endsWith(';')) {
                statements.push(currentStatement.trim());
                currentStatement = '';
            }
        }

        // Execute each statement
        for (const statement of statements) {
            try {
                if (statement.toLowerCase().includes('create database')) {
                    console.log('Skipping database creation as it already exists in Supabase');
                    continue;
                }

                // Handle different types of statements
                if (statement.includes('$$')) {
                    await executeDollarQuotedStatement(statement);
                } else {
                    await executePlainSQL(statement);
                }
            } catch (error) {
                console.error('Error executing statement:', error);
                console.error('Problematic statement:', statement);
                throw error;
            }
        }
        
        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        if (error.code === '28P01') {
            console.error('Database authentication failed. Please check your environment variables.');
        }
    } finally {
        await pool.end();
    }
}

runMigration()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Migration script failed:', error);
        process.exit(1);
    }); 