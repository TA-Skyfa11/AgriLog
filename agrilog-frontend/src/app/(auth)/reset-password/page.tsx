'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/login.module.css';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Mã khôi phục mật khẩu không hợp lệ hoặc bị thiếu.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);

    try {
      const data = await fetchAPI('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      if (data.success) {
        setSuccess(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Không thể đặt lại mật khẩu. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Đường dẫn không hợp lệ</h1>
          <p className={styles.subtitle}>
            Liên kết đặt lại mật khẩu bị thiếu token hoặc không chính xác.
          </p>
        </div>

        <div style={{ color: '#b91c1c', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center', backgroundColor: '#fee2e2', padding: '1rem', borderRadius: '8px' }}>
          Vui lòng kiểm tra lại đường dẫn trong email của bạn hoặc gửi lại yêu cầu mới.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link href="/forgot-password" className={styles.button} style={{ textAlign: 'center', textDecoration: 'none' }}>
            Yêu cầu liên kết mới
          </Link>
          <div className={styles.footer} style={{ marginTop: '0.5rem' }}>
            <Link href="/login" className={styles.footerLink} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <ArrowLeft size={16} /> Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Thành công!</h1>
          <p className={styles.subtitle}>
            Mật khẩu của bạn đã được cập nhật thành công.
          </p>
        </div>

        <div className={styles.successBox}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
            <CheckCircle2 size={22} color="#059669" />
            <span>Đổi mật khẩu thành công</span>
          </div>
          <p style={{ margin: 0 }}>
            Giờ đây bạn có thể sử dụng mật khẩu mới này để đăng nhập vào tài khoản AgriLog.
          </p>
        </div>

        <Link
          href="/login"
          className={styles.button}
          style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '1.5rem' }}
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h1 className={styles.title}>Đặt lại mật khẩu</h1>
        <p className={styles.subtitle}>
          Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
        </p>
      </div>

      {error && (
        <div style={{ color: '#b91c1c', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center', backgroundColor: '#fee2e2', padding: '0.75rem', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="newPassword">Mật khẩu mới</label>
          <div className={styles.passwordWrapper}>
            <input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              className={styles.input}
              placeholder="Tối thiểu 6 ký tự"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoFocus
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label="Hiện hoặc ẩn mật khẩu"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
          <div className={styles.passwordWrapper}>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              className={styles.input}
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label="Hiện hoặc ẩn xác nhận mật khẩu"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
        </button>
      </form>

      <div className={styles.footer}>
        <Link href="/login" className={styles.footerLink} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className={styles.splitContainer}>
      <div className={styles.imageSection}>
        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=2070&auto=format&fit=crop"
          alt="Agriculture Field"
          className={styles.unsplashImage}
        />
        <div className={styles.imageOverlay}></div>
        <div className={styles.imageQuote}>
          <h2>AgriLog.</h2>
          <p>Nền tảng quản lý nông trại thông minh, giúp bạn theo dõi mùa màng, kiểm soát vật tư và tối ưu hóa năng suất hiệu quả.</p>
        </div>
      </div>

      <div className={styles.formSection}>
        <Suspense fallback={<div style={{ textAlign: 'center', color: '#64748b' }}>Đang tải...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

