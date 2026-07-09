const fs = require('fs');
const newContent = `/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/css/billing.module.css';
import { Check } from 'lucide-react';
import { fetchAPI } from '@/lib/api';

export default function BillingPage() {
  const [profile, setProfile] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleUpgrade = async (planCode: string) => {
    if (profile?.plan === planCode) return;
    
    try {
      const res = await fetchAPI('/farm/profile', {
        method: 'PUT',
        body: JSON.stringify({
          plan: planCode,
          farmName: profile?.farmName || 'Nông trại mẫu'
        }),
      });
      if (res.success) {
        alert(\`Chúc mừng! Bạn đã thay đổi gói dịch vụ thành công sang \${planCode}\`);
        loadData();
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
        {packages.map((pkg) => (
          <div key={pkg._id} className={\`\${styles.pricingCard} \${pkg.code === 'STANDARD' ? styles.popular : ''} \${currentPlan === pkg.code ? styles.activeCard : ''}\`}>
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
              className={\`\${styles.button} \${currentPlan === pkg.code ? styles.btnDisabled : (pkg.code === 'STANDARD' ? styles.btnSolid : styles.btnOutline)}\`}
              onClick={() => handleUpgrade(pkg.code)}
              disabled={currentPlan === pkg.code || !pkg.isActive}
            >
              {!pkg.isActive ? 'Ngừng cung cấp' : currentPlan === pkg.code ? 'Gói hiện tại' : 'Chọn gói này'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/app/(farm)/billing/page.tsx', newContent);
console.log("Updated billing page");
