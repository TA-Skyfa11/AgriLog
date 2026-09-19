import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import session from 'express-session';
import MongoStore from 'connect-mongo';
dotenv.config();

// Fail fast on startup if JWT_SECRET is missing or empty
if (!process.env.JWT_SECRET || !process.env.JWT_SECRET.trim()) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is missing.');
  console.error('Server startup aborted: JWT_SECRET is required to secure authentication tokens and sessions.');
  throw new Error('FATAL: JWT_SECRET environment variable is required to start the server.');
}

const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/agrilog',
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));
import authRoutes from './routes/authRoutes';
import farmRoutes from './routes/farmRoutes';
import cultivationRoutes from './routes/cultivationRoutes';
import fertilizerRoutes from './routes/fertilizerRoutes';
import pesticideRoutes from './routes/pesticideRoutes';
import materialRoutes from './routes/materialRoutes';
import taskRoutes from './routes/taskRoutes';
import adminRoutes from './routes/adminRoutes';
import uploadRoutes from './routes/uploadRoutes';
import weatherRoutes from './routes/weatherRoutes';
import serviceRoutes from './routes/serviceRoutes';
import companyRoutes from './routes/companyRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import notificationRoutes from './routes/notificationRoutes';
import exportRoutes from './routes/exportRoutes';
import paymentRoutes from './routes/paymentRoutes';
import path from 'path';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/farm', farmRoutes);
app.use('/api/cultivation-boards', cultivationRoutes);
app.use('/api/fertilizer-boards', fertilizerRoutes);
app.use('/api/pesticide-boards', pesticideRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'AgriLog Backend is running' });
});

// Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
});

// Connect to Database
connectDB();

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export for Vercel
export default app;
