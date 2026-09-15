import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { FarmProfile } from '../models/FarmProfile';
import { CultivationBoard } from '../models/CultivationBoard';
import { CultivationEntry } from '../models/CultivationEntry';
import { FertilizerBoard } from '../models/FertilizerBoard';
import { FertilizerEntry } from '../models/FertilizerEntry';
import { PesticideBoard } from '../models/PesticideBoard';
import { PesticideEntry } from '../models/PesticideEntry';
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
  const plan = (profile.plan || 'BASIC').toUpperCase();
  if (plan === 'BASIC') {
    res.status(403).json({
      success: false,
      message: 'Gói cước Basic không hỗ trợ xuất file PDF. Vui lòng nâng cấp gói cước.',
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

    const cultivationBoards = await CultivationBoard.find({ farmProfile: profile._id }).select('_id');
    const fertilizerBoards = await FertilizerBoard.find({ farmProfile: profile._id }).select('_id');
    const pesticideBoards = await PesticideBoard.find({ farmProfile: profile._id }).select('_id');

    const cbIds = cultivationBoards.map((b) => b._id);
    const fbIds = fertilizerBoards.map((b) => b._id);
    const pbIds = pesticideBoards.map((b) => b._id);

    const cultivationEntries = await CultivationEntry.find({
      cultivationBoard: { $in: cbIds },
      date: { $gte: startDate, $lte: endDate },
    });

    const fertilizerEntries = await FertilizerEntry.find({
      fertilizerBoard: { $in: fbIds },
      date: { $gte: startDate, $lte: endDate },
      isNotUsed: { $ne: true },
    });

    const pesticideEntries = await PesticideEntry.find({
      pesticideBoard: { $in: pbIds },
      date: { $gte: startDate, $lte: endDate },
      isNotUsed: { $ne: true },
    });

    // Cultivation Aggregation
    const cultStats: Record<string, any> = {};
    for (const entry of cultivationEntries) {
      const act = entry.activityName || 'Hoạt động khác';
      if (!cultStats[act]) {
        cultStats[act] = { activity: act, taskCount: 0, uniquePeople: new Set(), uniqueDates: new Set(), laborCount: 0 };
      }
      cultStats[act].taskCount += 1;
      if (entry.date) {
        cultStats[act].uniqueDates.add(new Date(entry.date).toISOString().split('T')[0]);
      }
      const people = entry.performer ? entry.performer.split(',').map((p) => p.trim()).filter(Boolean) : [];
      people.forEach((p) => cultStats[act].uniquePeople.add(p));
      cultStats[act].laborCount += people.length || 1;
    }

    const cultivationReport = Object.values(cultStats).map((s: any) => ({
      activity: s.activity,
      taskCount: s.taskCount,
      peopleCount: s.uniquePeople.size,
      daysCount: s.uniqueDates.size,
      laborCount: s.laborCount,
    }));

    // Fertilizer Aggregation
    const fertStats: Record<string, any> = {};
    for (const entry of fertilizerEntries) {
      const name = entry.materialName || 'Phân bón khác';
      if (!fertStats[name]) {
        fertStats[name] = { materialName: name, timesUsed: 0, totalQuantity: 0, totalArea: 0 };
      }
      fertStats[name].timesUsed += 1;
      fertStats[name].totalQuantity += parseFloat(entry.quantity as string) || 1;
      fertStats[name].totalArea += (entry.appliedArea || 0);
    }
    const fertilizerReport = Object.values(fertStats);

    // Pesticide Aggregation
    const pestStats: Record<string, any> = {};
    for (const entry of pesticideEntries) {
      const name = entry.materialName || 'Thuốc BVTV khác';
      if (!pestStats[name]) {
        pestStats[name] = { materialName: name, targetPest: entry.targetPest || '—', timesUsed: 0, totalQuantity: 0 };
      }
      pestStats[name].timesUsed += 1;
      pestStats[name].totalQuantity += parseFloat(entry.quantity as string) || 1;
    }
    const pesticideReport = Object.values(pestStats);

    const stats = { cultivationReport, fertilizerReport, pesticideReport };
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
