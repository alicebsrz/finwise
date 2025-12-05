import { Router } from 'express';
import { getDashboardStats, getDashboardChart } from '../controllers/dashboardController'; // <--- Importe a nova função
import { isAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(isAuth);

router.get('/stats', getDashboardStats);
router.get('/chart', getDashboardChart); // <--- Nova rota

export default router;