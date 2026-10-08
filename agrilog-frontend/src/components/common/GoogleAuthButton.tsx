'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { fetchAPI } from '@/lib/api';
import { loginOneSignal } from '@/lib/onesignal';
import styles from '@/css/login.module.css';

interface GoogleAuthButtonProps {
  mode?: 'signin' | 'signup';
  role?: string;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export default function GoogleAuthButton({
  mode = 'signin',
  role = 'FARM',
  onError,
  disabled = false,
}: GoogleAuthButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGisResponse = useCallback(
    async (response: any) => {
      if (!response?.credential) return;
      setLoading(true);

      try {
        const intendedRole = localStorage.getItem('oauth_role') || role;
        const res = await fetchAPI('/auth/google', {
          method: 'POST',
          body: JSON.stringify({
            idToken: response.credential,
            role: intendedRole,
          }),
        });

        if (res.success && res.token) {
          document.cookie = `token=${res.token}; path=/; max-age=2592000`;
          document.cookie = `role=${res.user.role}; path=/; max-age=2592000`;

          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          localStorage.removeItem('oauth_role');
          localStorage.removeItem('cart');

          const userId = res.user?._id || res.user?.id;
          if (userId) {
            loginOneSignal(userId);
          }

          if (res.user.role === 'ADMIN') {
            router.push('/admin/dashboard');
          } else if (res.user.role === 'COMPANY') {
            router.push('/company/dashboard');
          } else {
            router.push('/dashboard');
          }
        } else {
          throw new Error(res.message || 'Xác thực Google thất bại');
        }
      } catch (err: any) {
        console.error('Lỗi GIS Login:', err);
        if (onError) {
          onError(err.message || 'Đăng nhập Google thất bại');
        }
      } finally {
        setLoading(false);
      }
    },
    [role, router, onError]
  );

  const initGis = useCallback(
    (clientId: string) => {
      try {
        if ((window as any).google?.accounts?.id) {
          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGisResponse,
          });
        }
      } catch (e) {
        console.warn('Không thể khởi tạo Google Identity Services:', e);
      }
    },
    [handleGisResponse]
  );

  // Khởi tạo Google Identity Services (GIS) nếu có NEXT_PUBLIC_GOOGLE_CLIENT_ID
  useEffect(() => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!googleClientId || typeof window === 'undefined') return;

    if ((window as any).google?.accounts?.id) {
      initGis(googleClientId);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initGis(googleClientId);
    };
    document.body.appendChild(script);
  }, [initGis]);

  const fallbackToSupabaseOAuth = async () => {
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      setLoading(false);
      if (onError) {
        onError(error.message);
      }
      return;
    }

    if (data?.url && typeof window !== 'undefined') {
      window.location.href = data.url;
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('oauth_role', role);
      }

      // Ưu tiên 1: Nếu đã tích hợp Google Identity Services One-Tap / Popup
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (googleClientId && (window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback sang Supabase OAuth
            fallbackToSupabaseOAuth();
          }
        });
        return;
      }

      // Ưu tiên 2: Chuyển hướng qua Supabase OAuth Provider
      await fallbackToSupabaseOAuth();
    } catch (err: any) {
      console.error('Lỗi khởi tạo Google OAuth:', err);
      setLoading(false);
      const errMsg = err?.message || 'Không thể kết nối với dịch vụ đăng nhập Google';
      if (onError) {
        onError(errMsg);
      }
    }
  };

  const buttonText = loading
    ? 'Đang kết nối Google...'
    : mode === 'signup'
    ? 'Đăng ký nhanh với Google'
    : 'Đăng nhập bằng Google';

  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
      className={styles.googleButton}
      disabled={disabled || loading}
      aria-label={buttonText}
    >
      {loading ? (
        <div
          style={{
            width: '18px',
            height: '18px',
            border: '2px solid #cbd5e1',
            borderTop: '2px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            fill="#EA4335"
          />
        </svg>
      )}
      <span>{buttonText}</span>
    </button>
  );
}
