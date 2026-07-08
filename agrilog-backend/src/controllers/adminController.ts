import { Response } from 'express';
import bcrypt from 'bcryptjs';
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

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalFarms = await User.countDocuments({ role: Role.FARM });
    const newUsers = await User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }); // Last 30 days
    
    const cCount = await CultivationBoard.countDocuments();
    const fCount = await FertilizerBoard.countDocuments();
    const pCount = await PesticideBoard.countDocuments();
    const totalBoards = cCount + fCount + pCount;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalFarms,
        newUsers,
        totalBoards
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const addUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email và mật khẩu' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email này đã được đăng ký' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      passwordHash,
      role: role || Role.FARM,
    });

    res.status(201).json({
      success: true,
      message: 'Thêm tài khoản thành công',
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const adminResetPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mật khẩu mới' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    if (!user.allowAdminReset) {
      return res.status(403).json({ 
        success: false, 
        message: 'Người dùng này chưa cho phép Admin đặt lại mật khẩu. Hãy yêu cầu họ bật tùy chọn này trong phần Cài đặt > Bảo mật.' 
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// ===== COMMISSION SETTINGS =====

import { CommissionSetting } from '../models/CommissionSetting';

export const getCommissionSetting = async (req: AuthRequest, res: Response) => {
  try {
    let setting = await CommissionSetting.findOne().sort({ updatedAt: -1 });
    if (!setting) {
      setting = await CommissionSetting.create({ rate: 5, description: 'Mức hoa hồng mặc định', updatedBy: req.user?._id });
    }
    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const updateCommissionSetting = async (req: AuthRequest, res: Response) => {
  try {
    const { rate, description } = req.body;
    if (rate == null || rate < 0 || rate > 100) {
      return res.status(400).json({ success: false, message: 'Mức hoa hồng phải từ 0% đến 100%' });
    }

    let setting = await CommissionSetting.findOne().sort({ updatedAt: -1 });
    if (!setting) {
      setting = new CommissionSetting();
    }
    setting.rate = rate;
    if (description) setting.description = description;
    setting.updatedBy = req.user?._id as any;
    await setting.save();

    res.json({ success: true, data: setting, message: `Đã cập nhật mức hoa hồng thành ${rate}%` });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
