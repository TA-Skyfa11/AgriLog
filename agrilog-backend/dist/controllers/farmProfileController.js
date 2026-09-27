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
exports.selectTrialPlan = exports.updateFarmProfile = exports.getFarmProfile = exports.createDefaultFarmProfile = void 0;
const FarmProfile_1 = require("../models/FarmProfile");
const Notification_1 = require("../models/Notification");
const boardUtils_1 = require("../utils/boardUtils");
/**
 * Hàm khởi tạo FarmProfile mặc định có áp dụng chính sách Dùng thử miễn phí
 */
const createDefaultFarmProfile = async (userId, initialData = {}) => {
    const trialSetting = await (0, boardUtils_1.getOrCreateTrialSetting)();
    let plan = initialData.plan || 'FREE';
    let planExpiresAt = initialData.planExpiresAt;
    let isTrial = false;
    // Nếu chính sách dùng thử đang BẬT và tài khoản chưa từng mua gói
    if (trialSetting.isEnabled) {
        const durationDays = (trialSetting.durationMonths || 1) * 30;
        plan = trialSetting.trialPlan || 'PREMIUM';
        planExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
        isTrial = true;
    }
    const profile = await FarmProfile_1.FarmProfile.create({
        user: userId,
        farmName: initialData.farmName || 'Nông trại của tôi',
        address: initialData.address || '',
        areaSqm: initialData.areaSqm,
        mainCropType: initialData.mainCropType,
        contactPhone: initialData.contactPhone,
        plan,
        planExpiresAt,
        isTrial,
        previousPlan: 'FREE',
        ...initialData,
    });
    // Tạo thông báo chào mừng dùng thử miễn phí
    if (isTrial && planExpiresAt) {
        try {
            const planNameText = plan === 'ALL'
                ? 'toàn bộ cả 3 gói dịch vụ (Basic + Standard + Premium)'
                : `gói ${plan}`;
            await Notification_1.Notification.create({
                user: userId,
                title: 'Kích hoạt dùng thử miễn phí',
                message: `Chào mừng bạn đến với AgriLog! Bạn được tặng gói dùng thử miễn phí ${planNameText} trong ${trialSetting.durationMonths} tháng (hạn dùng đến ${planExpiresAt.toLocaleDateString('vi-VN')}).`,
                type: 'BILLING',
            });
        }
        catch (e) {
            console.warn('Lỗi tạo notification chào mừng dùng thử:', e.message);
        }
    }
    return profile;
};
exports.createDefaultFarmProfile = createDefaultFarmProfile;
const getFarmProfile = async (req, res) => {
    try {
        let profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            profile = await (0, exports.createDefaultFarmProfile)(req.user?._id);
        }
        // Gắn thông tin tính toán gói cước hiệu dụng và trạng thái hết hạn
        const profileObj = profile.toObject ? profile.toObject() : profile;
        const effectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
        const expired = (0, boardUtils_1.isPlanExpired)(profile);
        profileObj.effectivePlan = effectivePlan;
        profileObj.isPlanExpired = expired;
        profileObj.isTrial = profile.isTrial || false;
        const trialSetting = await (0, boardUtils_1.getOrCreateTrialSetting)();
        const isTrialAll = profile.isTrial && (profile.plan === 'ALL' || trialSetting.trialPlan === 'ALL' || profile.previousPlan === 'ALL');
        profileObj.isTrialAll = isTrialAll;
        // Check if package allows export based on features
        const { ServicePackage } = await Promise.resolve().then(() => __importStar(require('../models/ServicePackage')));
        const pkg = await ServicePackage.findOne({ code: effectivePlan });
        let allowExport = false;
        if (pkg) {
            const featureString = pkg.features.join(' ').toLowerCase();
            allowExport = featureString.includes('lưu trữ') || featureString.includes('hồ sơ') || featureString.includes('xuất');
        }
        else {
            allowExport = effectivePlan !== 'BASIC' && effectivePlan !== 'FREE';
        }
        profileObj.allowExport = allowExport;
        res.json({ success: true, data: profileObj });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getFarmProfile = getFarmProfile;
const updateFarmProfile = async (req, res) => {
    try {
        let profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            profile = await (0, exports.createDefaultFarmProfile)(req.user?._id, req.body);
        }
        else {
            const currentEffectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
            if (req.body.plan && req.body.plan !== currentEffectivePlan) {
                const planValues = { FREE: 0, BASIC: 1, STANDARD: 2, PREMIUM: 3, EXPIRED: 0 };
                const currentVal = planValues[currentEffectivePlan] || 0;
                const newVal = planValues[req.body.plan] || 0;
                if (newVal > currentVal) {
                    const isNewPurchase = !profile.planExpiresAt || new Date(profile.planExpiresAt) < new Date();
                    profile.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    profile.isTrial = false; // Nếu mua gói mới thì không còn là trial nữa
                    if (isNewPurchase) {
                        // Generate notification for successful purchase
                        await Notification_1.Notification.create({
                            user: req.user?._id,
                            title: 'Mua gói cước thành công',
                            message: `Chúc mừng bạn đã nâng cấp lên gói ${req.body.plan}. Gói cước có hiệu lực đến ngày ${profile.planExpiresAt.toLocaleDateString('vi-VN')}.`,
                            type: 'BILLING'
                        });
                    }
                    profile.previousPlan = currentEffectivePlan === 'EXPIRED' ? 'FREE' : currentEffectivePlan;
                }
                else {
                    // Downgrade
                    profile.planExpiresAt = undefined;
                    profile.previousPlan = undefined;
                    profile.isTrial = false;
                }
            }
            profile.set(req.body);
            await profile.save();
        }
        const profileObj = profile.toObject();
        profileObj.effectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
        profileObj.isPlanExpired = (0, boardUtils_1.isPlanExpired)(profile);
        profileObj.isTrial = profile.isTrial || false;
        const trialSetting = await (0, boardUtils_1.getOrCreateTrialSetting)();
        profileObj.isTrialAll = profile.isTrial && (profile.plan === 'ALL' || trialSetting.trialPlan === 'ALL' || profile.previousPlan === 'ALL');
        res.json({ success: true, data: profileObj });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateFarmProfile = updateFarmProfile;
const selectTrialPlan = async (req, res) => {
    try {
        const { packageCode } = req.body;
        if (!['BASIC', 'STANDARD', 'PREMIUM'].includes(packageCode)) {
            return res.status(400).json({ success: false, message: 'Gói không hợp lệ' });
        }
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ nông trại' });
        }
        const trialSetting = await (0, boardUtils_1.getOrCreateTrialSetting)();
        const isTrialAll = profile.isTrial && (profile.plan === 'ALL' || trialSetting.trialPlan === 'ALL' || profile.previousPlan === 'ALL');
        if (!isTrialAll) {
            return res.status(400).json({ success: false, message: 'Bạn không có quyền chuyển đổi gói dùng thử lúc này' });
        }
        profile.plan = packageCode;
        // We KEEP the isTrial=true and the original planExpiresAt!
        await profile.save();
        await Notification_1.Notification.create({
            user: req.user?._id,
            title: 'Bắt đầu dùng thử gói',
            message: `Bạn đã chọn dùng thử gói ${packageCode}. Hạn dùng thử đến ngày ${profile.planExpiresAt ? profile.planExpiresAt.toLocaleDateString('vi-VN') : ''}.`,
            type: 'BILLING'
        });
        const profileObj = profile.toObject();
        profileObj.effectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
        profileObj.isPlanExpired = (0, boardUtils_1.isPlanExpired)(profile);
        profileObj.isTrial = profile.isTrial;
        res.json({ success: true, message: 'Đã chọn gói dùng thử', data: profileObj });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.selectTrialPlan = selectTrialPlan;
