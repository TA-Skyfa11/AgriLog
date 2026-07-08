/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';

export default function ServicesPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>Quản lý gói dịch vụ</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Cấu hình và quản lý các gói dịch vụ đăng ký cho nông trại.</p>
      </div>

      <Card style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Trang này đang được xây dựng...</p>
      </Card>
    </div>
  );
}
