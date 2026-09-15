import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { FarmProfile } from '../models/FarmProfile';
import { CultivationBoard } from '../models/CultivationBoard';
import { CultivationEntry } from '../models/CultivationEntry';
import { FertilizerBoard } from '../models/FertilizerBoard';
import { PesticideBoard } from '../models/PesticideBoard';
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
    const boardsWithCount = await Promise.all(boards.map(async (board) => {
      const count = await CultivationEntry.countDocuments({ cultivationBoard: board._id });
      return {
        ...board.toObject(),
        entryCount: count,
      };
    }));

    res.json({ success: true, data: boardsWithCount });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createCultivationBoard = async (req: AuthRequest, res: Response) => {
  try {
    let profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      profile = await FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
    }

    // Check board limit
    const effectivePlan = getEffectivePlan(profile);
    const planLimits = PLAN_LIMITS[effectivePlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.BASIC;
    const cultivationCount = await CultivationBoard.countDocuments({ farmProfile: profile._id });

    if (cultivationCount >= planLimits.products) {
      return res.status(403).json({ success: false, message: `Gói cước của bạn chỉ cho phép tạo tối đa ${planLimits.products} bảng canh tác. Vui lòng nâng cấp gói cước.` });
    }

    if (req.body.customColumns && req.body.customColumns.length > planLimits.columns) {
      return res.status(403).json({ success: false, message: `Gói cước của bạn chỉ cho phép tạo tối đa ${planLimits.columns} cột tùy chỉnh.` });
    }

    const groupId = 'gid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const board = new CultivationBoard({
      ...req.body,
      farmProfile: profile._id,
      groupId,
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

// --- Entries ---

export const getCultivationEntries = async (req: AuthRequest, res: Response) => {
  try {
    const board = await CultivationBoard.findById(req.params.boardId);
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });
    const profile = await FarmProfile.findById(board.farmProfile);
    const effectivePlan = profile ? getEffectivePlan(profile) : 'BASIC';
    const retentionDate = getRetentionDate(effectivePlan);

    const entries = await CultivationEntry.find({ 
      cultivationBoard: req.params.boardId,
      date: { $gte: retentionDate }
    }).sort({ date: 1, createdAt: 1 });
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
      cultivationBoard: req.params.boardId,
      entryGroupId,
    });
    await entry.save();

    // Automatically sync row to Fertilizer and Pesticide boards
    await syncCreateDiaryEntry('CULTIVATION', board, entry);

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

    // Sync date, performer, weather to linked entries
    if (entry.entryGroupId && (req.body.date || req.body.performer || req.body.weather)) {
      await syncUpdateDiaryEntry(entry.entryGroupId, {
        date: req.body.date,
        performer: req.body.performer,
        weather: req.body.weather,
      });
    }

    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deleteCultivationEntry = async (req: AuthRequest, res: Response) => {
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

    if (entryCheck.entryGroupId) {
      await syncDeleteDiaryEntry(entryCheck.entryGroupId);
    } else {
      await CultivationEntry.findByIdAndDelete(req.params.id);
    }

    res.json({ success: true, message: 'Entry deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
