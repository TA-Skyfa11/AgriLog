"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const protect = async (req, res, next) => {
    // Try session first
    let userId = req.session?.userId;
    // Fallback to JWT Bearer token (for cross-origin deployments where cookies are blocked)
    if (!userId) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            if (token) {
                try {
                    const secret = process.env.JWT_SECRET;
                    if (!secret) {
                        throw new Error('JWT_SECRET environment variable is not configured');
                    }
                    const decoded = jsonwebtoken_1.default.verify(token, secret);
                    userId = decoded.id;
                }
                catch (err) {
                    if (err?.message === 'JWT_SECRET environment variable is not configured') {
                        return res.status(500).json({ success: false, message: 'Lỗi cấu hình hệ thống: thiếu JWT_SECRET' });
                    }
                    // Token invalid or expired
                }
            }
        }
    }
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Bạn cần đăng nhập để truy cập' });
    }
    try {
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Không tìm thấy người dùng' });
        }
        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi xác thực phiên đăng nhập' });
    }
};
exports.protect = protect;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập chức năng này' });
        }
        next();
    };
};
exports.authorize = authorize;
