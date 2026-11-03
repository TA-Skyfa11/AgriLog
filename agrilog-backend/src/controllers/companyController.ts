import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { CompanyProfile } from '../models/CompanyProfile';

export const getCompanyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await CompanyProfile.findOne({ user: req.user?._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateCompanyProfile = async (req: AuthRequest, res: Response) => {
  try {
    let profile = await CompanyProfile.findOne({ user: req.user?._id });

    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;
    delete updateData.user;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    if (!profile) {
      profile = new CompanyProfile({ user: req.user?._id, ...updateData });
    } else {
      if (typeof profile.set === 'function') {
        profile.set(updateData);
      } else {
        Object.assign(profile, updateData);
      }
    }

    await profile.save();
    const resultData = profile.toObject ? profile.toObject() : profile;
    res.json({ success: true, data: resultData });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
