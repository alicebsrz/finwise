import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { companyId: string };
}

// 1. Busca Global (Produtos + Transações)
export const globalSearch = async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  const query = req.query.q as string;

  if (!companyId || !query) return res.json({ products: [], transactions: [] });

  try {
    const term = query.toLowerCase();

    // Busca Produtos
    const products = await prisma.sku.findMany({
      where: {
        companyId,
        OR: [
          { name: { contains: term } }, // Remove 'mode: insensitive' se der erro no SQLite
          { code: { contains: term } }
        ]
      },
      take: 5
    });

    // Busca Transações
    const transactions = await prisma.transaction.findMany({
      where: {
        companyId,
        description: { contains: term }
      },
      take: 5,
      orderBy: { date: 'desc' }
    });

    res.json({ products, transactions });
  } catch (error) {
    res.status(500).json({ message: 'Error searching' });
  }
};

// 2. Notificações Inteligentes (Gera avisos baseados em dados reais)
export const getNotifications = async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const notifications = [];

    // A. Verifica Estoque Baixo
    const criticalStock = await prisma.sku.findMany({
      where: { companyId, quantity: { lte: prisma.sku.fields.minQuantity } },
      take: 5
    });

    criticalStock.forEach(sku => {
      notifications.push({
        id: `stock-${sku.id}`,
        title: 'Estoque Crítico',
        message: `O produto ${sku.name} está com apenas ${sku.quantity} un.`,
        type: 'alert',
        time: 'Agora'
      });
    });

    // B. Verifica Últimas Transações Grandes (Ex: > 1000)
    const bigTransactions = await prisma.transaction.findMany({
      where: { companyId, amount: { gte: 1000 } },
      orderBy: { date: 'desc' },
      take: 3
    });

    bigTransactions.forEach(t => {
      notifications.push({
        id: `trans-${t.id}`,
        title: 'Movimentação Alta',
        message: `${t.type === 'INCOME' ? 'Entrada' : 'Saída'} de R$ ${t.amount} registrada.`,
        type: 'info',
        time: new Date(t.date).toLocaleDateString()
      });
    });

    // Se não tiver nada, adiciona boas-vindas
    if (notifications.length === 0) {
      notifications.push({
        id: 'welcome',
        title: 'Tudo certo!',
        message: 'Nenhum alerta pendente no sistema.',
        type: 'success',
        time: 'Agora'
      });
    }

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};