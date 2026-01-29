import axios from 'axios';

// TODO: In production, this URL should be an environment variable (VITE_API_URL)
const API_URL = 'http://localhost:3000/api';

// TODO: Replace this with the actual Tenant ID from your database (SELECT id FROM tenants LIMIT 1)
// Function to get or create a stored tenant ID for the session
const getTenantId = () => {
    let tid = localStorage.getItem('demo_tenant_id');
    if (!tid) {
        tid = 'e9ddf5f0-a591-49bb-8b82-a50ae1770426'; // Seeded Tenant ID
        console.warn('Using Placeholder Tenant ID. Please Configure Correctly.');
    }
    return tid;
};

// Create Axios Instance
export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor to add Auth/Tenant headers dynamically
api.interceptors.request.use((config) => {
    const tenantId = getTenantId();
    config.headers['X-Tenant-ID'] = tenantId;

    // Mock User Role - in a real app, get from Auth Context
    config.headers['X-User-Role'] = 'salesperson';

    return config;
});

// Response Interceptor for generic error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Call Failed:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);
