"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMaterial = exports.updateMaterial = exports.getMaterialLogs = exports.importMaterial = exports.getInventory = void 0;
const Material_1 = require("../models/Material");
const MaterialLog_1 = require("../models/MaterialLog");
const FarmProfile_1 = require("../models/FarmProfile");
const getInventory = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Profile not found' });
        const materials = await Material_1.Material.find({ farmProfile: profile._id });
        res.json({ success: true, data: materials });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getInventory = getInventory;
const importMaterial = async (req, res) => {
    try {
        const { name, type, quantity, unit, expiryDate, date, supplier, notes } = req.body;
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Profile not found' });
        // Check if material exists
        let material = await Material_1.Material.findOne({ farmProfile: profile._id, name, type });
        if (!material) {
            material = await Material_1.Material.create({
                farmProfile: profile._id,
                name,
                type,
                quantity: 0,
                unit,
                expiryDate: expiryDate ? new Date(expiryDate) : undefined,
            });
        }
        else if (expiryDate) {
            material.expiryDate = new Date(expiryDate);
        }
        // Add quantity
        material.quantity += Number(quantity);
        await material.save();
        // Create log
        const log = await MaterialLog_1.MaterialLog.create({
            material: material._id,
            type: 'IMPORT',
            quantity: Number(quantity),
            date: date || new Date(),
            supplier,
            notes,
        });
        res.status(201).json({ success: true, data: { material, log } });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.importMaterial = importMaterial;
const getMaterialLogs = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Profile not found' });
        // In a real app we'd filter logs by the materials owned by this farm
        // For simplicity, find all materials of this farm, then their logs
        const materials = await Material_1.Material.find({ farmProfile: profile._id }).select('_id');
        const materialIds = materials.map(m => m._id);
        const logs = await MaterialLog_1.MaterialLog.find({ material: { $in: materialIds } })
            .populate('material', 'name type unit')
            .sort({ date: -1 });
        res.json({ success: true, data: logs });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getMaterialLogs = getMaterialLogs;
const updateMaterial = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Profile not found' });
        const material = await Material_1.Material.findOneAndUpdate({ _id: req.params.id, farmProfile: profile._id }, req.body, { new: true });
        if (!material)
            return res.status(404).json({ success: false, message: 'Material not found' });
        res.json({ success: true, data: material });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateMaterial = updateMaterial;
const deleteMaterial = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Profile not found' });
        const material = await Material_1.Material.findOneAndDelete({ _id: req.params.id, farmProfile: profile._id });
        if (!material)
            return res.status(404).json({ success: false, message: 'Material not found' });
        // Optional: Also delete related logs? Usually logs are kept or marked deleted, but we can delete them here for simplicity
        await MaterialLog_1.MaterialLog.deleteMany({ material: material._id });
        res.json({ success: true, message: 'Material deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteMaterial = deleteMaterial;
