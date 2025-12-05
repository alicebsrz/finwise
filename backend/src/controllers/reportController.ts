import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { companyId: string };
}

// 1. CURVA ABC (Mantido)
export const getAbcCurve = async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const skus = await prisma.sku.findMany({ where: { companyId, quantity: { gt: 0 } } });
    const items = skus.map(sku => ({
      id: sku.id, name: sku.name, code: sku.code, value: sku.quantity * sku.costPrice, quantity: sku.quantity
    })).sort((a, b) => b.value - a.value);

    const totalInventoryValue = items.reduce((acc, item) => acc + item.value, 0);
    let accumulatedValue = 0;
    
    const abcList = items.map(item => {
      accumulatedValue += item.value;
      const accumulatedPercentage = (accumulatedValue / totalInventoryValue) * 100;
      let classification = 'C';
      if (accumulatedPercentage <= 80) classification = 'A';
      else if (accumulatedPercentage <= 95) classification = 'B';
      return { ...item, classification };
    });

    res.json({ totalInventoryValue, items: abcList });
  } catch (error) {
    res.status(500).json({ message: 'Error generating ABC' });
  }
};

// 2. ESTOQUE MORTO (Atualizado para aceitar filtro de dias)
export const getDeadStock = async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  // Pega os dias da query string (ex: ?days=30), padrão 90 se não vier nada
  const days = Number(req.query.days) || 90;

  if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const cutOffDate = new Date();
    cutOffDate.setDate(cutOffDate.getDate() - days);

    const skus = await prisma.sku.findMany({
      where: { 
        companyId, 
        quantity: { gt: 0 } // Só itens que têm saldo travado
      },
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const deadStock = skus.filter(sku => {
      // Usa a data do último movimento, quando existir. Se não houver movimento, não há lastActivity disponível.
      const lastActivity = sku.movements[0]?.createdAt; // Date | undefined
      // Se não houver lastActivity, consideramos o item sem movimentação (tratá-lo como inativo)
      if (!lastActivity) return true;
      return lastActivity < cutOffDate;
    }).map(sku => ({
      id: sku.id,
      name: sku.name,
      quantity: sku.quantity,
      costPrice: sku.costPrice,
      totalLostValue: sku.quantity * sku.costPrice,
      daysInactive: (() => {
        const last = sku.movements[0]?.createdAt;
        if (!last) return null;
        return Math.floor((Date.now() - last.getTime()) / (1000 * 3600 * 24));
      })()
    }));

    // Ordena pelo maior capital parado (Ranking dos piores)
    deadStock.sort((a, b) => b.totalLostValue - a.totalLostValue);

    res.json(deadStock);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching dead stock' });
  }
};

// 3. RELATÓRIO FINANCEIRO (Fluxo de Caixa + Categorias) - NOVO
export const getFinancialReports = async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const transactions = await prisma.transaction.findMany({
      where: { companyId },
      include: { category: true }
    });

    // A. Fluxo de Caixa Mensal
    const cashFlowMap = new Map();
    transactions.forEach(t => {
      const monthKey = new Date(t.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (!cashFlowMap.has(monthKey)) cashFlowMap.set(monthKey, { name: monthKey, income: 0, expense: 0 });
      const entry = cashFlowMap.get(monthKey);
      if (t.type === 'INCOME') entry.income += t.amount;
      else entry.expense += t.amount;
    });
    const cashFlow = Array.from(cashFlowMap.values());

    // B. Despesas por Categoria
    const categoryMap = new Map();
    transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
      const catName = t.category?.name || 'Sem Categoria';
      if (!categoryMap.has(catName)) categoryMap.set(catName, { name: catName, value: 0 });
      categoryMap.get(catName).value += t.amount;
    });
    const expensesByCategory = Array.from(categoryMap.values());

    res.json({ cashFlow, expensesByCategory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error financial reports' });
  }
};

// 4. KPIs GERAIS (Capital, Acuracidade, Crítico) - NOVO
export const getGeneralKpis = async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const skus = await prisma.sku.findMany({ where: { companyId } });
    
    // Capital Empregado
    const capitalEmployed = skus.reduce((acc, curr) => acc + (curr.quantity * curr.costPrice), 0);
    
    // Estoque Crítico
    const criticalItems = skus.filter(s => s.quantity <= s.minQuantity).length;

    // Acuracidade (Simulada baseada em ajustes manuais)
    // Se tiver muitos movimentos do tipo "ADJUST", a acuracidade cai.
    const adjustments = await prisma.inventoryMovement.count({
      where: { 
        sku: { companyId },
        type: 'ADJUST' // Supondo que você use esse tipo para correções de erro
      }
    });
    const totalMovements = await prisma.inventoryMovement.count({ where: { sku: { companyId } } });
    
    // Fórmula simples: 100% - (% de movimentos que são ajustes de erro)
    // Se não tiver movimentos, 100%.
    const accuracy = totalMovements === 0 ? 100 : Math.round(100 - ((adjustments / totalMovements) * 100));

    res.json({ capitalEmployed, criticalItems, accuracy });
  } catch (error) {
    res.status(500).json({ message: 'Error KPIs' });
  }
};