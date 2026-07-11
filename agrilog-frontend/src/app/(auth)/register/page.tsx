/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/login.module.css'; // Reusing the same styles
import billingStyles from '@/css/billing.module.css';
import { Check, X, CheckCircle2 } from 'lucide-react';

const QR_BASE_URL = 'https://api.vietqr.io/image/970422-88020305666999-CYu443p.jpg?accountName=NGUYEN%20TUNG%20ANH';

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

  // Step 3: Billing
  const [packages, setPackages] = useState<any[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

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

  const loadPackages = async () => {
    try {
      const pkgRes = await fetchAPI('/services');
      if (pkgRes.success) {
        setPackages(pkgRes.data);
      }
    } catch (error) {
      console.error(error);
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
          await loadPackages();
          setStep(3); // Go to billing
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

  // Step 3 Actions
  useEffect(() => {
    if (!showSuccess) return;
    if (countdown <= 0) {
      router.push(role === 'FARM' ? '/dashboard' : '/company/dashboard');
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [showSuccess, countdown, router, role]);

  const handleSkipBilling = () => {
    // Farm profile is already FREE by default in the backend
    router.push('/dashboard');
  };

  const handleSelectPlan = (pkg: any) => {
    setSelectedPkg(pkg);
    setShowQRModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPkg) return;

    try {
      const res = await fetchAPI('/farm/profile', {
        method: 'PUT',
        body: JSON.stringify({
          plan: selectedPkg.code,
          farmName // required field in PUT
        }),
      });
      if (res.success) {
        setShowQRModal(false);
        setShowSuccess(true);
        setCountdown(5);
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi xử lý thanh toán');
    }
  };

  const renderStep3 = () => {
    if (showSuccess) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '2rem', animation: 'fadeIn 0.5s ease',
          textAlign: 'center'
        }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 12px rgba(34,197,94,0.15)', animation: 'scaleIn 0.5s ease',
            marginBottom: '1rem'
          }}>
            <CheckCircle2 size={40} color="white" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 1rem 0' }}>
            Thanh toán thành công!
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Bạn đã đăng ký gói <strong style={{ color: 'var(--color-primary-600)' }}>{selectedPkg?.name}</strong>.
          </p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Tự động chuyển hướng sau {countdown}s
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className={styles.button}
            style={{ marginTop: '1rem' }}
          >
            Về trang chính ngay
          </button>
        </div>
      );
    }

    return (
      <div style={{ padding: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
          Chọn gói dịch vụ
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Bạn có thể nâng cấp để mở rộng tính năng, hoặc bỏ qua để dùng bản miễn phí.
        </p>

        <div className={billingStyles.pricingGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {packages.map((pkg) => (
            <div key={pkg._id} className={`${billingStyles.pricingCard} ${pkg.code === 'STANDARD' ? billingStyles.popular : ''}`} style={{ padding: '1.5rem' }}>
              {pkg.code === 'STANDARD' && <div className={billingStyles.popularBadge} style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>Phổ biến nhất</div>}
              <div className={billingStyles.planName} style={{ fontSize: '1rem' }}>{pkg.name}</div>
              <div className={billingStyles.planPrice} style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                {pkg.price.toLocaleString('vi-VN')} <span>/ tháng</span>
              </div>
              <div className={billingStyles.featureList} style={{ gap: '0.5rem', marginBottom: '1.5rem' }}>
                {pkg.features && pkg.features.map((feature: string, idx: number) => (
                  <div key={idx} className={billingStyles.featureItem} style={{ fontSize: '0.75rem' }}><Check size={14} color="#16a34a" /> {feature}</div>
                ))}
              </div>
              <button 
                className={`${billingStyles.button} ${pkg.code === 'STANDARD' ? billingStyles.btnSolid : billingStyles.btnOutline}`}
                style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                onClick={() => handleSelectPlan(pkg)}
                disabled={!pkg.isActive}
              >
                Chọn gói
              </button>
            </div>
          ))}
        </div>

        <button 
          onClick={handleSkipBilling}
          style={{
            width: '100%', marginTop: '1.5rem', padding: '0.875rem',
            background: 'transparent', border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)', borderRadius: '8px', cursor: 'pointer',
            fontWeight: 600, transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          Bỏ qua, dùng bản miễn phí (Free)
        </button>
      </div>
    );
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
        <div className={styles.card} style={step === 3 ? { maxWidth: '800px', width: '100%' } : {}}>
          {step < 3 && (
            <div className={styles.header}>
              <h1 className={styles.title}>{step === 1 ? 'Đăng ký' : (role === 'FARM' ? 'Thiết lập Nông trại' : 'Thiết lập Doanh nghiệp')}</h1>
              <p className={styles.subtitle}>
                {step === 1 
                  ? 'Khởi tạo tài khoản mới' 
                  : 'Cung cấp thông tin để chúng tôi thiết lập không gian cho bạn'}
              </p>
            </div>
          )}
          
          {error && <div style={{ color: 'var(--color-error)', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center', backgroundColor: '#fee2e2', padding: '0.75rem', borderRadius: '8px' }}>{error}</div>}

          {step === 1 && (
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
          )}

          {step === 2 && (
            <form className={styles.form} onSubmit={handleStep2Submit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {role === 'FARM' ? (
                  <>
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
                        <label className={styles.label} htmlFor="mainCropType">Tên người dùng</label>
                        <input id="mainCropType" type="text" className={styles.input} placeholder="Ví dụ: Nguyễn Văn A" value={mainCropType} onChange={(e) => setMainCropType(e.target.value)} />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
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

          {step === 3 && renderStep3()}

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

      {/* QR Modal Step 3 */}
      {showQRModal && selectedPkg && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface, #fff)', borderRadius: '20px',
            padding: '2.5rem', width: '100%', maxWidth: '480px', position: 'relative'
          }}>
            <button 
              onClick={() => setShowQRModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 800 }}>Thanh toán gói {selectedPkg.name}</h2>
            <div style={{ textAlign: 'center', color: '#16a34a', fontSize: '1.75rem', fontWeight: 800, margin: '1rem 0' }}>
              {selectedPkg.price.toLocaleString('vi-VN')} VNĐ
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
              <img
                src={`${QR_BASE_URL}&amount=${selectedPkg.price}`}
                alt="QR thanh toán"
                style={{ width: '220px', height: '220px', borderRadius: '8px' }}
              />
            </div>

            <button
              onClick={handleConfirmPayment}
              style={{
                width: '100%', padding: '1rem', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: 'white', border: 'none', borderRadius: '9999px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              ✓ Tôi đã thanh toán xong
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
