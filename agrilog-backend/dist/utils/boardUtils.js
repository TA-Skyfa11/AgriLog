"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBoardLocked = exports.getRetentionDate = exports.getEffectivePlan = exports.PLAN_LIMITS = void 0;
const CultivationBoard_1 = require("../models/CultivationBoard");
const FertilizerBoard_1 = require("../models/FertilizerBoard");
const PesticideBoard_1 = require("../models/PesticideBoard");
exports.PLAN_LIMITS = {
    FREE: { columns: 0, products: 1, retentionYears: 1 },
    BASIC: { columns: 10, products: 3, retentionYears: 1 },
    STANDARD: { columns: 15, products: 5, retentionYears: 2 },
    PREMIUM: { columns: 25, products: 15, retentionYears: 3 },
};
const getEffectivePlan = (profile) => {
    let effectivePlan = (profile.plan || 'FREE').toUpperCase();
    if (profile.planExpiresAt) {
        if (new Date(profile.planExpiresAt) < new Date()) {
            effectivePlan = 'FREE';
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
