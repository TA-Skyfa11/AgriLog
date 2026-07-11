"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const Notification_1 = require("../models/Notification");
const Task_1 = require("../models/Task");
const FarmProfile_1 = require("../models/FarmProfile");
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
