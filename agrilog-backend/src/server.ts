// import dns from 'dns';
// dns.setServers(['8.8.8.8', '1.1.1.1']);
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import session from 'express-session';
import { SupabaseSessionStore } from './config/supabaseSessionStore';
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

// Chuẩn hóa header X-Forwarded-For và X-Real-IP nếu reverse proxy chuyển tiếp port (ví dụ: "171.244.35.2:38052")
app.use((req: Request, _res: Response, next: NextFunction) => {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (typeof xForwardedFor === 'string' && xForwardedFor.includes(':')) {
    const cleaned = xForwardedFor
      .split(',')
      .map((part) => {
        const trimmed = part.trim();
        const ipv4Match = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/);
        if (ipv4Match) return ipv4Match[1];
        const ipv6Match = trimmed.match(/^\[([a-fA-F0-9:]+)\](:\d+)?$/);
        if (ipv6Match) return ipv6Match[1];
        return trimmed;
      })
      .join(', ');
    req.headers['x-forwarded-for'] = cleaned;
  }

  const xRealIp = req.headers['x-real-ip'];
  if (typeof xRealIp === 'string' && xRealIp.includes(':')) {
    const trimmed = xRealIp.trim();
    const ipv4Match = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/);
    if (ipv4Match) {
      req.headers['x-real-ip'] = ipv4Match[1];
    }
  }

  next();
});

// Danh sách origin được phép truy cập
const allowedOrigins = new Set([
  'https://agrilog.io.vn',
  'https://www.agrilog.io.vn',
  'http://agrilog.io.vn',
  'http://www.agrilog.io.vn',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach((url) => {
    const trimmed = url.trim().replace(/\/$/, '');
    if (trimmed) allowedOrigins.add(trimmed);
  });
}

// Middleware CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.has(origin) ||
        /^https?:\/\/([a-zA-Z0-9-]+\.)?agrilog\.io\.vn$/.test(origin) ||
        /^http:\/\/localhost(:\d+)?$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);

      if (isAllowed) {
        return callback(null, true);
      }

      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  })
);

// Lưu rawBody để xác thực chữ ký webhook (HMAC-SHA256 của SePay)
app.use(express.json({
  verify: (req: any, _res: Response, buf: Buffer) => {
    req.rawBody = buf;
  }
}));

app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new SupabaseSessionStore(),
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
import featureRoutes from './routes/featureRoutes';
import path from 'path';
import { getFileFromR2 } from './utils/r2Storage';
import { startTaskReminderScheduler } from './utils/taskScheduler';

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
app.use('/api/features', featureRoutes);

// Support direct /images/* routing for R2 stored files
app.get(/^\/images\/(.+)$/, async (req: Request, res: Response) => {
  const key = `images/${req.params[0]}`;
  try {
    const fileData = await getFileFromR2(key);
    res.setHeader('Content-Type', fileData.contentType);
    if (fileData.contentLength) {
      res.setHeader('Content-Length', fileData.contentLength);
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    fileData.stream.pipe(res);
  } catch (err: any) {
    res.status(404).send('Không tìm thấy ảnh');
  }
});

app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

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
  // Khởi động scheduler quét thông báo nhắc lịch công việc
  startTaskReminderScheduler(30);
});

// Export for Vercel
export default app;
