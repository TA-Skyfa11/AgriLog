import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { ServicePackage } from '../models/ServicePackage';

// Lấy danh sách tất cả các gói dịch vụ
export const getServicePackages = async (req: AuthRequest, res: Response) => {
  try {
    const packages = await ServicePackage.find().sort({ price: 1 });
    res.json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Tạo gói dịch vụ mới (Admin)
export const createServicePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, price, description, features, maxImages, maxBoards, isActive } = req.body;

    if (!name || !code || price == null) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tên, mã và giá' });
    }

    const formattedCode = String(code).trim().toUpperCase();
    const pkgExists = await ServicePackage.findOne({ code: formattedCode });
    if (pkgExists) {
      return res.status(400).json({ success: false, message: 'Mã gói dịch vụ đã tồn tại' });
    }

    let parsedFeatures: string[] = [];
    if (Array.isArray(features)) {
      parsedFeatures = features.map(f => String(f).trim()).filter(Boolean);
    } else if (typeof features === 'string') {
      parsedFeatures = features.split('\n').map(f => f.trim()).filter(Boolean);
    }

    const newPackage = await ServicePackage.create({
      name: String(name).trim(),
      code: formattedCode,
      price: Number(price),
      description: description ? String(description).trim() : '',
      features: parsedFeatures,
      maxImages: maxImages != null ? Number(maxImages) : 50,
      maxBoards: maxBoards != null ? Number(maxBoards) : 3,
      isActive: typeof isActive === 'boolean' ? isActive : true
    });

    res.status(201).json({ success: true, data: newPackage, message: 'Tạo gói dịch vụ thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Cập nhật gói dịch vụ (Admin)
export const updateServicePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code, price, description, features, maxImages, maxBoards, isActive } = req.body;

    const pkg = await ServicePackage.findById(id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Gói dịch vụ không tồn tại' });
    }

    if (name) pkg.name = String(name).trim();
    if (code) {
      const formattedCode = String(code).trim().toUpperCase();
      const existing = await ServicePackage.findOne({ code: formattedCode, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Mã gói dịch vụ đã được sử dụng bởi gói khác' });
      }
      pkg.code = formattedCode;
    }
    if (price != null) pkg.price = Number(price);
    if (description != null) pkg.description = String(description).trim();
    if (features != null) {
      if (Array.isArray(features)) {
        pkg.features = features.map(f => String(f).trim()).filter(Boolean);
      } else if (typeof features === 'string') {
        pkg.features = features.split('\n').map(f => f.trim()).filter(Boolean);
      }
    }
    if (maxImages != null) pkg.maxImages = Number(maxImages);
    if (maxBoards != null) pkg.maxBoards = Number(maxBoards);
    if (isActive != null) pkg.isActive = Boolean(isActive);

    await pkg.save();
    res.json({ success: true, data: pkg, message: 'Cập nhật gói dịch vụ thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Xóa gói dịch vụ (Admin)
export const deleteServicePackage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const pkg = await ServicePackage.findByIdAndDelete(id);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Gói dịch vụ không tồn tại' });
    }
    res.json({ success: true, message: 'Đã xóa gói dịch vụ' });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Lấy thông tin cấu hình chính sách Dùng thử (Public/Admin)
export const getTrialPolicy = async (req: AuthRequest, res: Response) => {
  try {
    const { getOrCreateTrialSetting } = await import('../utils/boardUtils');
    const setting = await getOrCreateTrialSetting();
    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Cập nhật cấu hình chính sách Dùng thử (Admin)
export const updateTrialPolicy = async (req: AuthRequest, res: Response) => {
  try {
    const { getOrCreateTrialSetting } = await import('../utils/boardUtils');
    const {
      isEnabled,
      durationMonths,
      trialPlan,
      lockOnExpiry,
      expiryAction,
      trialPromptMessage,
      expiryNotificationMessage,
      requirePlanSelection,
      applyToExistingUsers,
    } = req.body;

    const setting = await getOrCreateTrialSetting();

    if (typeof isEnabled === 'boolean') setting.isEnabled = isEnabled;
    if (typeof durationMonths === 'number' && durationMonths >= 1) {
      setting.durationMonths = Math.max(1, Math.min(36, Math.floor(durationMonths)));
    }
    if (trialPlan && ['BASIC', 'STANDARD', 'PREMIUM', 'ALL'].includes(trialPlan)) {
      setting.trialPlan = trialPlan;
    }
    if (expiryAction && ['SWITCH_TO_FREE', 'LOCK'].includes(expiryAction)) {
      setting.expiryAction = expiryAction;
      setting.lockOnExpiry = expiryAction === 'LOCK';
    } else if (typeof lockOnExpiry === 'boolean') {
      setting.lockOnExpiry = lockOnExpiry;
      setting.expiryAction = lockOnExpiry ? 'LOCK' : 'SWITCH_TO_FREE';
    }
    if (typeof trialPromptMessage === 'string') {
      setting.trialPromptMessage = trialPromptMessage.trim();
    }
    if (typeof expiryNotificationMessage === 'string') {
      setting.expiryNotificationMessage = expiryNotificationMessage.trim();
    }
    if (typeof requirePlanSelection === 'boolean') {
      setting.requirePlanSelection = requirePlanSelection;
    }
    setting.updatedBy = req.user?._id as any;

    await setting.save();

    let updatedUsersCount = 0;
    // Áp dụng cho các tài khoản nông trại đã đăng ký trước đó và gửi thông báo
    if (applyToExistingUsers && setting.isEnabled) {
      const { User, Role } = await import('../models/User');
      const { FarmProfile } = await import('../models/FarmProfile');
      const { Notification } = await import('../models/Notification');

      // Tìm tất cả tài khoản nông dân (FARM)
      const farmUsers = await User.find({ role: Role.FARM });
      const durationDays = (setting.durationMonths || 6) * 30;
      const newExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      const planNameText = setting.trialPlan === 'ALL'
        ? 'toàn bộ các gói dịch vụ (Basic, Standard, Premium)'
        : `gói ${setting.trialPlan}`;

      const notifMessage = setting.trialPlan === 'ALL' && setting.trialPromptMessage
        ? `${setting.trialPromptMessage} (Thời hạn dùng thử đến ${newExpiresAt.toLocaleDateString('vi-VN')})`
        : `Tài khoản của bạn đã được quản trị viên cấp quyền sử dụng ${planNameText} miễn phí trong ${setting.durationMonths} tháng (hạn sử dụng đến ngày ${newExpiresAt.toLocaleDateString('vi-VN')}). Hãy trải nghiệm ngay mọi tính năng!`;

      for (const user of farmUsers) {
        let profile = await FarmProfile.findOne({ user: user._id });
        if (!profile) {
          profile = await FarmProfile.create({
            user: user._id,
            farmName: user.name ? `Nông trại ${user.name}` : 'Nông trại của tôi',
            plan: setting.trialPlan,
            planExpiresAt: newExpiresAt,
            isTrial: true,
            previousPlan: 'FREE',
          });
        } else {
          profile.plan = setting.trialPlan as any;
          profile.planExpiresAt = newExpiresAt;
          profile.isTrial = true;
          await profile.save();
        }

        // Tạo thông báo cho tài khoản người dùng
        try {
          await Notification.create({
            user: user._id,
            title: `Kích hoạt dùng thử ${setting.durationMonths} tháng`,
            message: notifMessage,
            type: 'BILLING',
          });
        } catch (notifErr) {
          console.warn('Lỗi tạo notification dùng thử cho user:', user._id, (notifErr as Error).message);
        }

        updatedUsersCount++;
      }
    }

    res.json({
      success: true,
      data: setting,
      updatedUsersCount,
      message: `Cập nhật chính sách dùng thử thành công: ${setting.isEnabled ? `Bật gói ${setting.trialPlan} (${setting.durationMonths} tháng)` : 'Đã tắt'}${updatedUsersCount > 0 ? ` - Đã áp dụng và gửi thông báo cho ${updatedUsersCount} tài khoản trước đó!` : ''}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
