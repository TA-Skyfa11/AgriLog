import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { User, Role } from '../models/User';
import { FarmProfile } from '../models/FarmProfile';
import { CultivationBoard } from '../models/CultivationBoard';
import { FertilizerBoard } from '../models/FertilizerBoard';
import { PesticideBoard } from '../models/PesticideBoard';
export const getFarms = async (req: AuthRequest, res: Response) => {
  try {
    // Return list of Farm users with their profiles and board count
    const farms = await User.find({ role: Role.FARM }).select('-passwordHash');
    
    const results = await Promise.all(farms.map(async (farm) => {
      const profile = await FarmProfile.findOne({ user: farm._id });
      let boardCount = 0;
      if (profile) {
        const cCount = await CultivationBoard.countDocuments({ farmProfile: profile._id });
        const fCount = await FertilizerBoard.countDocuments({ farmProfile: profile._id });
        const pCount = await PesticideBoard.countDocuments({ farmProfile: profile._id });
        boardCount = cCount + fCount + pCount;
      }
      return {
        user: farm,
        profile,
        boardCount
      };
    }));

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
