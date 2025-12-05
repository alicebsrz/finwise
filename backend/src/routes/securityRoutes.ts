import { Router } from 'express';
import { getAuditLogs, downloadBackup } from '../controllers/securityController';
import { isAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(isAuth);

router.get('/logs', getAuditLogs);
router.get('/backup', downloadBackup);

export default router;