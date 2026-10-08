"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerTaskReminders = exports.testOneSignalNotification = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const Notification_1 = require("../models/Notification");
const Task_1 = require("../models/Task");
const FarmProfile_1 = require("../models/FarmProfile");
const Material_1 = require("../models/Material");
const oneSignalService_1 = require("../utils/oneSignalService");
const taskScheduler_1 = require("../utils/taskScheduler");
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        // 1. Check for upcoming tasks (Due within 2 days)
        const profile = await FarmProfile_1.FarmProfile.findOne({ user: userId });
        if (profile) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrowEnd = new Date();
            tomorrowEnd.setDate(tomorrowEnd.getDate() + 2);
            tomorrowEnd.setHours(23, 59, 59, 999);
            const tasks = await Task_1.Task.find({
                farmProfile: profile._id,
                status: 'PENDING',
                dueDate: { $gte: today, $lte: tomorrowEnd }
            });
            for (const task of tasks) {
                const refId = `task_${task._id}`;
                const exists = await Notification_1.Notification.findOne({ user: userId, referenceId: refId });
                if (!exists) {
                    await Notification_1.Notification.create({
                        user: userId,
                        title: 'Công việc sắp đến hạn',
                        message: `Công việc "${task.title}" sắp đến hạn vào ngày ${task.dueDate.toLocaleDateString('vi-VN')}.`,
                        type: 'TASK',
                        referenceId: refId
                    });
                    // Gửi thông báo đẩy OneSignal nếu người dùng bật nhận thông báo
                    const allowPush = profile.notificationPreferences?.push !== false;
                    const allowTasks = profile.notificationPreferences?.tasks !== false;
                    if (allowPush && allowTasks) {
                        (0, oneSignalService_1.sendTaskReminderPush)({
                            userId: userId.toString(),
                            taskTitle: task.title,
                            dueDate: task.dueDate,
                            taskId: task._id.toString(),
                            priority: task.priority
                        }).catch(err => console.error('[NotificationController] Lỗi gửi OneSignal push:', err));
                    }
                }
            }
            // 2. Check for plan expiration
            if (profile.planExpiresAt && profile.plan !== 'BASIC') {
                const now = new Date();
                const expiresAt = new Date(profile.planExpiresAt);
                const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                if (daysLeft <= 3 && daysLeft > 0) {
                    const refId = `plan_warn_${profile.plan}_${expiresAt.getTime()}`;
                    const exists = await Notification_1.Notification.findOne({ user: userId, referenceId: refId });
                    if (!exists) {
                        await Notification_1.Notification.create({
                            user: userId,
                            title: 'Sắp hết hạn gói cước',
                            message: `Gói cước ${profile.plan} của bạn sẽ hết hạn sau ${daysLeft} ngày nữa. Hãy gia hạn để không bị gián đoạn.`,
                            type: 'BILLING',
                            referenceId: refId
                        });
                    }
                }
                else if (daysLeft <= 0) {
                    const refId = `plan_expired_${profile.plan}_${expiresAt.getTime()}`;
                    const exists = await Notification_1.Notification.findOne({ user: userId, referenceId: refId });
                    if (!exists) {
                        await Notification_1.Notification.create({
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
            const materials = await Material_1.Material.find({ farmProfile: profile._id });
            for (const material of materials) {
                const threshold = material.minQuantityAlert || (material.type === 'FERTILIZER' ? 50 : 5);
                if (material.quantity <= 0) {
                    const refId = `mat_out_${material._id}`;
                    const exists = await Notification_1.Notification.findOne({ user: userId, referenceId: refId });
                    if (!exists) {
                        await Notification_1.Notification.create({
                            user: userId,
                            title: 'Vật tư đã hết hàng',
                            message: `Vật tư "${material.name}" đã hết hàng trong kho. Vui lòng nhập thêm.`,
                            type: 'SYSTEM',
                            referenceId: refId
                        });
                    }
                }
                else if (material.quantity <= threshold) {
                    const refId = `mat_low_${material._id}_${material.quantity}`;
                    const exists = await Notification_1.Notification.findOne({ user: userId, referenceId: refId });
                    if (!exists) {
                        await Notification_1.Notification.create({
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
        const notifications = await Notification_1.Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ success: true, data: notifications });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification_1.Notification.findOneAndUpdate({ _id: id, user: req.user?._id }, { isRead: true }, { returnDocument: 'after' });
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.json({ success: true, data: notification });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.markAsRead = markAsRead;
const markAllAsRead = async (req, res) => {
    try {
        await Notification_1.Notification.updateMany({ user: req.user?._id, isRead: false }, { isRead: true });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.markAllAsRead = markAllAsRead;
/**
 * Gửi thông báo thử nghiệm OneSignal đến người dùng đang đăng nhập
 */
const testOneSignalNotification = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const result = await (0, oneSignalService_1.sendOneSignalNotification)({
            userIds: [userId.toString()],
            title: '🔔 AgriLog: Kiểm tra thông báo nhắc lịch',
            message: 'Tính năng gửi thông báo nhắc lịch công việc qua OneSignal đã được kích hoạt thành công!',
            url: `${frontendUrl}/tasks`,
            data: {
                type: 'TEST_REMINDER',
                timestamp: Date.now(),
                url: '/tasks'
            }
        });
        res.json({
            success: true,
            message: 'Đã gửi yêu cầu thông báo OneSignal',
            data: result
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.testOneSignalNotification = testOneSignalNotification;
/**
 * Quét ngay các công việc sắp đến hạn và gửi thông báo nhắc nhở OneSignal
 */
const triggerTaskReminders = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const result = await (0, taskScheduler_1.checkAndSendTaskReminders)(userId.toString());
        res.json({
            success: true,
            message: 'Đã hoàn tất quét và gửi nhắc lịch công việc',
            data: result
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.triggerTaskReminders = triggerTaskReminders;
