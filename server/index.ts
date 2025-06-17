
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import leaveRoutes from './routes/leave';
import balanceRoutes from './routes/balance';
import holidayRoutes from './routes/holiday';
import rolloverRoutes from './routes/rollover';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/holiday', holidayRoutes);
app.use('/api/rollover', rolloverRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Leave Management API is running' });
});

// Start server
const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
