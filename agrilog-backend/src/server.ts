import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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
app.use('/api/weather', weatherRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'AgriLog Backend is running' });
});

// Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
});

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
