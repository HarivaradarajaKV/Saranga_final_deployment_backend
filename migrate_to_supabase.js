const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

// Local database connection
const localPool = new Pool({
    user: 'postgres',
    password: 'Hari@7118',
    host: 'localhost',
    port: 5432,
    database: 'cosmetics_db'
});

// Supabase connection
const supabasePool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
        sslmode: 'require'
    }
});

function formatValue(val) {
    if (val === null) return 'NULL';
    if (val instanceof Date) {
        return `'${val.toISOString()}'`;
    }
    if (typeof val === 'string') {
        // Escape single quotes and properly format timestamps
        if (val.match(/^\d{4}-\d{2}-\d{2}.*$/)) {
            // This looks like a date string
            return `'${val}'::timestamp`;
        }
        return `'${val.replace(/'/g, "''")}'`;
    }
    if (typeof val === 'boolean') {
        return val ? 'true' : 'false';
    }
    if (typeof val === 'number') {
        return val;
    }
    return val;
}

async function getTableColumns(pool, table) {
    const query = `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        ORDER BY ordinal_position;
    `;
    const { rows } = await pool.query(query, [table]);
    return rows.map(row => row.column_name);
}

async function migrateTable(table) {
    console.log(`\nMigrating ${table}...`);

    try {
        // Get column information from both databases
        const localColumns = await getTableColumns(localPool, table);
        const supabaseColumns = await getTableColumns(supabasePool, table);

        // Find matching columns
        const matchingColumns = localColumns.filter(col => supabaseColumns.includes(col));
        
        if (matchingColumns.length === 0) {
            console.log(`No matching columns found for ${table}`);
            return;
        }

        // Get data from local database
        const selectQuery = `SELECT ${matchingColumns.join(', ')} FROM ${table}`;
        const { rows } = await localPool.query(selectQuery);
        
        if (rows.length === 0) {
            console.log(`No data to migrate for ${table}`);
            return;
        }

        // Process rows in batches of 100
        const batchSize = 100;
        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            
            const values = batch.map(row => {
                return '(' + matchingColumns.map(col => formatValue(row[col])).join(', ') + ')';
            }).join(',\n');

            const insertQuery = `
                INSERT INTO ${table} (${matchingColumns.join(', ')})
                VALUES ${values}
                ON CONFLICT DO NOTHING;
            `;

            await supabasePool.query(insertQuery);
            console.log(`✅ Migrated batch ${i / batchSize + 1} (${batch.length} rows) to ${table}`);
        }

        console.log(`✅ Completed migration of ${rows.length} total rows to ${table}`);
    } catch (error) {
        console.error(`Error migrating ${table}:`, error);
        throw error;
    }
}

async function migrateData() {
    try {
        console.log('Starting data migration to Supabase...');

        // Tables to migrate in order (respecting foreign key constraints)
        const tables = [
            'users',
            'categories',
            'products',
            'cart',
            'orders',
            'order_items',
            'wishlist',
            'addresses',
            'coupons',
            'coupon_products'
        ];

        for (const table of tables) {
            await migrateTable(table);
        }

        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await localPool.end();
        await supabasePool.end();
    }
}

migrateData(); 