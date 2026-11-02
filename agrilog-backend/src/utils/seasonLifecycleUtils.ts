import { CultivationBoard, ICultivationBoard, ISeasonSummaryReport } from '../models/CultivationBoard';
import { FertilizerBoard } from '../models/FertilizerBoard';
import { PesticideBoard } from '../models/PesticideBoard';
import { CultivationEntry } from '../models/CultivationEntry';
import { FertilizerEntry } from '../models/FertilizerEntry';
import { PesticideEntry } from '../models/PesticideEntry';

export interface GenerateReportOptions {
  harvestYield?: number;
  harvestDate?: Date | string;
  seedCost?: number;
}

/**
 * Tự động tính toán và sinh Báo cáo tổng kết mùa vụ
 * Tổng tiền giống, tổng phân bón, thuốc BVTV đã dùng, tổng sản lượng đạt được, tuân thủ PHI và hiệu quả kinh tế
 */
export async function calculateSeasonSummaryReport(
  boardId: string,
  options?: GenerateReportOptions
): Promise<ISeasonSummaryReport> {
  const cBoard = await CultivationBoard.findById(boardId);
  if (!cBoard) {
    throw new Error('Không tìm thấy bảng canh tác');
  }

  // 1. Tìm bảng phân bón và thuốc BVTV đồng bộ
  let fBoard: any = null;
  let pBoard: any = null;

  if (cBoard.groupId) {
    [fBoard, pBoard] = await Promise.all([
      FertilizerBoard.findOne({ groupId: cBoard.groupId, farmProfile: cBoard.farmProfile }),
      PesticideBoard.findOne({ groupId: cBoard.groupId, farmProfile: cBoard.farmProfile }),
    ]);
  }

  // 2. Lấy toàn bộ entries
  const [cEntries, fEntries, pEntries] = await Promise.all([
    CultivationEntry.find({ cultivationBoard: cBoard._id }).sort({ date: 1 }),
    fBoard ? FertilizerEntry.find({ fertilizerBoard: fBoard._id, isNotUsed: { $ne: true } }).sort({ date: 1 }) : Promise.resolve([]),
    pBoard ? PesticideEntry.find({ pesticideBoard: pBoard._id, isNotUsed: { $ne: true } }).sort({ date: 1 }) : Promise.resolve([]),
  ]);

  // 3. Tính tiền giống
  let totalSeedCost = Number(options?.seedCost !== undefined ? options.seedCost : (cBoard.seedCost || 0));
  if (totalSeedCost === 0) {
    // Trích xuất từ các mục gieo giống trong CultivationEntry nếu có
    for (const e of cEntries) {
      const act = (e.activityName || '').toLowerCase();
      const stg = (e.stage || '').toLowerCase();
      if (act.includes('giống') || act.includes('gieo') || act.includes('xuống giống') || stg.includes('giống')) {
        totalSeedCost += Number(e.cost) || 0;
      }
    }
  }

  // 4. Tính chi phí phân bón & thống kê vật tư
  let totalFertilizerCost = 0;
  let totalFertilizerQty = 0;
  const fertMap = new Map<string, { name: string; quantity: number; unit: string; cost: number }>();

  for (const f of fEntries) {
    const cost = Number(f.cost) || 0;
    totalFertilizerCost += cost;
    const name = f.materialName || 'Phân bón khác';
    const parsedQty = parseFloat(String(f.quantity || '0').replace(/[^0-9.]/g, '')) || 0;
    const unit = f.unit || 'kg';
    totalFertilizerQty += parsedQty;

    const existing = fertMap.get(name) || { name, quantity: 0, unit, cost: 0 };
    existing.quantity += parsedQty;
    existing.cost += cost;
    fertMap.set(name, existing);
  }

  const fertilizerSummary = Array.from(fertMap.values()).map(v => ({
    name: v.name,
    quantity: `${v.quantity.toLocaleString('vi-VN')} ${v.unit}`,
    cost: v.cost,
  }));

  // 5. Tính chi phí thuốc BVTV & an toàn PHI
  let totalPesticideCost = 0;
  const pestMap = new Map<string, { name: string; count: number; phiDays: number; cost: number; lastSprayDate: Date }>();
  let hasCriticalPhiViolation = false;
  let hasWarningPhi = false;
  const phiViolationNotes: string[] = [];

  const effectiveHarvestDate = options?.harvestDate 
    ? new Date(options.harvestDate) 
    : (cBoard.harvestDate ? new Date(cBoard.harvestDate) : new Date());

  for (const p of pEntries) {
    const cost = Number(p.cost) || 0;
    totalPesticideCost += cost;
    const name = p.materialName || 'Thuốc BVTV khác';
    const phiDays = Number(p.phiDays) || 7;
    const sprayDate = new Date(p.date);

    const existing = pestMap.get(name) || { name, count: 0, phiDays, cost: 0, lastSprayDate: sprayDate };
    existing.count += 1;
    existing.cost += cost;
    if (sprayDate > existing.lastSprayDate) existing.lastSprayDate = sprayDate;
    pestMap.set(name, existing);

    // Kiểm tra tuân thủ cách ly PHI
    const safeHarvestDate = new Date(sprayDate.getTime() + phiDays * 24 * 60 * 60 * 1000);
    if (effectiveHarvestDate < safeHarvestDate) {
      hasCriticalPhiViolation = true;
      const daysDiff = Math.ceil((safeHarvestDate.getTime() - effectiveHarvestDate.getTime()) / (1000 * 60 * 60 * 24));
      phiViolationNotes.push(
        `Phun thuốc "${name}" ngày ${sprayDate.toLocaleDateString('vi-VN')} (cách ly ${phiDays} ngày). Đã thu hoạch trước ngày an toàn ${safeHarvestDate.toLocaleDateString('vi-VN')} (${daysDiff} ngày).`
      );
    }
  }

  const pesticideSummary = Array.from(pestMap.values()).map(p => ({
    name: p.name,
    quantity: `${p.count} lần phun`,
    phiDays: p.phiDays,
    cost: p.cost,
  }));

  // 6. Tính chi phí nhân công / canh tác
  let totalLaborCost = 0;
  let totalLaborDays = 0;
  for (const c of cEntries) {
    const cost = Number(c.cost) || 0;
    totalLaborCost += cost;
    if (c.performer) {
      const pList = c.performer.split(',').map((p: string) => p.trim()).filter(Boolean);
      totalLaborDays += pList.length > 0 ? pList.length : 1;
    }
  }

  // 7. Sản lượng thu hoạch & Hiệu quả kinh tế
  const actualYield = Number(options?.harvestYield !== undefined ? options.harvestYield : (cBoard.harvestYield || 0));
  const expectedYield = Number(cBoard.expectedYield || 0);
  const yieldAchievementRate = expectedYield > 0 
    ? Math.round((actualYield / expectedYield) * 100) 
    : 100;

  const totalCost = totalSeedCost + totalFertilizerCost + totalPesticideCost + totalLaborCost;
  const costPerKg = actualYield > 0 ? Math.round(totalCost / actualYield) : 0;

  let phiComplianceStatus: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';
  let phiNotes = 'Tuân thủ 100% thời gian cách ly PHI theo chuẩn an toàn VietGAP.';

  if (hasCriticalPhiViolation) {
    phiComplianceStatus = 'CRITICAL';
    phiNotes = `CẢNH BÁO VI PHẠM PHI: ${phiViolationNotes.join(' ')}`;
  }

  return {
    generatedAt: new Date(),
    totalSeedCost,
    totalFertilizerCost,
    totalFertilizerQty,
    fertilizerSummary,
    totalPesticideCost,
    totalPesticideApplications: pEntries.length,
    pesticideSummary,
    totalLaborCost,
    totalLaborDays,
    actualYield,
    expectedYield,
    yieldAchievementRate,
    totalCost,
    costPerKg,
    phiComplianceStatus,
    phiNotes,
  };
}
