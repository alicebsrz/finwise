import { Router, Request, Response } from 'express';
import { isAuth } from '../middleware/authMiddleware';

const router = Router();

// Minimal inline handler to avoid compilation dependency on controller during fast iteration.
router.get('/stats', isAuth, async (req: Request, res: Response) => {
	// Placeholder: the real controller will aggregate finance and inventory stats.
	res.json({ message: 'Dashboard stats endpoint (placeholder)' });
});

export default router;
