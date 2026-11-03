import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { FarmProfile, IFarmProfile } from '../models/FarmProfile';
import { Cooperative } from '../models/Cooperative';
import { Notification } from '../models/Notification';
import { getEffectivePlan, isPlanExpired, getOrCreateTrialSetting } from '../utils/boardUtils';

/**
 * Hàm khởi tạo FarmProfile mặc định có áp dụng chính sách Dùng thử miễn phí
 */
export const createDefaultFarmProfile = async (
  userId: any,
  initialData: Partial<any> = {}
): Promise<any> => {
  const trialSetting = await getOrCreateTrialSetting();
  let plan = initialData.plan || 'FREE';
  let planExpiresAt = initialData.planExpiresAt;
  let isTrial = false;

  // Nếu chính sách dùng thử đang BẬT và tài khoản chưa từng mua gói
  if (trialSetting.isEnabled) {
    const durationDays = (trialSetting.durationMonths || 6) * 30;
    const designatedPlan = trialSetting.trialPlan || 'PREMIUM';
    plan = designatedPlan;
    planExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    isTrial = true;
  }

  const profile = await FarmProfile.create({
    user: userId,
    farmName: initialData.farmName || 'Nông trại của tôi',
    address: initialData.address || '',
    areaSqm: initialData.areaSqm,
    mainCropType: initialData.mainCropType,
    contactPhone: initialData.contactPhone,
    plan,
    planExpiresAt,
    isTrial,
    previousPlan: 'FREE',
    ...initialData,
  });

  // Tạo thông báo chào mừng dùng thử miễn phí
  if (isTrial && planExpiresAt) {
    try {
      const welcomeMsg = trialSetting.trialPromptMessage || `Chào mừng bạn đến với AgriLog! Nông trại của bạn đã được kích hoạt gói ${plan} miễn phí ${trialSetting.durationMonths} tháng (hạn dùng đến ${planExpiresAt.toLocaleDateString('vi-VN')}). Hãy bắt đầu trải nghiệm ngay mọi tính năng!`;
      
      await Notification.create({
        user: userId,
        title: `Kích hoạt gói dịch vụ ${plan} miễn phí ${trialSetting.durationMonths} tháng`,
        message: welcomeMsg,
        type: 'BILLING',
      });
    } catch (e) {
      console.warn('Lỗi tạo notification chào mừng dùng thử:', (e as Error).message);
    }
  }

  return profile;
};

