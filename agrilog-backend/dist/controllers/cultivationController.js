"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCultivationEntry = exports.createCultivationEntry = exports.getCultivationEntries = exports.deleteCultivationBoard = exports.updateCultivationBoard = exports.getCultivationBoardById = exports.createCultivationBoard = exports.getCultivationBoards = exports.PLAN_LIMITS = void 0;
const FarmProfile_1 = require("../models/FarmProfile");
const CultivationBoard_1 = require("../models/CultivationBoard");
const CultivationEntry_1 = require("../models/CultivationEntry");
const FertilizerBoard_1 = require("../models/FertilizerBoard");
const PesticideBoard_1 = require("../models/PesticideBoard");
exports.PLAN_LIMITS = {
    BASIC: { boards: 3, columns: 10 },
    STANDARD: { boards: 5, columns: 15 },
    PREMIUM: { boards: 15, columns: 25 },
};
const getCultivationBoards = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Farm profile not found' });
        const boards = await CultivationBoard_1.CultivationBoard.find({ farmProfile: profile._id }).sort({ createdAt: -1 });
        const boardsWithCount = await Promise.all(boards.map(async (board) => {
            const count = await CultivationEntry_1.CultivationEntry.countDocuments({ cultivationBoard: board._id });
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
exports.getCultivationBoards = getCultivationBoards;
const createCultivationBoard = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Farm profile not found' });
        const cCount = await CultivationBoard_1.CultivationBoard.countDocuments({ farmProfile: profile._id });
        const fCount = await FertilizerBoard_1.FertilizerBoard.countDocuments({ farmProfile: profile._id });
        const pCount = await PesticideBoard_1.PesticideBoard.countDocuments({ farmProfile: profile._id });
        const totalBoards = cCount + fCount + pCount;
        const limits = exports.PLAN_LIMITS[profile.plan || 'BASIC'];
        if (totalBoards >= limits.boards) {
            return res.status(400).json({
                success: false,
                message: `Gói tài khoản ${profile.plan || 'BASIC'} của bạn chỉ cho phép tạo tối đa ${limits.boards} bảng nhật ký. Vui lòng nâng cấp gói dịch vụ.`
            });
        }
        const board = new CultivationBoard_1.CultivationBoard({
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
exports.createCultivationBoard = createCultivationBoard;
const getCultivationBoardById = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Farm profile not found' });
        const board = await CultivationBoard_1.CultivationBoard.findOne({ _id: req.params.id, farmProfile: profile._id });
        if (!board)
            return res.status(404).json({ success: false, message: 'Board not found' });
        res.json({ success: true, data: board });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCultivationBoardById = getCultivationBoardById;
const updateCultivationBoard = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Farm profile not found' });
        const board = await CultivationBoard_1.CultivationBoard.findOneAndUpdate({ _id: req.params.id, farmProfile: profile._id }, req.body, { new: true });
        if (!board)
            return res.status(404).json({ success: false, message: 'Board not found' });
        res.json({ success: true, data: board });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateCultivationBoard = updateCultivationBoard;
const deleteCultivationBoard = async (req, res) => {
    try {
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Farm profile not found' });
        const board = await CultivationBoard_1.CultivationBoard.findOneAndDelete({ _id: req.params.id, farmProfile: profile._id });
        if (!board)
            return res.status(404).json({ success: false, message: 'Board not found' });
        await CultivationEntry_1.CultivationEntry.deleteMany({ cultivationBoard: board._id });
        res.json({ success: true, message: 'Board deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteCultivationBoard = deleteCultivationBoard;
// --- Entries ---
const getCultivationEntries = async (req, res) => {
    try {
        const entries = await CultivationEntry_1.CultivationEntry.find({ cultivationBoard: req.params.boardId }).sort({ date: -1 });
        res.json({ success: true, data: entries });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCultivationEntries = getCultivationEntries;
const createCultivationEntry = async (req, res) => {
    try {
        const entry = new CultivationEntry_1.CultivationEntry({
            ...req.body,
            cultivationBoard: req.params.boardId,
        });
        await entry.save();
        res.status(201).json({ success: true, data: entry });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createCultivationEntry = createCultivationEntry;
const deleteCultivationEntry = async (req, res) => {
    try {
        const entry = await CultivationEntry_1.CultivationEntry.findByIdAndDelete(req.params.id);
        if (!entry)
            return res.status(404).json({ success: false, message: 'Entry not found' });
        res.json({ success: true, message: 'Entry deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteCultivationEntry = deleteCultivationEntry;
