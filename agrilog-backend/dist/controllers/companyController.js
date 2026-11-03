"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCompanyProfile = exports.getCompanyProfile = void 0;
const CompanyProfile_1 = require("../models/CompanyProfile");
const getCompanyProfile = async (req, res) => {
    try {
        const profile = await CompanyProfile_1.CompanyProfile.findOne({ user: req.user?._id });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }
        res.json({ success: true, data: profile });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCompanyProfile = getCompanyProfile;
const updateCompanyProfile = async (req, res) => {
    try {
        let profile = await CompanyProfile_1.CompanyProfile.findOne({ user: req.user?._id });
        const updateData = { ...req.body };
        delete updateData._id;
        delete updateData.id;
        delete updateData.user;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        if (!profile) {
            profile = new CompanyProfile_1.CompanyProfile({ user: req.user?._id, ...updateData });
        }
        else {
            if (typeof profile.set === 'function') {
                profile.set(updateData);
            }
            else {
                Object.assign(profile, updateData);
            }
        }
        await profile.save();
        const resultData = profile.toObject ? profile.toObject() : profile;
        res.json({ success: true, data: resultData });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateCompanyProfile = updateCompanyProfile;
