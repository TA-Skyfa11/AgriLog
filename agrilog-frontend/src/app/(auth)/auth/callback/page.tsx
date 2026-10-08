'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { fetchAPI } from '@/lib/api';
import { loginOneSignal } from '@/lib/onesignal';
import styles from '@/css/login.module.css';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState('Đang hoàn tất xác thực Google...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isHandled = false;

    const processSession = async (session: any) => {
      if (isHandled || !session?.user) return;
      isHandled = true;

      try {
        setStatusMessage('Đang đồng bộ tài khoản với hệ thống AgriLog...');

        const intendedRole = localStorage.getItem('oauth_role') || 'FARM';
        const user = session.user;
        const email = user.email;
        const name = user.user_metadata?.full_name || user.user_metadata?.name || email?.split('@')[0];
        const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        const googleId = user.id;

        const data = await fetchAPI('/auth/google', {
          method: 'POST',
          body: JSON.stringify({
            supabaseToken: session.access_token,
            email,
            name,
            avatar,
            googleId,
            role: intendedRole,
          }),
        });

        if (data.success && data.token) {
          // Lưu token và thông tin người dùng vào cookie & localStorage
          document.cookie = `token=${data.token}; path=/; max-age=2592000`;
          document.cookie = `role=${data.user.role}; path=/; max-age=2592000`;

          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.removeItem('oauth_role');
          localStorage.removeItem('cart');

          // Kích hoạt thông báo OneSignal
          const userId = data.user?._id || data.user?.id;
          if (userId) {
            loginOneSignal(userId);
          }

          setStatusMessage('Đăng nhập thành công! Đang chuyển hướng...');

          // Chuyển hướng theo phân quyền
          if (data.user.role === 'ADMIN') {
            router.push('/admin/dashboard');
          } else if (data.user.role === 'COMPANY') {
            router.push('/company/dashboard');
          } else {
            router.push('/dashboard');
          }
        } else {
          throw new Error(data.message || 'Không thể đồng bộ thông tin đăng nhập Google');
        }
      } catch (err: any) {
        console.error('Lỗi Callback Google Auth:', err);
        setError(err.message || 'Đăng nhập Google thất bại');
      }
    };

    const handleOAuthCallback = async () => {
      try {
        // Kiểm tra session hiện tại từ Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          await processSession(session);
        } else {
          // Lắng nghe auth state change khi Supabase xử lý hash URL
          const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            if (newSession) {
              await processSession(newSession);
            }
          });

          // Timeout dự phòng nếu không nhận được session
          const timeout = setTimeout(() => {
            if (!isHandled) {
              setError('Không tìm thấy phiên đăng nhập Google. Vui lòng thử lại.');
            }
          }, 8000);

          return () => {
            authListener?.subscription?.unsubscribe();
            clearTimeout(timeout);
          };
        }
      } catch (err: any) {
        console.error('Lỗi xử lý session Google:', err);
        setError(err.message || 'Xác thực Google thất bại');
      }
    };

    handleOAuthCallback();
  }, [router]);

  return (
    <div className={styles.splitContainer} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className={styles.card} style={{ textAlign: 'center', maxWidth: '480px', margin: 'auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-700)', marginBottom: '0.5rem' }}>
            AgriLog.
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            Hệ thống quản lý nông nghiệp thông minh
          </p>
        </div>

        {error ? (
          <div style={{ padding: '1.5rem', backgroundColor: '#fef2f2', borderRadius: '12px', border: '1px solid #fee2e2' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>
              Xác thực không thành công
            </h2>
            <p style={{ color: '#b91c1c', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              {error}
            </p>
            <button
              onClick={() => router.push('/login')}
              className={styles.button}
              style={{ width: '100%', margin: '0' }}
            >
              ← Quay lại trang đăng nhập
            </button>
          </div>
        ) : (
          <div style={{ padding: '2rem 1rem' }}>
            <div style={{
              width: '48px', height: '48px', margin: '0 auto 1.5rem',
              border: '4px solid #e2e8f0', borderTop: '4px solid var(--color-primary-600)',
              borderRadius: '50%', animation: 'spin 1s linear infinite'
            }}></div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
              {statusMessage}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Vui lòng đợi giây lát, hệ thống đang xử lý thông tin tài khoản của bạn.
            </p>
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}
