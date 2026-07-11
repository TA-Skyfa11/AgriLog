import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { FarmProfile } from '../models/FarmProfile';
import { CultivationBoard } from '../models/CultivationBoard';
import { CultivationEntry } from '../models/CultivationEntry';
import { FertilizerBoard } from '../models/FertilizerBoard';
import { FertilizerEntry } from '../models/FertilizerEntry';
import { PesticideBoard } from '../models/PesticideBoard';
import { PesticideEntry } from '../models/PesticideEntry';

const countPeople = (performerString: string | undefined): number => {
  if (!performerString) return 0;
  const names = performerString.split(',').map(n => n.trim()).filter(n => n.length > 0);
  return new Set(names).size;
};

export const getReportsStats = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Farm profile not found' });

    let startDate, endDate;

    if (req.query.month) {
      // e.g. "2026-07"
      const [yearStr, monthStr] = (req.query.month as string).split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1; // 0-indexed
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const cultivationBoards = await CultivationBoard.find({ farmProfile: profile._id }).select('_id');
    const fertilizerBoards = await FertilizerBoard.find({ farmProfile: profile._id }).select('_id');
    const pesticideBoards = await PesticideBoard.find({ farmProfile: profile._id }).select('_id');

    const cbIds = cultivationBoards.map(b => b._id);
    const fbIds = fertilizerBoards.map(b => b._id);
    const pbIds = pesticideBoards.map(b => b._id);

    const cultivationEntries = await CultivationEntry.find({
      cultivationBoard: { $in: cbIds },
      date: { $gte: startDate, $lte: endDate }
    });

    const fertilizerEntries = await FertilizerEntry.find({
      fertilizerBoard: { $in: fbIds },
      date: { $gte: startDate, $lte: endDate },
      isNotUsed: { $ne: true }
    });

    const pesticideEntries = await PesticideEntry.find({
      pesticideBoard: { $in: pbIds },
      date: { $gte: startDate, $lte: endDate },
      isNotUsed: { $ne: true }
    });

    const totalTasks = cultivationEntries.length + fertilizerEntries.length + pesticideEntries.length;

    // 1. Cultivation
    const cultivationStats: any = {};
    for (const entry of cultivationEntries) {
      const activity = entry.activityName || 'Khác';
      if (!cultivationStats[activity]) {
        cultivationStats[activity] = { activity, totalLabor: 0, uniqueDates: new Set(), uniquePeople: new Set(), count: 0 };
      }
      const peopleStr = entry.performer || '';
      const names = peopleStr.split(',').map(n => n.trim()).filter(n => n.length > 0);
      
      cultivationStats[activity].totalLabor += names.length || 1; 
      names.forEach(n => cultivationStats[activity].uniquePeople.add(n));
      cultivationStats[activity].uniqueDates.add(new Date(entry.date).toISOString().split('T')[0]);
      cultivationStats[activity].count += 1;
    }

    const cultivationReport = Object.values(cultivationStats).map((stat: any) => ({
      activity: stat.activity,
      laborCount: stat.totalLabor,
      daysCount: stat.uniqueDates.size,
      peopleCount: stat.uniquePeople.size || stat.totalLabor,
      taskCount: stat.count
    }));

    // 2. Fertilizer
    const fertilizerStats: any = {};
    for (const entry of fertilizerEntries) {
      const name = entry.materialName || 'Khác';
      if (!fertilizerStats[name]) {
        fertilizerStats[name] = { name, totalLabor: 0, uniqueDates: new Set(), uniquePeople: new Set(), quantities: [] };
      }
      const peopleStr = entry.performer || '';
      const names = peopleStr.split(',').map(n => n.trim()).filter(n => n.length > 0);
      
      fertilizerStats[name].totalLabor += names.length || 1;
      names.forEach(n => fertilizerStats[name].uniquePeople.add(n));
      if (entry.date) {
        fertilizerStats[name].uniqueDates.add(new Date(entry.date).toISOString().split('T')[0]);
      }
      if (entry.quantity) {
        fertilizerStats[name].quantities.push(entry.quantity);
      }
    }
    
    const parseQuantity = (quantities: string[]) => {
      if (quantities.length === 0) return '0';
      const unitMap: Record<string, number> = {};
      for (const q of quantities) {
        const match = q.match(/([\d.]+)\s*(\D+)/);
        if (match) {
          const val = parseFloat(match[1]);
          const unit = match[2].trim().toLowerCase();
          unitMap[unit] = (unitMap[unit] || 0) + val;
        } else {
           unitMap['khác'] = (unitMap['khác'] || 0) + 1;
        }
      }
      const parts = [];
      for (const [unit, val] of Object.entries(unitMap)) {
         parts.push(`${val} ${unit}`);
      }
      return parts.length > 0 ? parts.join(', ') : quantities.join(', ');
    }

    const fertilizerReport = Object.values(fertilizerStats).map((stat: any) => ({
      name: stat.name,
      laborCount: stat.totalLabor,
      daysCount: stat.uniqueDates.size,
      peopleCount: stat.uniquePeople.size || stat.totalLabor,
      quantityDetails: parseQuantity(stat.quantities)
    }));

    // 3. Pesticide
    const pesticideStats: any = {};
    for (const entry of pesticideEntries) {
      const name = entry.materialName || 'Khác';
      if (!pesticideStats[name]) {
        pesticideStats[name] = { name, totalLabor: 0, uniqueDates: new Set(), uniquePeople: new Set(), quantities: [] };
      }
      const peopleStr = entry.performer || '';
      const names = peopleStr.split(',').map(n => n.trim()).filter(n => n.length > 0);
      
      pesticideStats[name].totalLabor += names.length || 1;
      names.forEach(n => pesticideStats[name].uniquePeople.add(n));
      if (entry.date) {
        pesticideStats[name].uniqueDates.add(new Date(entry.date).toISOString().split('T')[0]);
      }
      if (entry.quantity) {
        pesticideStats[name].quantities.push(entry.quantity);
      }
    }

    const pesticideReport = Object.values(pesticideStats).map((stat: any) => ({
      name: stat.name,
      laborCount: stat.totalLabor,
      daysCount: stat.uniqueDates.size,
      peopleCount: stat.uniquePeople.size || stat.totalLabor,
      quantityDetails: parseQuantity(stat.quantities)
    }));

    res.json({
      success: true,
      data: {
        totalTasks,
        cultivationReport,
        fertilizerReport,
        pesticideReport,
        startDate,
        endDate
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
