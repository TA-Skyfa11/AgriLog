/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/css/billing.module.css';
import { Check } from 'lucide-react';
import { fetchAPI } from '@/lib/api';

export default function BillingPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const res = await fetchAPI('/farm/profile');
      if (res.success) {
        setProfile(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpgrade = async (planName: 'BASIC' | 'STANDARD' | 'PREMIUM') => {
    if (profile?.plan === planName) return;
    
    try {
      const res = await fetchAPI('/farm/profile', {
        method: 'PUT',
        body: JSON.stringify({
          plan: planName,
          farmName: profile?.farmName || 'Nông trại mẫu' // Keep existing required name
        }),
      });
      if (res.success) {
        alert(`Chúc mừng! Bạn đã thay đổi gói dịch vụ thành công sang ${planName}`);
        loadProfile();
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi nâng cấp gói dịch vụ');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Đang tải thông tin gói...</div>;

  const currentPlan = profile?.plan || 'BASIC';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gói Dịch Vụ & Thanh Toán</h1>
        <p className={styles.subtitle}>Nâng cấp gói dịch vụ để mở rộng thêm cột thông tin và số lượng bảng nhật ký</p>
      </div>

      <div className={styles.pricingGrid}>
        <div className={`${styles.pricingCard} ${currentPlan === 'BASIC' ? styles.activeCard : ''}`}>
          <div className={styles.planName}>Basic (Cơ Bản)</div>
          <div className={styles.planDesc}>Dành cho nông hộ nhỏ.</div>
          <div className={styles.planPrice}>
            290.000 VNĐ <span>/ tháng</span>
          </div>
          <div className={styles.featureList}>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Tạo tối đa 3 bảng nhật ký</div>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Tối đa 10 cột thông tin/sheet</div>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Đính kèm tối đa 50 ảnh/tháng</div>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Lưu trữ dữ liệu truy xuất 1 năm</div>
          </div>
          <button 
            className={`${styles.button} ${currentPlan === 'BASIC' ? styles.btnDisabled : styles.btnOutline}`}
            onClick={() => handleUpgrade('BASIC')}
            disabled={currentPlan === 'BASIC'}
          >
            {currentPlan === 'BASIC' ? 'Gói hiện tại' : 'Chọn gói này'}
          </button>
        </div>

        <div className={`${styles.pricingCard} ${styles.popular} ${currentPlan === 'STANDARD' ? styles.activeCard : ''}`}>
          <div className={styles.popularBadge}>Phổ biến nhất</div>
          <div className={styles.planName}>Standard (Tiêu Chuẩn)</div>
          <div className={styles.planDesc}>Dành cho HTX & nông trại trung bình.</div>
          <div className={styles.planPrice}>
            590.000 VNĐ <span>/ tháng</span>
          </div>
          <div className={styles.featureList}>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Tạo tối đa 5 bảng nhật ký</div>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Tối đa 15 cột thông tin/sheet</div>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Đính kèm tối đa 500 ảnh/tháng</div>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Hỗ trợ hồ sơ VietGAP</div>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Lưu trữ dữ liệu truy xuất 2 năm</div>
          </div>
          <button 
            className={`${styles.button} ${currentPlan === 'STANDARD' ? styles.btnDisabled : styles.btnSolid}`}
            onClick={() => handleUpgrade('STANDARD')}
            disabled={currentPlan === 'STANDARD'}
          >
            {currentPlan === 'STANDARD' ? 'Gói hiện tại' : 'Nâng cấp ngay'}
          </button>
        </div>

        <div className={`${styles.pricingCard} ${currentPlan === 'PREMIUM' ? styles.activeCard : ''}`}>
          <div className={styles.planName}>Premium (Cao Cấp)</div>
          <div className={styles.planDesc}>Dành cho các doanh nghiệp quy mô lớn.</div>
          <div className={styles.planPrice}>
            990.000 VNĐ <span>/ tháng</span>
          </div>
          <div className={styles.featureList}>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Tạo tối đa 15 bảng nhật ký</div>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Tối đa 25 cột thông tin/sheet</div>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Đính kèm không giới hạn hình ảnh</div>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Hỗ trợ hồ sơ VietGAP + GlobalGAP</div>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Lưu trữ dữ liệu truy xuất 3 năm</div>
          </div>
          <button 
            className={`${styles.button} ${currentPlan === 'PREMIUM' ? styles.btnDisabled : styles.btnOutline}`}
            onClick={() => handleUpgrade('PREMIUM')}
            disabled={currentPlan === 'PREMIUM'}
          >
            {currentPlan === 'PREMIUM' ? 'Gói hiện tại' : 'Chọn gói này'}
          </button>
        </div>
      </div>
    </div>
  );
}
