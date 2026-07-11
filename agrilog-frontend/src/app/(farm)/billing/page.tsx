/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/css/billing.module.css';
import { Check, X, CheckCircle2 } from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

const QR_BASE_URL = 'https://api.vietqr.io/image/970422-88020305666999-CYu443p.jpg?accountName=NGUYEN%20TUNG%20ANH';

export default function BillingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // QR Payment Modal state
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);

  // Success screen state
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const loadData = async () => {
    try {
      const [profileRes, pkgRes] = await Promise.all([
        fetchAPI('/farm/profile'),
        fetchAPI('/services')
      ]);
      
      if (profileRes.success) {
        setProfile(profileRes.data);
      }
      if (pkgRes.success) {
        setPackages(pkgRes.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Countdown timer for success screen
  useEffect(() => {
    if (!showSuccess) return;
    if (countdown <= 0) {
      router.push('/dashboard');
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [showSuccess, countdown, router]);

  const handleSelectPlan = (pkg: any) => {
    if (profile?.plan === pkg.code) return;
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
          farmName: profile?.farmName || 'Nông trại mẫu'
        }),
      });
      if (res.success) {
        setShowQRModal(false);
        setShowSuccess(true);
        setCountdown(5);
        loadData();
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi xử lý thanh toán');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Đang tải thông tin gói...</div>;

  const currentPlan = profile?.plan || 'BASIC';

  // ─── Success Screen ───────────────────────────────────────
  if (showSuccess) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        gap: '1.5rem',
        textAlign: 'center',
        padding: '2rem',
        animation: 'fadeIn 0.5s ease'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 0 12px rgba(34,197,94,0.15), 0 0 0 24px rgba(34,197,94,0.07)',
          animation: 'scaleIn 0.5s ease'
        }}>
          <CheckCircle2 size={56} color="white" />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0 }}>
          Thanh toán thành công!
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--color-text-muted)', maxWidth: '480px', lineHeight: 1.6 }}>
          Bạn đã nâng cấp thành công lên gói <strong style={{ color: 'var(--color-primary-600)' }}>{selectedPkg?.name}</strong>. 
          Tất cả các tính năng mới đã được kích hoạt cho tài khoản của bạn.
        </p>
        <div style={{
          padding: '0.75rem 1.5rem',
          background: 'var(--color-bg)',
          borderRadius: '9999px',
          fontSize: '0.875rem',
          color: 'var(--color-text-muted)',
          fontWeight: 600
        }}>
          Tự động chuyển hướng sau <span style={{ color: 'var(--color-primary-600)', fontWeight: 800 }}>{countdown}s</span>
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
            boxShadow: '0 4px 14px rgba(22,163,74,0.3)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(22,163,74,0.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(22,163,74,0.3)'; }}
        >
          Về trang chính ngay
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
        <h1 className={styles.title}>Gói Dịch Vụ &amp; Thanh Toán</h1>
        <p className={styles.subtitle}>Nâng cấp gói dịch vụ để mở rộng thêm cột thông tin và số lượng bảng nhật ký</p>
      </div>

      <div className={styles.pricingGrid}>
        {packages.map((pkg) => (
          <div key={pkg._id} className={`${styles.pricingCard} ${pkg.code === 'STANDARD' ? styles.popular : ''} ${currentPlan === pkg.code ? styles.activeCard : ''}`}>
            {pkg.code === 'STANDARD' && <div className={styles.popularBadge}>Phổ biến nhất</div>}
            <div className={styles.planName}>{pkg.name}</div>
            <div className={styles.planDesc}>{pkg.description}</div>
            <div className={styles.planPrice}>
              {pkg.price.toLocaleString('vi-VN')} VNĐ <span>/ tháng</span>
            </div>
            <div className={styles.featureList}>
              {pkg.features && pkg.features.map((feature: string, idx: number) => (
                <div key={idx} className={styles.featureItem}><Check size={18} color="#16a34a" /> {feature}</div>
              ))}
            </div>
            <button 
              className={`${styles.button} ${currentPlan === pkg.code ? styles.btnDisabled : (pkg.code === 'STANDARD' ? styles.btnSolid : styles.btnOutline)}`}
              onClick={() => handleSelectPlan(pkg)}
              disabled={currentPlan === pkg.code || !pkg.isActive}
            >
              {!pkg.isActive ? 'Ngừng cung cấp' : currentPlan === pkg.code ? 'Gói hiện tại' : 'Chọn gói này'}
            </button>
          </div>
        ))}
      </div>

      {/* ─── QR Payment Modal ─────────────────────────────── */}
      {showQRModal && selectedPkg && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface, #fff)',
            borderRadius: '20px',
            padding: '2.5rem',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            position: 'relative',
            animation: 'scaleIn 0.3s ease'
          }}>
            {/* Close button */}
            <button 
              onClick={() => setShowQRModal(false)}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'var(--color-bg, #f3f4f6)', border: 'none',
                borderRadius: '50%', width: '36px', height: '36px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--color-text-muted, #6b7280)',
                transition: 'all 0.2s'
              }}
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)', margin: '0 0 0.5rem 0' }}>
                Thanh toán gói {selectedPkg.name}
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                Quét mã QR bên dưới để chuyển khoản thanh toán
              </p>
            </div>

            {/* Amount */}
            <div style={{
              textAlign: 'center',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              border: '1px solid #bbf7d0'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                Số tiền thanh toán
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a' }}>
                {selectedPkg.price.toLocaleString('vi-VN')} VNĐ
              </div>
            </div>

            {/* QR Code */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              padding: '1rem',
              background: 'white',
              borderRadius: '16px',
              border: '2px dashed #d1d5db'
            }}>
              <img
                src={`${QR_BASE_URL}&amount=${selectedPkg.price}`}
                alt="QR thanh toán"
                style={{
                  width: '260px',
                  height: '260px',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }}
              />
            </div>

            {/* Bank info */}
            <div style={{
              background: 'var(--color-bg, #f9fafb)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem',
              fontSize: '0.8125rem',
              color: 'var(--color-text-main)',
              lineHeight: 1.8
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Ngân hàng:</span>
                <strong>MB Bank</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Số tài khoản:</span>
                <strong>88020305666999</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Chủ tài khoản:</span>
                <strong>NGUYEN TUNG ANH</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Nội dung CK:</span>
                <strong>AGRILOG {selectedPkg.code}</strong>
              </div>
            </div>

            {/* Confirm button */}
            <button
              onClick={handleConfirmPayment}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 14px rgba(22,163,74,0.3)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(22,163,74,0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(22,163,74,0.3)'; }}
            >
              ✓ Tôi đã thanh toán xong
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.75rem', marginBottom: 0 }}>
              Vui lòng chuyển khoản đúng số tiền trước khi xác nhận
            </p>
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleIn {
              from { transform: scale(0.9); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