export const getFarmProfile = async (req: AuthRequest, res: Response) => {
  try {
    let profile: any = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      profile = await createDefaultFarmProfile(req.user?._id);
    }

    const trialSetting = await getOrCreateTrialSetting();

    // Tự động kiểm tra hết hạn dùng thử -> Thông báo & Chuyển về gói FREE nếu cấu hình là SWITCH_TO_FREE
    if (profile.isTrial && profile.planExpiresAt && new Date(profile.planExpiresAt) < new Date()) {
      if (trialSetting.expiryAction === 'SWITCH_TO_FREE' || !trialSetting.lockOnExpiry) {
        if (profile.plan !== 'FREE') {
          profile.plan = 'FREE';
          profile.isTrial = false;
          await profile.save();

          try {
            await Notification.create({
              user: req.user?._id,
              title: 'Hết hạn dùng thử - Chuyển sang gói Miễn phí',
              message:
                trialSetting.expiryNotificationMessage ||
                'Thời hạn dùng thử miễn phí của bạn đã kết thúc. Tài khoản của bạn đã được chuyển về gói Miễn phí với các chức năng cơ bản (tối đa 1 bảng mỗi loại nhật ký, không xuất Excel/PDF và không tải ảnh).',
              type: 'BILLING',
            });
          } catch (notifErr) {
            console.warn('Lỗi tạo thông báo hết hạn trial:', notifErr);
          }
        }
      }
    }
    
    // Gắn thông tin tính toán gói cước hiệu dụng và trạng thái hết hạn
    const profileObj: any = profile.toObject ? profile.toObject() : profile;
    const effectivePlan = getEffectivePlan(profile);
    const expired = isPlanExpired(profile);
    
    profileObj.effectivePlan = effectivePlan;
    profileObj.isPlanExpired = expired;
    profileObj.isTrial = profile.isTrial || false;
    const isTrialAll = profile.isTrial && profile.plan === 'ALL';
    profileObj.isTrialAll = isTrialAll;

    // Gắn thông tin cấu hình dùng thử để frontend hiển thị thông báo & modal chọn gói
    profileObj.trialPromptMessage = trialSetting.trialPromptMessage;
    profileObj.expiryNotificationMessage = trialSetting.expiryNotificationMessage;
    profileObj.requirePlanSelection = trialSetting.requirePlanSelection;
    profileObj.trialDurationMonths = trialSetting.durationMonths;
    profileObj.expiryAction = trialSetting.expiryAction;
    
    // Check if package allows export based on features
    let allowExport = false;
    if (effectivePlan === 'FREE' || effectivePlan === 'BASIC' || effectivePlan === 'EXPIRED') {
      allowExport = false;
    } else {
      const { ServicePackage } = await import('../models/ServicePackage');
      const pkg = await ServicePackage.findOne({ code: effectivePlan });
      if (pkg) {
        const featureString = pkg.features.join(' ').toLowerCase();
        allowExport = featureString.includes('lưu trữ') || featureString.includes('hồ sơ') || featureString.includes('xuất');
      } else {
        allowExport = true;
      }
    }
    profileObj.allowExport = allowExport;
    
    res.json({ success: true, data: profileObj });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateFarmProfile = async (req: AuthRequest, res: Response) => {
  try {
    let profile: any = await FarmProfile.findOne({ user: req.user?._id });
    
    if (!profile) {
      profile = await createDefaultFarmProfile(req.user?._id, req.body);
    } else {
      const currentEffectivePlan = getEffectivePlan(profile);
      if (req.body.plan && req.body.plan !== currentEffectivePlan) {
        const planValues = { FREE: 0, BASIC: 1, STANDARD: 2, PREMIUM: 3, EXPIRED: 0 };
        const currentVal = planValues[currentEffectivePlan as keyof typeof planValues] || 0;
        const newVal = planValues[req.body.plan as keyof typeof planValues] || 0;
        
        if (newVal > currentVal) {
          const isNewPurchase = !profile.planExpiresAt || new Date(profile.planExpiresAt) < new Date();
          profile.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          profile.isTrial = false; // Nếu mua gói mới thì không còn là trial nữa
          
          if (isNewPurchase) {
            // Generate notification for successful purchase
            await Notification.create({
              user: req.user?._id,
              title: 'Mua gói cước thành công',
              message: `Chúc mừng bạn đã nâng cấp lên gói ${req.body.plan}. Gói cước có hiệu lực đến ngày ${profile.planExpiresAt.toLocaleDateString('vi-VN')}.`,
              type: 'BILLING'
            });
          }
          profile.previousPlan = currentEffectivePlan === 'EXPIRED' ? 'FREE' : currentEffectivePlan;
        } else {
          // Downgrade
          profile.planExpiresAt = undefined;
          profile.previousPlan = undefined;
          profile.isTrial = false;
        }
      }
      const updateData = { ...req.body };
      delete updateData._id;
      delete updateData.id;
      delete updateData.user;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      if (typeof profile.set === 'function') {
        profile.set(updateData);
      } else {
        Object.assign(profile, updateData);
      }
      await profile.save();
    }
    
    const profileObj: any = profile.toObject ? profile.toObject() : { ...profile };
    profileObj.effectivePlan = getEffectivePlan(profile);
    profileObj.isPlanExpired = isPlanExpired(profile);
    profileObj.isTrial = profile.isTrial || false;
    const trialSetting = await getOrCreateTrialSetting();
    profileObj.isTrialAll = profile.isTrial && profile.plan === 'ALL';
    
    res.json({ success: true, data: profileObj });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const selectTrialPlan = async (req: AuthRequest, res: Response) => {
  try {
    const { packageCode } = req.body;
    
    if (!['BASIC', 'STANDARD', 'PREMIUM'].includes(packageCode)) {
      return res.status(400).json({ success: false, message: 'Gói không hợp lệ' });
    }

    const profile: any = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ nông trại' });
    }

    if (!profile.isTrial) {
      return res.status(400).json({ success: false, message: 'Tài khoản của bạn hiện không trong thời gian dùng thử' });
    }

    if (isPlanExpired(profile)) {
      return res.status(400).json({ success: false, message: 'Thời hạn dùng thử miễn phí của bạn đã kết thúc' });
    }

    profile.plan = packageCode;
    // We KEEP the isTrial=true and the original planExpiresAt!
    await profile.save();

    const expiryDateStr = profile.planExpiresAt ? new Date(profile.planExpiresAt).toLocaleDateString('vi-VN') : '';
    await Notification.create({
      user: req.user?._id,
      title: `Bắt đầu dùng thử gói ${packageCode}`,
      message: `Bạn đã bắt đầu dùng thử gói ${packageCode}. Hạn dùng thử đến ngày ${expiryDateStr}. Chúc bạn có trải nghiệm tuyệt vời và ghi chép mùa vụ thật hiệu quả!`,
      type: 'BILLING'
    });

    const profileObj: any = profile.toObject ? profile.toObject() : { ...profile };
    profileObj.effectivePlan = getEffectivePlan(profile);
    profileObj.isPlanExpired = isPlanExpired(profile);
    profileObj.isTrial = profile.isTrial;
    
    res.json({
      success: true,
      message: `Bắt đầu dùng thử theo gói ${packageCode} đã chọn! Hạn dùng đến ngày ${expiryDateStr}.`,
      data: profileObj
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getFarmPerformers = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ trang trại' });
    }
    const list = profile.customPerformers || [];
    res.json({ success: true, performers: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addFarmPerformer = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ trang trại' });
    }
    const name = (req.body.name || '').trim();
    if (!name || name === 'Chủ hộ' || name === '—') {
      return res.json({ success: true, performers: profile.customPerformers || [] });
    }
    const current = profile.customPerformers || [];
    if (!current.includes(name)) {
      current.push(name);
      profile.customPerformers = current;
      await profile.save();
    }
    res.json({ success: true, performers: profile.customPerformers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Lấy thông tin Hợp tác xã mà nông trại đang tham gia
 */
export const getFarmCooperative = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile || !profile.cooperative) {
      return res.json({ success: true, data: null });
    }

    const coop = await Cooperative.findById(profile.cooperative).populate('manager', 'name phone email');
    if (!coop) {
      profile.cooperative = undefined;
      await profile.save();
      return res.json({ success: true, data: null });
    }

    return res.json({
      success: true,
      data: {
        _id: coop._id,
        name: coop.name,
        code: coop.code,
        address: coop.address,
        contactPhone: coop.contactPhone,
        email: coop.email,
        establishedYear: coop.establishedYear,
        certificationStandards: coop.certificationStandards,
        description: coop.description,
        managerName: (coop.manager as any)?.name || 'Ban Quản trị HTX',
        managerPhone: (coop.manager as any)?.phone || coop.contactPhone,
        memberCount: coop.members ? coop.members.length : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Nông dân chủ động nhập mã HTX (HTX-xxxx) để gia nhập
 */
export const joinCooperative = async (req: AuthRequest, res: Response) => {
  try {
    const { coopCode } = req.body;
    if (!coopCode || typeof coopCode !== 'string') {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã Hợp tác xã.' });
    }

    const trimmedCode = coopCode.trim().toUpperCase();
    const coop = await Cooperative.findOne({ code: trimmedCode });
    if (!coop) {
      return res.status(404).json({ success: false, message: `Không tìm thấy Hợp tác xã nào có mã "${trimmedCode}". Vui lòng kiểm tra lại mã chính xác!` });
    }

    let profile: any = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      profile = await createDefaultFarmProfile(req.user?._id);
    }

    if (profile.cooperative && profile.cooperative.toString() === coop._id.toString()) {
      return res.status(400).json({ success: false, message: `Nông trại của bạn đã tham gia Hợp tác xã "${coop.name}" rồi.` });
    }

    // Nếu đang thuộc HTX khác, gỡ khỏi HTX cũ
    if (profile.cooperative) {
      const oldCoop = await Cooperative.findById(profile.cooperative);
      if (oldCoop) {
        oldCoop.members = (oldCoop.members || []).filter((m: any) => m.toString() !== profile._id.toString());
        await oldCoop.save();
      }
    }

    profile.cooperative = coop._id;
    if (!profile.ownerName && req.user?.name) {
      profile.ownerName = req.user.name;
    }
    await profile.save();

    if (!coop.members) coop.members = [];
    if (!coop.members.map((id: any) => id.toString()).includes(profile._id.toString())) {
      coop.members.push(profile._id);
      await coop.save();
    }

    // Gửi thông báo đến Nông dân
    try {
      await Notification.create({
        user: req.user?._id,
        title: 'Gia nhập Hợp tác xã thành công',
        message: `Chúc mừng bạn đã gia nhập thành công Hợp tác xã "${coop.name}" (Mã: ${coop.code}). Cán bộ kỹ thuật HTX hiện có thể đồng hành giám sát mùa vụ và hỗ trợ xuất hồ sơ VietGAP cho nông trại của bạn!`,
        type: 'SYSTEM',
      });
    } catch (err) {
      console.warn('Lỗi tạo notification join HTX:', err);
    }

    // Gửi thông báo đến Quản lý HTX
    if (coop.manager) {
      try {
        await Notification.create({
          user: coop.manager,
          title: 'Xã viên mới gia nhập HTX',
          message: `Hộ nông dân "${profile.farmName || req.user?.name || 'Xã viên mới'}" vừa nhập mã "${coop.code}" để gia nhập HTX.`,
          type: 'SYSTEM',
        });
      } catch (err) {
        console.warn('Lỗi tạo notification cho manager HTX:', err);
      }
    }

    return res.json({
      success: true,
      message: `Đã gia nhập thành công Hợp tác xã "${coop.name}"!`,
      data: {
        _id: coop._id,
        name: coop.name,
        code: coop.code,
        address: coop.address,
        contactPhone: coop.contactPhone,
        certificationStandards: coop.certificationStandards,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

/**
 * Nông dân chủ động rời khỏi Hợp tác xã
 */
export const leaveCooperative = async (req: AuthRequest, res: Response) => {
  try {
    let profile: any = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile || !profile.cooperative) {
      return res.status(400).json({ success: false, message: 'Hiện tại nông trại của bạn chưa liên kết với Hợp tác xã nào.' });
    }

    const coop = await Cooperative.findById(profile.cooperative);
    const oldName = coop ? coop.name : 'Hợp tác xã';

    profile.cooperative = undefined;
    await profile.save();

    if (coop) {
      coop.members = (coop.members || []).filter((m: any) => m.toString() !== profile._id.toString());
      await coop.save();

      // Thông báo cho Quản lý HTX
      if (coop.manager) {
        try {
          await Notification.create({
            user: coop.manager,
            title: 'Xã viên đã rời Hợp tác xã',
            message: `Hộ nông dân "${profile.farmName || req.user?.name || 'Xã viên'}" đã hủy liên kết khỏi HTX.`,
            type: 'SYSTEM',
          });
        } catch (err) {
          console.warn('Lỗi tạo thông báo rời HTX cho manager:', err);
        }
      }
    }

    // Thông báo cho nông dân
    try {
      await Notification.create({
        user: req.user?._id,
        title: 'Đã rời khỏi Hợp tác xã',
        message: `Bạn đã hủy liên kết khỏi "${oldName}". Toàn bộ nhật ký canh tác của bạn vẫn được lưu giữ an toàn trên tài khoản độc lập.`,
        type: 'SYSTEM',
      });
    } catch (err) {
      console.warn('Lỗi tạo notification rời HTX cho farmer:', err);
    }

    return res.json({
      success: true,
      message: `Đã hủy liên kết khỏi ${oldName} thành công.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const removeFarmPerformer = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ trang trại' });
    }
    const rawName = (req.params.name as string) || '';
    const name = decodeURIComponent(rawName).trim();
    if (name) {
      profile.customPerformers = (profile.customPerformers || []).filter((p: string) => p !== name);
      await profile.save();
    }
    res.json({ success: true, performers: profile.customPerformers || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
