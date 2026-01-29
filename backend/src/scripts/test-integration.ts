import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function runTest() {
    console.log('--- STARTING INTEGRATION TEST ---');
    try {
        // 1. Health Check
        console.log('1. Checking Health...');
        const health = await axios.get(`${API_URL}/../health`);
        console.log('Health OK:', health.data);

        // 2. Create a Lead (this triggers DB access)
        console.log('\n2. Creating Test Lead...');
        const payload = {
            contact_name: "Integration Test User",
            name: "Integration Test User", // For legacy/compatibility
            email: "test@integration.com",
            status: "New",
            // Metadata that triggers incentives!
            metadata: {
                product_ids: [], // Minimal for now to test connection first
                notes: "Created via Test Script"
            }
        };

        const headers = {
            'X-Tenant-ID': 'e9ddf5f0-a591-49bb-8b82-a50ae1770426', // Seeded Tenant
            'X-User-Role': 'admin'
        };

        // Note: This WILL fail if DB is unreachable.
        const res = await axios.post(`${API_URL}/leads`, payload, { headers });
        console.log('Lead Created via API:', res.data);

        console.log('\n--- TEST SUCCESS ---');
    } catch (error: any) {
        console.error('\n!!! TEST FAILED !!!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

runTest();
