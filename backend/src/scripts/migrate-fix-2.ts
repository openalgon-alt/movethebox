import pool from '../config/db';

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Running Migration Fix 2...');

        // Make 'name' nullable if it exists
        await client.query(`
            ALTER TABLE leads ALTER COLUMN name DROP NOT NULL;
        `);

        console.log('Migration Complete: Made leads.name nullable.');
    } catch (e) {
        console.log('Migration Note:', (e as any).message); // Log but don't fail if column implies it doesn't exist (though error said it did)
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
