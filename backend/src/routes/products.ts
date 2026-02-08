import { Router } from 'express';
import { ProductService } from '../services/product.service';
import { requireAuth } from '../middleware/auth';

const router = Router();
const productService = new ProductService();

router.use(requireAuth);

// GET /api/products
router.get('/', async (req, res) => {
    try {
        const products = await productService.getProductsByTenant(req.tenantId!);
        res.json(products);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/products
router.post('/', async (req, res) => {
    try {
        const product = await productService.createProduct(req.tenantId!, req.body);
        res.json(product);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

export default router;
