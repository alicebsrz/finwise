import { Router } from 'express';
import { getConversations, sendMessage } from '../controllers/messageController';
import { isAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(isAuth);

router.get('/', getConversations);
router.post('/', sendMessage);

export default router;