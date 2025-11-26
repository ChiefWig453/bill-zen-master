import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
// Configure CORS to allow multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => origin.startsWith(allowed as string))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
import authRoutes from './routes/authRoutes';
import billRoutes from './routes/billRoutes';
import incomeRoutes from './routes/incomeRoutes';
import dashRoutes from './routes/dashRoutes';
import maintenanceRoutes from './routes/maintenanceRoutes';
import preferencesRoutes from './routes/preferencesRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/dash', dashRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/preferences', preferencesRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
