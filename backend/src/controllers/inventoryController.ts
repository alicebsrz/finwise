import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { companyId: string, userId: string };
}

// 1. Listar Produtos (SKUs)
export const getSkus = async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const skus = await prisma.sku.findMany({
      where: { companyId },
      orderBy: { name: 'asc' }
    });
    res.json(skus);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching SKUs' });
  }
};

// 2. Criar Novo Produto
// 2. Criar Novo Produto (Atualizado)
export const createSku = async (req: AuthRequest, res: Response) => {
  // Adicionei createdAt na desestruturação
  const { code, name, minQuantity, costPrice, sellingPrice, createdAt } = req.body;
  const companyId = req.user?.companyId;

  if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const sku = await prisma.sku.create({
      data: {
        code,
        name,
        minQuantity: Number(minQuantity),
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        quantity: 0, // Começa zerado, usa-se movimentação para adicionar saldo
        companyId,
        // Se vier data do front, usa ela. Senão, usa o padrão do banco (now)
        createdAt: createdAt ? new Date(createdAt) : undefined 
      }
    });
    res.status(201).json(sku);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating SKU' });
  }
};

// 3. Registrar Movimentação (Entrada/Saída)
export const addMovement = async (req: AuthRequest, res: Response) => {
  const { skuId, type, quantity, notes } = req.body; // type: 'IN' ou 'OUT'
  const userId = req.user?.userId;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Transação do Banco: Cria o histórico E atualiza a quantidade do produto de uma vez só
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Cria o registro de movimento
      const movement = await prisma.inventoryMovement.create({
        data: {
          type,
          quantity: Number(quantity),
          notes,
          skuId,
          userId
        }
      });

      // 2. Calcula se soma ou subtrai
      const adjustment = type === 'IN' ? Number(quantity) : -Number(quantity);

      // 3. Atualiza o produto
      const updatedSku = await prisma.sku.update({
        where: { id: skuId },
        data: {
          quantity: { increment: adjustment }
        }
      });

      return { movement, updatedSku };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding movement' });
  }
};

// 4. Atualizar Produto
// 4. Atualizar Produto (Atualizado)
export const updateSku = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  // Adicionei createdAt aqui também para permitir corrigir a data
  const { code, name, minQuantity, costPrice, sellingPrice, createdAt } = req.body;
  const companyId = req.user?.companyId;

  try {
    const updatedSku = await prisma.sku.updateMany({
      where: { id, companyId },
      data: {
        code,
        name,
        minQuantity: Number(minQuantity),
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        // Atualiza a data se for enviada
        createdAt: createdAt ? new Date(createdAt) : undefined 
      }
    });
    
    if (updatedSku.count === 0) return res.status(404).json({ message: 'SKU not found' });
    
    res.json({ message: 'Updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating SKU' });
  }
};

// 5. Excluir Produto
export const deleteSku = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const companyId = req.user?.companyId;

  try {
    // Primeiro deleta as movimentações desse produto (limpeza)
    await prisma.inventoryMovement.deleteMany({
      where: { skuId: id }
    });

    // Depois deleta o produto
    const deleted = await prisma.sku.deleteMany({
      where: { id, companyId }
    });

    if (deleted.count === 0) return res.status(404).json({ message: 'SKU not found' });

    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting SKU' });
  }
};

// 6. Realizar Auditoria (Inventário Físico)
export const performAudit = async (req: AuthRequest, res: Response) => {
  const { items } = req.body; // Array de { skuId, realQuantity }
  const userId = req.user?.userId;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const results: any[] = [];
    let totalItems = 0;
    let accurateItems = 0;

    // Usamos transaction para garantir que todos os ajustes sejam salvos ou nenhum
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const sku = await tx.sku.findUnique({ where: { id: item.skuId } });
        if (!sku) continue;

        totalItems++;
        const diff = item.realQuantity - sku.quantity;

        // Se houver diferença, cria movimentação de AJUSTE automaticamente
        if (diff !== 0) {
          await tx.inventoryMovement.create({
            data: {
              type: 'ADJUST', // Tipo específico para auditoria
              quantity: Math.abs(diff), // Quantidade absoluta
              // Se diff positivo: Entrada (Sobrou). Se negativo: Saída (Faltou).
              notes: `Ajuste de Inventário Físico: Sistema(${sku.quantity}) vs Real(${item.realQuantity})`,
              skuId: sku.id,
              userId
            }
          });

          // Atualiza o SKU para a quantidade real
          await tx.sku.update({
            where: { id: sku.id },
            data: { quantity: item.realQuantity }
          });
        } else {
          accurateItems++;
        }

        results.push({
          sku: sku.name,
          systemQty: sku.quantity,
          realQty: item.realQuantity,
          diff,
          status: diff === 0 ? 'ACCURATE' : 'DIVERGENT'
        });
      }
    });

    const accuracy = totalItems === 0 ? 100 : (accurateItems / totalItems) * 100;

    res.json({ 
      message: 'Audit completed successfully', 
      accuracy, 
      results 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error performing audit' });
  }
};