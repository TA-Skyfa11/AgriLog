import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export interface OneSignalNotificationOptions {
  userIds: string[];
  title: string;
  message: string;
  url?: string;
  data?: Record<string, any>;
}

export interface TaskReminderPushOptions {
  userId: string;
  taskTitle: string;
  dueDate: Date | string;
  taskId: string;
  priority?: string;
  notes?: string;
}

const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications';

/**
 * Gửi thông báo đẩy qua OneSignal REST API v16
 */
export const sendOneSignalNotification = async (options: OneSignalNotificationOptions) => {
  const appId = process.env.ONESIGNAL_APP_ID?.trim();
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY?.trim();

  if (!appId || !restApiKey) {
    console.warn('\n⚠️ [OneSignalService] ONESIGNAL_APP_ID hoặc ONESIGNAL_REST_API_KEY chưa được cấu hình.');
    console.warn(`[OneSignalService] Mô phỏng gửi push notification đến user: ${options.userIds.join(', ')}`);
    console.warn(`[OneSignalService] Tiêu đề: ${options.title}`);
    console.warn(`[OneSignalService] Nội dung: ${options.message}\n`);
    return { success: true, mocked: true, message: 'Mock notification logged (no API keys configured)' };
  }

  if (!options.userIds || options.userIds.length === 0) {
    return { success: false, message: 'Danh sách userIds trống' };
  }

  const payload: Record<string, any> = {
    app_id: appId,
    // Chỉ định người nhận bằng external_id (User._id trong MongoDB)
    include_aliases: {
      external_id: options.userIds.map(id => id.toString()),
    },
    target_channel: 'push',
    headings: {
      en: options.title,
      vi: options.title,
    },
    contents: {
      en: options.message,
      vi: options.message,
    },
  };

  if (options.url) {
    payload.url = options.url;
    payload.web_url = options.url;
  }

  if (options.data) {
    payload.data = options.data;
  }

  try {
    const response = await axios.post(ONESIGNAL_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Key ${restApiKey}`,
      },
      timeout: 10000,
    });

    console.log(`[OneSignalService] Push notification sent successfully. ID: ${response.data?.id}`);
    return { success: true, data: response.data };
  } catch (error: any) {
    const errorDetails = error.response?.data || error.message;
    console.error('[OneSignalService] Lỗi khi gửi push notification:', errorDetails);
    return { success: false, error: errorDetails };
  }
};

/**
 * Gửi thông báo nhắc lịch công việc OneSignal cho một người dùng
 */
export const sendTaskReminderPush = async (options: TaskReminderPushOptions) => {
  const { userId, taskTitle, dueDate, taskId, priority } = options;
  const dateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const formattedDate = dateObj.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const priorityBadge = priority === 'HIGH' ? '🔥 [Ưu tiên cao] ' : priority === 'LOW' ? '🌱 ' : '📋 ';
  const title = `⏰ Nhắc lịch: ${taskTitle}`;
  const message = `${priorityBadge}Công việc "${taskTitle}" đến hạn vào ${formattedDate}. Vui lòng kiểm tra và thực hiện!`;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  return sendOneSignalNotification({
    userIds: [userId],
    title,
    message,
    url: `${frontendUrl}/tasks`,
    data: {
      type: 'TASK_REMINDER',
      taskId,
      dueDate: dateObj.toISOString(),
      url: '/tasks',
    },
  });
};
