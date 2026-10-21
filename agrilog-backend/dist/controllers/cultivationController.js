"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCultivationEntry = exports.updateCultivationEntry = exports.createCultivationEntry = exports.getCultivationEntries = exports.deleteCultivationBoard = exports.updateCultivationBoard = exports.getCultivationBoardById = exports.createCultivationBoard = exports.getCultivationBoards = void 0;
const weatherUtils_1 = require("../utils/weatherUtils");
const FarmProfile_1 = require("../models/FarmProfile");
const CultivationBoard_1 = require("../models/CultivationBoard");
const CultivationEntry_1 = require("../models/CultivationEntry");
const FertilizerBoard_1 = require("../models/FertilizerBoard");
const PesticideBoard_1 = require("../models/PesticideBoard");
const db_1 = require("../config/db");
const boardUtils_1 = require("../utils/boardUtils");
const syncUtils_1 = require("../utils/syncUtils");
const getCultivationBoards = async (req, res) => {
    try {
        let profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            profile = await FarmProfile_1.FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
        }
        const effectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
        const retentionDate = (0, boardUtils_1.getRetentionDate)(effectivePlan);
        const boards = await CultivationBoard_1.CultivationBoard.find({
            farmProfile: profile._id,
            createdAt: { $gte: retentionDate }
        }).sort({ createdAt: -1 });
        if (boards.length === 0) {
            return res.json({ success: true, data: [] });
        }
        // Single-query batch count aggregation instead of N+1 individual queries
        const boardIds = boards.map(b => b._id.toString());
        const sql = (0, db_1.getSql)();
        const countRows = await sql.unsafe(`SELECT data->>'cultivationBoard' as board_id, COUNT(*)::int as count 
       FROM public.cultivation_entries 
       WHERE data->>'cultivationBoard' = ANY($1) 
       GROUP BY data->>'cultivationBoard'`, [boardIds]);
        const countMap = new Map(countRows.map((r) => [r.board_id, r.count]));
        const boardsWithCount = boards.map((board) => ({
            ...board.toObject(),
            entryCount: countMap.get(board._id.toString()) || 0,
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
        let profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            profile = await FarmProfile_1.FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
        }
        // Check board limit
        const effectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
        const planLimits = boardUtils_1.PLAN_LIMITS[effectivePlan] || boardUtils_1.PLAN_LIMITS.BASIC;
        const cultivationCount = await CultivationBoard_1.CultivationBoard.countDocuments({ farmProfile: profile._id });
        if (effectivePlan === 'ALL') {
            return res.status(400).json({
                success: false,
                requireSelectPlan: true,
                message: 'Bạn đang trong thời hạn dùng thử miễn phí. Vui lòng chọn gói dịch vụ (Basic, Standard hoặc Premium) trước khi tạo bảng!',
            });
        }
        if (cultivationCount >= planLimits.products) {
            if (effectivePlan === 'FREE') {
                return res.status(403).json({
                    success: false,
                    message: 'Gói cước Miễn phí chỉ cho phép tạo tối đa 1 bảng canh tác. Vui lòng nâng cấp gói cước để tạo thêm bảng.',
                });
            }
            return res.status(403).json({
                success: false,
                message: `Gói cước của bạn chỉ cho phép tạo tối đa ${planLimits.products} bảng canh tác. Vui lòng nâng cấp gói cước.`,
            });
        }
        if (req.body.customColumns && req.body.customColumns.length > planLimits.columns) {
            return res.status(403).json({ success: false, message: `Gói cước của bạn chỉ cho phép tạo tối đa ${planLimits.columns} cột tùy chỉnh.` });
        }
        const groupId = 'gid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        const board = new CultivationBoard_1.CultivationBoard({
            ...req.body,
            farmProfile: profile._id,
            groupId,
            hasInitializedEntries: true,
        });
        await board.save();
        // Sync to other boards
        await (0, syncUtils_1.syncDiaryBoards)('CULTIVATION', {
            farmProfile: board.farmProfile,
            name: board.name,
            cropType: board.cropType,
            areaSqm: board.areaSqm,
            areaText: board.areaText,
            startDate: board.startDate,
            description: board.description,
            groupId: board.groupId
        });
        res.status(201).json({ success: true, data: board });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createCultivationBoard = createCultivationBoard;
const getCultivationBoardById = async (req, res) => {
    try {
        let profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            profile = await FarmProfile_1.FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
        }
        const board = await CultivationBoard_1.CultivationBoard.findOne({ _id: req.params.id, farmProfile: profile._id });
        if (!board)
            return res.status(404).json({ success: false, message: 'Board not found' });
        // Ensure board is linked to a group and counterpart boards exist
        await (0, syncUtils_1.ensureBoardGroup)(board, 'CULTIVATION');
        res.json({ success: true, data: board });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCultivationBoardById = getCultivationBoardById;
const updateCultivationBoard = async (req, res) => {
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
        const board = await CultivationBoard_1.CultivationBoard.findOneAndUpdate({ _id: req.params.id, farmProfile: profile._id }, req.body, { returnDocument: 'after' });
        if (!board)
            return res.status(404).json({ success: false, message: 'Board not found' });
        if (board.groupId) {
            await (0, syncUtils_1.syncUpdateDiaryBoards)(board.groupId, req.body);
        }
        res.json({ success: true, data: board });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateCultivationBoard = updateCultivationBoard;
const deleteCultivationBoard = async (req, res) => {
    try {
        let profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            profile = await FarmProfile_1.FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
        }
        const board = await CultivationBoard_1.CultivationBoard.findOne({ _id: req.params.id, farmProfile: profile._id });
        if (!board)
            return res.status(404).json({ success: false, message: 'Board not found' });
        if (board.groupId) {
            await (0, syncUtils_1.syncDeleteDiaryBoards)(board.groupId);
        }
        else {
            await CultivationBoard_1.CultivationBoard.findByIdAndDelete(board._id);
            await CultivationEntry_1.CultivationEntry.deleteMany({ cultivationBoard: board._id });
        }
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
        const board = await CultivationBoard_1.CultivationBoard.findById(req.params.boardId);
        if (!board)
            return res.status(404).json({ success: false, message: 'Board not found' });
        const profile = await FarmProfile_1.FarmProfile.findById(board.farmProfile);
        const effectivePlan = profile ? (0, boardUtils_1.getEffectivePlan)(profile) : 'BASIC';
        const retentionDate = (0, boardUtils_1.getRetentionDate)(effectivePlan);
        let entries = await CultivationEntry_1.CultivationEntry.find({
            cultivationBoard: req.params.boardId,
            date: { $gte: retentionDate }
        }).sort({ date: 1, createdAt: 1 });
        // Nếu bảng chưa từng được khởi tạo và chưa có hàng nào, tạo sẵn 1 hàng thực tế trong Database
        if (entries.length === 0 && !board.hasInitializedEntries) {
            const currentWeather = await (0, weatherUtils_1.getCurrentWeatherText)(profile?.address || profile?.city || 'Hanoi');
            const startDate = board.startDate ? new Date(board.startDate) : new Date();
            const entryGroupId = 'eid_' + Date.now() + '_0_' + Math.random().toString(36).substring(2, 7);
            const entry = await CultivationEntry_1.CultivationEntry.create({
                cultivationBoard: board._id,
                date: startDate,
                stage: '',
                activityName: '',
                performer: '',
                weather: currentWeather,
                notes: '',
                entryGroupId,
            });
            await CultivationBoard_1.CultivationBoard.findByIdAndUpdate(board._id, { hasInitializedEntries: true });
            if (board.groupId) {
                await FertilizerBoard_1.FertilizerBoard.updateMany({ groupId: board.groupId }, { hasInitializedEntries: true });
                await PesticideBoard_1.PesticideBoard.updateMany({ groupId: board.groupId }, { hasInitializedEntries: true });
            }
            entries = [entry];
        }
        else if (!board.hasInitializedEntries && entries.length > 0) {
            await CultivationBoard_1.CultivationBoard.findByIdAndUpdate(board._id, { hasInitializedEntries: true });
        }
        res.json({ success: true, data: entries });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getCultivationEntries = getCultivationEntries;
const createCultivationEntry = async (req, res) => {
    try {
        const board = await CultivationBoard_1.CultivationBoard.findById(req.params.boardId);
        if (!board)
            return res.status(404).json({ success: false, message: 'Board not found' });
        const profile = await FarmProfile_1.FarmProfile.findById(board.farmProfile);
        if (profile) {
            const effectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
            const isLocked = await (0, boardUtils_1.checkBoardLocked)(profile._id.toString(), board._id.toString(), effectivePlan);
            if (isLocked)
                return res.status(403).json({ success: false, message: 'Bảng này đã bị khóa do vượt quá giới hạn gói cước hiện tại của bạn.' });
        }
        // Ensure board belongs to a group
        await (0, syncUtils_1.ensureBoardGroup)(board, 'CULTIVATION');
        const entryGroupId = req.body.entryGroupId || ('eid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9));
        const entry = new CultivationEntry_1.CultivationEntry({
            ...req.body,
            date: req.body.date || new Date(),
            cultivationBoard: req.params.boardId,
            entryGroupId,
        });
        await entry.save();
        // Automatically sync row to Fertilizer and Pesticide boards
        // disabled syncCreateDiaryEntry
        res.status(201).json({ success: true, data: entry });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createCultivationEntry = createCultivationEntry;
const updateCultivationEntry = async (req, res) => {
    try {
        const entryCheck = await CultivationEntry_1.CultivationEntry.findById(req.params.id).populate('cultivationBoard');
        if (!entryCheck)
            return res.status(404).json({ success: false, message: 'Entry not found' });
        const board = entryCheck.cultivationBoard;
        const profile = await FarmProfile_1.FarmProfile.findById(board.farmProfile);
        if (profile) {
            const effectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
            const isLocked = await (0, boardUtils_1.checkBoardLocked)(profile._id.toString(), board._id.toString(), effectivePlan);
            if (isLocked)
                return res.status(403).json({ success: false, message: 'Bảng này đã bị khóa do vượt quá giới hạn gói cước hiện tại của bạn.' });
        }
        const entry = await CultivationEntry_1.CultivationEntry.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        if (!entry)
            return res.status(404).json({ success: false, message: 'Entry not found' });
        // Sync date, performer, weather to linked entries
        if (entry.entryGroupId && (req.body.date || req.body.performer || req.body.weather)) {
            // disabled syncUpdateDiaryEntry
        }
        res.json({ success: true, data: entry });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateCultivationEntry = updateCultivationEntry;
const deleteCultivationEntry = async (req, res) => {
    try {
        const entryCheck = await CultivationEntry_1.CultivationEntry.findById(req.params.id);
        if (!entryCheck)
            return res.status(404).json({ success: false, message: 'Entry not found' });
        const boardId = (entryCheck.cultivationBoard?._id || entryCheck.cultivationBoard || '').toString();
        const board = await CultivationBoard_1.CultivationBoard.findById(boardId);
        if (board) {
            const profile = await FarmProfile_1.FarmProfile.findById(board.farmProfile);
            if (profile) {
                const effectivePlan = (0, boardUtils_1.getEffectivePlan)(profile);
                const isLocked = await (0, boardUtils_1.checkBoardLocked)(profile._id.toString(), board._id.toString(), effectivePlan);
                if (isLocked)
                    return res.status(403).json({ success: false, message: 'Bảng này đã bị khóa do vượt quá giới hạn gói cước hiện tại của bạn.' });
            }
        }
        const entry = await CultivationEntry_1.CultivationEntry.findByIdAndDelete(req.params.id);
        if (!entry)
            return res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi.' });
        res.json({ success: true, message: 'Entry deleted' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteCultivationEntry = deleteCultivationEntry;
