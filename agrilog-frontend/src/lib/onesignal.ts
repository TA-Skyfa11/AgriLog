// Helper module quản lý OneSignal Web SDK v16 trên Frontend

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

/**
 * Gắn External ID (MongoDB User ID) vào OneSignal để nhận push notification
 */
export const loginOneSignal = async (userId: string) => {
  if (typeof window === 'undefined' || !userId) return;

  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  if (!appId) return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function (OneSignal: any) {
    try {
      await OneSignal.login(userId.toString());
      console.log(`[OneSignal] Đã liên kết tài khoản user ID: ${userId}`);
    } catch (err) {
      console.error('[OneSignal] Lỗi khi login OneSignal:', err);
    }
  });
};

/**
 * Hủy liên kết tài khoản người dùng khi đăng xuất
 */
export const logoutOneSignal = async () => {
  if (typeof window === 'undefined') return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function (OneSignal: any) {
    try {
      await OneSignal.logout();
      console.log('[OneSignal] Đã đăng xuất khỏi OneSignal');
    } catch (err) {
      console.error('[OneSignal] Lỗi khi logout OneSignal:', err);
    }
  });
};

/**
 * Yêu cầu quyền nhận thông báo đẩy từ trình duyệt với timeout an toàn
 */
export const requestPushPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  const promise = new Promise<boolean>((resolve) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      return resolve(true);
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        if (OneSignal.Notifications?.requestPermission) {
          await OneSignal.Notifications.requestPermission();
          const permission = OneSignal.Notifications.permission;
          return resolve(permission === true || permission === 'granted');
        } else if (typeof Notification !== 'undefined') {
          const res = await Notification.requestPermission();
          return resolve(res === 'granted');
        } else {
          return resolve(false);
        }
      } catch (err) {
        console.warn('[OneSignal] Lỗi OneSignal requestPermission, thử native notification:', err);
        if (typeof Notification !== 'undefined') {
          try {
            const res = await Notification.requestPermission();
            return resolve(res === 'granted');
          } catch (e) {
            return resolve(false);
          }
        }
        return resolve(false);
      }
    });
  });

  const timeout = new Promise<boolean>((resolve) => {
    setTimeout(async () => {
      if (typeof Notification !== 'undefined') {
        try {
          if (Notification.permission === 'default') {
            const res = await Notification.requestPermission();
            return resolve(res === 'granted');
          }
          return resolve(Notification.permission === 'granted');
        } catch (e) {
          return resolve(false);
        }
      }
      resolve(false);
    }, 2500);
  });

  return Promise.race([promise, timeout]);
};

/**
 * Kiểm tra trạng thái cấp quyền thông báo hiện tại
 */
export const isPushPermissionGranted = (): boolean => {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return false;
  return Notification.permission === 'granted';
};

/**
 * Kiểm tra xem OneSignal SDK có bị tiện ích AdBlock chặn không
 */
export const isOneSignalBlocked = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).__onesignal_blocked;
};


