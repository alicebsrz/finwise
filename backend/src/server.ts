import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes'; // <--- Importou
import dashboardRoutes from './routes/dashboardRoutes';
import transactionRoutes from './routes/transactionRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import categoryRoutes from './routes/categoryRoutes';
import reportRoutes from './routes/reportRoutes';
import messageRoutes from './routes/messageRoutes';
import settingsRoutes from './routes/settingsRoutes';
import headerRoutes from './routes/headerRoutes';
import securityRoutes from './routes/securityRoutes';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Em produção usa a URL certa, local aceita tudo
  credentials: true
}));

const PORT = process.env.PORT || 3001;

// Rotas
app.use('/auth', authRoutes); // <--- Usou. Agora temos /auth/register e /auth/login
app.use('/dashboard', dashboardRoutes);
app.use('/transactions', transactionRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/categories', categoryRoutes);
app.use('/reports', reportRoutes);
app.use('/messages', messageRoutes);
app.use('/settings', settingsRoutes);
app.use('/header', headerRoutes);
app.use('/security', securityRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'FinWise API is running!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});