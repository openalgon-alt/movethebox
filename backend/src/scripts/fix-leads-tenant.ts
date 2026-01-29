
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'movethebox',
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function fixLeads() {
    try {
        console.log('--- FIX START ---');

        const defaultTenantId = 'e9ddf5f0-a591-49bb-8b82-a50ae1770426';

        console.log(`Assigning NULL tenant_id leads to: ${defaultTenantId}`);

        const res = await pool.query(
            `UPDATE leads 
             SET tenant_id = $1 
             WHERE tenant_id IS NULL`,
            [defaultTenantId]
        );

        console.log(`✅ Fixed: Updated ${res.rowCount} leads.`);

    } catch (e) {
        console.error('Error running fix:', e);
    } finally {
        await pool.end();
    }
}

fixLeads();
