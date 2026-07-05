'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Package } from 'lucide-react';
import styles from '@/css/Dashboard.module.css';

export default function MarketplacePage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Marketplace (Sàn Giao Dịch Vật Tư)</h1>
          <p className={styles.subtitle}>Quản lý các sản phẩm vật tư nông nghiệp được đăng bán trên AgriLog.</p>
        </div>
      </div>
      
      <Card style={{ textAlign: 'center', padding: '4rem 2rem', marginTop: '2rem' }}>
        <Package size={64} color="var(--color-primary-300)" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>Tính năng đang phát triển</h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '500px', margin: '0 auto' }}>
          Module quản lý Marketplace hiện chưa được kết nối với cơ sở dữ liệu. Nhóm phát triển đang xây dựng hệ thống cơ sở dữ liệu cho Sàn thương mại điện tử vật tư nông nghiệp.
        </p>
      </Card>
    </div>
  );
}
