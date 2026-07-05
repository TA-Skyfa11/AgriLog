import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { DiaryEntry } from '../models/DiaryEntry';
import { CropBoard } from '../models/CropBoard';
import { Material } from '../models/Material';
import { MaterialLog } from '../models/MaterialLog';

export const getDiaryEntries = async (req: AuthRequest, res: Response) => {
  try {
    const { boardId } = req.params;
    
    // Validate ownership
    const board = await CropBoard.findById(boardId);
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });
    
    // In a real app we'd verify the board belongs to the current user's farm profile.

    const entries = await DiaryEntry.find({ cropBoard: boardId }).sort({ date: -1 });
    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};



export const createDiaryEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { boardId } = req.params;

    const board = await CropBoard.findById(boardId);
    if (!board) return res.status(404).json({ success: false, message: 'Board not found' });

    const entry = await DiaryEntry.create({
      ...req.body,
      cropBoard: boardId,
    });

    // Auto deduct inventory if it is FERTILIZER or PESTICIDE
    if ((req.body.type === 'FERTILIZER' || req.body.type === 'PESTICIDE') && req.body.material) {
      const material = await Material.findById(req.body.material);
      if (material) {
        material.quantity -= Number(req.body.quantity || 0);
        await material.save();

        await MaterialLog.create({
          material: material._id,
          type: 'EXPORT',
          quantity: Number(req.body.quantity || 0),
          date: req.body.date || new Date(),
          notes: `Sử dụng cho bảng canh tác: ${board.name}`,
        });
      }
    }
    
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
