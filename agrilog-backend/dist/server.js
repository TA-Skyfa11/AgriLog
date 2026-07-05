"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const farmRoutes_1 = __importDefault(require("./routes/farmRoutes"));
const cultivationRoutes_1 = __importDefault(require("./routes/cultivationRoutes"));
const fertilizerRoutes_1 = __importDefault(require("./routes/fertilizerRoutes"));
const pesticideRoutes_1 = __importDefault(require("./routes/pesticideRoutes"));
const materialRoutes_1 = __importDefault(require("./routes/materialRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/farm', farmRoutes_1.default);
app.use('/api/cultivation-boards', cultivationRoutes_1.default);
app.use('/api/fertilizer-boards', fertilizerRoutes_1.default);
app.use('/api/pesticide-boards', pesticideRoutes_1.default);
app.use('/api/materials', materialRoutes_1.default);
app.use('/api/tasks', taskRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'AgriLog Backend is running' });
});
// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
});
// Start Server
const startServer = async () => {
    try {
        await (0, db_1.connectDB)();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
