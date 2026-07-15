import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Notification } from '../models/Notification';
import { Task } from '../models/Task';
import { FarmProfile } from '../models/FarmProfile';
import { Material } from '../models/Material';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // 1. Check for upcoming tasks (Due within 2 days)
    const profile = await FarmProfile.findOne({ user: userId });
    if (profile) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrowEnd = new Date();
      tomorrowEnd.setDate(tomorrowEnd.getDate() + 2);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const tasks = await Task.find({
        farmProfile: profile._id,
        status: 'PENDING',
        dueDate: { $gte: today, $lte: tomorrowEnd }
      });

      for (const task of tasks) {
        const refId = `task_${task._id}`;
        const exists = await Notification.findOne({ user: userId, referenceId: refId });
        if (!exists) {
          await Notification.create({
            user: userId,
            title: 'Công việc sắp đến hạn',
            message: `Công việc "${task.title}" sắp đến hạn vào ngày ${task.dueDate.toLocaleDateString('vi-VN')}.`,
            type: 'TASK',
            referenceId: refId
          });
        }
      }

      // 2. Check for plan expiration
      if (profile.planExpiresAt && profile.plan !== 'BASIC') {
        const now = new Date();
        const expiresAt = new Date(profile.planExpiresAt);
        const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft <= 3 && daysLeft > 0) {
          const refId = `plan_warn_${profile.plan}_${expiresAt.getTime()}`;
          const exists = await Notification.findOne({ user: userId, referenceId: refId });
          if (!exists) {
            await Notification.create({
              user: userId,
              title: 'Sắp hết hạn gói cước',
              message: `Gói cước ${profile.plan} của bạn sẽ hết hạn sau ${daysLeft} ngày nữa. Hãy gia hạn để không bị gián đoạn.`,
              type: 'BILLING',
              referenceId: refId
            });
          }
        } else if (daysLeft <= 0) {
          const refId = `plan_expired_${profile.plan}_${expiresAt.getTime()}`;
          const exists = await Notification.findOne({ user: userId, referenceId: refId });
          if (!exists) {
            await Notification.create({
              user: userId,
              title: 'Gói cước đã hết hạn',
              message: `Gói cước ${profile.plan} của bạn đã hết hạn. Hệ thống đã tự động chuyển về gói BASIC.`,
              type: 'BILLING',
              referenceId: refId
            });
          }
        }
      }
      // 3. Check for low/out-of-stock materials
      const materials = await Material.find({ farmProfile: profile._id });
      for (const material of materials) {
        const threshold = material.minQuantityAlert || (material.type === 'FERTILIZER' ? 50 : 5);
        if (material.quantity <= 0) {
          const refId = `mat_out_${material._id}`;
          const exists = await Notification.findOne({ user: userId, referenceId: refId });
          if (!exists) {
            await Notification.create({
              user: userId,
              title: 'Vật tư đã hết hàng',
              message: `Vật tư "${material.name}" đã hết hàng trong kho. Vui lòng nhập thêm.`,
              type: 'SYSTEM',
              referenceId: refId
            });
          }
        } else if (material.quantity <= threshold) {
          const refId = `mat_low_${material._id}_${material.quantity}`;
          const exists = await Notification.findOne({ user: userId, referenceId: refId });
          if (!exists) {
            await Notification.create({
              user: userId,
              title: 'Vật tư sắp hết',
              message: `Vật tư "${material.name}" chỉ còn ${material.quantity} ${material.unit || ''}. Hãy chuẩn bị nhập thêm.`,
              type: 'SYSTEM',
              referenceId: refId
            });
          }
        }
      }
    }

    // Return latest 50 notifications
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user?._id },
      { isRead: true },
      { returnDocument: 'after' }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany(
      { user: req.user?._id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
