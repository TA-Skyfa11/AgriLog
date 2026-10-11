import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { FarmProfile } from '../models/FarmProfile';
import { CultivationBoard } from '../models/CultivationBoard';
import { CultivationEntry } from '../models/CultivationEntry';
import { FertilizerBoard } from '../models/FertilizerBoard';
import { FertilizerEntry } from '../models/FertilizerEntry';
import { PesticideBoard } from '../models/PesticideBoard';
import { PesticideEntry } from '../models/PesticideEntry';
import { Material } from '../models/Material';
import {
  generatePdfFromHtml,
  buildCultivationHtml,
  buildFertilizerHtml,
  buildPesticideHtml,
  buildReportsHtml,
} from '../utils/pdfGenerator';

/**
 * Check if the farm profile is permitted to export PDF
 */
const checkPlanPermission = (profile: any, res: Response): boolean => {
  const { getEffectivePlan } = require('../utils/boardUtils');
  const plan = getEffectivePlan(profile);
  if (plan === 'FREE' || plan === 'BASIC' || plan === 'EXPIRED') {
    res.status(403).json({
      success: false,
      message:
        plan === 'FREE'
          ? 'Gói cước Miễn phí không hỗ trợ xuất báo cáo PDF/Excel. Vui lòng nâng cấp gói cước.'
          : plan === 'EXPIRED'
          ? 'Gói cước của bạn đã hết hạn. Vui lòng gia hạn gói cước để sử dụng tính năng xuất file.'
          : 'Gói cước Basic không hỗ trợ xuất file PDF. Vui lòng nâng cấp gói cước.',
    });
    return false;
  }
  return true;
};

/**
 * GET /api/export/pdf/cultivation/:boardId
 */
export const exportCultivationPdf = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ trang trại' });
    }

    if (!checkPlanPermission(profile, res)) return;

    const board = await CultivationBoard.findOne({
      _id: req.params.boardId,
      farmProfile: profile._id,
    });
    if (!board) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bảng canh tác' });
    }

    const entries = await CultivationEntry.find({ cultivationBoard: board._id })
      .sort({ date: 1, createdAt: 1 });

    const html = buildCultivationHtml(board, entries, profile);
    const pdfBuffer = await generatePdfFromHtml(html, true);

    const filename = `${board.name || 'nhat_ky'}_canh_tac.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Lỗi khi xuất PDF canh tác:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi xuất PDF' });
  }
};

/**
 * GET /api/export/pdf/fertilizer/:boardId
 */
export const exportFertilizerPdf = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ trang trại' });
    }

    if (!checkPlanPermission(profile, res)) return;

    const board = await FertilizerBoard.findOne({
      _id: req.params.boardId,
      farmProfile: profile._id,
    });
    if (!board) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bảng bón phân' });
    }

    const entries = await FertilizerEntry.find({ fertilizerBoard: board._id })
      .sort({ date: 1, createdAt: 1 });

    const html = buildFertilizerHtml(board, entries, profile);
    const pdfBuffer = await generatePdfFromHtml(html, true);

    const filename = `${board.name || 'nhat_ky'}_phan_bon.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Lỗi khi xuất PDF bón phân:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi xuất PDF' });
  }
};

/**
 * GET /api/export/pdf/pesticide/:boardId
 */
