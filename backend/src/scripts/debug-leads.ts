
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

async function checkLeads() {
    try {
        console.log('--- DIAGNOSIS START ---');

        // 1. Check Total Leads
        const countRes = await pool.query('SELECT COUNT(*) FROM leads');
        console.log(`Total Leads in Database: ${countRes.rows[0].count}`);

        // 2. Check Distinct Tenant IDs
        const tenantRes = await pool.query('SELECT DISTINCT tenant_id, COUNT(*) as count FROM leads GROUP BY tenant_id');
        console.log('\n--- Tenant IDs found in Leads Table ---');
        tenantRes.rows.forEach(row => {
            console.log(`Tenant ID: ${row.tenant_id} (Count: ${row.count})`);
        });

        // 3. Check what frontend might be using (hardcoded expected check)
        // Note: This is just a string check matching api.ts
        const expectedFrontendId = 'e9ddf5f0-a591-49bb-8b82-a50ae1770426';
        console.log(`\n--- Comparison ---`);
        console.log(`Frontend Hardcoded ID (likely): ${expectedFrontendId}`);

        const match = tenantRes.rows.find(r => r.tenant_id === expectedFrontendId);
        if (match) {
            console.log(`✅ MATCH FOUND: Database has ${match.count} leads for this ID.`);
        } else {
            console.log(`❌ MISMATCH: Frontend ID not found in database rows.`);
        }

    } catch (e) {
        console.error('Error running diagnosis:', e);
    } finally {
        await pool.end();
    }
}

checkLeads();
