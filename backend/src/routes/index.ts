import { Router } from 'express';
import leadsRouter from './leads';
import productsRouter from './products';

const router = Router();

router.use('/leads', leadsRouter);
router.use('/products', productsRouter);

router.get('/', (req, res) => {
    res.json({ message: 'MoveTheBox API v1', status: 'active' });
});

export default router;
