"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFarmProfile = exports.getFarmProfile = void 0;
const FarmProfile_1 = require("../models/FarmProfile");
const Notification_1 = require("../models/Notification");
const boardUtils_1 = require("../utils/boardUtils");
const getFarmProfile = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        // Convert to plain object to attach effectivePlan
        const profileObj = profile.toObject();
        const effectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
        // Optionally override the plan field for the frontend or add effectivePlan explicitly
        profileObj.plan = effectivePlan;
        profileObj.effectivePlan = effectivePlan;
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
            profile = new FarmProfile_1.FarmProfile({ user: req.user?._id, ...req.body });
            if (req.body.plan && req.body.plan !== 'BASIC') {
                profile.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            }
        }
        else {
            if (req.body.plan && req.body.plan !== profile.plan) {
                const planValues = { BASIC: 1, STANDARD: 2, PREMIUM: 3 };
                const currentVal = planValues[profile.plan] || 1;
                const newVal = planValues[req.body.plan] || 1;
                if (newVal > currentVal) {
                    profile.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    // Generate notification for successful purchase
                    await Notification_1.Notification.create({
                        user: req.user?._id,
                        title: 'Mua gói cước thành công',
                        message: `Chúc mừng bạn đã nâng cấp lên gói ${req.body.plan}. Gói cước có hiệu lực đến ngày ${profile.planExpiresAt.toLocaleDateString('vi-VN')}.`,
                        type: 'BILLING'
                    });
                }
                profile.previousPlan = profile.plan;
            }
            profile.set(req.body);
        }
        await profile.save();
        res.json({ success: true, data: profile });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateFarmProfile = updateFarmProfile;
