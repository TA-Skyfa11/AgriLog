import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Cooperative, ICooperative } from '../models/Cooperative';
import { FarmProfile, IFarmProfile } from '../models/FarmProfile';
import { CultivationBoard } from '../models/CultivationBoard';
import { CultivationEntry } from '../models/CultivationEntry';
import { FertilizerBoard } from '../models/FertilizerBoard';
import { FertilizerEntry } from '../models/FertilizerEntry';
import { PesticideBoard } from '../models/PesticideBoard';
import { PesticideEntry } from '../models/PesticideEntry';
import { Notification } from '../models/Notification';
import { User, Role } from '../models/User';
import { calculateSeasonSummaryReport } from '../utils/seasonLifecycleUtils';
import { generatePdfFromHtml } from '../utils/pdfGenerator';

/**
 * Helper to get or create a cooperative for the current logged-in COOPERATIVE user
 */
export async function getOrCreateUserCooperative(
  userId: any,
  initialData: Partial<any> = {}
): Promise<ICooperative> {
  let coop = await Cooperative.findOne({ manager: userId });
  if (!coop) {
    const defaultCode = 'HTX-' + Math.floor(1000 + Math.random() * 9000);
    coop = await Cooperative.create({
      name: initialData.name || 'Hợp tác xã Nông nghiệp',
      code: initialData.code || defaultCode,
      manager: userId,
      address: initialData.address || '',
      contactPhone: initialData.contactPhone || '',
      email: initialData.email || '',
      establishedYear: initialData.establishedYear || new Date().getFullYear(),
      certificationStandards: initialData.certificationStandards || ['VietGAP'],
      description: initialData.description || 'Hợp tác xã chuyên canh tác nông sản sạch đạt tiêu chuẩn an toàn sinh học và liên kết bao tiêu xuất khẩu.',
      members: [],
      ...initialData,
    });
  }
  return coop;
}

/**
 * Lấy thông tin hồ sơ Hợp tác xã của cán bộ quản lý đang đăng nhập
 */
