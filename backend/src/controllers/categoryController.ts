import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { companyId: string };
}

// 1. Listar Categorias
export const getCategories = async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const categories = await prisma.category.findMany({
      where: { companyId },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

// 2. Criar Categoria com Palavras-Chave
export const createCategory = async (req: AuthRequest, res: Response) => {
  const { name, keywords, priority } = req.body; // keywords vem como string "uber, 99, taxi"
  const companyId = req.user?.companyId;

  if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const category = await prisma.category.create({
      data: {
        name,
        keywords, // Salva direto no banco
        priority: Number(priority) || 1,
        companyId
      }
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error creating category' });
  }
};

// --- NOVO: Atualizar Categoria ---
export const updateCategory = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, keywords, priority } = req.body;
  const companyId = req.user?.companyId;

  if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const updated = await prisma.category.updateMany({
      where: { id, companyId },
      data: { 
        name, 
        keywords,
        priority: Number(priority) 
      }
    });
    
    if (updated.count === 0) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating category' });
  }
};

// 3. Excluir Categoria
export const deleteCategory = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const companyId = req.user?.companyId;

  try {
    // Opcional: Verificar se tem transações antes de deletar? 
    // Por enquanto vamos permitir deletar (o banco seta null nas transações ou dá erro dependendo da config)
    // Vamos apenas deletar direto:
    await prisma.category.deleteMany({
      where: { id, companyId }
    });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category' });
  }
};