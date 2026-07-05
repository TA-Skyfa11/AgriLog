import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { FarmProfile } from '../models/FarmProfile';
import { Material } from '../models/Material';
import { MaterialLog } from '../models/MaterialLog';
import { CultivationBoard } from '../models/CultivationBoard';

export const getReportsStats = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Farm profile not found' });

    // Generate last 6 months list
    const monthsData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsData.push({
        monthName: `T${d.getMonth() + 1}`,
        year: d.getFullYear(),
        month: d.getMonth(),
        startDate: new Date(d.getFullYear(), d.getMonth(), 1),
        endDate: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
      });
    }

    const costData = [];
    const harvestData = [];

    // Query materials for this farm to calculate costs
    const materials = await Material.find({ farmProfile: profile._id });
    const materialMap = new Map(materials.map(m => [m._id.toString(), m]));

    for (const m of monthsData) {
      // 1. Calculate fertilizer & pesticide cost from MaterialLog exports in this month
      const logs = await MaterialLog.find({
        material: { $in: Array.from(materialMap.keys()) },
        type: 'EXPORT',
        date: { $gte: m.startDate, $lte: m.endDate }
      });

      let phanBonCost = 0;
      let thuocBVTVCost = 0;

      for (const log of logs) {
        const material = materialMap.get(log.material.toString());
        if (material) {
          const cost = log.quantity * (material.pricePerUnit || 0);
          if (material.type === 'FERTILIZER') {
            phanBonCost += cost;
          } else if (material.type === 'PESTICIDE') {
            thuocBVTVCost += cost;
          }
        }
      }

      costData.push({
        month: m.monthName,
        phanBon: phanBonCost,
        thuocBVTV: thuocBVTVCost,
        giong: 0,
      });

      // 2. Calculate harvest yield from CultivationBoard harvested in this month
      const harvestedBoards = await CultivationBoard.find({
        farmProfile: profile._id,
        status: 'HARVESTED',
        harvestDate: { $gte: m.startDate, $lte: m.endDate }
      });

      const totalYieldKg = harvestedBoards.reduce((acc, b) => acc + (b.harvestYield || 0), 0);
      
      harvestData.push({
        month: m.monthName,
        sanLuong: totalYieldKg / 1000, // Convert kg to Tons for reports
      });
    }

    // 3. Calculate current inventory value
    const currentInventoryValue = materials.reduce((acc, m) => acc + (m.quantity * (m.pricePerUnit || 0)), 0);

    res.json({
      success: true,
      data: {
        costData,
        harvestData,
        currentInventoryValue
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
