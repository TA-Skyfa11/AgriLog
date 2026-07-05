"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFarmProfile = exports.getFarmProfile = void 0;
const FarmProfile_1 = require("../models/FarmProfile");
const getFarmProfile = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        res.json({ success: true, data: profile });
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
        }
        else {
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
