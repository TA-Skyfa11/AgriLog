"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReportsStats = void 0;
const FarmProfile_1 = require("../models/FarmProfile");
const CultivationBoard_1 = require("../models/CultivationBoard");
const CultivationEntry_1 = require("../models/CultivationEntry");
const FertilizerBoard_1 = require("../models/FertilizerBoard");
const FertilizerEntry_1 = require("../models/FertilizerEntry");
const PesticideBoard_1 = require("../models/PesticideBoard");
const PesticideEntry_1 = require("../models/PesticideEntry");
const Material_1 = require("../models/Material");
const getReportsStats = async (req, res) => {
    try {
        let profile = await FarmProfile_1.FarmProfile.findOne({ user: req.user?._id });
        if (!profile) {
            profile = await FarmProfile_1.FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
        }
        let startDate;
        let endDate;
        if (req.query.month) {
            const [yearStr, monthStr] = req.query.month.split('-');
            const year = parseInt(yearStr);
            const month = parseInt(monthStr) - 1; // 0-indexed
            startDate = new Date(year, month, 1, 0, 0, 0, 0);
            endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
        }
        else {
            const now = new Date();
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }
        // 1. Fetch all boards and materials for this farm profile in parallel
        const [cBoards, fBoards, pBoards, materials] = await Promise.all([
            CultivationBoard_1.CultivationBoard.find({ farmProfile: profile._id }),
            FertilizerBoard_1.FertilizerBoard.find({ farmProfile: profile._id }),
            PesticideBoard_1.PesticideBoard.find({ farmProfile: profile._id }),
            Material_1.Material.find({ farmProfile: profile._id })
        ]);
        const cBoardMap = new Map(cBoards.map(b => [b._id.toString(), b.toObject()]));
        const fBoardMap = new Map(fBoards.map(b => [b._id.toString(), b.toObject()]));
        const pBoardMap = new Map(pBoards.map(b => [b._id.toString(), b.toObject()]));
        const materialMap = new Map(materials.map(m => [m._id.toString(), m.toObject()]));
        const cbIds = cBoards.map(b => b._id);
        const fbIds = fBoards.map(b => b._id);
        const pbIds = pBoards.map(b => b._id);
        // 2. Fetch all entries within time range
        const [cEntries, fEntries, pEntries] = await Promise.all([
            cbIds.length > 0
                ? CultivationEntry_1.CultivationEntry.find({ cultivationBoard: { $in: cbIds }, date: { $gte: startDate, $lte: endDate } }).sort({ date: 1 })
                : Promise.resolve([]),
            fbIds.length > 0
                ? FertilizerEntry_1.FertilizerEntry.find({ fertilizerBoard: { $in: fbIds }, date: { $gte: startDate, $lte: endDate }, isNotUsed: { $ne: true } }).sort({ date: 1 })
                : Promise.resolve([]),
            pbIds.length > 0
                ? PesticideEntry_1.PesticideEntry.find({ pesticideBoard: { $in: pbIds }, date: { $gte: startDate, $lte: endDate }, isNotUsed: { $ne: true } }).sort({ date: 1 })
                : Promise.resolve([])
        ]);
        // Track usage per material (by name or ID)
        const materialUsageMap = new Map();
        // ---------------------------------------------------------
        // 3. Process Cultivation Data
        // ---------------------------------------------------------
        let totalCultivationLabor = 0;
        let totalCultivationCost = 0;
        const cultivationSummaryMap = {};
        const cultivationDetails = cEntries.map(entry => {
            const b = cBoardMap.get(entry.cultivationBoard?.toString()) || {};
            const people = entry.performer ? entry.performer.split(',').map((p) => p.trim()).filter(Boolean) : [];
            const laborCount = people.length > 0 ? people.length : 1;
            const cost = Number(entry.cost) || 0;
            totalCultivationLabor += laborCount;
            totalCultivationCost += cost;
            const act = entry.activityName || 'Công việc khác';
            if (!cultivationSummaryMap[act]) {
                cultivationSummaryMap[act] = {
                    activity: act,
                    taskCount: 0,
                    laborCount: 0,
                    totalCost: 0,
                    uniqueDates: new Set(),
                    uniquePeople: new Set(),
                    crops: new Set()
                };
            }
            cultivationSummaryMap[act].taskCount += 1;
            cultivationSummaryMap[act].laborCount += laborCount;
            cultivationSummaryMap[act].totalCost += cost;
            if (entry.date) {
                cultivationSummaryMap[act].uniqueDates.add(new Date(entry.date).toISOString().split('T')[0]);
            }
            people.forEach((p) => cultivationSummaryMap[act].uniquePeople.add(p));
            if (b.cropType)
                cultivationSummaryMap[act].crops.add(b.cropType);
            return {
                _id: entry._id,
                date: entry.date,
                boardId: entry.cultivationBoard,
                boardName: b.name || 'Bảng canh tác',
                cropType: b.cropType || '—',
                areaSqm: b.areaSqm || 0,
                areaText: b.areaText || '—',
                stage: entry.stage || '—',
                activityName: entry.activityName || '—',
                performer: entry.performer || '—',
                laborCount,
                weather: entry.weather || '—',
                cost,
                notes: entry.notes || '',
                isCompleted: Boolean(entry.isCompleted)
            };
        });
        const cultivationReport = Object.values(cultivationSummaryMap).map((s) => ({
            activity: s.activity,
            taskCount: s.taskCount,
            laborCount: s.laborCount,
            totalCost: s.totalCost,
            daysCount: s.uniqueDates.size,
            peopleCount: s.uniquePeople.size || s.laborCount,
            crops: Array.from(s.crops).join(', ') || '—'
        }));
        // ---------------------------------------------------------
        // 4. Process Fertilizer Data
        // ---------------------------------------------------------
        let totalFertilizerLabor = 0;
        let totalFertilizerCost = 0;
        let totalFertilizerArea = 0;
        const fertilizerSummaryMap = {};
        const fertilizerDetails = fEntries.map(entry => {
            const b = fBoardMap.get(entry.fertilizerBoard?.toString()) || {};
            const mat = entry.material ? materialMap.get(entry.material.toString()) : null;
            const people = entry.performer ? entry.performer.split(',').map((p) => p.trim()).filter(Boolean) : [];
            const laborCount = people.length > 0 ? people.length : 1;
            const cost = Number(entry.cost) || 0;
            const appliedArea = Number(entry.appliedArea) || Number(b.areaSqm) || 0;
            const quantityNum = parseFloat(String(entry.quantity).replace(/[^\d.-]/g, '')) || 0;
            const unit = entry.unit || mat?.unit || 'kg';
            const matName = entry.materialName || mat?.name || 'Phân bón';
            const manufacturer = entry.manufacturer || mat?.manufacturer || '—';
            totalFertilizerLabor += laborCount;
            totalFertilizerCost += cost;
            totalFertilizerArea += appliedArea;
            // Track usage
            const matKey = matName.toLowerCase();
            const existingUsage = materialUsageMap.get(matKey) || { totalQuantity: 0, unit, timesUsed: 0 };
            existingUsage.totalQuantity += quantityNum;
            existingUsage.timesUsed += 1;
            materialUsageMap.set(matKey, existingUsage);
            // Group for summary
            if (!fertilizerSummaryMap[matName]) {
                fertilizerSummaryMap[matName] = {
                    name: matName,
                    manufacturer,
                    totalQuantity: 0,
                    unit,
                    totalArea: 0,
                    totalCost: 0,
                    timesUsed: 0,
                    laborCount: 0,
                    uniqueDates: new Set()
                };
            }
            fertilizerSummaryMap[matName].totalQuantity += quantityNum;
            fertilizerSummaryMap[matName].totalArea += appliedArea;
            fertilizerSummaryMap[matName].totalCost += cost;
            fertilizerSummaryMap[matName].timesUsed += 1;
            fertilizerSummaryMap[matName].laborCount += laborCount;
            if (entry.date) {
                fertilizerSummaryMap[matName].uniqueDates.add(new Date(entry.date).toISOString().split('T')[0]);
            }
            return {
                _id: entry._id,
                date: entry.date,
                boardId: entry.fertilizerBoard,
                boardName: b.name || 'Bảng phân bón',
                cropType: b.cropType || '—',
                materialName: matName,
                manufacturer,
                quantity: entry.quantity || `${quantityNum} ${unit}`,
                unit,
                appliedArea,
                cost,
                performer: entry.performer || '—',
                laborCount,
                weather: entry.weather || '—',
                notes: entry.notes || ''
            };
        });
        const fertilizerReport = Object.values(fertilizerSummaryMap).map((s) => ({
            name: s.name,
            manufacturer: s.manufacturer,
            totalQuantity: `${Number(s.totalQuantity.toFixed(2))} ${s.unit}`,
            rawQuantity: s.totalQuantity,
            unit: s.unit,
            totalArea: s.totalArea,
            totalCost: s.totalCost,
            timesUsed: s.timesUsed,
            laborCount: s.laborCount,
            daysCount: s.uniqueDates.size
        }));
        // ---------------------------------------------------------
        // 5. Process Pesticide Data
        // ---------------------------------------------------------
        let totalPesticideLabor = 0;
        let totalPesticideCost = 0;
        const pesticideSummaryMap = {};
        const pesticideDetails = pEntries.map(entry => {
            const b = pBoardMap.get(entry.pesticideBoard?.toString()) || {};
            const mat = entry.material ? materialMap.get(entry.material.toString()) : null;
            const people = entry.performer ? entry.performer.split(',').map((p) => p.trim()).filter(Boolean) : [];
            const laborCount = people.length > 0 ? people.length : 1;
            const cost = Number(entry.cost) || 0;
            const quantityNum = parseFloat(String(entry.quantity).replace(/[^\d.-]/g, '')) || 0;
            const unit = entry.unit || mat?.unit || 'lít';
            const matName = entry.materialName || mat?.name || 'Thuốc BVTV';
            const manufacturer = entry.manufacturer || mat?.manufacturer || '—';
            const activeIngredient = entry.activeIngredient || mat?.activeIngredient || '—';
            const targetPest = entry.targetPest || '—';
            const phiDays = Number(entry.phiDays) || 7;
            totalPesticideLabor += laborCount;
            totalPesticideCost += cost;
            // Track usage
            const matKey = matName.toLowerCase();
            const existingUsage = materialUsageMap.get(matKey) || { totalQuantity: 0, unit, timesUsed: 0 };
            existingUsage.totalQuantity += quantityNum;
            existingUsage.timesUsed += 1;
            materialUsageMap.set(matKey, existingUsage);
            // Group for summary
            const groupKey = `${matName}_${targetPest}`;
            if (!pesticideSummaryMap[groupKey]) {
                pesticideSummaryMap[groupKey] = {
                    name: matName,
                    manufacturer,
                    activeIngredient,
                    targetPest,
                    totalQuantity: 0,
                    unit,
                    phiDays,
                    totalCost: 0,
                    timesUsed: 0,
                    laborCount: 0,
                    uniqueDates: new Set()
                };
            }
            pesticideSummaryMap[groupKey].totalQuantity += quantityNum;
            pesticideSummaryMap[groupKey].totalCost += cost;
            pesticideSummaryMap[groupKey].timesUsed += 1;
            pesticideSummaryMap[groupKey].laborCount += laborCount;
            if (entry.date) {
                pesticideSummaryMap[groupKey].uniqueDates.add(new Date(entry.date).toISOString().split('T')[0]);
            }
            return {
                _id: entry._id,
                date: entry.date,
                boardId: entry.pesticideBoard,
                boardName: b.name || 'Bảng thuốc BVTV',
                cropType: b.cropType || '—',
                materialName: matName,
                manufacturer,
                activeIngredient,
                targetPest,
                quantity: entry.quantity || `${quantityNum} ${unit}`,
                unit,
                phiDays,
                cost,
                performer: entry.performer || '—',
                laborCount,
                weather: entry.weather || '—',
                notes: entry.notes || ''
            };
        });
        const pesticideReport = Object.values(pesticideSummaryMap).map((s) => ({
            name: s.name,
            manufacturer: s.manufacturer,
            activeIngredient: s.activeIngredient,
            targetPest: s.targetPest,
            totalQuantity: `${Number(s.totalQuantity.toFixed(2))} ${s.unit}`,
            rawQuantity: s.totalQuantity,
            unit: s.unit,
            phiDays: s.phiDays,
            totalCost: s.totalCost,
            timesUsed: s.timesUsed,
            laborCount: s.laborCount,
            daysCount: s.uniqueDates.size
        }));
        // ---------------------------------------------------------
        // 6. Process Materials Inventory & Status
        // ---------------------------------------------------------
        const now = new Date();
        let materialsAlertCount = 0;
        const inventoryReport = materials.map(mat => {
            const matKey = mat.name.toLowerCase();
            const usedStats = materialUsageMap.get(matKey);
            const usedInMonth = usedStats ? Number(usedStats.totalQuantity.toFixed(2)) : 0;
            const qty = Number(mat.quantity) || 0;
            const minAlert = Number(mat.minQuantityAlert) || 10;
            let status = 'NORMAL';
            let statusText = 'Đủ tồn kho';
            if (mat.expiryDate && new Date(mat.expiryDate) < now) {
                status = 'EXPIRED';
                statusText = 'Đã hết hạn';
                materialsAlertCount++;
            }
            else if (qty <= 0) {
                status = 'EMPTY';
                statusText = 'Hết hàng';
                materialsAlertCount++;
            }
            else if (qty <= minAlert) {
                status = 'LOW';
                statusText = 'Sắp hết hàng';
                materialsAlertCount++;
            }
            return {
                _id: mat._id,
                name: mat.name,
                type: mat.type, // 'FERTILIZER' | 'PESTICIDE'
                typeLabel: mat.type === 'FERTILIZER' ? 'Phân bón' : 'Thuốc BVTV',
                quantity: qty,
                unit: mat.unit || 'kg',
                minQuantityAlert: minAlert,
                manufacturer: mat.manufacturer || '—',
                activeIngredient: mat.activeIngredient || '—',
                supplier: mat.supplier || '—',
                expiryDate: mat.expiryDate ? new Date(mat.expiryDate).toISOString().split('T')[0] : '—',
                usedInMonth: `${usedInMonth} ${mat.unit || 'kg'}`,
                status,
                statusText
            };
        });
        // ---------------------------------------------------------
        // 7. Executive Overall Summary
        // ---------------------------------------------------------
        const totalTasks = cEntries.length + fEntries.length + pEntries.length;
        const totalLabor = totalCultivationLabor + totalFertilizerLabor + totalPesticideLabor;
        const totalCost = totalCultivationCost + totalFertilizerCost + totalPesticideCost;
        res.json({
            success: true,
            data: {
                summary: {
                    totalTasks,
                    totalLabor,
                    totalCost,
                    totalCultivationCost,
                    totalFertilizerCost,
                    totalPesticideCost,
                    totalFertilizerArea,
                    materialsTotal: materials.length,
                    materialsAlertCount
                },
                // Grouped statistical summaries
                cultivationReport,
                fertilizerReport,
                pesticideReport,
                inventoryReport,
                // Detailed log entries with all fields
                cultivationDetails,
                fertilizerDetails,
                pesticideDetails,
                startDate,
                endDate
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getReportsStats = getReportsStats;
