/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.success) {
        document.cookie = `token=${data.token}; path=/; max-age=2592000`; // 30 days
        document.cookie = `role=${data.user.role}; path=/; max-age=2592000`;
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.removeItem('cart'); // Clear cart from any previous session

        if (data.user.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (data.user.role === 'COMPANY') {
          router.push('/company/dashboard');
        } else {
          router.push('/dashboard');
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
              <label className={styles.label} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="nhap@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="password">Mật khẩu</label>
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
    </div>
  );
}
