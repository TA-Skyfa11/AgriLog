import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { FarmProfile } from '../models/FarmProfile';
import { PesticideBoard } from '../models/PesticideBoard';
import { PesticideEntry } from '../models/PesticideEntry';
import { Material } from '../models/Material';
import { MaterialLog } from '../models/MaterialLog';
import { CultivationBoard } from '../models/CultivationBoard';
import { FertilizerBoard } from '../models/FertilizerBoard';

const PLAN_LIMITS = {
  BASIC: { columns: 10, products: 3 },
  STANDARD: { columns: 15, products: 5 },
  PREMIUM: { columns: 25, products: 15 },
};

export const getPesticideBoards = async (req: AuthRequest, res: Response) => {
  try {
    let profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      profile = await FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
    }

    const boards = await PesticideBoard.find({ farmProfile: profile._id }).sort({ createdAt: -1 });
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

    const board = await PesticideBoard.findOneAndUpdate(
      { _id: req.params.id, farmProfile: profile._id },
      req.body,
      { new: true }
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
    const entries = await PesticideEntry.find({ pesticideBoard: req.params.boardId }).sort({ date: -1 });
    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createPesticideEntry = async (req: AuthRequest, res: Response) => {
  try {
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
    const entry = await PesticideEntry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const deletePesticideEntry = async (req: AuthRequest, res: Response) => {
  try {
    const entry = await PesticideEntry.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Không tìm thấy ghi chép.' });
    res.json({ success: true, message: 'Xóa ghi chép thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
