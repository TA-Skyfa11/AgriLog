"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFarmProfile = exports.getFarmProfile = exports.createDefaultFarmProfile = void 0;
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
            await Notification_1.Notification.create({
                user: userId,
                title: 'Kích hoạt dùng thử miễn phí',
                message: `Chào mừng bạn đến với AgriLog! Bạn được tặng gói dùng thử miễn phí toàn bộ chức năng trong ${trialSetting.durationMonths} tháng (hạn dùng đến ${planExpiresAt.toLocaleDateString('vi-VN')}).`,
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
        res.json({ success: true, data: profileObj });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateFarmProfile = updateFarmProfile;
