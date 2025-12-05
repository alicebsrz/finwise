import { Router } from 'express';
import { getAbcCurve, getDeadStock, getFinancialReports, getGeneralKpis } from '../controllers/reportController';
import { isAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(isAuth);

router.get('/abc', getAbcCurve);
router.get('/dead-stock', getDeadStock);
router.get('/financial', getFinancialReports); // <--- Nova
router.get('/kpis', getGeneralKpis);           // <--- Nova

export default router;