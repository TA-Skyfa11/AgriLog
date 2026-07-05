import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { CropBoard } from '../models/CropBoard';
import { FarmProfile } from '../models/FarmProfile';

export const getCropBoards = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Farm profile not found' });

    const { boardType } = req.query;
    const filter: any = { farmProfile: profile._id };
    if (boardType) {
      filter.boardType = boardType;
    }

    const boards = await CropBoard.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: boards });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createCropBoard = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Farm profile not found' });

    const board = await CropBoard.create({
      ...req.body,
      farmProfile: profile._id,
    });
    
    res.status(201).json({ success: true, data: board });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getCropBoardById = async (req: AuthRequest, res: Response) => {
  try {
    const board = await CropBoard.findById(req.params.id);
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });
    
    res.json({ success: true, data: board });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
