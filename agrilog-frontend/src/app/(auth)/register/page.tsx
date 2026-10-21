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
  Gift,
  Sparkles,
  Sprout,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [role] = useState('FARM');
  
  // Account
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Profile
  const [profileName, setProfileName] = useState(''); // Maps to farmName
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [areaSqm, setAreaSqm] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Free Trial Celebration Info
  const [trialInfo, setTrialInfo] = useState<any>(null);
  const [showPackageList, setShowPackageList] = useState(false);

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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const pollingRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('user');
        if (stored) setCurrentUser(JSON.parse(stored));
      } catch {}
    }
  }, []);

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

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/[\s.-]/g, '');
    if (!cleanPhone) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }

    if (!/^(0|\+84)[0-9]{9}$/.test(cleanPhone)) {
      setError('Số điện thoại không hợp lệ (gồm 10 chữ số, ví dụ: 0987654321)');
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Email không đúng định dạng');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      const registerData = await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone,
          email: email.trim() || undefined,
          password,
          role
        }),
      });

      if (registerData.success) {
        document.cookie = `token=${registerData.token}; path=/; max-age=2592000`; // 30 days
        document.cookie = `role=${registerData.user.role}; path=/; max-age=2592000`;
        
        localStorage.setItem('token', registerData.token);
        localStorage.setItem('user', JSON.stringify(registerData.user));
        setCurrentUser(registerData.user);
        localStorage.removeItem('cart');

        // Set default profileName if empty
        if (!profileName.trim()) {
          setProfileName(`Nông trại ${name.trim() || 'của tôi'}`);
        }
        if (!contactPhone.trim()) {
          setContactPhone(cleanPhone);
        }

        toast.success('Tạo tài khoản thành công! Vui lòng hoàn tất thông tin.');
        setStep(2); // Chuyển sang trang riêng để điền thông tin tài khoản/hồ sơ
      } else {
        setError(registerData.message || 'Đăng ký thất bại');
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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const effectiveName = profileName.trim() || (role === 'FARM' ? `Nông trại ${name.trim() || 'của tôi'}` : `Doanh nghiệp ${name.trim() || 'của tôi'}`);
    const cleanPhone = phone.replace(/[\s.-]/g, '');
    const effectiveContactPhone = contactPhone.trim() || cleanPhone;

    setLoading(true);

    try {
      const profileData = await fetchAPI('/farm/profile', {
        method: 'PUT',
        body: JSON.stringify({
          farmName: effectiveName,
          address,
          areaSqm: areaSqm ? Number(areaSqm) : undefined,
          contactPhone: effectiveContactPhone
        }),
      });

      if (profileData.success) {
        if (profileData.data?.isTrial) {
          setTrialInfo(profileData.data);
        }
        await loadPackages();
        toast.success('Lưu thông tin nông trại thành công!');
        setStep(3); // Go to billing or trial celebration
      } else {
        setError(profileData.message || 'Lưu thông tin nông trại thất bại');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Lưu thông tin thất bại. Vui lòng kiểm tra lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkipProfile = async () => {
    setError('');
    const effectiveName = profileName.trim() || (role === 'FARM' ? `Nông trại ${name.trim() || 'của tôi'}` : `Doanh nghiệp ${name.trim() || 'của tôi'}`);
    const cleanPhone = phone.replace(/[\s.-]/g, '');
    const effectiveContactPhone = contactPhone.trim() || cleanPhone;

    setLoading(true);
    try {
      if (role === 'FARM') {
        const profileData = await fetchAPI('/farm/profile', {
          method: 'PUT',
          body: JSON.stringify({
            farmName: effectiveName,
            contactPhone: effectiveContactPhone,
          }),
        });
        if (profileData.success && profileData.data?.isTrial) {
          setTrialInfo(profileData.data);
        }
        await loadPackages();
        setStep(3);
      } else {
        await fetchAPI('/company/profile', {
          method: 'PUT',
          body: JSON.stringify({
            companyName: effectiveName,
            contactPhone: effectiveContactPhone,
          }),
        });
        router.push('/company/dashboard');
      }
    } catch {
      if (role === 'FARM') {
        setStep(3);
      } else {
        router.push('/company/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  // Billing Actions
  useEffect(() => {
    if (!showSuccess) return;
    if (countdown <= 0) {
      router.push('/dashboard');
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

  const renderStepper = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.75rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        fontSize: '0.825rem', fontWeight: 600,
        color: step === 1 ? 'var(--color-primary-600)' : '#16a34a'
      }}>
        <span style={{
          width: '24px', height: '24px', borderRadius: '50%',
          backgroundColor: step > 1 ? '#16a34a' : 'var(--color-primary-600)',
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700
        }}>
          {step > 1 ? '✓' : '1'}
        </span>
        Tài khoản
      </div>

      <div style={{ width: '28px', height: '2px', backgroundColor: step >= 2 ? '#16a34a' : 'var(--color-border)' }} />

      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        fontSize: '0.825rem', fontWeight: 600,
        color: step === 2 ? 'var(--color-primary-600)' : step > 2 ? '#16a34a' : 'var(--color-text-muted)'
      }}>
        <span style={{
          width: '24px', height: '24px', borderRadius: '50%',
          backgroundColor: step === 2 ? 'var(--color-primary-600)' : step > 2 ? '#16a34a' : 'var(--color-border)',
          color: step >= 2 ? 'white' : 'var(--color-text-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700
        }}>
          {step > 2 ? '✓' : '2'}
        </span>
        Nông trại
      </div>

      {role === 'FARM' && (
        <>
          <div style={{ width: '28px', height: '2px', backgroundColor: step === 3 ? 'var(--color-primary-600)' : 'var(--color-border)' }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.825rem', fontWeight: 600,
            color: step === 3 ? 'var(--color-primary-600)' : 'var(--color-text-muted)'
          }}>
            <span style={{
              width: '24px', height: '24px', borderRadius: '50%',
              backgroundColor: step === 3 ? 'var(--color-primary-600)' : 'var(--color-border)',
              color: step === 3 ? 'white' : 'var(--color-text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700
            }}>
              3
            </span>
            Gói dịch vụ
          </div>
        </>
      )}
    </div>
  );

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

    if (trialInfo && !showPackageList) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '1.5rem', textAlign: 'center',
          animation: 'fadeIn 0.5s ease'
        }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 12px rgba(16,185,129,0.15)',
            marginBottom: '1.25rem', color: '#fff'
          }}>
            <Gift size={40} />
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.35rem 0.85rem', backgroundColor: '#ecfdf5', color: '#059669',
            borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem'
          }}>
            <Sparkles size={14} /> TẶNG GÓI DÙNG THỬ MIỄN PHÍ
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 0.75rem 0' }}>
            Chúc mừng bạn đã tạo tài khoản thành công!
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.925rem', maxWidth: '480px', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
            Nông trại của bạn đã được kích hoạt gói dùng thử <strong style={{ color: '#059669' }}>{(trialInfo.effectivePlan === 'ALL' || trialInfo.plan === 'ALL') ? 'Toàn bộ cả 3 gói dịch vụ' : (trialInfo.effectivePlan || trialInfo.plan || 'PREMIUM')}</strong> với đầy đủ mọi tính năng.
            {trialInfo.planExpiresAt && (
              <> Thời hạn dùng thử đến ngày <strong style={{ color: '#0f172a' }}>{new Date(trialInfo.planExpiresAt).toLocaleDateString('vi-VN')}</strong>.</>
            )}
          </p>

          <div style={{
            width: '100%', maxWidth: '440px', backgroundColor: '#f8fafc',
            borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem',
            display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'left',
            marginBottom: '1.75rem', fontSize: '0.875rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#1e293b' }}>
              <CheckCircle2 size={16} color="#10b981" /> Trọn bộ công cụ ghi chép nhật ký canh tác
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#1e293b' }}>
              <CheckCircle2 size={16} color="#10b981" /> Quản lý phân bón, thuốc BVTV không giới hạn
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#1e293b' }}>
              <CheckCircle2 size={16} color="#10b981" /> Quản lý chi phí vật tư và mùa vụ nâng cao
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#1e293b' }}>
              <CheckCircle2 size={16} color="#10b981" /> Không trừ tiền, chỉ gia hạn khi hết hạn dùng thử
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className={styles.button}
            style={{
              padding: '0.875rem 2.5rem', fontSize: '1rem', fontWeight: 700,
              backgroundColor: '#10b981', color: 'white', borderRadius: '8px',
              border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              marginBottom: '1rem', width: '100%', maxWidth: '340px'
            }}
          >
            Bắt đầu trải nghiệm ngay
          </button>

          <button
            onClick={() => setShowPackageList(true)}
            style={{
              background: 'none', border: 'none', color: '#64748b',
              fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline'
            }}
          >
            Xem bảng so sánh các gói dịch vụ
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
          {trialInfo?.isTrial 
            ? `Tài khoản đang có gói dùng thử ${trialInfo.effectivePlan || 'PREMIUM'}. Bạn cũng có thể mua gói để sử dụng lâu dài.`
            : 'Bạn có thể nâng cấp để mở rộng tính năng, hoặc bỏ qua để dùng bản miễn phí.'}
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
          {trialInfo?.isTrial ? 'Bỏ qua & Vào Bảng Điều Khiển ngay' : 'Bỏ qua, dùng bản miễn phí (Free)'}
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
        <div className={styles.card} style={step === 3 ? { maxWidth: '800px', width: '100%' } : { maxWidth: '480px', width: '100%' }}>
          {step === 1 && (
            <>
              {renderStepper()}

              <div className={styles.header} style={{ marginBottom: '1.5rem' }}>
                <h1 className={styles.title} style={{ fontSize: '1.875rem' }}>Đăng ký Tài Khoản</h1>
                <p className={styles.subtitle}>Điền thông tin để tạo tài khoản mới</p>
              </div>
              
              {error && <div style={{ color: 'var(--color-error)', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center', backgroundColor: '#fee2e2', padding: '0.75rem', borderRadius: '8px' }}>{error}</div>}

              <form className={styles.form} onSubmit={handleAccountSubmit}>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="name">Họ và tên <span style={{ color: 'red' }}>*</span></label>
                  <input id="name" type="text" className={styles.input} placeholder="Nguyễn Văn A" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="phone">Số điện thoại <span style={{ color: 'red' }}>*</span></label>
                  <input id="phone" type="tel" className={styles.input} placeholder="0987654321" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="email">Email <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85em', fontWeight: 'normal' }}>(Tùy chọn)</span></label>
                  <input id="email" type="email" className={styles.input} placeholder="nhap@email.com (không bắt buộc)" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="password">Mật khẩu <span style={{ color: 'red' }}>*</span></label>
                  <input id="password" type="password" className={styles.input} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="confirmPassword">Xác nhận mật khẩu <span style={{ color: 'red' }}>*</span></label>
                  <input id="confirmPassword" type="password" className={styles.input} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>

                <button type="submit" className={styles.button} disabled={loading} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {loading ? 'Đang tạo tài khoản...' : <>Tiếp tục: Thiết lập thông tin <ArrowRight size={16} /></>}
                </button>
              </form>

              <div className={styles.footer} style={{ marginTop: '1.25rem' }}>
                Đã có tài khoản?{' '}
                <Link href="/login" className={styles.footerLink}>
                  Đăng nhập ngay
                </Link>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {renderStepper()}

              <div className={styles.header} style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  marginBottom: '0.5rem'
                }}>
                  <Sprout size={14} />
                  Hồ sơ Nông trại
                </div>
                <h1 className={styles.title} style={{ fontSize: '1.875rem' }}>
                  Thông tin Nông Trại
                </h1>
                <p className={styles.subtitle}>
                  Bổ sung thông tin nông trại của bạn để bắt đầu quản lý mùa vụ
                </p>
              </div>

              {error && <div style={{ color: 'var(--color-error)', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center', backgroundColor: '#fee2e2', padding: '0.75rem', borderRadius: '8px' }}>{error}</div>}

              <form className={styles.form} onSubmit={handleProfileSubmit}>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="profileName">
                    Tên Nông Trại <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    id="profileName"
                    type="text"
                    className={styles.input}
                    placeholder="Ví dụ: Nông trại Xanh Đà Lạt"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="contactPhone">Số điện thoại liên hệ</label>
                  <input
                    id="contactPhone"
                    type="tel"
                    className={styles.input}
                    placeholder={phone || "0987654321"}
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Để trống sẽ tự động dùng số điện thoại tài khoản ({phone})
                  </span>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="address">Địa chỉ</label>
                  <input
                    id="address"
                    type="text"
                    className={styles.input}
                    placeholder="Ví dụ: Xã Tân Hội, Huyện Đức Trọng, Lâm Đồng"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="areaSqm">Diện tích tổng (m²)</label>
                    <input
                      id="areaSqm"
                      type="number"
                      className={styles.input}
                      placeholder="Ví dụ: 5000"
                      value={areaSqm}
                      onChange={(e) => setAreaSqm(e.target.value)}
                    />
                  </div>

                <button type="submit" className={styles.button} disabled={loading} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {loading ? 'Đang lưu...' : <>Hoàn tất & Tiếp tục <ArrowRight size={16} /></>}
                </button>

                <button
                  type="button"
                  onClick={handleSkipProfile}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    textAlign: 'center',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-text-main)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                >
                  Bỏ qua bước này, thiết lập sau
                </button>
              </form>
            </>
          )}

          {step === 3 && renderBillingStep()}
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

              {Boolean(currentUser?.allowDevPayment || currentUser?.role === 'ADMIN') && (
                <button
                  className={billingStyles.simulateBtn}
                  onClick={handleSimulatePayment}
                  disabled={isSimulating}
                >
                  <Zap size={14} color="#ca8a04" />
                  {isSimulating ? 'Đang kích hoạt gói...' : '⚡ Mô phỏng thanh toán thành công (Dev Test)'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
