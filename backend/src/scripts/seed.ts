import pool from '../config/db';

async function seed() {
    const client = await pool.connect();
    try {
        console.log('Seeding Database...');

        // 1. Create Tenant
        const tenantRes = await client.query(
            `INSERT INTO tenants (name, plan_tier) VALUES ('Demo Corp', 'enterprise') RETURNING *`
        );
        const tenant = tenantRes.rows[0];
        console.log('Tenant Created:', tenant.id);

        // 2. Create User
        const userRes = await client.query(
            `INSERT INTO users (tenant_id, name, email, role) 
             VALUES ($1, 'Jane Doe', 'jane@demo.com', 'salesperson') 
             RETURNING *`,
            [tenant.id]
        );
        const user = userRes.rows[0];
        console.log('User Created:', user.id);

        console.log('\n--- CREDENTIALS FOR TESTING ---');
        console.log(`X-Tenant-ID: ${tenant.id}`);
        console.log(`X-User-Role: ${user.role}`);
        console.log('-------------------------------');

    } catch (e) {
        console.error('Seeding failed', e);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
