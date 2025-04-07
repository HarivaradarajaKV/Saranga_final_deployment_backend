const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
        sslmode: 'require'
    }
});

async function checkTableData() {
    try {
        // Get all tables in the public schema
        const { rows: tables } = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        console.log('\n📊 Database Migration Verification Report');
        console.log('=====================================');

        // Check each table
        for (const table of tables) {
            const tableName = table.table_name;
            
            // Get column information
            const { rows: columns } = await pool.query(`
                SELECT column_name, data_type, character_maximum_length
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = $1
                ORDER BY ordinal_position;
            `, [tableName]);

            // Get row count
            const { rows: [{ count }] } = await pool.query(`
                SELECT COUNT(*) as count FROM "${tableName}";
            `);

            // Get sample data (first row)
            const { rows: sampleData } = await pool.query(`
                SELECT * FROM "${tableName}" LIMIT 1;
            `);

            console.log(`\n📋 Table: ${tableName}`);
            console.log('-------------------------');
            console.log(`Total Rows: ${count}`);
            
            console.log('\nColumns:');
            columns.forEach(col => {
                const dataType = col.character_maximum_length 
                    ? `${col.data_type}(${col.character_maximum_length})`
                    : col.data_type;
                console.log(`- ${col.column_name}: ${dataType}`);
            });

            if (sampleData.length > 0) {
                console.log('\nSample Data (First Row):');
                console.log(sampleData[0]);
            }

            // Check for foreign keys
            const { rows: foreignKeys } = await pool.query(`
                SELECT
                    tc.constraint_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_name = $1;
            `, [tableName]);

            if (foreignKeys.length > 0) {
                console.log('\nForeign Keys:');
                foreignKeys.forEach(fk => {
                    console.log(`- ${fk.column_name} → ${fk.foreign_table_name}(${fk.foreign_column_name})`);
                });
            }
        }

        // Additional Supabase-specific checks
        console.log('\n🔒 RLS Policies Check');
        console.log('===================');
        const { rows: rlsPolicies } = await pool.query(`
            SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
            FROM pg_policies
            WHERE schemaname = 'public'
            ORDER BY tablename, policyname;
        `);

        if (rlsPolicies.length > 0) {
            rlsPolicies.forEach(policy => {
                console.log(`\nTable: ${policy.tablename}`);
                console.log(`Policy: ${policy.policyname}`);
                console.log(`Command: ${policy.cmd}`);
                console.log(`Roles: ${policy.roles}`);
            });
        } else {
            console.log('No RLS policies found');
        }

    } catch (error) {
        console.error('Error verifying migration:', error);
    } finally {
        await pool.end();
    }
}

console.log('Starting migration verification...');
checkTableData(); 