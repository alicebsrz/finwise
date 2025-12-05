import { Router } from 'express';
import { getCategories, createCategory, deleteCategory, updateCategory } from '../controllers/categoryController';
import { isAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(isAuth);

router.get('/', getCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory); // <--- Adiciona rota de edição
router.delete('/:id', deleteCategory);

export default router;