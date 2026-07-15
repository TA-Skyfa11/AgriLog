"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFertilizerEntry = exports.updateFertilizerEntry = exports.createFertilizerEntry = exports.getFertilizerEntries = exports.deleteFertilizerBoard = exports.updateFertilizerBoard = exports.getFertilizerBoardById = exports.createFertilizerBoard = exports.getFertilizerBoards = void 0;
const FarmProfile_1 = require("../models/FarmProfile");
const FertilizerBoard_1 = require("../models/FertilizerBoard");
const FertilizerEntry_1 = require("../models/FertilizerEntry");
const Material_1 = require("../models/Material");
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
        let numValue = 0;
        if (req.body.material && req.body.quantity) {
            const quantityStr = String(req.body.quantity);
            const quantityMatch = quantityStr.match(/[\d.]+/);
            if (quantityMatch) {
                numValue = parseFloat(quantityMatch[0]);
                if (!isNaN(numValue) && numValue > 0) {
                    const material = await Material_1.Material.findById(req.body.material);
                    if (material && material.quantity < numValue) {
                        return res.status(400).json({ success: false, message: `Số lượng vật tư trong kho không đủ. Kho hiện tại chỉ còn ${material.quantity} ${material.unit || ''}.` });
                    }
                }
                else {
                    numValue = 0;
                }
            }
        }
        const entry = new FertilizerEntry_1.FertilizerEntry({
            ...req.body,
            fertilizerBoard: req.params.boardId,
        });
        await entry.save();
        if (numValue > 0) {
            await Material_1.Material.findByIdAndUpdate(req.body.material, { $inc: { quantity: -numValue } });
        }
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
        const oldMaterialId = entryCheck.material?.toString();
        const newMaterialId = req.body.material;
        let oldQuantityNum = 0;
        if (entryCheck.quantity) {
            const match = String(entryCheck.quantity).match(/[\d.]+/);
            if (match)
                oldQuantityNum = parseFloat(match[0]) || 0;
        }
        let newQuantityNum = 0;
        if (req.body.quantity) {
            const match = String(req.body.quantity).match(/[\d.]+/);
            if (match)
                newQuantityNum = parseFloat(match[0]) || 0;
        }
        // Validation for new material usage
        if (oldMaterialId && newMaterialId && oldMaterialId === newMaterialId) {
            const diff = newQuantityNum - oldQuantityNum;
            if (diff > 0) {
                const material = await Material_1.Material.findById(newMaterialId);
                if (material && material.quantity < diff) {
                    return res.status(400).json({ success: false, message: `Số lượng vật tư trong kho không đủ. Kho hiện tại chỉ còn ${material.quantity} ${material.unit || ''}.` });
                }
            }
        }
        else {
            if (newMaterialId && newQuantityNum > 0) {
                const material = await Material_1.Material.findById(newMaterialId);
                if (material && material.quantity < newQuantityNum) {
                    return res.status(400).json({ success: false, message: `Số lượng vật tư trong kho không đủ. Kho hiện tại chỉ còn ${material.quantity} ${material.unit || ''}.` });
                }
            }
        }
        const entry = await FertilizerEntry_1.FertilizerEntry.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        if (!entry)
            return res.status(404).json({ success: false, message: 'Entry not found' });
        if (oldMaterialId && newMaterialId && oldMaterialId === newMaterialId) {
            const diff = newQuantityNum - oldQuantityNum;
            if (diff !== 0) {
                await Material_1.Material.findByIdAndUpdate(newMaterialId, { $inc: { quantity: -diff } });
            }
        }
        else {
            if (oldMaterialId && oldQuantityNum > 0) {
                await Material_1.Material.findByIdAndUpdate(oldMaterialId, { $inc: { quantity: oldQuantityNum } });
            }
            if (newMaterialId && newQuantityNum > 0) {
                await Material_1.Material.findByIdAndUpdate(newMaterialId, { $inc: { quantity: -newQuantityNum } });
            }
        }
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
        if (entry.material && entry.quantity) {
            const match = String(entry.quantity).match(/[\d.]+/);
            if (match) {
                const numValue = parseFloat(match[0]);
                if (!isNaN(numValue) && numValue > 0) {
                    await Material_1.Material.findByIdAndUpdate(entry.material, { $inc: { quantity: numValue } });
                }
            }
        }
        res.json({ success: true, message: 'Xóa ghi chép thành công.' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteFertilizerEntry = deleteFertilizerEntry;
