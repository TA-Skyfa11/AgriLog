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
        const durationDays = (trialSetting.durationMonths || 6) * 30;
        plan = trialSetting.trialPlan || 'ALL';
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
                ? 'toàn bộ các gói dịch vụ (Basic, Standard, Premium)'
                : `gói ${plan}`;
            const welcomeMsg = trialSetting.trialPromptMessage || `Chào mừng bạn đến với AgriLog! Bạn được tặng ${trialSetting.durationMonths} tháng dùng thử miễn phí (${planNameText}). Vui lòng chọn gói dịch vụ để bắt đầu trải nghiệm (hạn dùng đến ${planExpiresAt.toLocaleDateString('vi-VN')}).`;
            await Notification_1.Notification.create({
                user: userId,
                title: `Kích hoạt dùng thử miễn phí ${trialSetting.durationMonths} tháng`,
                message: welcomeMsg,
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
        const trialSetting = await (0, boardUtils_1.getOrCreateTrialSetting)();
        // Tự động kiểm tra hết hạn dùng thử -> Thông báo & Chuyển về gói FREE nếu cấu hình là SWITCH_TO_FREE
        if (profile.isTrial && profile.planExpiresAt && new Date(profile.planExpiresAt) < new Date()) {
            if (trialSetting.expiryAction === 'SWITCH_TO_FREE' || !trialSetting.lockOnExpiry) {
                if (profile.plan !== 'FREE') {
                    profile.plan = 'FREE';
                    profile.isTrial = false;
                    await profile.save();
                    try {
                        await Notification_1.Notification.create({
                            user: req.user?._id,
                            title: 'Hết hạn dùng thử - Chuyển sang gói Miễn phí',
                            message: trialSetting.expiryNotificationMessage ||
                                'Thời hạn dùng thử miễn phí của bạn đã kết thúc. Tài khoản của bạn đã được chuyển về gói Miễn phí với các chức năng cơ bản (tối đa 1 bảng mỗi loại nhật ký, không xuất Excel/PDF và không tải ảnh).',
                            type: 'BILLING',
                        });
                    }
                    catch (notifErr) {
                        console.warn('Lỗi tạo thông báo hết hạn trial:', notifErr);
                    }
                }
            }
        }
        // Gắn thông tin tính toán gói cước hiệu dụng và trạng thái hết hạn
        const profileObj = profile.toObject ? profile.toObject() : profile;
        const effectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
        const expired = (0, boardUtils_1.isPlanExpired)(profile);
        profileObj.effectivePlan = effectivePlan;
        profileObj.isPlanExpired = expired;
        profileObj.isTrial = profile.isTrial || false;
        const isTrialAll = profile.isTrial && profile.plan === 'ALL';
        profileObj.isTrialAll = isTrialAll;
        // Gắn thông tin cấu hình dùng thử để frontend hiển thị thông báo & modal chọn gói
        profileObj.trialPromptMessage = trialSetting.trialPromptMessage;
        profileObj.expiryNotificationMessage = trialSetting.expiryNotificationMessage;
        profileObj.requirePlanSelection = trialSetting.requirePlanSelection;
        profileObj.trialDurationMonths = trialSetting.durationMonths;
        profileObj.expiryAction = trialSetting.expiryAction;
        // Check if package allows export based on features
        let allowExport = false;
        if (effectivePlan === 'FREE' || effectivePlan === 'BASIC' || effectivePlan === 'EXPIRED') {
            allowExport = false;
        }
        else {
            const { ServicePackage } = await Promise.resolve().then(() => __importStar(require('../models/ServicePackage')));
            const pkg = await ServicePackage.findOne({ code: effectivePlan });
            if (pkg) {
                const featureString = pkg.features.join(' ').toLowerCase();
                allowExport = featureString.includes('lưu trữ') || featureString.includes('hồ sơ') || featureString.includes('xuất');
            }
            else {
                allowExport = true;
            }
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
        profileObj.isTrialAll = profile.isTrial && profile.plan === 'ALL';
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
        if (!profile.isTrial) {
            return res.status(400).json({ success: false, message: 'Tài khoản của bạn hiện không trong thời gian dùng thử' });
        }
        if ((0, boardUtils_1.isPlanExpired)(profile)) {
            return res.status(400).json({ success: false, message: 'Thời hạn dùng thử miễn phí của bạn đã kết thúc' });
        }
        profile.plan = packageCode;
        // We KEEP the isTrial=true and the original planExpiresAt!
        await profile.save();
        const expiryDateStr = profile.planExpiresAt ? new Date(profile.planExpiresAt).toLocaleDateString('vi-VN') : '';
        await Notification_1.Notification.create({
            user: req.user?._id,
            title: `Bắt đầu dùng thử gói ${packageCode}`,
            message: `Bạn đã bắt đầu dùng thử gói ${packageCode}. Hạn dùng thử đến ngày ${expiryDateStr}. Chúc bạn có trải nghiệm tuyệt vời và ghi chép mùa vụ thật hiệu quả!`,
            type: 'BILLING'
        });
        const profileObj = profile.toObject();
        profileObj.effectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
        profileObj.isPlanExpired = (0, boardUtils_1.isPlanExpired)(profile);
        profileObj.isTrial = profile.isTrial;
        res.json({
            success: true,
            message: `Bắt đầu dùng thử theo gói ${packageCode} đã chọn! Hạn dùng đến ngày ${expiryDateStr}.`,
            data: profileObj
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.selectTrialPlan = selectTrialPlan;
