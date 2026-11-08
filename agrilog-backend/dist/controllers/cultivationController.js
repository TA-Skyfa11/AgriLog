"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCultivationEntry = exports.updateCultivationEntry = exports.createCultivationEntry = exports.getCultivationEntries = exports.getBoardPhiWarning = exports.getSeasonComparison = exports.getSeasonSummary = exports.updateSeasonLifecycleStatus = exports.deleteCultivationBoard = exports.updateCultivationBoard = exports.getCultivationBoardById = exports.createCultivationBoard = exports.getCultivationBoards = void 0;
const weatherUtils_1 = require("../utils/weatherUtils");
const FarmProfile_1 = require("../models/FarmProfile");
const CultivationBoard_1 = require("../models/CultivationBoard");
const CultivationEntry_1 = require("../models/CultivationEntry");
const FertilizerBoard_1 = require("../models/FertilizerBoard");
const PesticideBoard_1 = require("../models/PesticideBoard");
const PesticideEntry_1 = require("../models/PesticideEntry");
const db_1 = require("../config/db");
const boardUtils_1 = require("../utils/boardUtils");
const syncUtils_1 = require("../utils/syncUtils");
const seasonLifecycleUtils_1 = require("../utils/seasonLifecycleUtils");
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
const cultivationCreationLocks = new Set();
const createCultivationBoard = async (req, res) => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (cultivationCreationLocks.has(userId)) {
        return res.status(429).json({
            success: false,
            message: 'Yêu cầu tạo bảng đang được xử lý, vui lòng chờ trong giây lát.',
        });
    }
    cultivationCreationLocks.add(userId);
    try {
        let profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            profile = await FarmProfile_1.FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
        }
        // Chống tạo trùng lặp do spam request liên tiếp trong vòng 5 giây
        const fiveSecondsAgo = new Date(Date.now() - 5000);
        const recentDuplicate = await CultivationBoard_1.CultivationBoard.findOne({
            farmProfile: profile._id,
            name: req.body.name,
            cropType: req.body.cropType,
            createdAt: { $gte: fiveSecondsAgo },
        });
        if (recentDuplicate) {
            return res.status(200).json({ success: true, data: recentDuplicate });
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
        const initialStatus = req.body.status || 'IN_PROGRESS';
        const board = new CultivationBoard_1.CultivationBoard({
            ...req.body,
            status: initialStatus,
            expectedYield: Number(req.body.expectedYield) || 0,
            seedCost: Number(req.body.seedCost) || 0,
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
    finally {
        cultivationCreationLocks.delete(userId);
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
/**
 * 3. Vòng đời Chu kỳ mùa vụ (Season Lifecycle):
 * LẬP KẾ HOẠCH (PLANNING) -> ĐANG CANH TÁC (IN_PROGRESS) -> THU HOẠCH (HARVESTING) -> KẾT THÚC VỤ (COMPLETED).
 * Khi kết thúc vụ, hệ thống tự động sinh báo cáo tổng kết:
 * Tổng tiền giống, tổng phân bón, thuốc BVTV đã dùng, tổng sản lượng đạt được, để so sánh hiệu quả giữa các vụ trong năm.
 */
const updateSeasonLifecycleStatus = async (req, res) => {
    try {
        let profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ nông trại' });
        const { id } = req.params;
        const { status, harvestYield, harvestDate, seedCost, expectedYield } = req.body;
        const board = await CultivationBoard_1.CultivationBoard.findOne({ _id: id, farmProfile: profile._id });
        if (!board)
            return res.status(404).json({ success: false, message: 'Không tìm thấy bảng canh tác' });
        const updateFields = {};
        if (status)
            updateFields.status = status;
        if (harvestYield !== undefined)
            updateFields.harvestYield = Number(harvestYield);
        if (harvestDate !== undefined)
            updateFields.harvestDate = new Date(harvestDate);
        if (seedCost !== undefined)
            updateFields.seedCost = Number(seedCost);
        if (expectedYield !== undefined)
            updateFields.expectedYield = Number(expectedYield);
        let summaryReport = null;
        // Khi kết thúc vụ (COMPLETED hoặc HARVESTED)
        if (status === 'COMPLETED' || status === 'HARVESTED') {
            updateFields.status = 'COMPLETED';
            updateFields.completedAt = new Date();
            if (!updateFields.harvestDate && !board.harvestDate) {
                updateFields.harvestDate = new Date();
            }
            summaryReport = await (0, seasonLifecycleUtils_1.calculateSeasonSummaryReport)(id, {
                harvestYield: updateFields.harvestYield !== undefined ? updateFields.harvestYield : board.harvestYield,
                harvestDate: updateFields.harvestDate || board.harvestDate,
                seedCost: updateFields.seedCost !== undefined ? updateFields.seedCost : board.seedCost,
            });
            updateFields.summaryReport = summaryReport;
        }
        const updatedBoard = await CultivationBoard_1.CultivationBoard.findOneAndUpdate({ _id: id, farmProfile: profile._id }, updateFields, { returnDocument: 'after' });
        // Đồng bộ trạng thái sang FertilizerBoard và PesticideBoard
        if (board.groupId && updateFields.status) {
            await Promise.all([
                FertilizerBoard_1.FertilizerBoard.updateMany({ groupId: board.groupId }, { $set: { status: updateFields.status } }),
                PesticideBoard_1.PesticideBoard.updateMany({ groupId: board.groupId }, { $set: { status: updateFields.status } }),
            ]);
        }
        res.json({
            success: true,
            data: updatedBoard,
            summaryReport,
            message: status === 'COMPLETED'
                ? '🎉 Đã kết thúc vụ mùa thành công! Hệ thống đã tự động tính toán và lưu báo cáo tổng kết mùa vụ.'
                : `Cập nhật trạng thái chu kỳ mùa vụ thành: ${status}`,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateSeasonLifecycleStatus = updateSeasonLifecycleStatus;
/**
 * Lấy Báo cáo tổng kết mùa vụ (Summary Report)
 */
const getSeasonSummary = async (req, res) => {
    try {
        let profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Profile not found' });
        const board = await CultivationBoard_1.CultivationBoard.findOne({ _id: req.params.id, farmProfile: profile._id });
        if (!board)
            return res.status(404).json({ success: false, message: 'Không tìm thấy bảng canh tác' });
        if (board.summaryReport && req.query.refresh !== 'true') {
            return res.json({ success: true, data: board.summaryReport, board });
        }
        const report = await (0, seasonLifecycleUtils_1.calculateSeasonSummaryReport)(board._id.toString());
        res.json({ success: true, data: report, board });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getSeasonSummary = getSeasonSummary;
/**
 * So sánh hiệu quả giữa các vụ trong năm
 */
const getSeasonComparison = async (req, res) => {
    try {
        let profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile)
            return res.status(404).json({ success: false, message: 'Profile not found' });
        const boards = await CultivationBoard_1.CultivationBoard.find({ farmProfile: profile._id }).sort({ startDate: -1 });
        const comparisonList = await Promise.all(boards.map(async (b) => {
            let rep = b.summaryReport;
            if (!rep) {
                try {
                    rep = await (0, seasonLifecycleUtils_1.calculateSeasonSummaryReport)(b._id.toString());
                }
                catch (e) {
                    rep = null;
                }
            }
            return {
                _id: b._id,
                name: b.name,
                cropType: b.cropType,
                areaSqm: b.areaSqm,
                startDate: b.startDate,
                status: b.status,
                harvestDate: b.harvestDate,
                actualYield: b.harvestYield || rep?.actualYield || 0,
                expectedYield: b.expectedYield || rep?.expectedYield || 0,
                yieldAchievementRate: rep?.yieldAchievementRate || 100,
                totalCost: rep?.totalCost || 0,
                totalSeedCost: rep?.totalSeedCost || 0,
                totalFertilizerCost: rep?.totalFertilizerCost || 0,
                totalPesticideCost: rep?.totalPesticideCost || 0,
                totalLaborCost: rep?.totalLaborCost || 0,
                costPerKg: rep?.costPerKg || 0,
                phiComplianceStatus: rep?.phiComplianceStatus || 'SAFE',
            };
        }));
        res.json({ success: true, data: comparisonList });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getSeasonComparison = getSeasonComparison;
/**
 * Kiểm tra cảnh báo cách ly PHI của một bảng
 */
const getBoardPhiWarning = async (req, res) => {
    try {
        const board = await CultivationBoard_1.CultivationBoard.findById(req.params.id);
        if (!board)
            return res.status(404).json({ success: false, message: 'Không tìm thấy bảng canh tác' });
        let pBoard = null;
        if (board.groupId) {
            pBoard = await PesticideBoard_1.PesticideBoard.findOne({ groupId: board.groupId, farmProfile: board.farmProfile });
        }
        if (!pBoard) {
            return res.json({ success: true, hasWarning: false, alerts: [] });
        }
        const pEntries = await PesticideEntry_1.PesticideEntry.find({ pesticideBoard: pBoard._id, isNotUsed: { $ne: true } }).sort({ date: -1 });
        const now = new Date();
        const alerts = [];
        for (const p of pEntries) {
            const sprayDate = new Date(p.date);
            const phiDays = Number(p.phiDays) || 7;
            const safeHarvestDate = new Date(sprayDate.getTime() + phiDays * 24 * 60 * 60 * 1000);
            if (safeHarvestDate > now) {
                const remainingDays = Math.ceil((safeHarvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                alerts.push({
                    pesticideName: p.materialName || 'Thuốc bảo vệ thực vật',
                    activeIngredient: p.activeIngredient || '',
                    sprayDate,
                    phiDays,
                    safeHarvestDate,
                    remainingDays,
                    message: `Vừa phun thuốc "${p.materialName || 'BVTV'}" ngày ${sprayDate.toLocaleDateString('vi-VN')}, chưa đủ thời gian cách ly PHI (${phiDays} ngày). Cần cách ly thêm ${remainingDays} ngày nữa (đến ngày ${safeHarvestDate.toLocaleDateString('vi-VN')}). CẢNH BÁO: KHÔNG ĐƯỢC THU HOẠCH SỚM!`,
                    isCritical: board.status === 'HARVESTING' || remainingDays >= phiDays - 1,
                });
            }
        }
        res.json({
            success: true,
            hasWarning: alerts.length > 0,
            alerts,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getBoardPhiWarning = getBoardPhiWarning;
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
