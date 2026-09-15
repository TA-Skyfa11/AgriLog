import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { FarmProfile } from '../models/FarmProfile';
import { FertilizerBoard } from '../models/FertilizerBoard';
import { FertilizerEntry } from '../models/FertilizerEntry';
import { Material } from '../models/Material';
import { MaterialLog } from '../models/MaterialLog';
import { CultivationBoard } from '../models/CultivationBoard';
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

export const getFertilizerBoards = async (req: AuthRequest, res: Response) => {
  try {
    let profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      profile = await FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
    }

    const effectivePlan = getEffectivePlan(profile);
    const retentionDate = getRetentionDate(effectivePlan);

    const boards = await FertilizerBoard.find({ 
      farmProfile: profile._id,
      createdAt: { $gte: retentionDate }
    }).sort({ createdAt: -1 });
    const boardsWithCount = await Promise.all(boards.map(async (board) => {
      const count = await FertilizerEntry.countDocuments({ fertilizerBoard: board._id });
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

export const createFertilizerBoard = async (req: AuthRequest, res: Response) => {
  try {
    let profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      profile = await FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
    }

    // Check board limit
    const effectivePlan = getEffectivePlan(profile);
    const planLimits = PLAN_LIMITS[effectivePlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.BASIC;
    const fertilizerCount = await FertilizerBoard.countDocuments({ farmProfile: profile._id });

    if (fertilizerCount >= planLimits.products) {
      return res.status(403).json({ success: false, message: `Gói cước của bạn chỉ cho phép tạo tối đa ${planLimits.products} bảng phân bón. Vui lòng nâng cấp gói cước.` });
    }

    if (req.body.customColumns && req.body.customColumns.length > planLimits.columns) {
      return res.status(403).json({ success: false, message: `Gói cước của bạn chỉ cho phép tạo tối đa ${planLimits.columns} cột tùy chỉnh.` });
    }

    const groupId = 'gid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const board = new FertilizerBoard({
      ...req.body,
      farmProfile: profile._id,
      groupId,
    });

    await board.save();
    
    // Sync to other boards
    await syncDiaryBoards('FERTILIZER', {
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

export const getFertilizerBoardById = async (req: AuthRequest, res: Response) => {
  try {
    let profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      profile = await FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
    }

    const board = await FertilizerBoard.findOne({ _id: req.params.id, farmProfile: profile._id });
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

    // Ensure board is linked to a group and counterpart boards exist
    await ensureBoardGroup(board, 'FERTILIZER');

    res.json({ success: true, data: board });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateFertilizerBoard = async (req: AuthRequest, res: Response) => {
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

    const board = await FertilizerBoard.findOneAndUpdate(
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

export const deleteFertilizerBoard = async (req: AuthRequest, res: Response) => {
  try {
    let profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      profile = await FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
    }

    const board = await FertilizerBoard.findOne({ _id: req.params.id, farmProfile: profile._id });
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

    if (board.groupId) {
      await syncDeleteDiaryBoards(board.groupId);
    } else {
      await FertilizerBoard.findByIdAndDelete(board._id);
      await FertilizerEntry.deleteMany({ fertilizerBoard: board._id });
    }

    res.json({ success: true, message: 'Board deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// --- Entries ---

export const getFertilizerEntries = async (req: AuthRequest, res: Response) => {
  try {
    const board = await FertilizerBoard.findById(req.params.boardId);
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });
    const profile = await FarmProfile.findById(board.farmProfile);
    const effectivePlan = profile ? getEffectivePlan(profile) : 'BASIC';
    const retentionDate = getRetentionDate(effectivePlan);

    const entries = await FertilizerEntry.find({ 
      fertilizerBoard: req.params.boardId,
      date: { $gte: retentionDate }
    }).sort({ date: 1, createdAt: 1 });
    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createFertilizerEntry = async (req: AuthRequest, res: Response) => {
  try {
    const board = await FertilizerBoard.findById(req.params.boardId);
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });
    const profile = await FarmProfile.findById(board.farmProfile);
    if (profile) {
      const effectivePlan = getEffectivePlan(profile);
      const isLocked = await checkBoardLocked(profile._id.toString(), board._id.toString(), effectivePlan);
      if (isLocked) return res.status(403).json({ success: false, message: 'Bảng này đã bị khóa do vượt quá giới hạn gói cước hiện tại của bạn.' });
    }

    let numValue = 0;
    if (req.body.material && req.body.quantity) {
      const quantityStr = String(req.body.quantity);
      const quantityMatch = quantityStr.match(/[\d.]+/);
      if (quantityMatch) {
        numValue = parseFloat(quantityMatch[0]);
        if (!isNaN(numValue) && numValue > 0) {
          const material = await Material.findById(req.body.material);
          if (material && material.quantity < numValue) {
            return res.status(400).json({ success: false, message: `Số lượng vật tư trong kho không đủ. Kho hiện tại chỉ còn ${material.quantity} ${material.unit || ''}.` });
          }
        } else {
          numValue = 0;
        }
      }
    }

    // Ensure board belongs to a group
    await ensureBoardGroup(board, 'FERTILIZER');

    const entryGroupId = req.body.entryGroupId || ('eid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9));

    const entry = new FertilizerEntry({
      ...req.body,
      fertilizerBoard: req.params.boardId,
      entryGroupId,
    });
    await entry.save();

    if (numValue > 0) {
      await Material.findByIdAndUpdate(req.body.material, { $inc: { quantity: -numValue } });
    }

    // Automatically sync row to Cultivation and Pesticide boards
    await syncCreateDiaryEntry('FERTILIZER', board, entry);

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateFertilizerEntry = async (req: AuthRequest, res: Response) => {
  try {
    const entryCheck = await FertilizerEntry.findById(req.params.id).populate('fertilizerBoard');
    if (!entryCheck) return res.status(404).json({ success: false, message: 'Entry not found' });
    const board = entryCheck.fertilizerBoard as any;
    const profile = await FarmProfile.findById(board.farmProfile);
    if (profile) {
      const effectivePlan = getEffectivePlan(profile);
      const isLocked = await checkBoardLocked(profile._id.toString(), board._id.toString(), effectivePlan);
      if (isLocked) return res.status(403).json({ success: false, message: 'Bảng này đã bị khóa do vượt quá giới hạn gói cước hiện tại của bạn.' });
    }

    const oldMaterialId = entryCheck.material?.toString();
    const newMaterialId = req.body.material;
    
    let oldQuantityNum = 0;
    if (entryCheck.quantity) {
      const match = String(entryCheck.quantity).match(/[\d.]+/);
      if (match) oldQuantityNum = parseFloat(match[0]) || 0;
    }

    let newQuantityNum = 0;
    if (req.body.quantity) {
      const match = String(req.body.quantity).match(/[\d.]+/);
      if (match) newQuantityNum = parseFloat(match[0]) || 0;
    }

    // Validation for new material usage
    if (oldMaterialId && newMaterialId && oldMaterialId === newMaterialId) {
      const diff = newQuantityNum - oldQuantityNum;
      if (diff > 0) {
        const material = await Material.findById(newMaterialId);
        if (material && material.quantity < diff) {
          return res.status(400).json({ success: false, message: `Số lượng vật tư trong kho không đủ. Kho hiện tại chỉ còn ${material.quantity} ${material.unit || ''}.` });
        }
      }
    } else {
      if (newMaterialId && newQuantityNum > 0) {
        const material = await Material.findById(newMaterialId);
        if (material && material.quantity < newQuantityNum) {
          return res.status(400).json({ success: false, message: `Số lượng vật tư trong kho không đủ. Kho hiện tại chỉ còn ${material.quantity} ${material.unit || ''}.` });
        }
      }
    }

    const entry = await FertilizerEntry.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });

    if (oldMaterialId && newMaterialId && oldMaterialId === newMaterialId) {
      const diff = newQuantityNum - oldQuantityNum;
      if (diff !== 0) {
        await Material.findByIdAndUpdate(newMaterialId, { $inc: { quantity: -diff } });
      }
    } else {
      if (oldMaterialId && oldQuantityNum > 0) {
        await Material.findByIdAndUpdate(oldMaterialId, { $inc: { quantity: oldQuantityNum } });
      }
      if (newMaterialId && newQuantityNum > 0) {
        await Material.findByIdAndUpdate(newMaterialId, { $inc: { quantity: -newQuantityNum } });
      }
    }

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

export const deleteFertilizerEntry = async (req: AuthRequest, res: Response) => {
  try {
    const entryCheck = await FertilizerEntry.findById(req.params.id).populate('fertilizerBoard');
    if (!entryCheck) return res.status(404).json({ success: false, message: 'Entry not found' });
    const board = entryCheck.fertilizerBoard as any;
    const profile = await FarmProfile.findById(board.farmProfile);
    if (profile) {
      const effectivePlan = getEffectivePlan(profile);
      const isLocked = await checkBoardLocked(profile._id.toString(), board._id.toString(), effectivePlan);
      if (isLocked) return res.status(403).json({ success: false, message: 'Bảng này đã bị khóa do vượt quá giới hạn gói cước hiện tại của bạn.' });
    }

    const entry = await FertilizerEntry.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Không tìm thấy ghi chép.' });

    if (entry.material && entry.quantity) {
      const match = String(entry.quantity).match(/[\d.]+/);
      if (match) {
        const numValue = parseFloat(match[0]);
        if (!isNaN(numValue) && numValue > 0) {
          await Material.findByIdAndUpdate(entry.material, { $inc: { quantity: numValue } });
        }
      }
    }

    // Delete linked entries across boards
    if (entryCheck.entryGroupId) {
      await syncDeleteDiaryEntry(entryCheck.entryGroupId);
    }

    res.json({ success: true, message: 'Xóa ghi chép thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