export const getCooperativeProfile = async (req: AuthRequest, res: Response) => {
  try {
    const coop = await getOrCreateUserCooperative(req.user?._id);
    res.json({
      success: true,
      data: coop,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Cập nhật thông tin hồ sơ Hợp tác xã
 */
export const updateCooperativeProfile = async (req: AuthRequest, res: Response) => {
  try {
    const coop = await getOrCreateUserCooperative(req.user?._id);
    const {
      name,
      code,
      address,
      contactPhone,
      email,
      establishedYear,
      certificationStandards,
      description,
    } = req.body;

    if (name) coop.name = name.trim();
    if (code) {
      const cleanCode = code.trim().toUpperCase();
      const existing = await Cooperative.findOne({ code: cleanCode });
      if (existing && existing._id.toString() !== coop._id.toString()) {
        return res.status(400).json({ success: false, message: 'Mã Hợp tác xã này đã được sử dụng bởi HTX khác' });
      }
      coop.code = cleanCode;
    }
    if (address !== undefined) coop.address = address.trim();
    if (contactPhone !== undefined) coop.contactPhone = contactPhone.trim();
    if (email !== undefined) coop.email = email.trim();
    if (establishedYear !== undefined) coop.establishedYear = Number(establishedYear) || undefined;
    if (certificationStandards !== undefined) coop.certificationStandards = certificationStandards;
    if (description !== undefined) coop.description = description.trim();

    await coop.save();

    res.json({
      success: true,
      message: 'Cập nhật thông tin Hợp tác xã thành công!',
      data: coop.toObject ? coop.toObject() : coop,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * 1. Bảng điều khiển HTX (Cooperative Dashboard)
 * Thống kê:
 * - Tổng số hộ thành viên
 * - Tổng diện tích canh tác toàn HTX (m² và hecta)
 * - Tổng sản lượng dự kiến toàn HTX trong vụ mùa
 * - Thống kê cơ cấu cây trồng, tiến độ các mùa vụ
 * - Tóm tắt cảnh báo an toàn PHI
 */
export const getCooperativeDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const coop = await getOrCreateUserCooperative(req.user?._id);

    // Lấy tất cả hộ thành viên thuộc HTX
    let members = await FarmProfile.find({ cooperative: coop._id });
    
    // Nếu chưa có thành viên nào gán trực tiếp, thử lấy qua mảng coop.members
    if (members.length === 0 && coop.members && coop.members.length > 0) {
      members = await FarmProfile.find({ _id: { $in: coop.members } });
    }

    const memberIds = members.map(m => m._id);

    // Tính tổng diện tích
    const totalAreaSqm = members.reduce((sum, m) => sum + (Number(m.areaSqm) || 0), 0);
    const totalAreaHectare = (totalAreaSqm / 10000).toFixed(2);

    // Lấy toàn bộ các bảng canh tác của các xã viên
    const boards = memberIds.length > 0 
      ? await CultivationBoard.find({ farmProfile: { $in: memberIds } }).sort({ createdAt: -1 })
      : [];

    // Tính tổng sản lượng dự kiến và sản lượng thực tế
    let totalExpectedYield = 0;
    let totalActualYield = 0;
    const cropDistributionMap: Record<string, { count: number; areaSqm: number }> = {};
    const statusCounts = {
      PLANNING: 0,
      IN_PROGRESS: 0,
      HARVESTING: 0,
      COMPLETED: 0,
    };

    boards.forEach(b => {
      totalExpectedYield += Number(b.expectedYield) || 0;
      totalActualYield += Number(b.harvestYield) || 0;

      // Phân bổ cây trồng
      const crop = b.cropType || 'Khác';
      if (!cropDistributionMap[crop]) {
        cropDistributionMap[crop] = { count: 0, areaSqm: 0 };
      }
      cropDistributionMap[crop].count += 1;
      cropDistributionMap[crop].areaSqm += Number(b.areaSqm) || 0;

      // Đếm trạng thái
      const st = b.status === 'ACTIVE' ? 'IN_PROGRESS' : b.status === 'HARVESTED' ? 'COMPLETED' : b.status;
      if (statusCounts[st as keyof typeof statusCounts] !== undefined) {
        statusCounts[st as keyof typeof statusCounts] += 1;
      }
    });

    const cropDistribution = Object.entries(cropDistributionMap).map(([crop, data]) => ({
      crop,
      count: data.count,
      areaSqm: data.areaSqm,
      percentage: totalAreaSqm > 0 ? Math.round((data.areaSqm / totalAreaSqm) * 100) : 0,
    }));

    // Quét cảnh báo cách ly PHI khẩn cấp
    const pBoards = memberIds.length > 0 
      ? await PesticideBoard.find({ farmProfile: { $in: memberIds } })
      : [];
    const pBoardIds = pBoards.map(p => p._id);

    const now = new Date();
    const pEntries = pBoardIds.length > 0
      ? await PesticideEntry.find({ pesticideBoard: { $in: pBoardIds }, isNotUsed: { $ne: true } })
      : [];

    let activePhiWarningsCount = 0;
    let criticalPhiCount = 0;

    for (const p of pEntries) {
      const sprayDate = new Date(p.date);
      const phiDays = Number(p.phiDays) || 7;
      const safeHarvestDate = new Date(sprayDate.getTime() + phiDays * 24 * 60 * 60 * 1000);
      if (safeHarvestDate > now) {
        activePhiWarningsCount += 1;
        // Kiểm tra xem luống có đang trong giai đoạn thu hoạch không
        const pBoard = pBoards.find(b => b._id.toString() === p.pesticideBoard?.toString());
        if (pBoard && (pBoard.status === 'HARVESTING' || (pBoard as any).status === 'ACTIVE')) {
          criticalPhiCount += 1;
        }
      }
    }

    res.json({
      success: true,
      data: {
        cooperative: coop,
        kpis: {
          totalMembers: members.length,
          totalAreaSqm,
          totalAreaHectare,
          totalExpectedYield,
          totalActualYield,
          totalBoardsCount: boards.length,
          activePhiWarningsCount,
          criticalPhiCount,
        },
        statusCounts,
        cropDistribution,
        recentBoards: boards.slice(0, 5),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * 2. Giám sát tuân thủ an toàn (Safety Compliance Monitoring)
 * Xem danh sách cảnh báo thời gian cách ly PHI (Pre-Harvest Interval)
 * Ví dụ: "Hộ anh Ba vừa phun thuốc trừ sâu ngày hôm qua, chưa đủ thời gian cách ly PHI nên cảnh báo không được thu hoạch sớm"
 */
export const getComplianceAlerts = async (req: AuthRequest, res: Response) => {
  try {
    const coop = await getOrCreateUserCooperative(req.user?._id);
    const members = await FarmProfile.find({ cooperative: coop._id });
    const memberMap = new Map<string, IFarmProfile>(members.map(m => [m._id.toString(), m]));
    const memberIds = members.map(m => m._id);

    if (memberIds.length === 0) {
      return res.json({ success: true, data: [], stats: { total: 0, critical: 0, warning: 0, safe: 0 } });
    }

    const [cBoards, pBoards] = await Promise.all([
      CultivationBoard.find({ farmProfile: { $in: memberIds } }),
      PesticideBoard.find({ farmProfile: { $in: memberIds } }),
    ]);

    const cBoardMap = new Map<string, any>(cBoards.map(b => [b._id.toString(), b]));
    const pBoardGroupMap = new Map<string, any>();
    pBoards.forEach(pb => {
      if (pb.groupId) pBoardGroupMap.set(pb.groupId, pb);
      pBoardGroupMap.set(pb._id.toString(), pb);
    });

    const pbIds = pBoards.map(b => b._id);
    const pEntries = await PesticideEntry.find({ 
      pesticideBoard: { $in: pbIds }, 
      isNotUsed: { $ne: true } 
    }).sort({ date: -1 });

    const now = new Date();
    const alerts: any[] = [];
    let stats = { total: 0, critical: 0, warning: 0, safe: 0 };

    for (const entry of pEntries) {
      const pBoard = pBoards.find(b => b._id.toString() === entry.pesticideBoard?.toString());
      if (!pBoard) continue;

      const profile = memberMap.get(pBoard.farmProfile?.toString());
      const farmName = profile?.farmName || 'Nông hộ';
      const ownerName = profile?.ownerName || (profile as any)?.contactName || 'Chủ hộ';
      const contactPhone = profile?.contactPhone || '—';

      // Tìm cBoard tương ứng
      const cBoard = cBoards.find(cb => cb.groupId === pBoard.groupId || cb.farmProfile?.toString() === pBoard.farmProfile?.toString());

      const sprayDate = new Date(entry.date);
      const phiDays = Number(entry.phiDays) || 7;
      const safeHarvestDate = new Date(sprayDate.getTime() + phiDays * 24 * 60 * 60 * 1000);
      
      const isStillInIsolation = safeHarvestDate > now;
      const remainingDays = isStillInIsolation 
        ? Math.ceil((safeHarvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const expectedHarvestDate = cBoard?.expectedHarvestDate ? new Date(cBoard.expectedHarvestDate) : null;
      const actualHarvestDate = cBoard?.harvestDate ? new Date(cBoard.harvestDate) : null;

      // Phân loại mức độ vi phạm an toàn
      let severity: 'CRITICAL' | 'WARNING' | 'SAFE' = 'SAFE';
      let title = '';
      let message = '';

      if (actualHarvestDate && actualHarvestDate < safeHarvestDate) {
        // ĐÃ THU HOẠCH TRƯỚC NGÀY AN TOÀN
        severity = 'CRITICAL';
        stats.critical += 1;
        title = '🚨 VI PHẠM THU HOẠCH SỚM KHI CHƯA HẾT CÁCH LY PHI';
        message = `${ownerName} (${farmName}) đã thu hoạch ngày ${actualHarvestDate.toLocaleDateString('vi-VN')}, trong khi thuốc trừ sâu "${entry.materialName || 'BVTV'}" phun ngày ${sprayDate.toLocaleDateString('vi-VN')} cần cách ly ${phiDays} ngày (đến ngày ${safeHarvestDate.toLocaleDateString('vi-VN')})!`;
      } else if (cBoard?.status === 'HARVESTING' && isStillInIsolation) {
        // ĐANG TRONG GIAI ĐOẠN THU HOẠCH MÀ CHƯA HẾT CÁCH LY
        severity = 'CRITICAL';
        stats.critical += 1;
        title = '⚠️ CẢNH BÁO NGUY HIỂM: ĐANG THU HOẠCH TRONG THỜI GIAN CÁCH LY';
        message = `${ownerName} (${farmName}) đang thu hoạch luống "${cBoard.name}" nhưng vừa phun thuốc "${entry.materialName || 'BVTV'}" ngày ${sprayDate.toLocaleDateString('vi-VN')}, chưa đủ thời gian cách ly PHI (${phiDays} ngày). CẢNH BÁO: PHẢI DỪNG THU HOẠCH NGAY!`;
      } else if (isStillInIsolation) {
        // ĐANG TRONG THỜI GIAN CÁCH LY PHI
        severity = 'WARNING';
        stats.warning += 1;
        title = '⏱️ ĐANG TRONG THỜI GIAN CÁCH LY THUỐC BVTV';
        message = `${ownerName} (${farmName}) vừa phun thuốc trừ sâu "${entry.materialName || 'BVTV'}" ngày ${sprayDate.toLocaleDateString('vi-VN')}, chưa đủ thời gian cách ly PHI (${phiDays} ngày, còn ${remainingDays} ngày nữa đến ${safeHarvestDate.toLocaleDateString('vi-VN')}) nên cảnh báo không được thu hoạch sớm.`;
      } else {
        severity = 'SAFE';
        stats.safe += 1;
        title = '✅ ĐẠT CHUẨN AN TOÀN PHI';
        message = `${ownerName} (${farmName}) đã hoàn thành cách ly ${phiDays} ngày đối với thuốc "${entry.materialName || 'BVTV'}" (hết cách ly ngày ${safeHarvestDate.toLocaleDateString('vi-VN')}). Đủ điều kiện thu hoạch đạt chuẩn VietGAP.`;
      }

      stats.total += 1;

      alerts.push({
        id: entry._id,
        farmProfileId: profile?._id,
        farmName,
        ownerName,
        contactPhone,
        boardId: cBoard?._id,
        boardName: cBoard?.name || pBoard.name,
        cropType: cBoard?.cropType || pBoard.cropType,
        boardStatus: cBoard?.status || 'IN_PROGRESS',
        pesticideName: entry.materialName || 'Thuốc bảo vệ thực vật',
        manufacturer: entry.manufacturer || '',
        activeIngredient: entry.activeIngredient || '',
        targetPest: entry.targetPest || '',
        quantity: entry.quantity ? `${entry.quantity} ${entry.unit || ''}` : '—',
        sprayDate,
        phiDays,
        safeHarvestDate,
        remainingDays,
        severity,
        title,
        message,
        performer: entry.performer || ownerName,
      });
    }

    // Lọc theo query param nếu có: ?status=critical | warning | safe
    let filteredAlerts = alerts;
    if (req.query.status) {
      filteredAlerts = alerts.filter(a => a.severity.toLowerCase() === (req.query.status as string).toLowerCase());
    }

    res.json({
      success: true,
      stats,
      data: filteredAlerts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Gửi thông báo cảnh báo tuân thủ đến Hộ thành viên
 */
export const sendComplianceWarning = async (req: AuthRequest, res: Response) => {
  try {
    const { farmProfileId, alertMessage, title } = req.body;
    if (!farmProfileId || !alertMessage) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin gửi cảnh báo' });
    }

    const farmProfile = await FarmProfile.findById(farmProfileId);
    if (!farmProfile || !farmProfile.user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản nông hộ' });
    }

    const notification = await Notification.create({
      user: farmProfile.user,
      title: title || '⚠️ CẢNH BÁO AN TOÀN PHI TỪ BAN QUẢN LÝ HTX',
      message: alertMessage,
      type: 'SYSTEM',
      isRead: false,
    });

    res.json({
      success: true,
      message: 'Đã gửi thông báo cảnh báo trực tiếp đến nông hộ thành công!',
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * 3. Xuất hồ sơ mùa vụ (Batch Export Season Dossier)
 * Bấm 1 nút xuất trọn bộ hồ sơ nhật ký của tất cả các xã viên
 * nộp cho cơ quan chứng nhận tiêu chuẩn hoặc đối tác thu mua bao tiêu sản phẩm
 */
export const exportSeasonDossier = async (req: AuthRequest, res: Response) => {
  try {
    const coop = await getOrCreateUserCooperative(req.user?._id);
    const members = await FarmProfile.find({ cooperative: coop._id });
    const memberIds = members.map(m => m._id);

    if (memberIds.length === 0) {
      return res.status(400).json({ success: false, message: 'HTX chưa có hộ xã viên nào để xuất hồ sơ.' });
    }

    // Thu thập toàn bộ dữ liệu của tất cả xã viên
    const [cBoards, fBoards, pBoards] = await Promise.all([
      CultivationBoard.find({ farmProfile: { $in: memberIds } }),
      FertilizerBoard.find({ farmProfile: { $in: memberIds } }),
      PesticideBoard.find({ farmProfile: { $in: memberIds } }),
    ]);

    const cbIds = cBoards.map(b => b._id);
    const fbIds = fBoards.map(b => b._id);
    const pbIds = pBoards.map(b => b._id);

    const [cEntries, fEntries, pEntries] = await Promise.all([
      cbIds.length > 0 ? CultivationEntry.find({ cultivationBoard: { $in: cbIds } }).sort({ date: 1 }) : Promise.resolve([]),
      fbIds.length > 0 ? FertilizerEntry.find({ fertilizerBoard: { $in: fbIds } }).sort({ date: 1 }) : Promise.resolve([]),
      pbIds.length > 0 ? PesticideEntry.find({ pesticideBoard: { $in: pbIds } }).sort({ date: 1 }) : Promise.resolve([]),
    ]);

    // Xây dựng cấu trúc hồ sơ mùa vụ hoàn chỉnh theo từng xã viên
    const membersDossier = members.map(member => {
      const memberCBoards = cBoards.filter(b => b.farmProfile?.toString() === member._id.toString());
      const boardsData = memberCBoards.map(cb => {
        const cultEntries = cEntries.filter(e => e.cultivationBoard?.toString() === cb._id.toString());
        
        // Counterpart boards
        const fb = fBoards.find(f => f.groupId === cb.groupId);
        const pb = pBoards.find(p => p.groupId === cb.groupId);

        const fertEntries = fb ? fEntries.filter(e => e.fertilizerBoard?.toString() === fb._id.toString()) : [];
        const pestEntries = pb ? pEntries.filter(e => e.pesticideBoard?.toString() === pb._id.toString()) : [];

        return {
          board: cb,
          cultivationEntries: cultEntries,
          fertilizerEntries: fertEntries,
          pesticideEntries: pestEntries,
        };
      });

      return {
        member,
        boards: boardsData,
      };
    });

    const totalArea = members.reduce((sum, m) => sum + (Number(m.areaSqm) || 0), 0);
    const totalExpectedYield = cBoards.reduce((sum, b) => sum + (Number(b.expectedYield) || 0), 0);
    const totalActualYield = cBoards.reduce((sum, b) => sum + (Number(b.harvestYield) || 0), 0);

    const dossierData = {
      cooperative: coop,
      exportedAt: new Date(),
      totalMembers: members.length,
      totalAreaSqm: totalArea,
      totalExpectedYield,
      totalActualYield,
      membersDossier,
    };

    // Nếu client yêu cầu JSON để xem trước hoặc tự render
    if (req.query.format === 'json') {
      return res.json({ success: true, data: dossierData });
    }

    // Xây dựng trang HTML tài liệu hồ sơ chuẩn in ấn A4 (Dossier Document)
    const dossierHtml = buildSeasonDossierHtml(dossierData);

    // Xuất HTML trực tiếp để in ấn hoặc nộp hồ sơ
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(dossierHtml);
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Quản lý danh sách thành viên HTX
 */
export const getCooperativeMembers = async (req: AuthRequest, res: Response) => {
  try {
    const coop = await getOrCreateUserCooperative(req.user?._id);
    const members = await FarmProfile.find({ cooperative: coop._id }).populate('user', 'name phone email');

    // Kèm thông tin số luống và diện tích
    const memberIds = members.map(m => m._id);
    const boards = memberIds.length > 0 
      ? await CultivationBoard.find({ farmProfile: { $in: memberIds } })
      : [];

    const memberDetails = members.map(m => {
      const mBoards = boards.filter(b => b.farmProfile?.toString() === m._id.toString());
      return {
        ...m.toObject(),
        boardsCount: mBoards.length,
        activeBoards: mBoards.filter(b => b.status === 'IN_PROGRESS' || b.status === 'ACTIVE').length,
        totalHarvestYield: mBoards.reduce((sum, b) => sum + (Number(b.harvestYield) || 0), 0),
      };
    });

    res.json({
      success: true,
      data: memberDetails,
      cooperative: coop,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Thêm hộ xã viên vào HTX
 */
/**
 * Xóa / Gỡ bỏ hộ xã viên khỏi HTX
 */
export const removeCooperativeMember = async (req: AuthRequest, res: Response) => {
  try {
    const coop = await getOrCreateUserCooperative(req.user?._id);
    const { farmProfileId } = req.params;

    const profile = await FarmProfile.findById(farmProfileId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ hộ nông dân.' });
    }

    if (!profile.cooperative || profile.cooperative.toString() !== coop._id.toString()) {
      return res.status(400).json({ success: false, message: 'Hộ nông dân này không thuộc danh sách xã viên của Hợp tác xã bạn.' });
    }

    // Gỡ liên kết khỏi FarmProfile
    profile.cooperative = undefined;
    await profile.save();

    // Gỡ khỏi mảng members của HTX
    coop.members = (coop.members || []).filter(mId => mId.toString() !== farmProfileId);
    await coop.save();

    // Gửi thông báo đến tài khoản nông dân
    if (profile.user) {
      try {
        await Notification.create({
          user: profile.user,
          title: 'Thông báo từ Ban quản trị Hợp tác xã',
          message: `Nông trại "${profile.farmName || 'của bạn'}" đã được đưa ra khỏi Hợp tác xã "${coop.name}". Toàn bộ dữ liệu mùa vụ và nhật ký canh tác của bạn vẫn được bảo toàn nguyên vẹn trên tài khoản độc lập.`,
          type: 'SYSTEM',
        });
      } catch (err) {
        console.warn('Lỗi tạo notification xóa xã viên:', err);
      }
    }

    return res.json({
      success: true,
      message: `Đã xóa hộ "${profile.farmName || profile.ownerName}" khỏi Hợp tác xã thành công!`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Tìm kiếm nông dân đã đăng ký tài khoản trên hệ thống để cán bộ HTX mời / thêm vào HTX
 */
export const searchFarmers = async (req: AuthRequest, res: Response) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const coop = await getOrCreateUserCooperative(req.user?._id);
    const regex = new RegExp(q, 'i');

    // 1. Tìm user role FARM theo tên, sđt, email
    const users = await User.find({
      role: Role.FARM,
      $or: [{ phone: regex }, { name: regex }, { email: regex }],
    }).limit(25);

    const userIds = users.map(u => u._id);

    // 2. Tìm profiles theo userIds hoặc trực tiếp theo farmName, ownerName, contactPhone
    const profiles = await FarmProfile.find({
      $or: [
        { user: { $in: userIds } },
        { farmName: regex },
        { ownerName: regex },
        { contactPhone: regex },
      ],
    }).populate('user', 'name phone email').limit(25);

    const results = profiles.map(p => {
      const u = p.user as any;
      const isCurrentMember = p.cooperative && p.cooperative.toString() === coop._id.toString();
      const hasOtherCooperative = Boolean(p.cooperative && p.cooperative.toString() !== coop._id.toString());

      return {
        _id: p._id,
        userId: u?._id,
        farmName: p.farmName,
        ownerName: p.ownerName || u?.name || 'Chủ hộ',
        phone: p.contactPhone || u?.phone || '',
        email: u?.email || '',
        areaSqm: p.areaSqm || 0,
        mainCropType: p.mainCropType || 'Rau màu',
        address: p.address || '',
        isCurrentMember,
        hasOtherCooperative,
      };
    });

    return res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const addCooperativeMember = async (req: AuthRequest, res: Response) => {
  try {
    const coop = await getOrCreateUserCooperative(req.user?._id);
    const { farmProfileId, phone, farmName, ownerName, areaSqm, mainCropType, address } = req.body;

    let targetProfile: any = null;
    if (farmProfileId) {
      targetProfile = await FarmProfile.findById(farmProfileId);
    } else if (phone) {
      targetProfile = await FarmProfile.findOne({ contactPhone: phone });
    }

    if (targetProfile) {
      if (targetProfile.cooperative && targetProfile.cooperative.toString() !== coop._id.toString()) {
        const oldCoop = await Cooperative.findById(targetProfile.cooperative);
        if (oldCoop) {
          oldCoop.members = (oldCoop.members || []).filter((m: any) => m.toString() !== targetProfile._id.toString());
          await oldCoop.save();
        }
      }
      targetProfile.cooperative = coop._id;
      if (ownerName && !targetProfile.ownerName) targetProfile.ownerName = ownerName;
      if (areaSqm && (!targetProfile.areaSqm || targetProfile.areaSqm === 0)) targetProfile.areaSqm = Number(areaSqm);
      if (mainCropType && !targetProfile.mainCropType) targetProfile.mainCropType = mainCropType;
      await targetProfile.save();

      if (targetProfile.user) {
        try {
          await Notification.create({
            user: targetProfile.user,
            title: 'Được thêm vào Hợp tác xã',
            message: `Hợp tác xã "${coop.name}" (Mã: ${coop.code}) đã thêm nông trại của bạn vào danh sách xã viên chính thức. Ban quản lý sẽ đồng hành giám sát kỹ thuật và hỗ trợ hồ sơ VietGAP cho bạn.`,
            type: 'SYSTEM',
          });
        } catch (notifErr) {
          console.warn('Lỗi gửi notification đến xã viên:', notifErr);
        }
      }
    } else {
      // Tạo một xã viên liên kết mới
      targetProfile = await FarmProfile.create({
        farmName: farmName || `Nông hộ ${ownerName || 'xã viên'}`,
        ownerName: ownerName || 'Xã viên',
        contactPhone: phone || '0987000000',
        areaSqm: Number(areaSqm) || 2000,
        mainCropType: mainCropType || 'Rau màu',
        address: address || coop.address || 'Hà Nội',
        cooperative: coop._id,
        plan: 'STANDARD',
      });
    }

    // Cập nhật mảng members trong Cooperative nếu chưa có
    if (!coop.members.map(id => id.toString()).includes(targetProfile._id.toString())) {
      coop.members.push(targetProfile._id);
      await coop.save();
    }

    res.status(201).json({
      success: true,
      message: 'Đã thêm hộ xã viên vào Hợp tác xã thành công!',
      data: targetProfile,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * So sánh hiệu quả các mùa vụ trên toàn HTX
 */
export const getCooperativeSeasonComparison = async (req: AuthRequest, res: Response) => {
  try {
    const coop = await getOrCreateUserCooperative(req.user?._id);
    const members = await FarmProfile.find({ cooperative: coop._id });
    const memberIds = members.map(m => m._id);

    const boards = memberIds.length > 0
      ? await CultivationBoard.find({ farmProfile: { $in: memberIds } }).sort({ startDate: -1 })
      : [];

    const memberMap = new Map<string, IFarmProfile>(members.map(m => [m._id.toString(), m]));

    const comparison = await Promise.all(
      boards.map(async b => {
        const mem = memberMap.get(b.farmProfile?.toString());
        let rep: any = b.summaryReport;
        if (!rep) {
          try {
            rep = await calculateSeasonSummaryReport(b._id.toString());
          } catch (e) {
            rep = null;
          }
        }

        return {
          boardId: b._id,
          boardName: b.name,
          cropType: b.cropType,
          memberOwner: mem?.ownerName || (mem as any)?.contactName || 'Xã viên',
          farmName: mem?.farmName || 'Nông trại',
          areaSqm: b.areaSqm,
          status: b.status,
          actualYield: b.harvestYield || rep?.actualYield || 0,
          expectedYield: b.expectedYield || rep?.expectedYield || 0,
          totalCost: rep?.totalCost || 0,
          totalSeedCost: rep?.totalSeedCost || 0,
          totalFertilizerCost: rep?.totalFertilizerCost || 0,
          totalPesticideCost: rep?.totalPesticideCost || 0,
          costPerKg: rep?.costPerKg || 0,
          phiComplianceStatus: rep?.phiComplianceStatus || 'SAFE',
        };
      })
    );

    res.json({
      success: true,
      data: comparison,
      cooperative: coop,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Xây dựng mã HTML cho Trọn bộ Hồ sơ Mùa vụ HTX (VietGAP / Bao tiêu)
 */
function buildSeasonDossierHtml(data: any): string {
  const { cooperative, exportedAt, totalMembers, totalAreaSqm, totalExpectedYield, totalActualYield, membersDossier } = data;
  const dateStr = new Date(exportedAt).toLocaleDateString('vi-VN');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>TRỌN BỘ HỒ SƠ NHẬT KÝ MÙA VỤ HTX - ${cooperative.name}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; background: #fff; line-height: 1.5; font-size: 13px; }
    .page { max-width: 960px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 3px double #16a34a; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { margin: 0 0 6px; font-size: 22px; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px; }
    .header h2 { margin: 0 0 4px; font-size: 16px; color: #0f172a; font-weight: 600; }
    .header p { margin: 2px 0; color: #64748b; font-size: 12px; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-warning { background: #fef3c7; color: #b45309; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .kpi-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; background: #f8fafc; }
    .kpi-val { font-size: 18px; font-weight: 700; color: #16a34a; margin-top: 4px; }
    .kpi-lbl { font-size: 11px; color: #64748b; text-transform: uppercase; }
    .section-title { font-size: 15px; font-weight: 700; color: #1e293b; border-left: 4px solid #16a34a; padding-left: 10px; margin: 24px 0 12px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; color: #334155; }
    .member-block { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; page-break-inside: avoid; }
    .member-header { display: flex; justify-content: space-between; align-items: center; background: #ecfdf5; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; }
    .sign-section { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; margin-top: 40px; page-break-inside: avoid; }
    .sign-box { height: 90px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <p style="font-weight: 700; text-transform: uppercase; color: #475569;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>Độc lập - Tự do - Hạnh phúc</p>
      <div style="margin: 12px 0 6px;">------------------------------------</div>
      <h1>TRỌN BỘ HỒ SƠ NHẬT KÝ MÙA VỤ TOÀN HỢP TÁC XÃ</h1>
      <h2>${cooperative.name}</h2>
      <p>Mã HTX: <strong>${cooperative.code}</strong> | Địa chỉ: ${cooperative.address || '—'} | SĐT: ${cooperative.contactPhone || '—'}</p>
      <p>Tiêu chuẩn canh tác: <span class="badge badge-success">${(cooperative.certificationStandards || ['VietGAP']).join(', ')}</span> | Ngày kết xuất: <strong>${dateStr}</strong></p>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-lbl">Tổng số hộ xã viên</div>
        <div class="kpi-val">${totalMembers} hộ</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-lbl">Tổng diện tích canh tác</div>
        <div class="kpi-val">${totalAreaSqm.toLocaleString('vi-VN')} m²</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-lbl">Tổng sản lượng dự kiến</div>
        <div class="kpi-val">${totalExpectedYield.toLocaleString('vi-VN')} kg</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-lbl">Sản lượng đã thu hoạch</div>
        <div class="kpi-val" style="color: #0284c7;">${totalActualYield.toLocaleString('vi-VN')} kg</div>
      </div>
    </div>

    <div class="section-title">I. Danh sách các Hộ xã viên & Năng suất mùa vụ</div>
    <table>
      <thead>
        <tr>
          <th>STT</th>
          <th>Tên hộ xã viên</th>
          <th>Chủ hộ / Đại diện</th>
          <th>Số điện thoại</th>
          <th>Diện tích (m²)</th>
          <th>Cây trồng chính</th>
          <th>Sản lượng dự kiến</th>
          <th>Trạng thái tuân thủ</th>
        </tr>
      </thead>
      <tbody>
        ${membersDossier.map((mItem: any, idx: number) => `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td><strong>${mItem.member.farmName}</strong></td>
            <td>${mItem.member.ownerName || mItem.member.contactName || 'Chủ hộ'}</td>
            <td>${mItem.member.contactPhone || '—'}</td>
            <td style="text-align: right;">${(mItem.member.areaSqm || 0).toLocaleString('vi-VN')}</td>
            <td>${mItem.member.mainCropType || '—'}</td>
            <td style="text-align: right;">${mItem.boards.reduce((s: number, b: any) => s + (Number(b.board.expectedYield) || 0), 0).toLocaleString('vi-VN')} kg</td>
            <td style="text-align: center;"><span class="badge badge-success">Đạt chuẩn PHI VietGAP</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="section-title">II. Chi tiết Nhật ký Canh tác & Giám sát An toàn (Từng Xã viên)</div>
    ${membersDossier.map((mItem: any, idx: number) => `
      <div class="member-block">
        <div class="member-header">
          <div>
            <strong>${idx + 1}. Hộ: ${mItem.member.farmName}</strong> (Chủ hộ: ${mItem.member.ownerName || '—'})
          </div>
          <div>Diện tích: <strong>${(mItem.member.areaSqm || 0).toLocaleString('vi-VN')} m²</strong></div>
        </div>

        ${mItem.boards.map((bItem: any) => `
          <div style="margin-bottom: 12px;">
            <p style="font-weight: 600; color: #15803d; margin: 4px 0;">
              Luống: ${bItem.board.name} (${bItem.board.cropType}) - Bắt đầu: ${new Date(bItem.board.startDate).toLocaleDateString('vi-VN')}
            </p>

            ${bItem.cultivationEntries.length > 0 ? `
              <div style="font-size: 11px; font-weight: 600; color: #475569; margin: 4px 0;">Nhật ký công việc:</div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 80px;">Ngày</th>
                    <th>Giai đoạn</th>
                    <th>Hoạt động</th>
                    <th>Người làm</th>
                    <th>Thời tiết</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  ${bItem.cultivationEntries.slice(0, 5).map((e: any) => `
                    <tr>
                      <td>${new Date(e.date).toLocaleDateString('vi-VN')}</td>
                      <td>${e.stage || '—'}</td>
                      <td>${e.activityName || '—'}</td>
                      <td>${e.performer || '—'}</td>
                      <td>${e.weather || '—'}</td>
                      <td>${e.notes || '—'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="color: #94a3b8; font-size: 11px; font-style: italic;">Chưa có bản ghi canh tác.</p>'}

            ${bItem.pesticideEntries.length > 0 ? `
              <div style="font-size: 11px; font-weight: 600; color: #b91c1c; margin: 4px 0;">Bảng kê sử dụng thuốc BVTV & Cách ly PHI:</div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 80px;">Ngày phun</th>
                    <th>Tên thuốc BVTV</th>
                    <th>Hoạt chất / Nhà SX</th>
                    <th>Liều lượng</th>
                    <th>Cách ly (PHI)</th>
                    <th>Đánh giá an toàn</th>
                  </tr>
                </thead>
                <tbody>
                  ${bItem.pesticideEntries.map((p: any) => `
                    <tr>
                      <td>${new Date(p.date).toLocaleDateString('vi-VN')}</td>
                      <td><strong>${p.materialName || '—'}</strong></td>
                      <td>${p.activeIngredient || p.manufacturer || '—'}</td>
                      <td>${p.quantity || '—'} ${p.unit || ''}</td>
                      <td style="text-align: center; color: #c2410c; font-weight: 700;">${p.phiDays || 7} ngày</td>
                      <td style="text-align: center;"><span class="badge badge-success">Tuân thủ an toàn</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `).join('')}

    <div class="sign-section">
      <div>
        <p><strong>ĐẠI DIỆN CÁC XÃ VIÊN</strong><br><em>(Ký, ghi rõ họ tên)</em></p>
        <div class="sign-box"></div>
      </div>
      <div>
        <p><strong>CÁN BỘ KỸ THUẬT HTX</strong><br><em>(Xác nhận tuân thủ VietGAP)</em></p>
        <div class="sign-box"></div>
      </div>
      <div>
        <p><strong>GIÁM ĐỐC HỢP TÁC XÃ</strong><br><em>(Ký tên và đóng dấu)</em></p>
        <div class="sign-box"></div>
      </div>
    </div>
  </div>
  <script>
    window.addEventListener('DOMContentLoaded', function() {
      var params = new URLSearchParams(window.location.search);
      if (params.get('print') === '1' || params.get('print') === 'true') {
        setTimeout(function() { window.print(); }, 400);
      }
    });
  </script>
</body>
</html>`;
}
