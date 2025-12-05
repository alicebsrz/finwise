import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Registro: Cria Empresa + Usuário Admin ao mesmo tempo
export const register = async (req: Request, res: Response) => {
  const { name, email, password, companyName } = req.body;

  try {
    // Verifica se usuário já existe
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Criptografa a senha
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Transação: Cria Company e User juntos. Se um falhar, tudo falha.
    const result = await prisma.$transaction(async (prisma) => {
      const company = await prisma.company.create({
        data: { name: companyName }
      });

      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          companyId: company.id,
          role: 'ADMIN' // Primeiro usuário é sempre Admin
        }
      });

      return { company, user };
    });

    res.status(201).json({ 
      message: 'Company and Admin registered successfully',
      user: { id: result.user.id, name: result.user.name, email: result.user.email }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login: Valida senha e devolve Token
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Gera o Token JWT
    const token = jwt.sign(
      { userId: user.id, companyId: user.companyId, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' } // Expira em 1 dia
    );

    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};