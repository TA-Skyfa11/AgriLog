import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { FarmProfile, IFarmProfile } from '../models/FarmProfile';
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
    const durationDays = (trialSetting.durationMonths || 1) * 30;
    plan = trialSetting.trialPlan || 'PREMIUM';
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
      await Notification.create({
        user: userId,
        title: 'Kích hoạt dùng thử miễn phí',
        message: `Chào mừng bạn đến với AgriLog! Bạn được tặng gói dùng thử miễn phí toàn bộ chức năng trong ${trialSetting.durationMonths} tháng (hạn dùng đến ${planExpiresAt.toLocaleDateString('vi-VN')}).`,
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
    
    // Gắn thông tin tính toán gói cước hiệu dụng và trạng thái hết hạn
    const profileObj: any = profile.toObject ? profile.toObject() : profile;
    const effectivePlan = getEffectivePlan(profile);
    const expired = isPlanExpired(profile);
    
    profileObj.effectivePlan = effectivePlan;
    profileObj.isPlanExpired = expired;
    profileObj.isTrial = profile.isTrial || false;
    
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
      profile.set(req.body);
      await profile.save();
    }
    
    const profileObj: any = profile.toObject();
    profileObj.effectivePlan = getEffectivePlan(profile);
    profileObj.isPlanExpired = isPlanExpired(profile);
    profileObj.isTrial = profile.isTrial || false;
    
    res.json({ success: true, data: profileObj });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
