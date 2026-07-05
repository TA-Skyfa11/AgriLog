'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { ShoppingCart } from 'lucide-react';
import styles from '@/css/Dashboard.module.css';

export default function OrdersPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý Đơn hàng</h1>
          <p className={styles.subtitle}>Theo dõi và xử lý các đơn hàng trên toàn hệ thống.</p>
        </div>
      </div>
      
      <Card style={{ textAlign: 'center', padding: '4rem 2rem', marginTop: '2rem' }}>
        <ShoppingCart size={64} color="var(--color-primary-300)" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>Tính năng đang phát triển</h2>
        <p style={{ color: 'var(--color-text-muted)', maxWidth: '500px', margin: '0 auto' }}>
          Module quản lý Đơn hàng hiện chưa được kết nối với cơ sở dữ liệu. Nhóm phát triển đang xây dựng hệ thống giỏ hàng và thanh toán.
        </p>
      </Card>
    </div>
  );
}
