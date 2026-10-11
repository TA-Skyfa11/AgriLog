import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { FarmProfile } from '../models/FarmProfile';
import { CultivationBoard } from '../models/CultivationBoard';
import { CultivationEntry } from '../models/CultivationEntry';
import { FertilizerBoard } from '../models/FertilizerBoard';
import { PesticideBoard } from '../models/PesticideBoard';
import { Task } from '../models/Task';
import { Material } from '../models/Material';
import { getRetentionDate, getEffectivePlan } from '../utils/boardUtils';

/**
 * Aggregated dashboard summary endpoint.
 * Replaces 6-8 separate frontend HTTP requests with 1 single backend-aggregated payload,
 * executing parallel database queries inside Node.js.
 */
export const getDashboardSummary = async (req: AuthRequest, res: Response) => {
  try {
    let profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      profile = await FarmProfile.create({ user: req.user?._id, farmName: 'Nông trại của tôi' });
    }

    const effectivePlan = getEffectivePlan(profile);
    const retentionDate = getRetentionDate(effectivePlan);

    // Parallel fetch across collections
    const [cBoards, fBoards, pBoards, tasks, materials] = await Promise.all([
      CultivationBoard.find({
        farmProfile: profile._id,
        createdAt: { $gte: retentionDate }
      }).sort({ createdAt: -1 }),
      FertilizerBoard.find({
        farmProfile: profile._id,
        createdAt: { $gte: retentionDate }
      }).sort({ createdAt: -1 }),
      PesticideBoard.find({
        farmProfile: profile._id,
        createdAt: { $gte: retentionDate }
      }).sort({ createdAt: -1 }),
      Task.find({
        farmProfile: profile._id
      }).sort({ dueDate: 1 }),
      Material.find({
        farmProfile: profile._id
      })
    ]);

    const userName = req.user?.name || profile.farmName || 'Admin';

    // Combine and sort boards
    const allBoards: any[] = [
      ...cBoards.map(b => ({ ...b.toObject(), type: 'cultivation' })),
      ...fBoards.map(b => ({ ...b.toObject(), type: 'fertilizer' })),
      ...pBoards.map(b => ({ ...b.toObject(), type: 'pesticide' }))
    ];
    allBoards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const recentBoards = allBoards.slice(0, 2);

    // Fetch entries for recent cultivation boards
    let recentEntries: any[] = [];
    const topCBoards = cBoards.slice(0, 2);
    if (topCBoards.length > 0) {
      const topCBoardIds = topCBoards.map(b => b._id.toString());
      const entries = await CultivationEntry.find({
        cultivationBoard: { $in: topCBoardIds }
      }).sort({ date: -1 }).limit(5);

      const boardNameMap = new Map(cBoards.map(b => [b._id.toString(), b.name]));
      recentEntries = entries.map(e => ({
        ...e.toObject(),
        boardName: boardNameMap.get(e.cultivationBoard?.toString()) || 'Canh tác',
        type: 'cultivation'
      }));
      recentEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      recentEntries = recentEntries.slice(0, 3);
    }

    // Process tasks for today
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter((t: any) => t.dueDate && String(t.dueDate).startsWith(todayStr));
    const tasksToday = todayTasks.length;
    const tasksCompleted = todayTasks.filter((t: any) => t.status === 'COMPLETED').length;

    // Process inventory
    const inventoryCount = materials.length;
    const inventoryAlerts = materials.filter((m: any) => Number(m.quantity) <= Number(m.minQuantityAlert || 0)).length;

    const boardsCount = cBoards.length + fBoards.length + pBoards.length;

    res.json({
      success: true,
      data: {
        userName,
        profile: profile.toObject(),
        stats: {
          boardsCount,
          tasksToday,
          tasksCompleted,
          inventoryCount,
          inventoryAlerts
        },
        recentBoards,
        recentEntries,
        todayTasks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
