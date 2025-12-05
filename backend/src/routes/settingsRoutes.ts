import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { isAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(isAuth);

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;