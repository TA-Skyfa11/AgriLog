import { Task } from '../models/Task';
import { FarmProfile } from '../models/FarmProfile';
import { Notification } from '../models/Notification';
import { sendTaskReminderPush } from './oneSignalService';

/**
 * Quét toàn bộ công việc sắp đến hạn hoặc trong ngày và gửi thông báo nhắc nhở OneSignal
 */
export const checkAndSendTaskReminders = async (filterUserId?: string) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const reminderWindowEnd = new Date();
    reminderWindowEnd.setDate(reminderWindowEnd.getDate() + 2); // Đến hạn trong 2 ngày tới
    reminderWindowEnd.setHours(23, 59, 59, 999);

    const profileQuery: Record<string, any> = {};
    if (filterUserId) {
      profileQuery.user = filterUserId;
    }

    const profiles = await FarmProfile.find(profileQuery);
    let totalChecked = 0;
    let notificationsCreated = 0;
    let pushSentCount = 0;

    for (const profile of profiles) {
      const tasks = await Task.find({
        farmProfile: profile._id,
        status: 'PENDING',
        dueDate: { $gte: todayStart, $lte: reminderWindowEnd },
      });

      totalChecked += tasks.length;

      for (const task of tasks) {
        const refId = `task_${task._id}`;
        const exists = await Notification.findOne({ user: profile.user, referenceId: refId });

        if (!exists) {
          const dateStr = new Date(task.dueDate).toLocaleDateString('vi-VN');
          const notif = await Notification.create({
            user: profile.user,
            title: 'Công việc sắp đến hạn',
            message: `Công việc "${task.title}" sắp đến hạn vào ngày ${dateStr}.`,
            type: 'TASK',
            referenceId: refId,
          });
          notificationsCreated++;

          // Kiểm tra cấu hình nhận thông báo của nông hộ
          const allowPush = profile.notificationPreferences?.push !== false;
          const allowTaskNotif = profile.notificationPreferences?.tasks !== false;

          if (allowPush && allowTaskNotif) {
            await sendTaskReminderPush({
              userId: profile.user.toString(),
              taskTitle: task.title,
              dueDate: task.dueDate,
              taskId: (task._id as any).toString(),
              priority: task.priority,
            });
            pushSentCount++;
          }
        }
      }
    }

    console.log(
      `[TaskScheduler] Hoàn tất quét nhắc lịch công việc: Đã kiểm tra ${totalChecked} công việc, tạo ${notificationsCreated} thông báo, gửi ${pushSentCount} push OneSignal.`
    );

    return {
      success: true,
      totalChecked,
      notificationsCreated,
      pushSentCount,
    };
  } catch (error) {
    console.error('[TaskScheduler] Lỗi khi quét nhắc lịch công việc:', error);
    return { success: false, error: (error as Error).message };
  }
};

let schedulerTimer: NodeJS.Timeout | null = null;

/**
 * Khởi động scheduler quét nhắc lịch định kỳ (Mỗi 30 phút)
 */
export const startTaskReminderScheduler = (intervalMinutes = 30) => {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
  }

  // Chạy lần đầu sau 10 giây khi server khởi động
  setTimeout(() => {
    console.log('[TaskScheduler] Chạy lượt quét nhắc lịch công việc đầu tiên sau khi khởi động...');
    checkAndSendTaskReminders();
  }, 10000);

  // Đặt lịch lặp lại định kỳ
  const intervalMs = intervalMinutes * 60 * 1000;
  schedulerTimer = setInterval(() => {
    console.log('[TaskScheduler] Chạy lượt quét nhắc lịch công việc định kỳ...');
    checkAndSendTaskReminders();
  }, intervalMs);

  console.log(`[TaskScheduler] Đã kích hoạt hệ thống nhắc lịch công việc định kỳ (mỗi ${intervalMinutes} phút).`);
};
