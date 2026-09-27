"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTrialPolicy = exports.getTrialPolicy = exports.deleteServicePackage = exports.updateServicePackage = exports.createServicePackage = exports.getServicePackages = void 0;
const ServicePackage_1 = require("../models/ServicePackage");
// Lấy danh sách tất cả các gói dịch vụ
const getServicePackages = async (req, res) => {
    try {
        const packages = await ServicePackage_1.ServicePackage.find().sort({ price: 1 });
        res.json({ success: true, data: packages });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getServicePackages = getServicePackages;
// Tạo gói dịch vụ mới (Admin)
const createServicePackage = async (req, res) => {
    try {
        const { name, code, price, description, features, maxImages, maxBoards, isActive } = req.body;
        if (!name || !code || price == null) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tên, mã và giá' });
        }
        const formattedCode = String(code).trim().toUpperCase();
        const pkgExists = await ServicePackage_1.ServicePackage.findOne({ code: formattedCode });
        if (pkgExists) {
            return res.status(400).json({ success: false, message: 'Mã gói dịch vụ đã tồn tại' });
        }
        let parsedFeatures = [];
        if (Array.isArray(features)) {
            parsedFeatures = features.map(f => String(f).trim()).filter(Boolean);
        }
        else if (typeof features === 'string') {
            parsedFeatures = features.split('\n').map(f => f.trim()).filter(Boolean);
        }
        const newPackage = await ServicePackage_1.ServicePackage.create({
            name: String(name).trim(),
            code: formattedCode,
            price: Number(price),
            description: description ? String(description).trim() : '',
            features: parsedFeatures,
            maxImages: maxImages != null ? Number(maxImages) : 50,
            maxBoards: maxBoards != null ? Number(maxBoards) : 3,
            isActive: typeof isActive === 'boolean' ? isActive : true
        });
        res.status(201).json({ success: true, data: newPackage, message: 'Tạo gói dịch vụ thành công' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createServicePackage = createServicePackage;
// Cập nhật gói dịch vụ (Admin)
const updateServicePackage = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, price, description, features, maxImages, maxBoards, isActive } = req.body;
        const pkg = await ServicePackage_1.ServicePackage.findById(id);
        if (!pkg) {
            return res.status(404).json({ success: false, message: 'Gói dịch vụ không tồn tại' });
        }
        if (name)
            pkg.name = String(name).trim();
        if (code) {
            const formattedCode = String(code).trim().toUpperCase();
            const existing = await ServicePackage_1.ServicePackage.findOne({ code: formattedCode, _id: { $ne: id } });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Mã gói dịch vụ đã được sử dụng bởi gói khác' });
            }
            pkg.code = formattedCode;
        }
        if (price != null)
            pkg.price = Number(price);
        if (description != null)
            pkg.description = String(description).trim();
        if (features != null) {
            if (Array.isArray(features)) {
                pkg.features = features.map(f => String(f).trim()).filter(Boolean);
            }
            else if (typeof features === 'string') {
                pkg.features = features.split('\n').map(f => f.trim()).filter(Boolean);
            }
        }
        if (maxImages != null)
            pkg.maxImages = Number(maxImages);
        if (maxBoards != null)
            pkg.maxBoards = Number(maxBoards);
        if (isActive != null)
            pkg.isActive = Boolean(isActive);
        await pkg.save();
        res.json({ success: true, data: pkg, message: 'Cập nhật gói dịch vụ thành công' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateServicePackage = updateServicePackage;
// Xóa gói dịch vụ (Admin)
const deleteServicePackage = async (req, res) => {
    try {
        const { id } = req.params;
        const pkg = await ServicePackage_1.ServicePackage.findByIdAndDelete(id);
        if (!pkg) {
            return res.status(404).json({ success: false, message: 'Gói dịch vụ không tồn tại' });
        }
        res.json({ success: true, message: 'Đã xóa gói dịch vụ' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteServicePackage = deleteServicePackage;
// Lấy thông tin cấu hình chính sách Dùng thử (Public/Admin)
const getTrialPolicy = async (req, res) => {
    try {
        const { getOrCreateTrialSetting } = await Promise.resolve().then(() => __importStar(require('../utils/boardUtils')));
        const setting = await getOrCreateTrialSetting();
        res.json({ success: true, data: setting });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getTrialPolicy = getTrialPolicy;
// Cập nhật cấu hình chính sách Dùng thử (Admin)
const updateTrialPolicy = async (req, res) => {
    try {
        const { getOrCreateTrialSetting } = await Promise.resolve().then(() => __importStar(require('../utils/boardUtils')));
        const { isEnabled, durationMonths, trialPlan, lockOnExpiry, expiryAction, trialPromptMessage, expiryNotificationMessage, requirePlanSelection, applyToExistingUsers, } = req.body;
        const setting = await getOrCreateTrialSetting();
        if (typeof isEnabled === 'boolean')
            setting.isEnabled = isEnabled;
        if (typeof durationMonths === 'number' && durationMonths >= 1) {
            setting.durationMonths = Math.max(1, Math.min(36, Math.floor(durationMonths)));
        }
        if (trialPlan && ['BASIC', 'STANDARD', 'PREMIUM', 'ALL'].includes(trialPlan)) {
            setting.trialPlan = trialPlan;
        }
        if (expiryAction && ['SWITCH_TO_FREE', 'LOCK'].includes(expiryAction)) {
            setting.expiryAction = expiryAction;
            setting.lockOnExpiry = expiryAction === 'LOCK';
        }
        else if (typeof lockOnExpiry === 'boolean') {
            setting.lockOnExpiry = lockOnExpiry;
            setting.expiryAction = lockOnExpiry ? 'LOCK' : 'SWITCH_TO_FREE';
        }
        if (typeof trialPromptMessage === 'string') {
            setting.trialPromptMessage = trialPromptMessage.trim();
        }
        if (typeof expiryNotificationMessage === 'string') {
            setting.expiryNotificationMessage = expiryNotificationMessage.trim();
        }
        if (typeof requirePlanSelection === 'boolean') {
            setting.requirePlanSelection = requirePlanSelection;
        }
        setting.updatedBy = req.user?._id;
        await setting.save();
        let updatedUsersCount = 0;
        // Áp dụng cho các tài khoản nông trại đã đăng ký trước đó và gửi thông báo
        if (applyToExistingUsers && setting.isEnabled) {
            const { User, Role } = await Promise.resolve().then(() => __importStar(require('../models/User')));
            const { FarmProfile } = await Promise.resolve().then(() => __importStar(require('../models/FarmProfile')));
            const { Notification } = await Promise.resolve().then(() => __importStar(require('../models/Notification')));
            // Tìm tất cả tài khoản nông dân (FARM)
            const farmUsers = await User.find({ role: Role.FARM });
            const durationDays = (setting.durationMonths || 6) * 30;
            const newExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
            const planNameText = setting.trialPlan === 'ALL'
                ? 'toàn bộ các gói dịch vụ (Basic, Standard, Premium)'
                : `gói ${setting.trialPlan}`;
            const notifMessage = setting.trialPlan === 'ALL' && setting.trialPromptMessage
                ? `${setting.trialPromptMessage} (Thời hạn dùng thử đến ${newExpiresAt.toLocaleDateString('vi-VN')})`
                : `Tài khoản của bạn đã được quản trị viên cấp quyền sử dụng ${planNameText} miễn phí trong ${setting.durationMonths} tháng (hạn sử dụng đến ngày ${newExpiresAt.toLocaleDateString('vi-VN')}). Hãy trải nghiệm ngay mọi tính năng!`;
            for (const user of farmUsers) {
                let profile = await FarmProfile.findOne({ user: user._id });
                if (!profile) {
                    profile = await FarmProfile.create({
                        user: user._id,
                        farmName: user.name ? `Nông trại ${user.name}` : 'Nông trại của tôi',
                        plan: setting.trialPlan,
                        planExpiresAt: newExpiresAt,
                        isTrial: true,
                        previousPlan: 'FREE',
                    });
                }
                else {
                    profile.plan = setting.trialPlan;
                    profile.planExpiresAt = newExpiresAt;
                    profile.isTrial = true;
                    await profile.save();
                }
                // Tạo thông báo cho tài khoản người dùng
                try {
                    await Notification.create({
                        user: user._id,
                        title: `Kích hoạt dùng thử ${setting.durationMonths} tháng`,
                        message: notifMessage,
                        type: 'BILLING',
                    });
                }
                catch (notifErr) {
                    console.warn('Lỗi tạo notification dùng thử cho user:', user._id, notifErr.message);
                }
                updatedUsersCount++;
            }
        }
        res.json({
            success: true,
            data: setting,
            updatedUsersCount,
            message: `Cập nhật chính sách dùng thử thành công: ${setting.isEnabled ? `Bật gói ${setting.trialPlan} (${setting.durationMonths} tháng)` : 'Đã tắt'}${updatedUsersCount > 0 ? ` - Đã áp dụng và gửi thông báo cho ${updatedUsersCount} tài khoản trước đó!` : ''}`,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateTrialPolicy = updateTrialPolicy;
