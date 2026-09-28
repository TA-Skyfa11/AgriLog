'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

export default function OneSignalInit() {
  const router = useRouter();

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId) {
      console.log('ℹ️ [OneSignal] NEXT_PUBLIC_ONESIGNAL_APP_ID chưa được cung cấp.');
      return;
    }

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      try {
        await OneSignal.init({
          appId,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: false,
          },
        });

        // Tự động liên kết tài khoản nếu đã đăng nhập từ trước
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            const userId = user?._id || user?.id;
            if (userId) {
              await OneSignal.login(userId.toString());
              console.log(`[OneSignal] Đã tự động đăng nhập external_id: ${userId}`);
            }
          } catch (e) {
            console.error('[OneSignal] Lỗi parse dữ liệu người dùng:', e);
          }
        }

        // Lắng nghe sự kiện click vào thông báo đẩy để chuyển hướng đến trang công việc
        if (OneSignal.Notifications?.addEventListener) {
          OneSignal.Notifications.addEventListener('click', (event: any) => {
            console.log('[OneSignal] Đã click vào thông báo:', event);
            const customData = event.notification?.additionalData;
            if (customData?.url) {
              router.push(customData.url);
            } else if (customData?.type === 'TASK' || customData?.type === 'TASK_REMINDER') {
              router.push('/tasks');
            }
          });
        }
      } catch (initErr) {
        console.error('[OneSignal] Lỗi khi khởi tạo OneSignal Web SDK:', initErr);
      }
    });
  }, [router]);

  return (
    <Script
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
      onError={() => {
        console.warn('[OneSignal] Script bị chặn bởi trình duyệt (ERR_BLOCKED_BY_CLIENT). Nguyên nhân thường do tiện ích AdBlock/Brave Shields.');
        if (typeof window !== 'undefined') {
          (window as any).__onesignal_blocked = true;
        }
      }}
    />
  );
}
