import pool from '../config/db';

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Running Migration Fix...');

        await client.query(`
            ALTER TABLE leads 
            ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
            ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
            ADD COLUMN IF NOT EXISTS source VARCHAR(100);
        `);

        console.log('Migration Complete: Added missing columns to leads table.');
    } catch (e) {
        console.error('Migration Failed', e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
