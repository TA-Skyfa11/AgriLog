/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/login.module.css'; // Reusing the same styles

export default function RegisterPage() {
  const router = useRouter();
  
  // Step management
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('FARM'); // FARM or COMPANY
  
  // Step 1: Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Step 2: Farm Profile
  const [farmName, setFarmName] = useState('');
  const [address, setAddress] = useState('');
  const [areaSqm, setAreaSqm] = useState('');
  const [mainCropType, setMainCropType] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Step 2: Company Profile
  const [companyName, setCompanyName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [businessType, setBusinessType] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);

    try {
      const data = await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });

      if (data.success) {
        document.cookie = `token=${data.token}; path=/; max-age=2592000`; // 30 days
        document.cookie = `role=${data.user.role}; path=/; max-age=2592000`;
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Move to step 2 instead of redirecting
        setStep(2);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Đăng ký thất bại. Vui lòng kiểm tra lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (role === 'FARM' && !farmName.trim()) {
      setError('Vui lòng nhập Tên Nông Trại');
      return;
    }
    if (role === 'COMPANY' && !companyName.trim()) {
      setError('Vui lòng nhập Tên Doanh Nghiệp');
      return;
    }

    setLoading(true);

    try {
      if (role === 'FARM') {
        const data = await fetchAPI('/farm/profile', {
          method: 'PUT',
          body: JSON.stringify({
            farmName,
            address,
            areaSqm: areaSqm ? Number(areaSqm) : undefined,
            mainCropType,
            contactPhone
          }),
        });

        if (data.success) {
          router.push('/dashboard');
        }
      } else {
        const data = await fetchAPI('/company/profile', {
          method: 'PUT',
          body: JSON.stringify({
            companyName,
            address,
            contactPhone,
            taxCode,
            businessType
          }),
        });

        if (data.success) {
          router.push('/company/dashboard');
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Cập nhật hồ sơ thất bại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.splitContainer}>
      <div className={styles.imageSection}>
        <img 
          src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=2053&auto=format&fit=crop" 
          alt="Hands with soil" 
          className={styles.unsplashImage} 
        />
        <div className={styles.imageOverlay}></div>
        <div className={styles.imageQuote}>
          <h2>AgriLog.</h2>
          <p>Tham gia cộng đồng nông nghiệp hiện đại. Bắt đầu số hóa nông trại của bạn ngay hôm nay.</p>
        </div>
      </div>

      <div className={styles.formSection}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>{step === 1 ? 'Đăng ký' : (role === 'FARM' ? 'Thiết lập Nông trại' : 'Thiết lập Doanh nghiệp')}</h1>
            <p className={styles.subtitle}>
              {step === 1 
                ? 'Khởi tạo tài khoản mới' 
                : 'Cung cấp thông tin để chúng tôi thiết lập không gian cho bạn'}
            </p>
          </div>
          
          {error && <div style={{ color: 'var(--color-error)', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center', backgroundColor: '#fee2e2', padding: '0.75rem', borderRadius: '8px' }}>{error}</div>}

          {step === 1 ? (
            <form className={styles.form} onSubmit={handleStep1Submit}>
              <div className={styles.formGroup} style={{ marginBottom: '1.5rem' }}>
                <label className={styles.label}>Loại tài khoản</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                  <div 
                    onClick={() => setRole('FARM')}
                    style={{ 
                      padding: '1rem', border: `2px solid ${role === 'FARM' ? 'var(--color-primary-500)' : 'var(--color-border)'}`, 
                      borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                      backgroundColor: role === 'FARM' ? 'var(--color-primary-50)' : 'transparent'
                    }}
                  >
                    <div style={{ fontWeight: 600, color: role === 'FARM' ? 'var(--color-primary-700)' : 'var(--color-text-main)' }}>Nông trại</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Quản lý canh tác</div>
                  </div>
                  <div 
                    onClick={() => setRole('COMPANY')}
                    style={{ 
                      padding: '1rem', border: `2px solid ${role === 'COMPANY' ? 'var(--color-primary-500)' : 'var(--color-border)'}`, 
                      borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                      backgroundColor: role === 'COMPANY' ? 'var(--color-primary-50)' : 'transparent'
                    }}
                  >
                    <div style={{ fontWeight: 600, color: role === 'COMPANY' ? 'var(--color-primary-700)' : 'var(--color-text-main)' }}>Doanh nghiệp</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Bán vật tư nông nghiệp</div>
                  </div>
                </div>
              </div>

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

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                <input
                  id="confirmPassword"
                  type="password"
                  className={styles.input}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              
              <button type="submit" className={styles.button} disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đăng ký & Tiếp tục'}
              </button>
            </form>
          ) : (
            <form className={styles.form} onSubmit={handleStep2Submit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {role === 'FARM' ? (
                  <>
                    {/* FARM PROFILE */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="farmName">Tên Nông Trại <span style={{ color: 'red' }}>*</span></label>
                        <input id="farmName" type="text" className={styles.input} placeholder="Ví dụ: Nông trại Xanh" value={farmName} onChange={(e) => setFarmName(e.target.value)} required />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="contactPhone">Số điện thoại</label>
                        <input id="contactPhone" type="tel" className={styles.input} placeholder="0987654321" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="areaSqm">Diện tích tổng (m²)</label>
                        <input id="areaSqm" type="number" className={styles.input} placeholder="Ví dụ: 5000" value={areaSqm} onChange={(e) => setAreaSqm(e.target.value)} />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Vai trò tài khoản</label>
                        <input type="text" className={styles.input} value="Quản lý nông trại (Chủ sở hữu)" disabled style={{ backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Email</label>
                        <input type="email" className={styles.input} value={email} disabled style={{ backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }} />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="address">Địa chỉ</label>
                        <input id="address" type="text" className={styles.input} placeholder="Tỉnh/Thành phố..." value={address} onChange={(e) => setAddress(e.target.value)} />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="mainCropType">Cây trồng chính</label>
                        <input id="mainCropType" type="text" className={styles.input} placeholder="Ví dụ: Nhãn lồng" value={mainCropType} onChange={(e) => setMainCropType(e.target.value)} />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* COMPANY PROFILE */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="companyName">Tên Doanh Nghiệp <span style={{ color: 'red' }}>*</span></label>
                        <input id="companyName" type="text" className={styles.input} placeholder="Ví dụ: Công ty Phân bón Bình Điền" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="contactPhone">Số điện thoại</label>
                        <input id="contactPhone" type="tel" className={styles.input} placeholder="0987654321" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="taxCode">Mã số thuế</label>
                        <input id="taxCode" type="text" className={styles.input} placeholder="Ví dụ: 0312345678" value={taxCode} onChange={(e) => setTaxCode(e.target.value)} />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Vai trò tài khoản</label>
                        <input type="text" className={styles.input} value="Đại diện doanh nghiệp" disabled style={{ backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Email</label>
                        <input type="email" className={styles.input} value={email} disabled style={{ backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }} />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="address">Địa chỉ</label>
                        <input id="address" type="text" className={styles.input} placeholder="Tỉnh/Thành phố..." value={address} onChange={(e) => setAddress(e.target.value)} />
                      </div>
                      <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="businessType">Loại hình kinh doanh</label>
                        <input id="businessType" type="text" className={styles.input} placeholder="Ví dụ: Sản xuất phân bón, thuốc BVTV" value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button type="submit" className={styles.button} disabled={loading} style={{ marginTop: '0.5rem' }}>
                {loading ? 'Đang hoàn tất...' : 'Bắt đầu sử dụng'}
              </button>
            </form>
          )}

          {step === 1 && (
            <div className={styles.footer}>
              Đã có tài khoản?{' '}
              <Link href="/login" className={styles.footerLink}>
                Đăng nhập ngay
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
