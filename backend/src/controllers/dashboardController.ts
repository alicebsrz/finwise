import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { companyId: string };
}

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // 1. Financeiro
    const transactions = await prisma.transaction.findMany({ where: { companyId } });
    const income = transactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
    const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
    const balance = income - expense;

    // 2. Estoque
    const skus = await prisma.sku.findMany({ where: { companyId } });
    const capitalEmployed = skus.reduce((acc, curr) => acc + (curr.quantity * curr.costPrice), 0);
    const lowStockItems = skus.filter(sku => sku.quantity <= sku.minQuantity).length;

    res.json({
      finance: { balance, income, expense },
      inventory: { totalSkus: skus.length, capitalEmployed, lowStockItems },
      recentActivity: [] // Frontend busca isso separadamente agora se quiser, ou removemos
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

// --- COLE ISTO DENTRO DE backend/src/controllers/dashboardController.ts ---
// Substitua a função getDashboardChart antiga por esta:

export const getDashboardChart = async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  const period = req.query.period as string || 'monthly'; // 'daily', 'weekly', 'monthly'

  console.log(`\n📊 GERANDO GRÁFICO (${period}) para empresa: ${companyId}`);

  if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const now = new Date();
    let startDate = new Date();

    // 1. Definir a data de corte (Onde começa o gráfico)
    if (period === 'daily') {
      startDate.setDate(now.getDate() - 30); // Últimos 30 dias
    } else if (period === 'weekly') {
      startDate.setDate(now.getDate() - 90); // Últimos 3 meses (dia a dia)
    } else {
      startDate.setMonth(now.getMonth() - 12); // Últimos 12 meses
      startDate.setDate(1); // Começo do mês
    }

    // 2. Buscar Transações no Banco
    const transactions = await prisma.transaction.findMany({
      where: {
        companyId,
        date: { gte: startDate } // Pega tudo dessa data pra frente
      },
      orderBy: { date: 'asc' } // IMPORTANTE: Ordenar por data para o gráfico não ficar bagunçado
    });

    console.log(`✅ Encontradas ${transactions.length} transações no período.`);

    // 3. Agrupamento (A Mágica acontece aqui)
    // Usamos um Map onde a CHAVE é a data formatada (ex: "dez. 25")
    const groupedData = new Map<string, { name: string, income: number, expense: number }>();

    transactions.forEach(t => {
      const date = new Date(t.date);
      let key = '';

      // Formatação da Data (Eixo X do gráfico)
      if (period === 'monthly') {
        // Ex: "dez. 25"
        // Nota: O 'pt-BR' garante que fique em português
        key = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }); 
      } else {
        // Ex: "05/12" (Para diário e semanal mostramos dia/mês)
        key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      }

      // Se a data ainda não existe no mapa, cria zerada
      if (!groupedData.has(key)) {
        groupedData.set(key, { name: key, income: 0, expense: 0 });
      }

      // Soma os valores
      const entry = groupedData.get(key)!;
      if (t.type === 'INCOME') {
        entry.income += t.amount;
      } else {
        entry.expense += t.amount;
      }
    });

    // 4. Converte o Map para o Array que o Recharts exige
    const finalChartData = Array.from(groupedData.values());

    console.log('📦 Dados enviados para o Frontend:', finalChartData);
    
    // Retorna o JSON exato: [{ name: '...', income: 100, expense: 50 }, ...]
    res.json(finalChartData);

  } catch (error) {
    console.error('❌ ERRO NO GRÁFICO:', error);
    res.status(500).json({ message: 'Error fetching chart data' });
  }
};