"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = exports.getFarms = void 0;
const User_1 = require("../models/User");
const FarmProfile_1 = require("../models/FarmProfile");
const CultivationBoard_1 = require("../models/CultivationBoard");
const FertilizerBoard_1 = require("../models/FertilizerBoard");
const PesticideBoard_1 = require("../models/PesticideBoard");
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
        const cCount = await CultivationBoard_1.CultivationBoard.countDocuments();
        const fCount = await FertilizerBoard_1.FertilizerBoard.countDocuments();
        const pCount = await PesticideBoard_1.PesticideBoard.countDocuments();
        const totalBoards = cCount + fCount + pCount;
        res.json({
            success: true,
            data: {
                totalUsers,
                totalFarms,
                newUsers,
                totalBoards
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getDashboardStats = getDashboardStats;
