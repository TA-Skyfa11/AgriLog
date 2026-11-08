import { getCurrentWeatherText } from '../utils/weatherUtils';
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { FarmProfile } from '../models/FarmProfile';
import { CultivationBoard } from '../models/CultivationBoard';
import { CultivationEntry } from '../models/CultivationEntry';
import { FertilizerBoard } from '../models/FertilizerBoard';
import { PesticideBoard } from '../models/PesticideBoard';
import { PesticideEntry } from '../models/PesticideEntry';
import { getSql } from '../config/db';
import { PLAN_LIMITS, checkBoardLocked, getRetentionDate, getEffectivePlan } from '../utils/boardUtils';
import {
  syncDiaryBoards,
  syncUpdateDiaryBoards,
  syncDeleteDiaryBoards,
  ensureBoardGroup,
  syncCreateDiaryEntry,
  syncUpdateDiaryEntry,
  syncDeleteDiaryEntry
} from '../utils/syncUtils';
import { calculateSeasonSummaryReport } from '../utils/seasonLifecycleUtils';

export const getCultivationBoards = async (req: AuthRequest, res: Response) => {
  try {
    let profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      profile = await FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
    }

    const effectivePlan = getEffectivePlan(profile);
    const retentionDate = getRetentionDate(effectivePlan);

    const boards = await CultivationBoard.find({ 
      farmProfile: profile._id,
      createdAt: { $gte: retentionDate }
    }).sort({ createdAt: -1 });

    if (boards.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Single-query batch count aggregation instead of N+1 individual queries
    const boardIds = boards.map(b => b._id.toString());
    const sql = getSql();
    const countRows = await sql.unsafe(
      `SELECT data->>'cultivationBoard' as board_id, COUNT(*)::int as count 
       FROM public.cultivation_entries 
       WHERE data->>'cultivationBoard' = ANY($1) 
       GROUP BY data->>'cultivationBoard'`,
      [boardIds]
    );
    const countMap = new Map<string, number>(countRows.map((r: any) => [r.board_id, r.count]));

    const boardsWithCount = boards.map((board) => ({
      ...board.toObject(),
      entryCount: countMap.get(board._id.toString()) || 0,
    }));

    res.json({ success: true, data: boardsWithCount });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

const cultivationCreationLocks = new Set<string>();

export const createCultivationBoard = async (req: AuthRequest, res: Response) => {
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
    let profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      profile = await FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
    }

    // Chống tạo trùng lặp do spam request liên tiếp trong vòng 5 giây
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const recentDuplicate = await CultivationBoard.findOne({
      farmProfile: profile._id,
      name: req.body.name,
      cropType: req.body.cropType,
      createdAt: { $gte: fiveSecondsAgo },
    });
    if (recentDuplicate) {
      return res.status(200).json({ success: true, data: recentDuplicate });
    }

    // Check board limit
    const effectivePlan = getEffectivePlan(profile);
    const planLimits = PLAN_LIMITS[effectivePlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.BASIC;
    const cultivationCount = await CultivationBoard.countDocuments({ farmProfile: profile._id });

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
    const board = new CultivationBoard({
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
    await syncDiaryBoards('CULTIVATION', {
      farmProfile: board.farmProfile,
      name: board.name,
      cropType: board.cropType,
      areaSqm: board.areaSqm,
      areaText: board.areaText,
      startDate: board.startDate,
      description: board.description,
      groupId: board.groupId as string
    });

    res.status(201).json({ success: true, data: board });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  } finally {
    cultivationCreationLocks.delete(userId);
  }
};

export const getCultivationBoardById = async (req: AuthRequest, res: Response) => {
  try {
    let profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      profile = await FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
    }

    const board = await CultivationBoard.findOne({ _id: req.params.id, farmProfile: profile._id });
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

    // Ensure board is linked to a group and counterpart boards exist
    await ensureBoardGroup(board, 'CULTIVATION');

    res.json({ success: true, data: board });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateCultivationBoard = async (req: AuthRequest, res: Response) => {
  try {
    let profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      profile = await FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
    }

    const effectivePlan = getEffectivePlan(profile);
    const isLocked = await checkBoardLocked(profile._id.toString(), req.params.id as string, effectivePlan);
    if (isLocked) {
      return res.status(403).json({ success: false, message: 'Bảng này đã bị khóa do vượt quá giới hạn gói cước hiện tại của bạn.' });
    }

    const normalizedPlan = (profile.plan || 'BASIC').toUpperCase();
    const planLimits = PLAN_LIMITS[normalizedPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.BASIC;
    if (req.body.customColumns && req.body.customColumns.length > planLimits.columns) {
      return res.status(403).json({ success: false, message: `Gói cước của bạn chỉ cho phép tạo tối đa ${planLimits.columns} cột tùy chỉnh.` });
    }

    const board = await CultivationBoard.findOneAndUpdate(
      { _id: req.params.id, farmProfile: profile._id },
      req.body,
      { returnDocument: 'after' }
    );
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

    if (board.groupId) {
      await syncUpdateDiaryBoards(board.groupId, req.body);
    }

    res.json({ success: true, data: board });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteCultivationBoard = async (req: AuthRequest, res: Response) => {
  try {
    let profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      profile = await FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
    }

    const board = await CultivationBoard.findOne({ _id: req.params.id, farmProfile: profile._id });
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

    if (board.groupId) {
      await syncDeleteDiaryBoards(board.groupId);
    } else {
      await CultivationBoard.findByIdAndDelete(board._id);
      await CultivationEntry.deleteMany({ cultivationBoard: board._id });
    }

    res.json({ success: true, message: 'Board deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * 3. Vòng đời Chu kỳ mùa vụ (Season Lifecycle):
 * LẬP KẾ HOẠCH (PLANNING) -> ĐANG CANH TÁC (IN_PROGRESS) -> THU HOẠCH (HARVESTING) -> KẾT THÚC VỤ (COMPLETED).
 * Khi kết thúc vụ, hệ thống tự động sinh báo cáo tổng kết:
 * Tổng tiền giống, tổng phân bón, thuốc BVTV đã dùng, tổng sản lượng đạt được, để so sánh hiệu quả giữa các vụ trong năm.
 */
export const updateSeasonLifecycleStatus = async (req: AuthRequest, res: Response) => {
  try {
    let profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ nông trại' });

    const { id } = req.params;
    const { status, harvestYield, harvestDate, seedCost, expectedYield } = req.body;

    const board = await CultivationBoard.findOne({ _id: id, farmProfile: profile._id });
    if (!board) return res.status(404).json({ success: false, message: 'Không tìm thấy bảng canh tác' });

    const updateFields: any = {};
    if (status) updateFields.status = status;
    if (harvestYield !== undefined) updateFields.harvestYield = Number(harvestYield);
    if (harvestDate !== undefined) updateFields.harvestDate = new Date(harvestDate);
    if (seedCost !== undefined) updateFields.seedCost = Number(seedCost);
    if (expectedYield !== undefined) updateFields.expectedYield = Number(expectedYield);

    let summaryReport = null;
    // Khi kết thúc vụ (COMPLETED hoặc HARVESTED)
    if (status === 'COMPLETED' || status === 'HARVESTED') {
      updateFields.status = 'COMPLETED';
      updateFields.completedAt = new Date();
      if (!updateFields.harvestDate && !board.harvestDate) {
        updateFields.harvestDate = new Date();
      }

      summaryReport = await calculateSeasonSummaryReport(id as string, {
        harvestYield: updateFields.harvestYield !== undefined ? updateFields.harvestYield : board.harvestYield,
        harvestDate: updateFields.harvestDate || board.harvestDate,
        seedCost: updateFields.seedCost !== undefined ? updateFields.seedCost : board.seedCost,
      });
      updateFields.summaryReport = summaryReport;
    }

    const updatedBoard = await CultivationBoard.findOneAndUpdate(
      { _id: id, farmProfile: profile._id },
      updateFields,
      { returnDocument: 'after' }
    );

    // Đồng bộ trạng thái sang FertilizerBoard và PesticideBoard
    if (board.groupId && updateFields.status) {
      await Promise.all([
        FertilizerBoard.updateMany({ groupId: board.groupId }, { $set: { status: updateFields.status } }),
        PesticideBoard.updateMany({ groupId: board.groupId }, { $set: { status: updateFields.status } }),
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
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Lấy Báo cáo tổng kết mùa vụ (Summary Report)
 */
export const getSeasonSummary = async (req: AuthRequest, res: Response) => {
  try {
    let profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const board = await CultivationBoard.findOne({ _id: req.params.id, farmProfile: profile._id });
    if (!board) return res.status(404).json({ success: false, message: 'Không tìm thấy bảng canh tác' });

    if (board.summaryReport && req.query.refresh !== 'true') {
      return res.json({ success: true, data: board.summaryReport, board });
    }

    const report = await calculateSeasonSummaryReport(board._id.toString());
    res.json({ success: true, data: report, board });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * So sánh hiệu quả giữa các vụ trong năm
 */
export const getSeasonComparison = async (req: AuthRequest, res: Response) => {
  try {
    let profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const boards = await CultivationBoard.find({ farmProfile: profile._id }).sort({ startDate: -1 });

    const comparisonList = await Promise.all(
      boards.map(async b => {
        let rep: any = b.summaryReport;
        if (!rep) {
          try {
            rep = await calculateSeasonSummaryReport(b._id.toString());
          } catch (e) {
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
      })
    );

    res.json({ success: true, data: comparisonList });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Kiểm tra cảnh báo cách ly PHI của một bảng
 */
export const getBoardPhiWarning = async (req: AuthRequest, res: Response) => {
  try {
    const board = await CultivationBoard.findById(req.params.id);
    if (!board) return res.status(404).json({ success: false, message: 'Không tìm thấy bảng canh tác' });

    let pBoard = null;
    if (board.groupId) {
      pBoard = await PesticideBoard.findOne({ groupId: board.groupId, farmProfile: board.farmProfile });
    }

    if (!pBoard) {
      return res.json({ success: true, hasWarning: false, alerts: [] });
    }

    const pEntries = await PesticideEntry.find({ pesticideBoard: pBoard._id, isNotUsed: { $ne: true } }).sort({ date: -1 });
    const now = new Date();
    const alerts: any[] = [];

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
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// --- Entries ---

export const getCultivationEntries = async (req: AuthRequest, res: Response) => {
  try {
    const board = await CultivationBoard.findById(req.params.boardId);
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });
    const profile = await FarmProfile.findById(board.farmProfile);
    const effectivePlan = profile ? getEffectivePlan(profile) : 'BASIC';
    const retentionDate = getRetentionDate(effectivePlan);

    let entries = await CultivationEntry.find({ 
      cultivationBoard: req.params.boardId,
      date: { $gte: retentionDate }
    }).sort({ date: 1, createdAt: 1 });

    // Nếu bảng chưa từng được khởi tạo và chưa có hàng nào, tạo sẵn 1 hàng thực tế trong Database
    if (entries.length === 0 && !board.hasInitializedEntries) {
      const currentWeather = await getCurrentWeatherText((profile as any)?.address || (profile as any)?.city || 'Hanoi');
      const startDate = board.startDate ? new Date(board.startDate) : new Date();
      const entryGroupId = 'eid_' + Date.now() + '_0_' + Math.random().toString(36).substring(2, 7);
      const entry = await CultivationEntry.create({
        cultivationBoard: board._id,
        date: startDate,
        stage: '',
        activityName: '',
        performer: '',
        weather: currentWeather,
        notes: '',
        entryGroupId,
      });
      await CultivationBoard.findByIdAndUpdate(board._id, { hasInitializedEntries: true });
      if (board.groupId) {
        await FertilizerBoard.updateMany({ groupId: board.groupId }, { hasInitializedEntries: true });
        await PesticideBoard.updateMany({ groupId: board.groupId }, { hasInitializedEntries: true });
      }
      entries = [entry];
    } else if (!board.hasInitializedEntries && entries.length > 0) {
      await CultivationBoard.findByIdAndUpdate(board._id, { hasInitializedEntries: true });
    }

    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createCultivationEntry = async (req: AuthRequest, res: Response) => {
  try {
    const board = await CultivationBoard.findById(req.params.boardId);
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });
    const profile = await FarmProfile.findById(board.farmProfile);
    if (profile) {
      const effectivePlan = getEffectivePlan(profile);
      const isLocked = await checkBoardLocked(profile._id.toString(), board._id.toString(), effectivePlan);
      if (isLocked) return res.status(403).json({ success: false, message: 'Bảng này đã bị khóa do vượt quá giới hạn gói cước hiện tại của bạn.' });
    }

    // Ensure board belongs to a group
    await ensureBoardGroup(board, 'CULTIVATION');

    const entryGroupId = req.body.entryGroupId || ('eid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9));

    const entry = new CultivationEntry({
      ...req.body,
      date: req.body.date || new Date(),
      cultivationBoard: req.params.boardId,
      entryGroupId,
    });
    await entry.save();

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateCultivationEntry = async (req: AuthRequest, res: Response) => {
  try {
    const entryCheck = await CultivationEntry.findById(req.params.id).populate('cultivationBoard');
    if (!entryCheck) return res.status(404).json({ success: false, message: 'Entry not found' });
    const board = entryCheck.cultivationBoard as any;
    const profile = await FarmProfile.findById(board.farmProfile);
    if (profile) {
      const effectivePlan = getEffectivePlan(profile);
      const isLocked = await checkBoardLocked(profile._id.toString(), board._id.toString(), effectivePlan);
      if (isLocked) return res.status(403).json({ success: false, message: 'Bảng này đã bị khóa do vượt quá giới hạn gói cước hiện tại của bạn.' });
    }

    const entry = await CultivationEntry.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });

    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteCultivationEntry = async (req: AuthRequest, res: Response) => {
  try {
    const entryCheck = await CultivationEntry.findById(req.params.id);
    if (!entryCheck) return res.status(404).json({ success: false, message: 'Entry not found' });
    
    const boardId = (entryCheck.cultivationBoard?._id || entryCheck.cultivationBoard || '').toString();
    const board = await CultivationBoard.findById(boardId);
    if (board) {
      const profile = await FarmProfile.findById(board.farmProfile);
      if (profile) {
        const effectivePlan = getEffectivePlan(profile);
        const isLocked = await checkBoardLocked(profile._id.toString(), board._id.toString(), effectivePlan);
        if (isLocked) return res.status(403).json({ success: false, message: 'Bảng này đã bị khóa do vượt quá giới hạn gói cước hiện tại của bạn.' });
      }
    }

    const entry = await CultivationEntry.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi.' });

    res.json({ success: true, message: 'Entry deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
