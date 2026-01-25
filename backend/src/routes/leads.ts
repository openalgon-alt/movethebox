import { Router } from 'express';
import { LeadService } from '../services/lead.service';
import { requireAuth } from '../middleware/auth';

const router = Router();
const leadService = new LeadService();

router.use(requireAuth);

// GET /api/leads
router.get('/', async (req, res) => {
    try {
        const leads = await leadService.getLeads(req.tenantId!, req.query);
        res.json(leads);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/leads (Create/Update with Incentive Calc)
router.post('/', async (req, res) => {
    try {
        const lead = await leadService.upsertLead(
            req.tenantId!,
            req.body,
            req.userRole!
        );
        res.json(lead);
    } catch (e: any) {
        console.error(e);
        res.status(400).json({ error: e.message });
    }
});

// GET /api/leads/stats
router.get('/stats', async (req, res) => {
    try {
        const stats = await leadService.getLeadStats(req.tenantId!);
        res.json(stats);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
