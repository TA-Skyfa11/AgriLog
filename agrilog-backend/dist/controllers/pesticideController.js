"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePesticideEntry = exports.createPesticideEntry = exports.getPesticideEntries = exports.deletePesticideBoard = exports.updatePesticideBoard = exports.getPesticideBoardById = exports.createPesticideBoard = exports.getPesticideBoards = void 0;
const FarmProfile_1 = require("../models/FarmProfile");
const PesticideBoard_1 = require("../models/PesticideBoard");
const PesticideEntry_1 = require("../models/PesticideEntry");
const Material_1 = require("../models/Material");
const MaterialLog_1 = require("../models/MaterialLog");
const CultivationBoard_1 = require("../models/CultivationBoard");
const FertilizerBoard_1 = require("../models/FertilizerBoard");
const PLAN_LIMITS = {
    BASIC: { boards: 3 },
    STANDARD: { boards: 5 },
    PREMIUM: { boards: 15 },
};
const getPesticideBoards = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Farm profile not found' });
        const boards = await PesticideBoard_1.PesticideBoard.find({ farmProfile: profile._id }).sort({ createdAt: -1 });
        const boardsWithCount = await Promise.all(boards.map(async (board) => {
            const count = await PesticideEntry_1.PesticideEntry.countDocuments({ pesticideBoard: board._id });
            return {
                ...board.toObject(),
                entryCount: count,
            };
        }));
        res.json({ success: true, data: boardsWithCount });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPesticideBoards = getPesticideBoards;
const createPesticideBoard = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Farm profile not found' });
        const cCount = await CultivationBoard_1.CultivationBoard.countDocuments({ farmProfile: profile._id });
        const fCount = await FertilizerBoard_1.FertilizerBoard.countDocuments({ farmProfile: profile._id });
        const pCount = await PesticideBoard_1.PesticideBoard.countDocuments({ farmProfile: profile._id });
        const totalBoards = cCount + fCount + pCount;
        const limits = PLAN_LIMITS[profile.plan || 'BASIC'];
        if (totalBoards >= limits.boards) {
            return res.status(400).json({
                success: false,
                message: `Gói tài khoản ${profile.plan || 'BASIC'} của bạn chỉ cho phép tạo tối đa ${limits.boards} bảng nhật ký. Vui lòng nâng cấp gói dịch vụ.`
            });
        }
        const board = new PesticideBoard_1.PesticideBoard({
            ...req.body,
            farmProfile: profile._id,
        });
        await board.save();
        res.status(201).json({ success: true, data: board });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createPesticideBoard = createPesticideBoard;
const getPesticideBoardById = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Farm profile not found' });
        const board = await PesticideBoard_1.PesticideBoard.findOne({ _id: req.params.id, farmProfile: profile._id });
        if (!board)
            return res.status(404).json({ success: false, message: 'Board not found' });
        res.json({ success: true, data: board });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPesticideBoardById = getPesticideBoardById;
const updatePesticideBoard = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Farm profile not found' });
        const board = await PesticideBoard_1.PesticideBoard.findOneAndUpdate({ _id: req.params.id, farmProfile: profile._id }, req.body, { new: true });
        if (!board)
            return res.status(404).json({ success: false, message: 'Board not found' });
        res.json({ success: true, data: board });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updatePesticideBoard = updatePesticideBoard;
const deletePesticideBoard = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Farm profile not found' });
        const board = await PesticideBoard_1.PesticideBoard.findOneAndDelete({ _id: req.params.id, farmProfile: profile._id });
        if (!board)
            return res.status(404).json({ success: false, message: 'Board not found' });
        await PesticideEntry_1.PesticideEntry.deleteMany({ pesticideBoard: board._id });
        res.json({ success: true, message: 'Board deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deletePesticideBoard = deletePesticideBoard;
// --- Entries ---
const getPesticideEntries = async (req, res) => {
    try {
        const entries = await PesticideEntry_1.PesticideEntry.find({ pesticideBoard: req.params.boardId }).sort({ date: -1 });
        res.json({ success: true, data: entries });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getPesticideEntries = getPesticideEntries;
const createPesticideEntry = async (req, res) => {
    try {
        const { material: materialId, quantity, date, notes } = req.body;
        let materialName = req.body.materialName;
        // Auto-deduction logic if materialId is provided
        if (materialId) {
            const material = await Material_1.Material.findById(materialId);
            if (!material) {
                return res.status(404).json({ success: false, message: 'Vật tư không tồn tại trong kho.' });
            }
            const usageQty = Number(quantity) || 0;
            if (material.quantity < usageQty) {
                return res.status(400).json({
                    success: false,
                    message: `Số lượng vật tư trong kho không đủ (Hiện còn: ${material.quantity} ${material.unit}, yêu cầu dùng: ${usageQty} ${material.unit}).`
                });
            }
            materialName = material.name;
            material.quantity -= usageQty;
            await material.save();
        }
        const entry = new PesticideEntry_1.PesticideEntry({
            ...req.body,
            materialName,
            pesticideBoard: req.params.boardId,
        });
        await entry.save();
        // Create export log
        if (materialId) {
            // Find board name for description
            const board = await PesticideBoard_1.PesticideBoard.findById(req.params.boardId);
            const boardName = board ? board.name : '';
            await MaterialLog_1.MaterialLog.create({
                material: materialId,
                type: 'EXPORT',
                quantity: Number(quantity) || 0,
                date: date ? new Date(date) : new Date(),
                notes: notes || `Sử dụng cho nhật ký thuốc BVTV: ${boardName}`,
                pesticideEntry: entry._id,
            });
        }
        res.status(201).json({ success: true, data: entry });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createPesticideEntry = createPesticideEntry;
const deletePesticideEntry = async (req, res) => {
    try {
        const entry = await PesticideEntry_1.PesticideEntry.findById(req.params.id);
        if (!entry)
            return res.status(404).json({ success: false, message: 'Không tìm thấy ghi chép.' });
        // Restore stock if it was tied to a material
        if (entry.material && entry.quantity) {
            const material = await Material_1.Material.findById(entry.material);
            if (material) {
                material.quantity += entry.quantity;
                await material.save();
            }
            // Delete the associated export log
            await MaterialLog_1.MaterialLog.deleteMany({ pesticideEntry: entry._id });
        }
        await PesticideEntry_1.PesticideEntry.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Xóa ghi chép thành công và hoàn trả tồn kho.' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deletePesticideEntry = deletePesticideEntry;
