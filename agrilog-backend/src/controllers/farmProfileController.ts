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
      if (req.body.plan && req.body.plan !== 'BASIC') {
        profile.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    } else {
      if (req.body.plan && req.body.plan !== profile.plan) {
        const planValues = { BASIC: 1, STANDARD: 2, PREMIUM: 3 };
        const currentVal = planValues[profile.plan as keyof typeof planValues] || 1;
        const newVal = planValues[req.body.plan as keyof typeof planValues] || 1;
        
        if (newVal > currentVal) {
          profile.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          
          // Generate notification for successful purchase
          await Notification.create({
            user: req.user?._id,
            title: 'Mua gói cước thành công',
            message: `Chúc mừng bạn đã nâng cấp lên gói ${req.body.plan}. Gói cước có hiệu lực đến ngày ${profile.planExpiresAt.toLocaleDateString('vi-VN')}.`,
            type: 'BILLING'
          });
        }
        profile.previousPlan = profile.plan;
      }
      profile.set(req.body);
    }
    
    await profile.save();
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
