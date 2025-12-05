import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { companyId: string, userId: string };
}

// 1. Listar Logs de Auditoria
export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const logs = await prisma.auditLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Últimos 50 eventos
      include: { user: { select: { name: true } } }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs' });
  }
};

// 2. Gerar Backup Completo (JSON)
export const downloadBackup = async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Busca TUDO da empresa
    const [company, users, transactions, skus, movements, categories, logs] = await prisma.$transaction([
      prisma.company.findUnique({ where: { id: companyId } }),
      prisma.user.findMany({ where: { companyId } }),
      prisma.transaction.findMany({ where: { companyId } }),
      prisma.sku.findMany({ where: { companyId } }),
      prisma.inventoryMovement.findMany({ where: { sku: { companyId } } }),
      prisma.category.findMany({ where: { companyId } }),
      prisma.auditLog.findMany({ where: { companyId } })
    ]);

    const backupData = {
      generatedAt: new Date(),
      company,
      users,
      transactions,
      inventory: { skus, movements },
      categories,
      systemLogs: logs
    };

    // Registra que um backup foi feito
    await prisma.auditLog.create({
      data: {
        action: 'BACKUP_GENERATED',
        details: 'Backup completo do sistema realizado.',
        userId: req.user!.userId,
        companyId
      }
    });

    res.json(backupData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating backup' });
  }
};