export const exportPesticidePdf = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ trang trại' });
    }

    if (!checkPlanPermission(profile, res)) return;

    const board = await PesticideBoard.findOne({
      _id: req.params.boardId,
      farmProfile: profile._id,
    });
    if (!board) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bảng thuốc BVTV' });
    }

    const entries = await PesticideEntry.find({ pesticideBoard: board._id })
      .sort({ date: 1, createdAt: 1 });

    const html = buildPesticideHtml(board, entries, profile);
    const pdfBuffer = await generatePdfFromHtml(html, true);

    const filename = `${board.name || 'nhat_ky'}_thuoc_bvtv.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Lỗi khi xuất PDF thuốc BVTV:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi xuất PDF' });
  }
};

/**
 * GET /api/export/pdf/reports?month=YYYY-MM
 */
export const exportReportsPdf = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ trang trại' });
    }

    if (!checkPlanPermission(profile, res)) return;

    let startDate: Date;
    let endDate: Date;
    let monthLabel = '';

    if (req.query.month) {
      const [yearStr, monthStr] = (req.query.month as string).split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1;
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      monthLabel = `${monthStr}/${yearStr}`;
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      monthLabel = `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    }

    const [cBoards, fBoards, pBoards, materials] = await Promise.all([
      CultivationBoard.find({ farmProfile: profile._id }),
      FertilizerBoard.find({ farmProfile: profile._id }),
      PesticideBoard.find({ farmProfile: profile._id }),
      Material.find({ farmProfile: profile._id }),
    ]);

    const cBoardMap = new Map<string, any>(cBoards.map(b => [b._id.toString(), b.toObject()]));
    const fBoardMap = new Map<string, any>(fBoards.map(b => [b._id.toString(), b.toObject()]));
    const pBoardMap = new Map<string, any>(pBoards.map(b => [b._id.toString(), b.toObject()]));

    const cbIds = cBoards.map((b) => b._id);
    const fbIds = fBoards.map((b) => b._id);
    const pbIds = pBoards.map((b) => b._id);

    const [cultivationEntries, fertilizerEntries, pesticideEntries] = await Promise.all([
      cbIds.length > 0 ? CultivationEntry.find({ cultivationBoard: { $in: cbIds }, date: { $gte: startDate, $lte: endDate } }) : Promise.resolve([]),
      fbIds.length > 0 ? FertilizerEntry.find({ fertilizerBoard: { $in: fbIds }, date: { $gte: startDate, $lte: endDate }, isNotUsed: { $ne: true } }) : Promise.resolve([]),
      pbIds.length > 0 ? PesticideEntry.find({ pesticideBoard: { $in: pbIds }, date: { $gte: startDate, $lte: endDate }, isNotUsed: { $ne: true } }) : Promise.resolve([]),
    ]);

    const materialUsageMap = new Map<string, number>();

    // Cultivation Aggregation
    let totalCultCost = 0;
    let totalCultLabor = 0;
    const cultStats: Record<string, any> = {};
    for (const entry of cultivationEntries) {
      const act = entry.activityName || 'Hoạt động khác';
      const b = cBoardMap.get(entry.cultivationBoard?.toString()) || {};
      const people = entry.performer ? entry.performer.split(',').map((p: string) => p.trim()).filter(Boolean) : [];
      const labor = people.length > 0 ? people.length : 1;
      const cost = Number(entry.cost) || 0;
      totalCultCost += cost;
      totalCultLabor += labor;

      if (!cultStats[act]) {
        cultStats[act] = { activity: act, taskCount: 0, uniquePeople: new Set(), uniqueDates: new Set(), laborCount: 0, totalCost: 0, crops: new Set() };
      }
      cultStats[act].taskCount += 1;
      cultStats[act].laborCount += labor;
      cultStats[act].totalCost += cost;
      if (entry.date) {
        cultStats[act].uniqueDates.add(new Date(entry.date).toISOString().split('T')[0]);
      }
      people.forEach((p: string) => cultStats[act].uniquePeople.add(p));
      if (b.cropType) cultStats[act].crops.add(b.cropType);
    }

    const cultivationReport = Object.values(cultStats).map((s: any) => ({
      activity: s.activity,
      taskCount: s.taskCount,
      peopleCount: s.uniquePeople.size,
      daysCount: s.uniqueDates.size,
      laborCount: s.laborCount,
      totalCost: s.totalCost,
      crops: Array.from(s.crops).join(', ') || '—'
    }));

    // Fertilizer Aggregation
    let totalFertCost = 0;
    let totalFertLabor = 0;
    const fertStats: Record<string, any> = {};
    for (const entry of fertilizerEntries) {
      const name = entry.materialName || 'Phân bón khác';
      const people = entry.performer ? entry.performer.split(',').map((p: string) => p.trim()).filter(Boolean) : [];
      const labor = people.length > 0 ? people.length : 1;
      const cost = Number(entry.cost) || 0;
      const qtyNum = parseFloat(String(entry.quantity).replace(/[^\d.-]/g, '')) || 0;
      totalFertCost += cost;
      totalFertLabor += labor;

      const matKey = name.toLowerCase();
      materialUsageMap.set(matKey, (materialUsageMap.get(matKey) || 0) + qtyNum);

      if (!fertStats[name]) {
        fertStats[name] = { name, manufacturer: entry.manufacturer || '—', timesUsed: 0, totalQuantity: 0, unit: entry.unit || 'kg', totalArea: 0, totalCost: 0 };
      }
      fertStats[name].timesUsed += 1;
      fertStats[name].totalQuantity += qtyNum;
      fertStats[name].totalArea += (entry.appliedArea || 0);
      fertStats[name].totalCost += cost;
    }
    const fertilizerReport = Object.values(fertStats).map((s: any) => ({
      name: s.name,
      manufacturer: s.manufacturer,
      timesUsed: s.timesUsed,
      totalQuantity: `${Number(s.totalQuantity.toFixed(2))} ${s.unit}`,
      totalArea: s.totalArea,
      totalCost: s.totalCost
    }));

    // Pesticide Aggregation
    let totalPestCost = 0;
    let totalPestLabor = 0;
    const pestStats: Record<string, any> = {};
    for (const entry of pesticideEntries) {
      const name = entry.materialName || 'Thuốc BVTV khác';
      const people = entry.performer ? entry.performer.split(',').map((p: string) => p.trim()).filter(Boolean) : [];
      const labor = people.length > 0 ? people.length : 1;
      const cost = Number(entry.cost) || 0;
      const qtyNum = parseFloat(String(entry.quantity).replace(/[^\d.-]/g, '')) || 0;
      totalPestCost += cost;
      totalPestLabor += labor;

      const matKey = name.toLowerCase();
      materialUsageMap.set(matKey, (materialUsageMap.get(matKey) || 0) + qtyNum);

      const groupKey = `${name}_${entry.targetPest || ''}`;
      if (!pestStats[groupKey]) {
        pestStats[groupKey] = {
          name,
          activeIngredient: entry.activeIngredient || '—',
          targetPest: entry.targetPest || '—',
          phiDays: Number(entry.phiDays) || 7,
          timesUsed: 0,
          totalQuantity: 0,
          unit: entry.unit || 'lít',
          totalCost: 0
        };
      }
      pestStats[groupKey].timesUsed += 1;
      pestStats[groupKey].totalQuantity += qtyNum;
      pestStats[groupKey].totalCost += cost;
    }
    const pesticideReport = Object.values(pestStats).map((s: any) => ({
      name: s.name,
      activeIngredient: s.activeIngredient,
      targetPest: s.targetPest,
      phiDays: s.phiDays,
      timesUsed: s.timesUsed,
      totalQuantity: `${Number(s.totalQuantity.toFixed(2))} ${s.unit}`,
      totalCost: s.totalCost
    }));

    // Inventory report
    const now = new Date();
    const inventoryReport = materials.map(mat => {
      const matKey = mat.name.toLowerCase();
      const usedInMonth = Number((materialUsageMap.get(matKey) || 0).toFixed(2));
      const qty = Number(mat.quantity) || 0;
      const minAlert = Number(mat.minQuantityAlert) || 10;
      let statusText = 'Đủ tồn kho';
      if (mat.expiryDate && new Date(mat.expiryDate) < now) statusText = 'Đã hết hạn';
      else if (qty <= 0) statusText = 'Hết hàng';
      else if (qty <= minAlert) statusText = 'Sắp hết hàng';

      return {
        name: mat.name,
        typeLabel: mat.type === 'FERTILIZER' ? 'Phân bón' : 'Thuốc BVTV',
        quantity: qty,
        unit: mat.unit || 'kg',
        usedInMonth: `${usedInMonth} ${mat.unit || 'kg'}`,
        expiryDate: mat.expiryDate ? new Date(mat.expiryDate).toISOString().split('T')[0] : '—',
        statusText
      };
    });

    const summary = {
      totalTasks: cultivationEntries.length + fertilizerEntries.length + pesticideEntries.length,
      totalLabor: totalCultLabor + totalFertLabor + totalPestLabor,
      totalCost: totalCultCost + totalFertCost + totalPestCost,
      materialsTotal: materials.length
    };

    const stats = { summary, cultivationReport, fertilizerReport, pesticideReport, inventoryReport };
    const html = buildReportsHtml(stats, monthLabel, profile);
    const pdfBuffer = await generatePdfFromHtml(html, false); // Portrait orientation for reports

    const filename = `Bao_cao_nong_trai_${monthLabel.replace('/', '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Lỗi khi xuất PDF báo cáo tháng:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi xuất PDF' });
  }
};
