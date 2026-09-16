/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/login.module.css';
import billingStyles from '@/css/billing.module.css';
import {
  Check,
  X,
  CheckCircle2,
  Copy,
  Clock,
  RefreshCw,
  Zap,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('FARM'); // FARM or COMPANY
  
  // Account
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Profile
  const [profileName, setProfileName] = useState(''); // Maps to farmName or companyName
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [areaSqm, setAreaSqm] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [businessType, setBusinessType] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Billing & SePay
  const [packages, setPackages] = useState<any[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(900);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const pollingRef = React.useRef<NodeJS.Timeout | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (!profileName.trim()) {
      setError(role === 'FARM' ? 'Vui lòng nhập Tên Nông Trại' : 'Vui lòng nhập Tên Doanh Nghiệp');
      return;
    }

    setLoading(true);

    try {
      const registerData = await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });

      if (registerData.success) {
        document.cookie = `token=${registerData.token}; path=/; max-age=2592000`; // 30 days
        document.cookie = `role=${registerData.user.role}; path=/; max-age=2592000`;
        
        localStorage.setItem('token', registerData.token);
        localStorage.setItem('user', JSON.stringify(registerData.user));
        localStorage.removeItem('cart'); // Clear cart on new account

        // Now setup profile
        if (role === 'FARM') {
          const profileData = await fetchAPI('/farm/profile', {
            method: 'PUT',
            body: JSON.stringify({
              farmName: profileName,
              address,
              areaSqm: areaSqm ? Number(areaSqm) : undefined,
              contactPhone
            }),
          });
          if (profileData.success) {
            await loadPackages();
            setStep(2); // Go to billing
          }
        } else {
          const profileData = await fetchAPI('/company/profile', {
            method: 'PUT',
            body: JSON.stringify({
              companyName: profileName,
              address,
              contactPhone,
              taxCode,
              businessType
            }),
          });
          if (profileData.success) {
            router.push('/company/dashboard');
          }
        }
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

  // Billing Actions
  useEffect(() => {
    if (!showSuccess) return;
    if (countdown <= 0) {
      router.push(role === 'FARM' ? '/dashboard' : '/company/dashboard');
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [showSuccess, countdown, router, role]);

  // Đếm ngược thời gian đơn thanh toán (15 phút)
  useEffect(() => {
    if (!showQRModal || !paymentData) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Lệnh thanh toán đã hết hạn');
          setShowQRModal(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showQRModal, paymentData]);

  const handlePaymentSuccess = React.useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setShowQRModal(false);
    setShowSuccess(true);
    setCountdown(5);
    toast.success('Thanh toán thành công! Gói cước đã được kích hoạt.');
  }, []);

  // Polling tự động kiểm tra trạng thái thanh toán mỗi 2.5s
  useEffect(() => {
    if (!showQRModal || !paymentData?.paymentCode) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetchAPI(`/payment/status/${paymentData.paymentCode}`);
        if (res.success && res.data?.status === 'SUCCESS') {
          handlePaymentSuccess();
        }
      } catch {
        // ignore polling err
      }
    };

    pollingRef.current = setInterval(checkStatus, 2500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [showQRModal, paymentData, handlePaymentSuccess]);

  const handleSkipBilling = () => {
    router.push('/dashboard');
  };

  const handleSelectPlan = async (pkg: any) => {
    setSelectedPkg(pkg);
    setIsCreatingPayment(true);

    try {
      const res = await fetchAPI('/payment/create', {
        method: 'POST',
        body: JSON.stringify({ packageCode: pkg.code }),
      });

      if (res.success && res.data) {
        setPaymentData(res.data);
        setTimeLeft(900);
        setShowQRModal(true);
      } else {
        toast.error(res.message || 'Không thể tạo giao dịch thanh toán');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi tạo giao dịch thanh toán');
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleCheckStatusNow = async () => {
    if (!paymentData?.paymentCode) return;
    setIsCheckingPayment(true);

    try {
      const res = await fetchAPI(`/payment/status/${paymentData.paymentCode}`);
      if (res.success) {
        if (res.data?.status === 'SUCCESS') {
          handlePaymentSuccess();
        } else if (res.data?.status === 'EXPIRED') {
          toast.error('Giao dịch này đã hết hạn');
          setShowQRModal(false);
        } else {
          toast('Hệ thống chưa nhận được tiền chuyển khoản. Vui lòng thử lại sau vài giây.', {
            icon: '⏳',
          });
        }
      }
    } catch {
      toast.error('Không thể kiểm tra trạng thái lúc này');
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!paymentData?.paymentCode) return;
    setIsSimulating(true);

    try {
      const res = await fetchAPI('/payment/dev-simulate', {
        method: 'POST',
        body: JSON.stringify({ paymentCode: paymentData.paymentCode }),
      });

      if (res.success) {
        handlePaymentSuccess();
      } else {
        toast.error(res.message || 'Mô phỏng thất bại');
      }
    } catch {
      toast.error('Lỗi khi mô phỏng thanh toán');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${fieldName}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderBillingStep = () => {
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
                disabled={!pkg.isActive || isCreatingPayment}
              >
                {isCreatingPayment && selectedPkg?.code === pkg.code ? 'Đang tạo...' : 'Chọn gói'}
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
        <div className={styles.card} style={step === 2 ? { maxWidth: '800px', width: '100%' } : { maxHeight: '90vh', overflowY: 'auto', paddingRight: '1rem' }}>
          {step === 1 && (
            <>
              <div className={styles.header}>
                <h1 className={styles.title}>Đăng ký Tài Khoản</h1>
                <p className={styles.subtitle}>Điền đầy đủ thông tin để tham gia nền tảng</p>
              </div>
              
              {error && <div style={{ color: 'var(--color-error)', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center', backgroundColor: '#fee2e2', padding: '0.75rem', borderRadius: '8px' }}>{error}</div>}

              <form className={styles.form} onSubmit={handleSubmit}>
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
                  <label className={styles.label} htmlFor="name">Họ và tên <span style={{ color: 'red' }}>*</span></label>
                  <input id="name" type="text" className={styles.input} placeholder="Nguyễn Văn A" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="email">Email <span style={{ color: 'red' }}>*</span></label>
                  <input id="email" type="email" className={styles.input} placeholder="nhap@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="password">Mật khẩu <span style={{ color: 'red' }}>*</span></label>
                  <input id="password" type="password" className={styles.input} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="confirmPassword">Xác nhận mật khẩu <span style={{ color: 'red' }}>*</span></label>
                  <input id="confirmPassword" type="password" className={styles.input} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>

                <hr style={{ margin: '1.5rem 0', borderColor: 'var(--color-border)', borderTop: 'none' }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 1rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="profileName">{role === 'FARM' ? 'Tên Nông Trại' : 'Tên Doanh Nghiệp'} <span style={{ color: 'red' }}>*</span></label>
                    <input id="profileName" type="text" className={styles.input} placeholder={role === 'FARM' ? "Ví dụ: Nông trại Xanh" : "Ví dụ: Cty Bình Điền"} value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="contactPhone">Số điện thoại</label>
                    <input id="contactPhone" type="tel" className={styles.input} placeholder="0987654321" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="address">Địa chỉ</label>
                    <input id="address" type="text" className={styles.input} placeholder="Tỉnh/Thành phố..." value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>

                  {role === 'FARM' ? (
                    <div className={styles.formGroup}>
                      <label className={styles.label} htmlFor="areaSqm">Diện tích tổng (m²)</label>
                      <input id="areaSqm" type="number" className={styles.input} placeholder="Ví dụ: 5000" value={areaSqm} onChange={(e) => setAreaSqm(e.target.value)} />
                    </div>
                  ) : (
                    <div className={styles.formGroup}>
                      <label className={styles.label} htmlFor="taxCode">Mã số thuế</label>
                      <input id="taxCode" type="text" className={styles.input} placeholder="Ví dụ: 0312345678" value={taxCode} onChange={(e) => setTaxCode(e.target.value)} />
                    </div>
                  )}

                  {role === 'COMPANY' && (
                    <div className={styles.formGroup} style={{ gridColumn: '1 / span 2' }}>
                      <label className={styles.label} htmlFor="businessType">Loại hình kinh doanh</label>
                      <input id="businessType" type="text" className={styles.input} placeholder="Ví dụ: Sản xuất phân bón, thuốc BVTV" value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
                    </div>
                  )}
                </div>

                <button type="submit" className={styles.button} disabled={loading} style={{ marginTop: '1rem' }}>
                  {loading ? 'Đang xử lý...' : 'Đăng ký & Bắt đầu sử dụng'}
                </button>
              </form>

              <div className={styles.footer}>
                Đã có tài khoản?{' '}
                <Link href="/login" className={styles.footerLink}>
                  Đăng nhập ngay
                </Link>
              </div>
            </>
          )}

          {step === 2 && renderBillingStep()}
        </div>
      </div>

      {/* QR Modal Step 2 */}
      {/* SePay QR Modal Step 2 */}
      {showQRModal && paymentData && (
        <div className={billingStyles.modalOverlay}>
          <div className={billingStyles.modalContent}>
            {/* Close button */}
            <button className={billingStyles.modalCloseBtn} onClick={() => setShowQRModal(false)}>
              <X size={18} />
            </button>

            {/* Header */}
            <div className={billingStyles.modalHeader}>
              <div className={billingStyles.sepayBranding}>
                <ShieldCheck size={14} /> Cổng thanh toán tự động SePay
              </div>
              <h2 className={billingStyles.modalTitle}>Thanh toán gói {paymentData.packageName}</h2>
              <p className={billingStyles.modalSubtitle}>
                Quét mã VietQR bằng ứng dụng ngân hàng bất kỳ để hoàn tất nâng cấp
              </p>
            </div>

            {/* Amount Banner */}
            <div className={billingStyles.amountBanner}>
              <div className={billingStyles.amountLabel}>Số tiền cần thanh toán</div>
              <div className={billingStyles.amountValue}>
                {paymentData.amount.toLocaleString('vi-VN')} VNĐ
              </div>
            </div>

            {/* QR Code Container */}
            <div className={billingStyles.qrContainer}>
              <img
                src={paymentData.qrUrl}
                alt="SePay VietQR MBBank"
                className={billingStyles.qrImage}
                onError={(e) => {
                  if (paymentData.vietqrUrl) {
                    (e.target as HTMLImageElement).src = paymentData.vietqrUrl;
                  }
                }}
              />
              <div className={billingStyles.qrInstructions}>
                Mở ứng dụng Ngân hàng hoặc ví điện tử để quét mã thanh toán tức thì
              </div>
            </div>

            {/* Thông tin chuyển khoản và nút sao chép */}
            <div className={billingStyles.bankDetailsCard}>
              <div className={billingStyles.bankRow}>
                <span className={billingStyles.bankLabel}>Ngân hàng:</span>
                <span className={billingStyles.bankValue}>
                  {paymentData.bankName} (Ngân hàng Quân Đội)
                </span>
              </div>

              <div className={billingStyles.bankRow}>
                <span className={billingStyles.bankLabel}>Số tài khoản:</span>
                <div className={billingStyles.bankValue}>
                  <span>{paymentData.accountNumber}</span>
                  <button
                    className={`${billingStyles.copyBtn} ${
                      copiedField === 'Số tài khoản' ? billingStyles.copied : ''
                    }`}
                    onClick={() => handleCopy(paymentData.accountNumber, 'Số tài khoản')}
                  >
                    {copiedField === 'Số tài khoản' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'Số tài khoản' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>

              <div className={billingStyles.bankRow}>
                <span className={billingStyles.bankLabel}>Chủ tài khoản:</span>
                <span className={billingStyles.bankValue}>{paymentData.accountHolder}</span>
              </div>

              <div className={billingStyles.bankRow}>
                <span className={billingStyles.bankLabel}>Số tiền:</span>
                <div className={billingStyles.bankValue}>
                  <span>{paymentData.amount.toLocaleString('vi-VN')} đ</span>
                  <button
                    className={`${billingStyles.copyBtn} ${copiedField === 'Số tiền' ? billingStyles.copied : ''}`}
                    onClick={() => handleCopy(paymentData.amount.toString(), 'Số tiền')}
                  >
                    {copiedField === 'Số tiền' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'Số tiền' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>

              <div className={billingStyles.bankRow}>
                <span className={billingStyles.bankLabel}>Nội dung CK:</span>
                <div className={billingStyles.bankValue}>
                  <span className={billingStyles.transferContentHighlight}>
                    {paymentData.paymentCode}
                  </span>
                  <button
                    className={`${billingStyles.copyBtn} ${
                      copiedField === 'Nội dung chuyển khoản' ? billingStyles.copied : ''
                    }`}
                    onClick={() => handleCopy(paymentData.paymentCode, 'Nội dung chuyển khoản')}
                  >
                    {copiedField === 'Nội dung chuyển khoản' ? (
                      <Check size={12} />
                    ) : (
                      <Copy size={12} />
                    )}
                    {copiedField === 'Nội dung chuyển khoản' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>

              <div className={billingStyles.contentWarning}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Quan trọng:</strong> Vui lòng giữ nguyên nội dung chuyển khoản{' '}
                  <code style={{ fontWeight: 800 }}>{paymentData.paymentCode}</code> để hệ thống tự
                  động kích hoạt gói cước ngay khi nhận được tiền.
                </span>
              </div>
            </div>

            {/* Trạng thái real-time & Bộ đếm giờ */}
            <div className={billingStyles.statusRow}>
              <div className={billingStyles.pulsingStatus}>
                <div className={billingStyles.pulseDot}></div>
                <span>Hệ thống đang đợi nhận tiền...</span>
              </div>
              <div className={billingStyles.timer}>
                <Clock size={14} />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Các nút hành động */}
            <div className={billingStyles.modalActions}>
              <button
                className={billingStyles.checkStatusBtn}
                onClick={handleCheckStatusNow}
                disabled={isCheckingPayment}
              >
                <RefreshCw
                  size={16}
                  style={isCheckingPayment ? { animation: 'spin 1s linear infinite' } : {}}
                />
                {isCheckingPayment ? 'Đang kiểm tra SePay...' : 'Tôi đã chuyển khoản - Kiểm tra ngay'}
              </button>

              <button
                className={billingStyles.simulateBtn}
                onClick={handleSimulatePayment}
                disabled={isSimulating}
              >
                <Zap size={14} color="#ca8a04" />
                {isSimulating ? 'Đang kích hoạt gói...' : '⚡ Mô phỏng thanh toán thành công (Dev Test)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
