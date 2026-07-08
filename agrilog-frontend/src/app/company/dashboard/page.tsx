/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { Package, ShoppingCart, DollarSign, TrendingUp, BarChart3, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function CompanyDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchAPI('/orders/company/stats');
        if (res.success) setStats(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Đang tải thống kê...</div>;

  const cards = [
    { label: 'Tổng sản phẩm', value: stats?.totalProducts || 0, icon: <Package size={24} />, color: '#3b82f6' },
    { label: 'Đã duyệt', value: stats?.approvedProducts || 0, icon: <TrendingUp size={24} />, color: '#16a34a' },
    { label: 'Chờ duyệt', value: stats?.pendingProducts || 0, icon: <Clock size={24} />, color: '#f59e0b' },
    { label: 'Tổng đơn hàng', value: stats?.totalOrders || 0, icon: <ShoppingCart size={24} />, color: '#8b5cf6' },
    { label: 'Doanh thu', value: `${(stats?.totalRevenue || 0).toLocaleString('vi-VN')}đ`, icon: <DollarSign size={24} />, color: '#06b6d4' },
    { label: 'Hoa hồng phải trả', value: `${(stats?.totalCommission || 0).toLocaleString('vi-VN')}đ`, icon: <BarChart3 size={24} />, color: '#ef4444' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Dashboard Doanh nghiệp</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Tổng quan hoạt động kinh doanh trên AgriLog Marketplace.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        {cards.map((c, i) => (
          <Card key={i} style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{c.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{c.value}</div>
              </div>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: `${c.color}15`, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {c.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>Thông tin hoa hồng</h2>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Mức hoa hồng hiện tại: </span>
            <strong style={{ color: 'var(--color-primary-600)' }}>{stats?.commissionRate || 0}%</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Thu nhập thực tế: </span>
            <strong style={{ color: '#16a34a' }}>{(stats?.netIncome || 0).toLocaleString('vi-VN')}đ</strong>
          </div>
        </div>
      </Card>
    </div>
  );
}
