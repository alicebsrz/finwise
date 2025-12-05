import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { companyId: string, userId: string };
}

// --- Lógica de Categorização Automática Melhorada ---
const categorizeTransaction = async (description: string, companyId: string) => {
  // Busca categorias ordenadas por PRIORIDADE (descendente)
  const categories = await prisma.category.findMany({ 
    where: { companyId },
    orderBy: { priority: 'desc' } // Verifica as regras mais fortes primeiro
  });
  
  const text = description.toLowerCase();

  for (const cat of categories) {
    if (cat.keywords) {
      const keywords = cat.keywords.split(',').map(k => k.trim().toLowerCase());
      
      for (const kw of keywords) {
        if (!kw) continue;
        // Regex para buscar palavra inteira ou parcial segura
        // Ex: se keyword for "uber", acha "uber eats", mas cuidado com parciais.
        // Vamos manter o includes simples mas robusto:
        if (text.includes(kw)) {
          return cat.id;
        }
      }
    }
  }
  return null;
};

// --- CRUD ---

export const createTransaction = async (req: AuthRequest, res: Response) => {
  const { type, amount, date, description, categoryId } = req.body;
  const companyId = req.user?.companyId;

  if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Se o usuário não mandou categoria, tentamos adivinhar
    let finalCategoryId = categoryId;
    if (!finalCategoryId) {
      finalCategoryId = await categorizeTransaction(description, companyId);
    }

    const transaction = await prisma.transaction.create({
      data: {
        type, // 'INCOME' ou 'EXPENSE'
        amount: Number(amount),
        date: new Date(date),
        description,
        categoryId: finalCategoryId,
        companyId
      },
      include: { category: true } // Retorna já com o nome da categoria
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating transaction' });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const transactions = await prisma.transaction.findMany({
      where: { companyId },
      orderBy: { date: 'desc' },
      include: { category: true }
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const companyId = req.user?.companyId;

  try {
    // Garante que só deleta se pertencer à empresa do usuário
    await prisma.transaction.deleteMany({
      where: { id, companyId }
    });
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting' });
  }
};