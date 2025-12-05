import { Router } from 'express';
import { globalSearch, getNotifications } from '../controllers/headerController';
import { isAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(isAuth);

router.get('/search', globalSearch);
router.get('/notifications', getNotifications);

export default router;