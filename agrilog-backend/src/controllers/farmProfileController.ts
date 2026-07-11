import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { FarmProfile } from '../models/FarmProfile';
import { Notification } from '../models/Notification';
import { getEffectivePlan } from '../utils/boardUtils';

export const getFarmProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    
    // Convert to plain object to attach effectivePlan
    const profileObj: any = profile.toObject();
    const effectivePlan = getEffectivePlan(profile);
    
    // Optionally override the plan field for the frontend or add effectivePlan explicitly
    profileObj.plan = effectivePlan;
    profileObj.effectivePlan = effectivePlan;
    
    res.json({ success: true, data: profileObj });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateFarmProfile = async (req: AuthRequest, res: Response) => {
  try {
    let profile = await FarmProfile.findOne({ user: req.user?._id });
    
    if (!profile) {
      profile = new FarmProfile({ user: req.user?._id, ...req.body });
      if (req.body.plan && req.body.plan !== 'FREE') {
        profile.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    } else {
      const currentEffectivePlan = getEffectivePlan(profile);
      if (req.body.plan && req.body.plan !== currentEffectivePlan) {
        const planValues = { FREE: 0, BASIC: 1, STANDARD: 2, PREMIUM: 3 };
        const currentVal = planValues[currentEffectivePlan as keyof typeof planValues] || 0;
        const newVal = planValues[req.body.plan as keyof typeof planValues] || 0;
        
        if (newVal > currentVal) {
          const isNewPurchase = !profile.planExpiresAt || new Date(profile.planExpiresAt) < new Date();
          profile.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          
          if (isNewPurchase) {
            // Generate notification for successful purchase
            await Notification.create({
              user: req.user?._id,
              title: 'Mua gói cước thành công',
              message: `Chúc mừng bạn đã nâng cấp lên gói ${req.body.plan}. Gói cước có hiệu lực đến ngày ${profile.planExpiresAt.toLocaleDateString('vi-VN')}.`,
              type: 'BILLING'
            });
          }
          profile.previousPlan = currentEffectivePlan;
        } else {
          // Downgrade immediately
          profile.planExpiresAt = undefined;
          profile.previousPlan = undefined;
        }
      }
      profile.set(req.body);
    }
    
    await profile.save();
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
