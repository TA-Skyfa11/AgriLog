"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import dns from 'dns';
// dns.setServers(['8.8.8.8', '1.1.1.1']);
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const express_session_1 = __importDefault(require("express-session"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
dotenv_1.default.config();
// Fail fast on startup if JWT_SECRET is missing or empty
if (!process.env.JWT_SECRET || !process.env.JWT_SECRET.trim()) {
    console.error('FATAL ERROR: JWT_SECRET environment variable is missing.');
    console.error('Server startup aborted: JWT_SECRET is required to secure authentication tokens and sessions.');
    throw new Error('FATAL: JWT_SECRET environment variable is required to start the server.');
}
const JWT_SECRET = process.env.JWT_SECRET;
const app = (0, express_1.default)();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, express_session_1.default)({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    store: connect_mongo_1.default.create({
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
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const farmRoutes_1 = __importDefault(require("./routes/farmRoutes"));
const cultivationRoutes_1 = __importDefault(require("./routes/cultivationRoutes"));
const fertilizerRoutes_1 = __importDefault(require("./routes/fertilizerRoutes"));
const pesticideRoutes_1 = __importDefault(require("./routes/pesticideRoutes"));
const materialRoutes_1 = __importDefault(require("./routes/materialRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const weatherRoutes_1 = __importDefault(require("./routes/weatherRoutes"));
const serviceRoutes_1 = __importDefault(require("./routes/serviceRoutes"));
const companyRoutes_1 = __importDefault(require("./routes/companyRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const exportRoutes_1 = __importDefault(require("./routes/exportRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const path_1 = __importDefault(require("path"));
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/farm', farmRoutes_1.default);
app.use('/api/cultivation-boards', cultivationRoutes_1.default);
app.use('/api/fertilizer-boards', fertilizerRoutes_1.default);
app.use('/api/pesticide-boards', pesticideRoutes_1.default);
app.use('/api/materials', materialRoutes_1.default);
app.use('/api/tasks', taskRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/upload', uploadRoutes_1.default);
app.use('/api/export', exportRoutes_1.default);
app.use('/api/weather', weatherRoutes_1.default);
app.use('/api/services', serviceRoutes_1.default);
app.use('/api/company', companyRoutes_1.default);
app.use('/api/products', productRoutes_1.default);
app.use('/api/orders', orderRoutes_1.default);
app.use('/api/payment', paymentRoutes_1.default);
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'AgriLog Backend is running' });
});
// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
});
// Connect to Database
(0, db_1.connectDB)();
// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// Export for Vercel
exports.default = app;
