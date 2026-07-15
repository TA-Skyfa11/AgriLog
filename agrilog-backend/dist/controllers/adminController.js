"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateCommissionSetting = exports.getCommissionSetting = exports.adminResetPassword = exports.toggleUserLock = exports.addUser = exports.getDashboardStats = exports.getFarms = exports.getUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = require("../models/User");
const FarmProfile_1 = require("../models/FarmProfile");
const CultivationBoard_1 = require("../models/CultivationBoard");
const FertilizerBoard_1 = require("../models/FertilizerBoard");
const PesticideBoard_1 = require("../models/PesticideBoard");
const Product_1 = require("../models/Product");
const Order_1 = require("../models/Order");
const CompanyProfile_1 = require("../models/CompanyProfile");
const CultivationEntry_1 = require("../models/CultivationEntry");
const FertilizerEntry_1 = require("../models/FertilizerEntry");
const PesticideEntry_1 = require("../models/PesticideEntry");
const Task_1 = require("../models/Task");
const Material_1 = require("../models/Material");
const UploadLog_1 = require("../models/UploadLog");
const Notification_1 = require("../models/Notification");
const LoginHistory_1 = require("../models/LoginHistory");
const getUsers = async (req, res) => {
    try {
        const { role, status } = req.query;
        let query = { role: { $ne: User_1.Role.ADMIN } };
        if (role && role !== 'ALL') {
            query.role = role;
        }
        if (status && status !== 'ALL') {
            query.isActive = status === 'ACTIVE';
        }
        const users = await User_1.User.find(query).select('-passwordHash');
        const results = await Promise.all(users.map(async (u) => {
            let profile = null;
            let boardCount = 0;
            if (u.role === User_1.Role.FARM) {
                profile = await FarmProfile_1.FarmProfile.findOne({ user: u._id });
                if (profile) {
                    const cCount = await CultivationBoard_1.CultivationBoard.countDocuments({ farmProfile: profile._id });
                    const fCount = await FertilizerBoard_1.FertilizerBoard.countDocuments({ farmProfile: profile._id });
                    const pCount = await PesticideBoard_1.PesticideBoard.countDocuments({ farmProfile: profile._id });
                    boardCount = cCount + fCount + pCount;
                }
            }
            else if (u.role === User_1.Role.COMPANY) {
                profile = await CompanyProfile_1.CompanyProfile.findOne({ user: u._id });
            }
            return {
                user: u,
                profile,
                boardCount
            };
        }));
        res.json({ success: true, data: results });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getUsers = getUsers;
const getFarms = async (req, res) => {
    try {
        // Return list of Farm users with their profiles and board count
        const farms = await User_1.User.find({ role: User_1.Role.FARM }).select('-passwordHash');
        const results = await Promise.all(farms.map(async (farm) => {
            const profile = await FarmProfile_1.FarmProfile.findOne({ user: farm._id });
            let boardCount = 0;
            if (profile) {
                const cCount = await CultivationBoard_1.CultivationBoard.countDocuments({ farmProfile: profile._id });
                const fCount = await FertilizerBoard_1.FertilizerBoard.countDocuments({ farmProfile: profile._id });
                const pCount = await PesticideBoard_1.PesticideBoard.countDocuments({ farmProfile: profile._id });
                boardCount = cCount + fCount + pCount;
            }
            return {
                user: farm,
                profile,
                boardCount
            };
        }));
        res.json({ success: true, data: results });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getFarms = getFarms;
const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User_1.User.countDocuments();
        const totalFarms = await User_1.User.countDocuments({ role: User_1.Role.FARM });
        const newUsers = await User_1.User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }); // Last 30 days
        const totalProducts = await Product_1.Product.countDocuments();
        const cCount = await CultivationBoard_1.CultivationBoard.countDocuments();
        const fCount = await FertilizerBoard_1.FertilizerBoard.countDocuments();
        const pCount = await PesticideBoard_1.PesticideBoard.countDocuments();
        const totalBoards = cCount + fCount + pCount;
        // Recent Activities (Mix of recent users and recent products)
        const recentUsers = await User_1.User.find().sort({ createdAt: -1 }).limit(5).select('email role createdAt');
        const recentProducts = await Product_1.Product.find().sort({ createdAt: -1 }).limit(5).select('name createdAt status');
        let activities = [];
        recentUsers.forEach(u => {
            activities.push({
                id: u._id,
                type: 'USER',
                text: `Người dùng mới: ${u.email}`,
                time: u.createdAt
            });
        });
        recentProducts.forEach(p => {
            activities.push({
                id: p._id,
                type: 'PRODUCT',
                text: `Sản phẩm mới: ${p.name}`,
                time: p.createdAt
            });
        });
        activities.sort((a, b) => b.time.getTime() - a.time.getTime());
        const recentActivities = activities.slice(0, 5);
        // Chart Data (Last 6 months)
        const chartData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const year = d.getFullYear();
            const month = d.getMonth();
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0, 23, 59, 59);
            const usersCount = await User_1.User.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
            const ordersCount = await Order_1.Order.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
            chartData.push({
                name: `Tháng ${month + 1}`,
                users: usersCount,
                orders: ordersCount
            });
        }
        res.json({
            success: true,
            data: {
                totalUsers,
                totalFarms,
                newUsers,
                totalProducts,
                totalBoards,
                recentActivities,
                chartData
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getDashboardStats = getDashboardStats;
const addUser = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email và mật khẩu' });
        }
        const userExists = await User_1.User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Email này đã được đăng ký' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const user = await User_1.User.create({
            email,
            passwordHash,
            role: role || User_1.Role.FARM,
        });
        res.status(201).json({
            success: true,
            message: 'Thêm tài khoản thành công',
            data: {
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
exports.addUser = addUser;
const toggleUserLock = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (user.role === User_1.Role.ADMIN) {
            return res.status(403).json({ success: false, message: 'Cannot lock admin accounts' });
        }
        // Default to true if undefined
        const currentStatus = user.isActive === false ? false : true;
        user.isActive = !currentStatus;
        await user.save();
        res.json({ success: true, message: `Tài khoản đã được ${user.isActive ? 'mở khóa' : 'khóa'}` });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.toggleUserLock = toggleUserLock;
const adminResetPassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { newPassword } = req.body;
        if (!newPassword) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mật khẩu mới' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        }
        if (!user.allowAdminReset) {
            return res.status(403).json({
                success: false,
                message: 'Người dùng này chưa cho phép Admin đặt lại mật khẩu. Hãy yêu cầu họ bật tùy chọn này trong phần Cài đặt > Bảo mật.'
            });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        user.passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
        await user.save();
        res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.adminResetPassword = adminResetPassword;
// ===== COMMISSION SETTINGS =====
const CommissionSetting_1 = require("../models/CommissionSetting");
const getCommissionSetting = async (req, res) => {
    try {
        let setting = await CommissionSetting_1.CommissionSetting.findOne().sort({ updatedAt: -1 });
        if (!setting) {
            setting = await CommissionSetting_1.CommissionSetting.create({ rate: 5, description: 'Mức hoa hồng mặc định', updatedBy: req.user?._id });
        }
        res.json({ success: true, data: setting });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCommissionSetting = getCommissionSetting;
const updateCommissionSetting = async (req, res) => {
    try {
        const { rate, description } = req.body;
        if (rate == null || rate < 0 || rate > 100) {
            return res.status(400).json({ success: false, message: 'Mức hoa hồng phải từ 0% đến 100%' });
        }
        let setting = await CommissionSetting_1.CommissionSetting.findOne().sort({ updatedAt: -1 });
        if (!setting) {
            setting = new CommissionSetting_1.CommissionSetting();
        }
        setting.rate = rate;
        if (description)
            setting.description = description;
        setting.updatedBy = req.user?._id;
        await setting.save();
        res.json({ success: true, data: setting, message: `Đã cập nhật mức hoa hồng thành ${rate}%` });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateCommissionSetting = updateCommissionSetting;
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        }
        if (user.role === User_1.Role.ADMIN) {
            return res.status(403).json({ success: false, message: 'Không thể xóa tài khoản Admin' });
        }
        if (user.role === User_1.Role.FARM) {
            const profile = await FarmProfile_1.FarmProfile.findOne({ user: user._id });
            if (profile) {
                // Find boards
                const cBoards = await CultivationBoard_1.CultivationBoard.find({ farmProfile: profile._id });
                const fBoards = await FertilizerBoard_1.FertilizerBoard.find({ farmProfile: profile._id });
                const pBoards = await PesticideBoard_1.PesticideBoard.find({ farmProfile: profile._id });
                const cBoardIds = cBoards.map(b => b._id);
                const fBoardIds = fBoards.map(b => b._id);
                const pBoardIds = pBoards.map(b => b._id);
                // Delete entries
                await CultivationEntry_1.CultivationEntry.deleteMany({ cultivationBoard: { $in: cBoardIds } });
                await FertilizerEntry_1.FertilizerEntry.deleteMany({ fertilizerBoard: { $in: fBoardIds } });
                await PesticideEntry_1.PesticideEntry.deleteMany({ pesticideBoard: { $in: pBoardIds } });
                // Delete boards
                await CultivationBoard_1.CultivationBoard.deleteMany({ farmProfile: profile._id });
                await FertilizerBoard_1.FertilizerBoard.deleteMany({ farmProfile: profile._id });
                await PesticideBoard_1.PesticideBoard.deleteMany({ farmProfile: profile._id });
                // Delete tasks, materials, upload logs
                await Task_1.Task.deleteMany({ farmProfile: profile._id });
                await Material_1.Material.deleteMany({ farmProfile: profile._id });
                await UploadLog_1.UploadLog.deleteMany({ farmProfile: profile._id });
                await FarmProfile_1.FarmProfile.findByIdAndDelete(profile._id);
            }
            await Order_1.Order.deleteMany({ farm: user._id });
        }
        else if (user.role === User_1.Role.COMPANY) {
            await CompanyProfile_1.CompanyProfile.findOneAndDelete({ user: user._id });
            await Product_1.Product.deleteMany({ company: user._id });
            await Order_1.Order.deleteMany({ company: user._id });
        }
        // Common relations
        await Notification_1.Notification.deleteMany({ user: user._id });
        await LoginHistory_1.LoginHistory.deleteMany({ user: user._id });
        // Finally delete user
        await User_1.User.findByIdAndDelete(user._id);
        res.json({ success: true, message: 'Xóa tài khoản thành công' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteUser = deleteUser;
