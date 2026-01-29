
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../middleware/auth';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

const supabaseUrl = process.env.SUPABASE_URL || `https://${process.env.DB_HOST}`;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

// Lazy initialization or fallback to prevent startup crash if envs are missing
// We'll throw error only when trying to use it if keys are missing
const supabaseAdmin = (supabaseUrl && serviceKey && serviceKey !== 'your_service_role_secret_key')
    ? createClient(supabaseUrl, serviceKey)
    : null;

if (!supabaseAdmin) {
    console.warn('WARNING: Supabase Admin Client not initialized. Missing SUPABASE_URL or valid SUPABASE_SERVICE_KEY.');
}

// Middleware to ensure only Admins can access
const requireAdmin = (req: any, res: any, next: any) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin rights required.' });
    }
    next();
};

router.use(requireAuth);
router.use(requireAdmin);

// GET /api/users - List Team Members
router.get('/', async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.status(503).json({ error: 'Supabase Admin not configured. check server logs.' });
        }

        // Fetch users from Supabase (Filtering by tenant happens manually or via metadata query if enabled)
        // Note: listUsers() lists ALL users in project. We must filter by tenant_id metadata.
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

        if (error) throw error;

        // Filter by Tenant ID
        const teamMembers = users
            .filter(u => u.user_metadata?.tenant_id === req.tenantId)
            .map(u => ({
                id: u.id,
                name: u.user_metadata?.full_name || 'Unknown',
                email: u.email,
                role: u.user_metadata?.role || 'salesperson',
                designation: u.user_metadata?.designation || 'Salesperson',
                created_at: u.created_at
            }));

        res.json(teamMembers);
    } catch (e: any) {
        console.error('List Users Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// POST /api/users - Create Salesperson
router.post('/', async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.status(503).json({ error: 'Supabase Admin not configured. check server logs.' });
        }

        const { email, password, name, designation, id: employeeId } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Create User in Supabase
        const { data: { user }, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm
            user_metadata: {
                full_name: name,
                designation: designation || 'Salesperson',
                role: 'salesperson', // ENFORCED CONSTRAINT: Only salespersons can be created
                tenant_id: req.tenantId, // Bind to Admin's Tenant
                employee_id: employeeId
            }
        });

        if (error) throw error;

        // Optional: Also insert into public.users table if you maintain a shadow table
        // For this architecture, we might be relying on Auth + Metadata, but syncing is good practice.

        res.status(201).json(user);
    } catch (e: any) {
        console.error('Create User Error:', e);
        res.status(400).json({ error: e.message });
    }
});

// DELETE /api/users/:id - Delete Member
router.delete('/:id', async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.status(503).json({ error: 'Supabase Admin not configured. check server logs.' });
        }

        const { id } = req.params;
        // Verify user belongs to tenant before deleting? 
        // Ideally yes, but getUserById then check metadata.
        const { data: { user }, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(id);

        if (fetchError || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.user_metadata?.tenant_id !== req.tenantId) {
            return res.status(403).json({ error: 'Unauthorized to delete this user' });
        }

        const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (error) throw error;

        res.json({ success: true });
    } catch (e: any) {
        console.error('Delete User Error:', e);
        res.status(500).json({ error: e.message });
    }
});

export default router;
