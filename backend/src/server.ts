import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import assetRoutes from './routes/assets';
import loanRoutes from './routes/loans';
import aiRoutes from './routes/ai';
import cardRoutes from './routes/cards';
import fxRoutes from './routes/fx';
import certificateRoutes from './routes/certificates';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration
const allowedOrigins = [
  // Local development
  'http://localhost:5173',
  'http://localhost:5174', 
  'http://localhost:5175',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  // Production
  process.env.FRONTEND_URL,
  'https://*.vercel.app',
].filter(Boolean);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin?.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/loans', loanRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/cards', cardRoutes);
app.use('/api/v1/fx', fxRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AssetBridge API is running' });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    status: 'error',
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message || 'Internal server error'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🌍 AssetBridge Backend API                         ║
║                                                       ║
║   Server running on: http://localhost:${PORT}        ║
║   Environment: ${process.env.NODE_ENV || 'development'}                      ║
║                                                       ║
║   API Endpoints:                                      ║
║   - POST /api/v1/auth/register                       ║
║   - POST /api/v1/auth/login                          ║
║   - GET  /api/v1/users/profile                       ║
║   - PUT  /api/v1/users/details                       ║
║   - GET  /api/v1/users/dashboard                     ║
║   - GET  /api/v1/assets                              ║
║   - POST /api/v1/assets                              ║
║   - POST /api/v1/assets/:id/lock                     ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export default app;
