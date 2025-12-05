import { Router } from 'express';
// Adicione updateSku, deleteSku e performAudit na importação abaixo
import { getSkus, createSku, addMovement, updateSku, deleteSku, performAudit } from '../controllers/inventoryController';
import { isAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(isAuth);

router.get('/', getSkus);            // Lista produtos
router.post('/', createSku);         // Cria produto
router.post('/movement', addMovement); // Registra entrada/saída
router.put('/:id', updateSku);    // <--- Nova rota de Edição
router.delete('/:id', deleteSku); // <--- Nova rota de Exclusão
router.post('/audit', performAudit); // Auditoria de inventário físico

export default router;