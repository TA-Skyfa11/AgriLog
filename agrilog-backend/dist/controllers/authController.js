"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoginHistory = exports.toggleAdminReset = exports.changePassword = exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const LoginHistory_1 = require("../models/LoginHistory");
const generateToken = (id, role) => {
    return jsonwebtoken_1.default.sign({ id, role }, process.env.JWT_SECRET || 'secret_key', {
        expiresIn: '30d',
    });
};
const register = async (req, res) => {
    try {
        const { email, password, role: requestedRole } = req.body;
        const userExists = await User_1.User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Email này đã được đăng ký' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        // Only allow FARM or COMPANY from registration, never ADMIN
        const allowedRoles = [User_1.Role.FARM, User_1.Role.COMPANY];
        const finalRole = allowedRoles.includes(requestedRole) ? requestedRole : User_1.Role.FARM;
        const user = await User_1.User.create({
            email,
            passwordHash,
            role: finalRole,
        });
        res.status(201).json({
            success: true,
            token: generateToken(user._id.toString(), user.role),
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();
        const user = await User_1.User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu' });
        }
        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa' });
        }
        const normalizedPassword = password?.trim() || '';
        const isMatch = await bcryptjs_1.default.compare(normalizedPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu' });
        }
        // Log login history
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        await LoginHistory_1.LoginHistory.create({
            user: user._id,
            ipAddress,
            userAgent
        });
        res.json({
            success: true,
            token: generateToken(user._id.toString(), user.role),
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        const user = await User_1.User.findById(req.user?._id).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMe = getMe;
const changePassword = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
        }
        const isMatch = await bcryptjs_1.default.compare(currentPassword.trim(), user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(newPassword.trim(), salt);
        user.passwordHash = passwordHash;
        await user.save();
        res.json({ success: true, message: 'Đổi mật khẩu thành công' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.changePassword = changePassword;
const toggleAdminReset = async (req, res) => {
    try {
        const { allow } = req.body;
        const user = await User_1.User.findById(req.user?._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        }
        user.allowAdminReset = !!allow;
        await user.save();
        res.json({
            success: true,
            message: allow ? 'Đã cho phép Admin đặt lại mật khẩu' : 'Đã tắt quyền Admin đặt lại mật khẩu',
            data: { allowAdminReset: user.allowAdminReset }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.toggleAdminReset = toggleAdminReset;
const getLoginHistory = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const history = await LoginHistory_1.LoginHistory.find({ user: userId }).sort({ createdAt: -1 }).limit(10);
        res.json({ success: true, data: history });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getLoginHistory = getLoginHistory;
