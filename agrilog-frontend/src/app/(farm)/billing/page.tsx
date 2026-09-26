/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from '@/css/billing.module.css';
import {
  Check,
  X,
  CheckCircle2,
  Copy,
  Clock,
  RefreshCw,
  Zap,
  ShieldCheck,
  Crown,
  Calendar,
  AlertTriangle,
  Sparkles,
  Gift,
} from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function BillingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('user');
        if (stored) setCurrentUser(JSON.parse(stored));
      } catch {}
    }
  }, []);

  // SePay QR Payment Modal state
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 phút (900s)

  // Success screen state
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = async () => {
    try {
      const [profileRes, pkgRes, historyRes, meRes] = await Promise.all([
        fetchAPI('/farm/profile'),
        fetchAPI('/services'),
        fetchAPI('/payment/history').catch(() => ({ success: false, data: [] })),
        fetchAPI('/auth/me').catch(() => ({ success: false, data: null })),
      ]);

      if (profileRes.success) {
        setProfile(profileRes.data);
      }
      if (pkgRes.success) {
        setPackages(pkgRes.data);
      }
      if (historyRes.success) {
        setHistory(historyRes.data);
      }
      if (meRes.success && meRes.data) {
        setCurrentUser(meRes.data);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu gói cước:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Đếm ngược màn hình thành công
  useEffect(() => {
    if (!showSuccess) return;
    if (countdown <= 0) {
      router.push('/dashboard');
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [showSuccess, countdown, router]);

  // Đếm ngược thời gian hiệu lực của đơn thanh toán (15 phút)
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
    loadData();
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
        // Bỏ qua lỗi polling thông thường
      }
    };

    pollingRef.current = setInterval(checkStatus, 2500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [showQRModal, paymentData, handlePaymentSuccess]);

  // Khởi tạo giao dịch thanh toán SePay
  const handleSelectPlan = async (pkg: any) => {
    const isExpired = profile?.isPlanExpired || (profile?.planExpiresAt && new Date(profile.planExpiresAt) < new Date());
    if (profile?.plan === pkg.code && !isExpired) return;
    setSelectedPkg(pkg);
    setIsCreatingPayment(true);

    try {
      const res = await fetchAPI('/payment/create', {
        method: 'POST',
        body: JSON.stringify({ packageCode: pkg.code }),
      });

      if (res.success && res.data) {
        setPaymentData(res.data);
        setTimeLeft(900); // 15 phút
        setShowQRModal(true);
      } else {
        toast.error(res.message || 'Không thể tạo giao dịch thanh toán');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tạo giao dịch thanh toán');
      console.error(error);
    } finally {
      setIsCreatingPayment(false);
    }
  };

  // Kiểm tra chủ động trạng thái qua SePay API
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

  // Nút mô phỏng thanh toán (Dev/Test mode)
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

  // Hàm sao chép thông tin
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

  if (loading) return <div style={{ padding: '2rem' }}>Đang tải thông tin gói cước...</div>;

  const isExpired = Boolean(profile?.isPlanExpired || (profile?.planExpiresAt && new Date(profile.planExpiresAt) < new Date()));
  const isTrial = Boolean(profile?.isTrial && !isExpired);
  const currentPlan = isExpired ? 'EXPIRED' : (profile?.plan || 'FREE');
  const daysLeft = profile?.planExpiresAt 
    ? Math.max(0, Math.ceil((new Date(profile.planExpiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // ─── Success Screen ───────────────────────────────────────
  if (showSuccess) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          gap: '1.5rem',
          textAlign: 'center',
          padding: '2rem',
          animation: 'fadeIn 0.5s ease',
        }}
      >
        <div
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 0 12px rgba(34,197,94,0.15), 0 0 0 24px rgba(34,197,94,0.07)',
            animation: 'scaleIn 0.5s ease',
          }}
        >
          <CheckCircle2 size={56} color="white" />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0 }}>
          Thanh toán thành công qua SePay!
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--color-text-muted)', maxWidth: '520px', lineHeight: 1.6 }}>
          Bạn đã nâng cấp thành công lên gói{' '}
          <strong style={{ color: 'var(--color-primary-600)' }}>
            {selectedPkg?.name || paymentData?.packageName}
          </strong>
          . Hệ thống đã tự động kích hoạt tất cả đặc quyền và thời hạn 30 ngày cho nông trại của bạn!
        </p>
        <div
          style={{
            padding: '0.75rem 1.5rem',
            background: 'var(--color-bg)',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
            fontWeight: 600,
          }}
        >
          Tự động chuyển hướng về trang chủ sau{' '}
          <span style={{ color: 'var(--color-primary-600)', fontWeight: 800 }}>{countdown}s</span>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            marginTop: '0.5rem',
            padding: '0.875rem 2.5rem',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '9999px',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 14px rgba(22,163,74,0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(22,163,74,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(22,163,74,0.3)';
          }}
        >
          Về trang quản trị ngay
        </button>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scaleIn {
            from { transform: scale(0.5); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // ─── Main Billing Page ────────────────────────────────────
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gói Dịch Vụ &amp; Thanh Toán SePay</h1>
        <p className={styles.subtitle}>
          Nâng cấp gói dịch vụ để mở rộng thêm số lượng bảng nhật ký và tính năng nâng cao
        </p>
      </div>

      {/* Cảnh báo khi gói cước / gói dùng thử đã hết hạn */}
      {isExpired && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '50%',
            backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#dc2626', flexShrink: 0
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.35rem 0', color: '#991b1b', fontSize: '1.1rem', fontWeight: 700 }}>
              Gói dịch vụ {profile?.isTrial ? 'dùng thử ' : ''}của bạn đã hết hạn!
            </h3>
            <p style={{ margin: 0, color: '#b91c1c', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Thời hạn sử dụng đã kết thúc vào ngày {profile?.planExpiresAt ? new Date(profile.planExpiresAt).toLocaleDateString('vi-VN') : ''}. 
              Các tính năng tạo mới bảng nhật ký và ghi chép canh tác hiện đang tạm thời bị khóa.
              Vui lòng chọn một trong các gói dịch vụ bên dưới để thanh toán kích hoạt lại tài khoản.
            </p>
          </div>
        </div>
      )}

      {/* Banner thông báo gói cước hiện tại */}
      {profile && (
        <div className={styles.activePlanBanner} style={isExpired ? { borderLeft: '4px solid #ef4444', backgroundColor: '#fff5f5' } : (isTrial ? { borderLeft: '4px solid #10b981', backgroundColor: '#f0fdf4' } : undefined)}>
          <div className={styles.activePlanInfo}>
            <div className={styles.activePlanIcon} style={isExpired ? { backgroundColor: '#fee2e2', color: '#ef4444' } : (isTrial ? { backgroundColor: '#dcfce7', color: '#16a34a' } : undefined)}>
              {isExpired ? <AlertTriangle size={22} /> : isTrial ? <Sparkles size={22} /> : <Crown size={22} />}
            </div>
            <div className={styles.activePlanText}>
              <h3>
                {isExpired ? (
                  <>Trạng thái: <strong style={{ color: '#dc2626' }}>Gói {profile.plan || 'dịch vụ'} đã hết hạn</strong></>
                ) : isTrial ? (
                  <>Nông trại hiện đang dùng: <strong style={{ color: '#15803d' }}>Gói {profile.effectivePlan || profile.plan} (Dùng thử miễn phí)</strong></>
                ) : (
                  <>Nông trại hiện đang dùng: <strong>Gói {currentPlan}</strong></>
                )}
              </h3>
              <p>
                {isExpired
                  ? 'Toàn bộ tính năng tạo mới bảng và ghi chép đã tạm khóa. Vui lòng thanh toán gia hạn bên dưới.'
                  : isTrial
                  ? `Bạn đang được trải nghiệm miễn phí toàn bộ tính năng cao cấp không giới hạn (${daysLeft} ngày còn lại).`
                  : currentPlan === 'FREE'
                  ? 'Gói miễn phí với tính năng ghi chép cơ bản.'
                  : `Tất cả các tính năng của gói ${currentPlan} đang hoạt động bình thường.`}
              </p>
            </div>
          </div>
          {profile.planExpiresAt && (
            <div className={styles.activePlanExpiry} style={isExpired ? { backgroundColor: '#fee2e2', color: '#b91c1c' } : (isTrial ? { backgroundColor: '#dcfce7', color: '#15803d' } : undefined)}>
              <Calendar size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
              {isExpired ? 'Đã hết hạn: ' : isTrial ? 'Hạn dùng thử: ' : 'Hạn dùng: '}
              {new Date(profile.planExpiresAt).toLocaleDateString('vi-VN')}
              {!isExpired && isTrial && ` (${daysLeft} ngày)`}
            </div>
          )}
        </div>
      )}

      {/* Grid danh sách các gói dịch vụ */}
      <div className={styles.pricingGrid}>
        {packages.map((pkg) => {
          const isCurrentActive = profile?.plan === pkg.code && !isExpired;
          return (
            <div
              key={pkg._id}
              className={`${styles.pricingCard} ${pkg.code === 'STANDARD' ? styles.popular : ''} ${
                isCurrentActive ? styles.activeCard : ''
              }`}
            >
              {pkg.code === 'STANDARD' && <div className={styles.popularBadge}>Phổ biến nhất</div>}
              <div className={styles.planName}>{pkg.name}</div>
              <div className={styles.planDesc}>{pkg.description}</div>
              <div className={styles.planPrice}>
                {pkg.price.toLocaleString('vi-VN')} VNĐ <span>/ tháng</span>
              </div>
              <div className={styles.featureList}>
                {pkg.features &&
                  pkg.features.map((feature: string, idx: number) => (
                    <div key={idx} className={styles.featureItem}>
                      <Check size={18} color="#16a34a" /> {feature}
                    </div>
                  ))}
              </div>
              <button
                className={`${styles.button} ${
                  isCurrentActive ? styles.btnDisabled : styles.btnOutline
                }`}
                onClick={() => handleSelectPlan(pkg)}
                disabled={isCurrentActive || !pkg.isActive || isCreatingPayment}
              >
                {!pkg.isActive
                  ? 'Ngừng cung cấp'
                  : isCurrentActive
                  ? 'Gói hiện tại'
                  : isCreatingPayment && selectedPkg?.code === pkg.code
                  ? 'Đang khởi tạo...'
                  : isExpired && profile?.plan === pkg.code
                  ? 'Gia hạn gói này'
                  : 'Nâng cấp ngay'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Bảng lịch sử giao dịch thanh toán */}
      {history.length > 0 && (
        <div className={styles.historySection}>
          <div className={styles.historyHeader}>
            <h2>Lịch sử giao dịch</h2>
            <p>Các giao dịch thanh toán nâng cấp gói cước qua SePay của tài khoản</p>
          </div>
          <div className={styles.historyTableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Gói dịch vụ</th>
                  <th>Số tiền</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <code style={{ fontWeight: 700, color: 'var(--color-primary-700)' }}>
                        {item.paymentCode}
                      </code>
                    </td>
                    <td>
                      <strong>{item.packageName}</strong>
                    </td>
                    <td>{item.amount.toLocaleString('vi-VN')} VNĐ</td>
                    <td>{new Date(item.createdAt).toLocaleString('vi-VN')}</td>
                    <td>
                      {item.status === 'SUCCESS' ? (
                        <span className={styles.badgeSuccess}>
                          <CheckCircle2 size={12} /> Thành công
                        </span>
                      ) : item.status === 'PENDING' ? (
                        <span className={styles.badgePending}>
                          <Clock size={12} /> Chờ chuyển khoản
                        </span>
                      ) : (
                        <span className={styles.badgeExpired}>Hết hạn / Hủy</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── SePay Payment Modal ─────────────────────────────── */}
      {showQRModal && paymentData && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {/* Close button */}
            <button className={styles.modalCloseBtn} onClick={() => setShowQRModal(false)}>
              <X size={18} />
            </button>

            {/* Header */}
            <div className={styles.modalHeader}>
              <div className={styles.sepayBranding}>
                <ShieldCheck size={14} /> Cổng thanh toán tự động SePay
              </div>
              <h2 className={styles.modalTitle}>Thanh toán gói {paymentData.packageName}</h2>
              <p className={styles.modalSubtitle}>
                Quét mã VietQR bằng ứng dụng ngân hàng bất kỳ để hoàn tất nâng cấp
              </p>
            </div>

            {/* Amount Banner */}
            <div className={styles.amountBanner}>
              <div className={styles.amountLabel}>Số tiền cần thanh toán</div>
              <div className={styles.amountValue}>
                {paymentData.amount.toLocaleString('vi-VN')} VNĐ
              </div>
            </div>

            {/* QR Code Container */}
            <div className={styles.qrContainer}>
              <img
                src={paymentData.qrUrl}
                alt="SePay VietQR MBBank"
                className={styles.qrImage}
                onError={(e) => {
                  // Fallback sang vietqrUrl nếu qr.sepay.vn gặp sự cố
                  if (paymentData.vietqrUrl) {
                    (e.target as HTMLImageElement).src = paymentData.vietqrUrl;
                  }
                }}
              />
              <div className={styles.qrInstructions}>
                Mở ứng dụng Ngân hàng hoặc ví điện tử để quét mã thanh toán tức thì
              </div>
            </div>

            {/* Thông tin chuyển khoản và nút sao chép */}
            <div className={styles.bankDetailsCard}>
              <div className={styles.bankRow}>
                <span className={styles.bankLabel}>Ngân hàng:</span>
                <span className={styles.bankValue}>
                  {paymentData.bankName} (Ngân hàng Quân Đội)
                </span>
              </div>

              <div className={styles.bankRow}>
                <span className={styles.bankLabel}>Số tài khoản:</span>
                <div className={styles.bankValue}>
                  <span>{paymentData.accountNumber}</span>
                  <button
                    className={`${styles.copyBtn} ${
                      copiedField === 'Số tài khoản' ? styles.copied : ''
                    }`}
                    onClick={() => handleCopy(paymentData.accountNumber, 'Số tài khoản')}
                  >
                    {copiedField === 'Số tài khoản' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'Số tài khoản' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>

              <div className={styles.bankRow}>
                <span className={styles.bankLabel}>Chủ tài khoản:</span>
                <span className={styles.bankValue}>{paymentData.accountHolder}</span>
              </div>

              <div className={styles.bankRow}>
                <span className={styles.bankLabel}>Số tiền:</span>
                <div className={styles.bankValue}>
                  <span>{paymentData.amount.toLocaleString('vi-VN')} đ</span>
                  <button
                    className={`${styles.copyBtn} ${copiedField === 'Số tiền' ? styles.copied : ''}`}
                    onClick={() => handleCopy(paymentData.amount.toString(), 'Số tiền')}
                  >
                    {copiedField === 'Số tiền' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'Số tiền' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>

              <div className={styles.bankRow}>
                <span className={styles.bankLabel}>Nội dung CK:</span>
                <div className={styles.bankValue}>
                  <span className={styles.transferContentHighlight}>
                    {paymentData.paymentCode}
                  </span>
                  <button
                    className={`${styles.copyBtn} ${
                      copiedField === 'Nội dung chuyển khoản' ? styles.copied : ''
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

              <div className={styles.contentWarning}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Quan trọng:</strong> Vui lòng giữ nguyên nội dung chuyển khoản{' '}
                  <code style={{ fontWeight: 800 }}>{paymentData.paymentCode}</code> để hệ thống tự
                  động kích hoạt gói cước ngay khi nhận được tiền.
                </span>
              </div>
            </div>

            {/* Trạng thái real-time & Bộ đếm giờ */}
            <div className={styles.statusRow}>
              <div className={styles.pulsingStatus}>
                <div className={styles.pulseDot}></div>
                <span>Hệ thống đang đợi nhận tiền...</span>
              </div>
              <div className={styles.timer}>
                <Clock size={14} />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Các nút hành động */}
            <div className={styles.modalActions}>
              <button
                className={styles.checkStatusBtn}
                onClick={handleCheckStatusNow}
                disabled={isCheckingPayment}
              >
                <RefreshCw
                  size={16}
                  style={isCheckingPayment ? { animation: 'spin 1s linear infinite' } : {}}
                />
                {isCheckingPayment ? 'Đang kiểm tra SePay...' : 'Tôi đã chuyển khoản - Kiểm tra ngay'}
              </button>

              {/* Nút mô phỏng thanh toán dành riêng cho tài khoản được Admin cấp phép */}
              {Boolean(currentUser?.allowDevPayment || currentUser?.role === 'ADMIN') && (
                <button
                  className={styles.simulateBtn}
                  onClick={handleSimulatePayment}
                  disabled={isSimulating}
                  title="Tính năng mô phỏng thanh toán dành cho tài khoản được Admin cấp phép"
                >
                  <Zap size={14} color="#ca8a04" />
                  {isSimulating ? 'Đang kích hoạt gói...' : '⚡ Mô phỏng thanh toán thành công (Dev Test)'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
