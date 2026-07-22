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

    const { recurrence, recurrenceCustomDays, recurrenceEndDate, dueDate, ...rest } = req.body;
    const baseDate = new Date(dueDate);

    // Create the first task
    const task = await Task.create({
      ...req.body,
      farmProfile: profile._id,
      dueDate: baseDate,
    });
    
    // Generate recurrent tasks
    if (recurrence && recurrence !== 'NONE' && recurrenceEndDate) {
      const endRecurrence = new Date(recurrenceEndDate);
      let nextDate = new Date(baseDate);
      const generatedTasks = [];
      
      while (true) {
        if (recurrence === 'DAILY') {
          nextDate.setDate(nextDate.getDate() + 1);
        } else if (recurrence === 'WEEKLY') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (recurrence === 'MONTHLY') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (recurrence === 'CUSTOM' && recurrenceCustomDays) {
          nextDate.setDate(nextDate.getDate() + recurrenceCustomDays);
        }

        if (nextDate > endRecurrence) break;
        
        // Prevent infinite loops / too many tasks (limit to 100)
        if (generatedTasks.length >= 100) break;

        generatedTasks.push({
          ...rest,
          farmProfile: profile._id,
          dueDate: new Date(nextDate),
          status: 'PENDING',
          recurrence: 'NONE', // generated tasks are single instances
          parentTaskId: task._id
        });
      }
      
      if (generatedTasks.length > 0) {
        await Task.insertMany(generatedTasks);
      }
    }

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
