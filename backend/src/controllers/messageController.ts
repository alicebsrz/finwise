import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { companyId: string };
}

// 1. Listar Conversas (Agrupadas por telefone)
export const getConversations = async (req: AuthRequest, res: Response) => {
  const companyId = req.user?.companyId;
  if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Busca todos os logs
    const logs = await prisma.whatsappLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'asc' } // Do mais antigo para o novo (ordem de chat)
    });

    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

// 2. Enviar Mensagem
export const sendMessage = async (req: AuthRequest, res: Response) => {
  const { phone, contactName, message, status } = req.body;
  const companyId = req.user?.companyId;

  if (!companyId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Em alguns ambientes o client do Prisma pode ainda não expor o campo
    // (caso o client não tenha sido regenerado). Aqui montamos o objeto
    // de dados e o tipamos como `any` para evitar erro de tipo do TS.
    const data: any = {
      phone,
      contactName: contactName || 'Desconhecido',
      message,
      status: status || 'SENT',
      direction: 'OUT',
      companyId
    };

    const newLog = await prisma.whatsappLog.create({ data });
    
    res.status(201).json(newLog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error sending message' });
  }
};