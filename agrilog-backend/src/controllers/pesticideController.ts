import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { FarmProfile } from '../models/FarmProfile';
import { PesticideBoard } from '../models/PesticideBoard';
import { PesticideEntry } from '../models/PesticideEntry';
import { Material } from '../models/Material';
import { MaterialLog } from '../models/MaterialLog';
import { CultivationBoard } from '../models/CultivationBoard';
import { FertilizerBoard } from '../models/FertilizerBoard';

import { PLAN_LIMITS, checkBoardLocked, getRetentionDate, getEffectivePlan } from '../utils/boardUtils';

export const getPesticideBoards = async (req: AuthRequest, res: Response) => {
  try {
    let profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      profile = await FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
    }

    const effectivePlan = getEffectivePlan(profile);
    const retentionDate = getRetentionDate(effectivePlan);

    const boards = await PesticideBoard.find({ 
      farmProfile: profile._id,
      createdAt: { $gte: retentionDate }
    }).sort({ createdAt: -1 });
    const boardsWithCount = await Promise.all(boards.map(async (board) => {
      const count = await PesticideEntry.countDocuments({ pesticideBoard: board._id });
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

export const createPesticideBoard = async (req: AuthRequest, res: Response) => {
  try {
    let profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      profile = await FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
    }

    // Check board limit
    const effectivePlan = getEffectivePlan(profile);
    const planLimits = PLAN_LIMITS[effectivePlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.BASIC;
    const pesticideCount = await PesticideBoard.countDocuments({ farmProfile: profile._id });

    if (pesticideCount >= planLimits.products) {
      return res.status(403).json({ success: false, message: `Gói cước của bạn chỉ cho phép tạo tối đa ${planLimits.products} bảng thuốc BVTV. Vui lòng nâng cấp gói cước.` });
    }

    if (req.body.customColumns && req.body.customColumns.length > planLimits.columns) {
      return res.status(403).json({ success: false, message: `Gói cước của bạn chỉ cho phép tạo tối đa ${planLimits.columns} cột tùy chỉnh.` });
    }

    const board = new PesticideBoard({
      ...req.body,
      farmProfile: profile._id,
    });

    await board.save();
    res.status(201).json({ success: true, data: board });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getPesticideBoardById = async (req: AuthRequest, res: Response) => {
  try {
    let profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      profile = await FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
    }

    const board = await PesticideBoard.findOne({ _id: req.params.id, farmProfile: profile._id });
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

    res.json({ success: true, data: board });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updatePesticideBoard = async (req: AuthRequest, res: Response) => {
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

    const planLimits = PLAN_LIMITS[effectivePlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.BASIC;
    if (req.body.customColumns && req.body.customColumns.length > planLimits.columns) {
      return res.status(403).json({ success: false, message: `Gói cước của bạn chỉ cho phép tạo tối đa ${planLimits.columns} cột tùy chỉnh.` });
    }

    const board = await PesticideBoard.findOneAndUpdate(
      { _id: req.params.id, farmProfile: profile._id },
      req.body,
      { returnDocument: 'after' }
    );
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

    res.json({ success: true, data: board });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deletePesticideBoard = async (req: AuthRequest, res: Response) => {
  try {
    let profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      profile = await FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
    }

    const board = await PesticideBoard.findOneAndDelete({ _id: req.params.id, farmProfile: profile._id });
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

    await PesticideEntry.deleteMany({ pesticideBoard: board._id });

    res.json({ success: true, message: 'Board deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// --- Entries ---

export const getPesticideEntries = async (req: AuthRequest, res: Response) => {
  try {
    const board = await PesticideBoard.findById(req.params.boardId);
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });
    const profile = await FarmProfile.findById(board.farmProfile);
    const effectivePlan = profile ? getEffectivePlan(profile) : 'BASIC';
    const retentionDate = getRetentionDate(effectivePlan);

    const entries = await PesticideEntry.find({ 
      pesticideBoard: req.params.boardId,
      date: { $gte: retentionDate }
    }).sort({ date: -1 });
    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createPesticideEntry = async (req: AuthRequest, res: Response) => {
  try {
    const board = await PesticideBoard.findById(req.params.boardId);
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });
    const profile = await FarmProfile.findById(board.farmProfile);
    if (profile) {
      const effectivePlan = getEffectivePlan(profile);
      const isLocked = await checkBoardLocked(profile._id.toString(), board._id.toString(), effectivePlan);
      if (isLocked) return res.status(403).json({ success: false, message: 'Bảng này đã bị khóa do vượt quá giới hạn gói cước hiện tại của bạn.' });
    }

    const entry = new PesticideEntry({
      ...req.body,
      pesticideBoard: req.params.boardId,
    });
    await entry.save();
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updatePesticideEntry = async (req: AuthRequest, res: Response) => {
  try {
    const entryCheck = await PesticideEntry.findById(req.params.id).populate('pesticideBoard');
    if (!entryCheck) return res.status(404).json({ success: false, message: 'Entry not found' });
    const board = entryCheck.pesticideBoard as any;
    const profile = await FarmProfile.findById(board.farmProfile);
    if (profile) {
      const effectivePlan = getEffectivePlan(profile);
      const isLocked = await checkBoardLocked(profile._id.toString(), board._id.toString(), effectivePlan);
      if (isLocked) return res.status(403).json({ success: false, message: 'Bảng này đã bị khóa do vượt quá giới hạn gói cước hiện tại của bạn.' });
    }

    const entry = await PesticideEntry.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deletePesticideEntry = async (req: AuthRequest, res: Response) => {
  try {
    const entryCheck = await PesticideEntry.findById(req.params.id).populate('pesticideBoard');
    if (!entryCheck) return res.status(404).json({ success: false, message: 'Entry not found' });
    const board = entryCheck.pesticideBoard as any;
    const profile = await FarmProfile.findById(board.farmProfile);
    if (profile) {
      const effectivePlan = getEffectivePlan(profile);
      const isLocked = await checkBoardLocked(profile._id.toString(), board._id.toString(), effectivePlan);
      if (isLocked) return res.status(403).json({ success: false, message: 'Bảng này đã bị khóa do vượt quá giới hạn gói cước hiện tại của bạn.' });
    }

    const entry = await PesticideEntry.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Không tìm thấy ghi chép.' });
    res.json({ success: true, message: 'Xóa ghi chép thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
