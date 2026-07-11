"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFertilizerEntry = exports.updateFertilizerEntry = exports.createFertilizerEntry = exports.getFertilizerEntries = exports.deleteFertilizerBoard = exports.updateFertilizerBoard = exports.getFertilizerBoardById = exports.createFertilizerBoard = exports.getFertilizerBoards = void 0;
const FarmProfile_1 = require("../models/FarmProfile");
const FertilizerBoard_1 = require("../models/FertilizerBoard");
const FertilizerEntry_1 = require("../models/FertilizerEntry");
const boardUtils_1 = require("../utils/boardUtils");
const getFertilizerBoards = async (req, res) => {
    try {
        let profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            profile = await FarmProfile_1.FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
        }
        const effectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
        const retentionDate = (0, boardUtils_1.getRetentionDate)(effectivePlan);
        const boards = await FertilizerBoard_1.FertilizerBoard.find({
            farmProfile: profile._id,
            createdAt: { $gte: retentionDate }
        }).sort({ createdAt: -1 });
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
        let profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            profile = await FarmProfile_1.FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
        }
        // Check board limit
        const effectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
        const planLimits = boardUtils_1.PLAN_LIMITS[effectivePlan] || boardUtils_1.PLAN_LIMITS.BASIC;
        const fertilizerCount = await FertilizerBoard_1.FertilizerBoard.countDocuments({ farmProfile: profile._id });
        if (fertilizerCount >= planLimits.products) {
            return res.status(403).json({ success: false, message: `Gói cước của bạn chỉ cho phép tạo tối đa ${planLimits.products} bảng phân bón. Vui lòng nâng cấp gói cước.` });
        }
        if (req.body.customColumns && req.body.customColumns.length > planLimits.columns) {
            return res.status(403).json({ success: false, message: `Gói cước của bạn chỉ cho phép tạo tối đa ${planLimits.columns} cột tùy chỉnh.` });
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
        let profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            profile = await FarmProfile_1.FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
        }
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
        let profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            profile = await FarmProfile_1.FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
        }
        const effectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
        const isLocked = await (0, boardUtils_1.checkBoardLocked)(profile._id.toString(), req.params.id, effectivePlan);
        if (isLocked) {
            return res.status(403).json({ success: false, message: 'Bảng này đã bị khóa do vượt quá giới hạn gói cước hiện tại của bạn.' });
        }
        const normalizedPlan = (profile.plan || 'BASIC').toUpperCase();
        const planLimits = boardUtils_1.PLAN_LIMITS[normalizedPlan] || boardUtils_1.PLAN_LIMITS.BASIC;
        if (req.body.customColumns && req.body.customColumns.length > planLimits.columns) {
            return res.status(403).json({ success: false, message: `Gói cước của bạn chỉ cho phép tạo tối đa ${planLimits.columns} cột tùy chỉnh.` });
        }
        const board = await FertilizerBoard_1.FertilizerBoard.findOneAndUpdate({ _id: req.params.id, farmProfile: profile._id }, req.body, { returnDocument: 'after' });
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
        let profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            profile = await FarmProfile_1.FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
        }
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
        const board = await FertilizerBoard_1.FertilizerBoard.findById(req.params.boardId);
        if (!board)
            return res.status(404).json({ success: false, message: 'Board not found' });
        const profile = await FarmProfile_1.FarmProfile.findById(board.farmProfile);
        const effectivePlan = profile ? (0, boardUtils_1.getEffectivePlan)(profile) : 'BASIC';
        const retentionDate = (0, boardUtils_1.getRetentionDate)(effectivePlan);
        const entries = await FertilizerEntry_1.FertilizerEntry.find({
            fertilizerBoard: req.params.boardId,
            date: { $gte: retentionDate }
        }).sort({ date: -1 });
        res.json({ success: true, data: entries });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getFertilizerEntries = getFertilizerEntries;
const createFertilizerEntry = async (req, res) => {
    try {
        const board = await FertilizerBoard_1.FertilizerBoard.findById(req.params.boardId);
        if (!board)
            return res.status(404).json({ success: false, message: 'Board not found' });
        const profile = await FarmProfile_1.FarmProfile.findById(board.farmProfile);
        if (profile) {
            const effectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
            const isLocked = await (0, boardUtils_1.checkBoardLocked)(profile._id.toString(), board._id.toString(), effectivePlan);
            if (isLocked)
                return res.status(403).json({ success: false, message: 'Bảng này đã bị khóa do vượt quá giới hạn gói cước hiện tại của bạn.' });
        }
        const entry = new FertilizerEntry_1.FertilizerEntry({
            ...req.body,
            fertilizerBoard: req.params.boardId,
        });
        await entry.save();
        res.status(201).json({ success: true, data: entry });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createFertilizerEntry = createFertilizerEntry;
const updateFertilizerEntry = async (req, res) => {
    try {
        const entryCheck = await FertilizerEntry_1.FertilizerEntry.findById(req.params.id).populate('fertilizerBoard');
        if (!entryCheck)
            return res.status(404).json({ success: false, message: 'Entry not found' });
        const board = entryCheck.fertilizerBoard;
        const profile = await FarmProfile_1.FarmProfile.findById(board.farmProfile);
        if (profile) {
            const effectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
            const isLocked = await (0, boardUtils_1.checkBoardLocked)(profile._id.toString(), board._id.toString(), effectivePlan);
            if (isLocked)
                return res.status(403).json({ success: false, message: 'Bảng này đã bị khóa do vượt quá giới hạn gói cước hiện tại của bạn.' });
        }
        const entry = await FertilizerEntry_1.FertilizerEntry.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        if (!entry)
            return res.status(404).json({ success: false, message: 'Entry not found' });
        res.json({ success: true, data: entry });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateFertilizerEntry = updateFertilizerEntry;
const deleteFertilizerEntry = async (req, res) => {
    try {
        const entryCheck = await FertilizerEntry_1.FertilizerEntry.findById(req.params.id).populate('fertilizerBoard');
        if (!entryCheck)
            return res.status(404).json({ success: false, message: 'Entry not found' });
        const board = entryCheck.fertilizerBoard;
        const profile = await FarmProfile_1.FarmProfile.findById(board.farmProfile);
        if (profile) {
            const effectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
            const isLocked = await (0, boardUtils_1.checkBoardLocked)(profile._id.toString(), board._id.toString(), effectivePlan);
            if (isLocked)
                return res.status(403).json({ success: false, message: 'Bảng này đã bị khóa do vượt quá giới hạn gói cước hiện tại của bạn.' });
        }
        const entry = await FertilizerEntry_1.FertilizerEntry.findByIdAndDelete(req.params.id);
        if (!entry)
            return res.status(404).json({ success: false, message: 'Không tìm thấy ghi chép.' });
        res.json({ success: true, message: 'Xóa ghi chép thành công.' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteFertilizerEntry = deleteFertilizerEntry;
