'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/login.module.css';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; notFound?: boolean } | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError({ message: 'Vui lòng nhập số điện thoại hoặc email.' });
      return;
    }

    if (newPassword.length < 6) {
      setError({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setError({ message: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setLoading(true);

    try {
      const data = await fetchAPI('/auth/direct-reset-password', {
        method: 'POST',
        body: JSON.stringify({
          identifier: identifier.trim(),
          newPassword,
        }),
      });

      if (data.success) {
        setSuccess(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đặt lại mật khẩu thất bại.';
      const isNotFound = msg.toLowerCase().includes('không tìm thấy') || msg.toLowerCase().includes('chưa được đăng ký');
      setError({
        message: msg,
        notFound: isNotFound,
      });
    } finally {
      setLoading(false);
    }
  };

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
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Quên mật khẩu?</h1>
            <p className={styles.subtitle}>
              Nhập số điện thoại hoặc email của bạn và đặt mật khẩu mới.
            </p>
          </div>

          {success ? (
            <div>
              <div className={styles.successBox}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                  <CheckCircle2 size={22} color="#059669" />
                  <span>Đổi mật khẩu thành công!</span>
                </div>
                <p style={{ margin: 0 }}>
                  Mật khẩu của bạn đã được cập nhật thành công. Hãy dùng mật khẩu mới này để đăng nhập.
                </p>
              </div>

              <Link
                href="/login"
                className={styles.button}
                style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
              >
                Đăng nhập ngay
              </Link>
            </div>
          ) : (
            <div>
              {error && (
                <div className={styles.errorAlert}>
                  <AlertCircle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>{error.notFound ? 'Tài khoản không tồn tại!' : 'Thông báo lỗi:'}</strong>
                    <p>{error.message}</p>
                    {error.notFound && (
                      <div style={{ marginTop: '0.35rem' }}>
                        Chưa có tài khoản?{' '}
                        <Link href="/register" style={{ fontWeight: 700, textDecoration: 'underline' }}>
                          Đăng ký tài khoản mới ngay →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="identifier">
                    Số điện thoại hoặc Email
                  </label>
                  <input
                    id="identifier"
                    type="text"
                    className={styles.input}
                    placeholder="0987654321 hoặc nongdan@example.com"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (error) setError(null);
                    }}
                    required
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="newPassword">
                    Mật khẩu mới
                  </label>
                  <div className={styles.passwordWrapper}>
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      className={styles.input}
                      placeholder="Tối thiểu 6 ký tự"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label="Ẩn hiện mật khẩu mới"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="confirmPassword">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className={styles.passwordWrapper}>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={styles.input}
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label="Ẩn hiện xác nhận mật khẩu"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={styles.button}
                  disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Lock size={18} />
                  {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu mới'}
                </button>
              </form>

              <div className={styles.footer}>
                <Link href="/login" className={styles.footerLink} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ArrowLeft size={16} /> Quay lại đăng nhập
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
