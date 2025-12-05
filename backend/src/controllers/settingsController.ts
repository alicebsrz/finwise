import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { companyId: string };
}

// 1. Buscar Configurações e Usuários
export const getSettings = async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true } // Não devolve a senha!
        }
      }
    });

    if (!company) return res.status(404).json({ message: 'Company not found' });

    res.json({
      name: company.name,
      currency: company.currency,
      minStockAlert: company.minStockAlert,
      purchaseAlertLimit: company.purchaseAlertLimit,
      users: company.users
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings' });
  }
};

// 2. Atualizar Configurações Gerais
export const updateSettings = async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  const { name, currency, minStockAlert, purchaseAlertLimit } = req.body;

  if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        name,
        currency,
        minStockAlert: Number(minStockAlert),
        purchaseAlertLimit: Number(purchaseAlertLimit)
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings' });
  }
};