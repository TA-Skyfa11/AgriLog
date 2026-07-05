"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFertilizerEntry = exports.createFertilizerEntry = exports.getFertilizerEntries = exports.deleteFertilizerBoard = exports.updateFertilizerBoard = exports.getFertilizerBoardById = exports.createFertilizerBoard = exports.getFertilizerBoards = void 0;
const FarmProfile_1 = require("../models/FarmProfile");
const FertilizerBoard_1 = require("../models/FertilizerBoard");
const FertilizerEntry_1 = require("../models/FertilizerEntry");
const Material_1 = require("../models/Material");
const MaterialLog_1 = require("../models/MaterialLog");
const CultivationBoard_1 = require("../models/CultivationBoard");
const PesticideBoard_1 = require("../models/PesticideBoard");
const PLAN_LIMITS = {
    BASIC: { boards: 3 },
    STANDARD: { boards: 5 },
    PREMIUM: { boards: 15 },
};
const getFertilizerBoards = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Farm profile not found' });
        const boards = await FertilizerBoard_1.FertilizerBoard.find({ farmProfile: profile._id }).sort({ createdAt: -1 });
        const boardsWithCount = await Promise.all(boards.map(async (board) => {
            const count = await FertilizerEntry_1.FertilizerEntry.countDocuments({ fertilizerBoard: board._id });
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
exports.getFertilizerBoards = getFertilizerBoards;
const createFertilizerBoard = async (req, res) => {
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
        const board = new FertilizerBoard_1.FertilizerBoard({
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
exports.createFertilizerBoard = createFertilizerBoard;
const getFertilizerBoardById = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Farm profile not found' });
        const board = await FertilizerBoard_1.FertilizerBoard.findOne({ _id: req.params.id, farmProfile: profile._id });
        if (!board)
            return res.status(404).json({ success: false, message: 'Board not found' });
        res.json({ success: true, data: board });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getFertilizerBoardById = getFertilizerBoardById;
const updateFertilizerBoard = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Farm profile not found' });
        const board = await FertilizerBoard_1.FertilizerBoard.findOneAndUpdate({ _id: req.params.id, farmProfile: profile._id }, req.body, { new: true });
        if (!board)
            return res.status(404).json({ success: false, message: 'Board not found' });
        res.json({ success: true, data: board });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateFertilizerBoard = updateFertilizerBoard;
const deleteFertilizerBoard = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Farm profile not found' });
        const board = await FertilizerBoard_1.FertilizerBoard.findOneAndDelete({ _id: req.params.id, farmProfile: profile._id });
        if (!board)
            return res.status(404).json({ success: false, message: 'Board not found' });
        await FertilizerEntry_1.FertilizerEntry.deleteMany({ fertilizerBoard: board._id });
        res.json({ success: true, message: 'Board deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteFertilizerBoard = deleteFertilizerBoard;
// --- Entries ---
const getFertilizerEntries = async (req, res) => {
    try {
        const entries = await FertilizerEntry_1.FertilizerEntry.find({ fertilizerBoard: req.params.boardId }).sort({ date: -1 });
        res.json({ success: true, data: entries });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getFertilizerEntries = getFertilizerEntries;
const createFertilizerEntry = async (req, res) => {
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
        const entry = new FertilizerEntry_1.FertilizerEntry({
            ...req.body,
            materialName,
            fertilizerBoard: req.params.boardId,
        });
        await entry.save();
        // Create export log
        if (materialId) {
            // Find board name for description
            const board = await FertilizerBoard_1.FertilizerBoard.findById(req.params.boardId);
            const boardName = board ? board.name : '';
            await MaterialLog_1.MaterialLog.create({
                material: materialId,
                type: 'EXPORT',
                quantity: Number(quantity) || 0,
                date: date ? new Date(date) : new Date(),
                notes: notes || `Sử dụng cho nhật ký phân bón: ${boardName}`,
                fertilizerEntry: entry._id,
            });
        }
        res.status(201).json({ success: true, data: entry });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createFertilizerEntry = createFertilizerEntry;
const deleteFertilizerEntry = async (req, res) => {
    try {
        const entry = await FertilizerEntry_1.FertilizerEntry.findById(req.params.id);
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
            await MaterialLog_1.MaterialLog.deleteMany({ fertilizerEntry: entry._id });
        }
        await FertilizerEntry_1.FertilizerEntry.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Xóa ghi chép thành công và hoàn trả tồn kho.' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteFertilizerEntry = deleteFertilizerEntry;
