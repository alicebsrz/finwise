import { Router } from 'express';
import { createTransaction, getTransactions, deleteTransaction } from '../controllers/transactionController';
import { isAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(isAuth); // Protege todas as rotas abaixo

router.post('/', createTransaction);
router.get('/', getTransactions);
router.delete('/:id', deleteTransaction);

export default router;