import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { FarmProfile } from '../models/FarmProfile';

export const getFarmProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await FarmProfile.findOne({ user: req.user?._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateFarmProfile = async (req: AuthRequest, res: Response) => {
  try {
    let profile = await FarmProfile.findOne({ user: req.user?._id });
    
    if (!profile) {
      profile = new FarmProfile({ user: req.user?._id, ...req.body });
    } else {
      profile.set(req.body);
    }
    
    await profile.save();
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
