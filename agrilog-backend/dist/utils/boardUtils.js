"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBoardLocked = exports.getRetentionDate = exports.getEffectivePlan = exports.isPlanExpired = exports.getOrCreateTrialSetting = exports.PLAN_LIMITS = void 0;
const CultivationBoard_1 = require("../models/CultivationBoard");
const FertilizerBoard_1 = require("../models/FertilizerBoard");
const PesticideBoard_1 = require("../models/PesticideBoard");
const TrialSetting_1 = require("../models/TrialSetting");
exports.PLAN_LIMITS = {
    FREE: { columns: 0, products: 1, retentionYears: 1 },
    BASIC: { columns: 10, products: 3, retentionYears: 1 },
    STANDARD: { columns: 15, products: 5, retentionYears: 2 },
    PREMIUM: { columns: 25, products: 15, retentionYears: 3 },
    EXPIRED: { columns: 0, products: 0, retentionYears: 1 },
};
/**
 * Lấy hoặc khởi tạo cấu hình chính sách Dùng thử mặc định
 */
const getOrCreateTrialSetting = async () => {
    let setting = await TrialSetting_1.TrialSetting.findOne();
    if (!setting) {
        setting = await TrialSetting_1.TrialSetting.create({
            isEnabled: true,
            durationMonths: 1, // Mặc định 1 tháng miễn phí toàn bộ chức năng
            trialPlan: 'PREMIUM', // Cấp gói cao nhất full chức năng
            lockOnExpiry: true,
        });
    }
    return setting;
};
exports.getOrCreateTrialSetting = getOrCreateTrialSetting;
/**
 * Kiểm tra xem gói cước hoặc gói dùng thử của người dùng đã hết hạn hay chưa
 */
const isPlanExpired = (profile) => {
    if (!profile || !profile.planExpiresAt)
        return false;
    return new Date(profile.planExpiresAt) < new Date();
};
exports.isPlanExpired = isPlanExpired;
const getEffectivePlan = (profile) => {
    let effectivePlan = (profile.plan || 'FREE').toUpperCase();
    if (profile.planExpiresAt) {
        if (new Date(profile.planExpiresAt) < new Date()) {
            effectivePlan = 'EXPIRED';
        }
        else if (profile.previousPlan) {
            const prevPlan = profile.previousPlan.toUpperCase();
            const planValues = { FREE: 0, BASIC: 1, STANDARD: 2, PREMIUM: 3 };
            const currentVal = planValues[effectivePlan] || 1;
            const prevVal = planValues[prevPlan] || 1;
            if (prevVal > currentVal) {
                effectivePlan = prevPlan;
            }
        }
    }
    return effectivePlan;
};
exports.getEffectivePlan = getEffectivePlan;
const getRetentionDate = (plan) => {
    const normalizedPlan = (plan || 'FREE').toUpperCase();
    const years = exports.PLAN_LIMITS[normalizedPlan]?.retentionYears || 1;
    const date = new Date();
    date.setFullYear(date.getFullYear() - years);
    return date;
};
exports.getRetentionDate = getRetentionDate;
const checkBoardLocked = async (profileId, boardId, plan) => {
    const normalizedPlan = (plan || 'FREE').toUpperCase();
    if (normalizedPlan === 'EXPIRED') {
        return true; // Khóa toàn bộ khi gói cước/dùng thử đã hết hạn
    }
    const planLimits = exports.PLAN_LIMITS[normalizedPlan] || exports.PLAN_LIMITS.FREE;
    let boards = await CultivationBoard_1.CultivationBoard.find({ farmProfile: profileId }, '_id createdAt').sort({ createdAt: 1 }).lean();
    let boardIndex = boards.findIndex(b => b._id.toString() === boardId.toString());
    if (boardIndex === -1) {
        boards = await FertilizerBoard_1.FertilizerBoard.find({ farmProfile: profileId }, '_id createdAt').sort({ createdAt: 1 }).lean();
        boardIndex = boards.findIndex(b => b._id.toString() === boardId.toString());
    }
    if (boardIndex === -1) {
        boards = await PesticideBoard_1.PesticideBoard.find({ farmProfile: profileId }, '_id createdAt').sort({ createdAt: 1 }).lean();
        boardIndex = boards.findIndex(b => b._id.toString() === boardId.toString());
    }
    if (boardIndex === -1)
        return false;
    return boardIndex >= planLimits.products;
};
exports.checkBoardLocked = checkBoardLocked;
