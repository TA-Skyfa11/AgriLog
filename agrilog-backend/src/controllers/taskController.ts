import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Task } from '../models/Task';
import { FarmProfile } from '../models/FarmProfile';

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const tasks = await Task.find({ farmProfile: profile._id }).sort({ dueDate: 1 });
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });

    const task = await Task.create({
      ...req.body,
      farmProfile: profile._id,
    });
    
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const completeTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, { status: 'COMPLETED' }, { returnDocument: 'after' });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
