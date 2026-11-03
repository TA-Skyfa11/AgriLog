'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { loginOneSignal } from '@/lib/onesignal';
import styles from '@/css/login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // MFA state
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [mfaEmail, setMfaEmail] = useState('');
  const [otp, setOtp] = useState('');

  // Direct Password Reset Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const handleLoginSuccess = (data: any) => {
    document.cookie = `token=${data.token || ''}; path=/; max-age=2592000`;
    document.cookie = `role=${data.user.role}; path=/; max-age=2592000`;
    
    localStorage.setItem('token', data.token || '');
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.removeItem('cart');

    // Đồng bộ user ID với OneSignal để nhận thông báo nhắc lịch
    const userId = data.user?._id || data.user?.id;
    if (userId) {
      loginOneSignal(userId);
    }

    if (data.user.role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else if (data.user.role === 'COMPANY') {
      router.push('/company/dashboard');
    } else if (data.user.role === 'COOPERATIVE') {
      router.push('/cooperative/dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: identifier.trim(), email: identifier.trim(), password }),
      });

      if (data.success) {
        if (data.requiresMfa) {
          // Admin requires MFA - show OTP input
          setRequiresMfa(true);
          setMfaEmail(data.email);
        } else {
          // Farm/Company - login directly
          handleLoginSuccess(data);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Đăng nhập thất bại. Vui lòng kiểm tra lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await fetchAPI('/auth/verify-mfa', {
        method: 'POST',
        body: JSON.stringify({ email: mfaEmail, otp }),
      });

      if (data.success) {
        handleLoginSuccess(data);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Xác thực MFA thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDirectResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetIdentifier.trim()) {
      setResetError('Vui lòng nhập số điện thoại hoặc email');
      return;
    }

    if (resetNewPassword.length < 6) {
      setResetError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Mật khẩu xác nhận không khớp');
      return;
    }

    setResetLoading(true);

    try {
      const data = await fetchAPI('/auth/direct-reset-password', {
        method: 'POST',
        body: JSON.stringify({
          identifier: resetIdentifier.trim(),
          newPassword: resetNewPassword,
        }),
      });

      if (data.success) {
        setResetSuccess(data.message || 'Đặt lại mật khẩu thành công!');
        // Update login form
        setIdentifier(resetIdentifier.trim());
        setPassword(resetNewPassword);
        setError('');

        setTimeout(() => {
          setShowForgotModal(false);
          setResetNewPassword('');
          setResetConfirmPassword('');
          setResetSuccess('');
        }, 1500);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setResetError(err.message);
      } else {
        setResetError('Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  // MFA verification form
  if (requiresMfa) {
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
              <h1 className={styles.title}>Xác thực MFA</h1>
              <p className={styles.subtitle}>Vui lòng kiểm tra email <strong>{mfaEmail}</strong> để lấy mã xác thực 6 chữ số.</p>
            </div>
            
            {error && <div style={{ color: 'var(--color-error)', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center', backgroundColor: '#fee2e2', padding: '0.75rem', borderRadius: '8px' }}>{error}</div>}

            <form className={styles.form} onSubmit={handleVerifyMfa}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="otp">Mã xác thực (OTP)</label>
                <input
                  id="otp"
                  type="text"
                  className={styles.input}
                  placeholder="Nhập mã 6 chữ số"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  autoFocus
                />
              </div>
              
              <button type="submit" className={styles.button} disabled={loading}>
                {loading ? 'Đang xác thực...' : 'Xác nhận'}
              </button>
            </form>

            <div className={styles.footer}>
              <button 
                onClick={() => { setRequiresMfa(false); setOtp(''); setError(''); }}
                className={styles.footerLink}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ← Quay lại đăng nhập
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className={styles.title}>Đăng nhập</h1>
            <p className={styles.subtitle}>Chào mừng trở lại! Vui lòng điền thông tin để tiếp tục.</p>
          </div>
          
          {error && <div style={{ color: 'var(--color-error)', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center', backgroundColor: '#fee2e2', padding: '0.75rem', borderRadius: '8px' }}>{error}</div>}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="identifier">Số điện thoại hoặc Email</label>
              <input
                id="identifier"
                type="text"
                className={styles.input}
                placeholder="0987654321 hoặc nhap@email.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            
            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="password">Mật khẩu</label>
                <button
                  type="button"
                  onClick={() => {
                    setResetIdentifier(identifier);
                    setResetError('');
                    setResetSuccess('');
                    setShowForgotModal(true);
                  }}
                  className={styles.forgotPasswordLink}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Quên mật khẩu?
                </button>
              </div>
              <input
                id="password"
                type="password"
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className={styles.footer}>
            Chưa có tài khoản?{' '}
            <Link href="/register" className={styles.footerLink}>
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>

      {/* ===== POPUP MODAL ĐỔI MẬT KHẨU NHANH ===== */}
      {showForgotModal && (
        <div className={styles.modalOverlay} onClick={() => setShowForgotModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--color-text-main)' }}>
                  Đặt lại mật khẩu
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  Nhập tài khoản và mật khẩu mới để đổi ngay.
                </p>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowForgotModal(false)}
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            {resetError && (
              <div className={styles.errorAlert}>
                <AlertCircle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>{resetError.toLowerCase().includes('không tìm thấy') ? 'Tài khoản không tồn tại!' : 'Thông báo lỗi:'}</strong>
                  <p>{resetError}</p>
                  {resetError.toLowerCase().includes('không tìm thấy') && (
                    <div style={{ marginTop: '0.35rem' }}>
                      Chưa có tài khoản?{' '}
                      <Link href="/register" onClick={() => setShowForgotModal(false)} style={{ fontWeight: 700, textDecoration: 'underline' }}>
                        Đăng ký tài khoản mới ngay →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {resetSuccess ? (
              <div className={styles.successBox}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.35rem', fontWeight: 600 }}>
                  <CheckCircle2 size={20} color="#059669" />
                  <span>Thành công!</span>
                </div>
                <p style={{ margin: 0 }}>{resetSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleDirectResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="modal-identifier">
                    Số điện thoại hoặc Email
                  </label>
                  <input
                    id="modal-identifier"
                    type="text"
                    className={styles.input}
                    placeholder="0987654321 hoặc nhap@email.com"
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="modal-newPassword">
                    Mật khẩu mới
                  </label>
                  <div className={styles.passwordWrapper}>
                    <input
                      id="modal-newPassword"
                      type={showResetNewPassword ? 'text' : 'password'}
                      className={styles.input}
                      placeholder="Tối thiểu 6 ký tự"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                      aria-label="Ẩn hiện mật khẩu mới"
                    >
                      {showResetNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="modal-confirmPassword">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className={styles.passwordWrapper}>
                    <input
                      id="modal-confirmPassword"
                      type={showResetConfirmPassword ? 'text' : 'password'}
                      className={styles.input}
                      placeholder="Nhập lại mật khẩu mới"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                      aria-label="Ẩn hiện xác nhận mật khẩu"
                    >
                      {showResetConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={styles.button}
                  disabled={resetLoading}
                  style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Lock size={18} />
                  {resetLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu mới'}
                </button>
              </form>
            )}


          </div>
        </div>
      )}
    </div>
  );
}
