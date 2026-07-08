/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ShoppingCart } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; variant: string }> = {
  PENDING: { label: 'Chờ xác nhận', variant: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', variant: 'info' },
  SHIPPING: { label: 'Đang giao', variant: 'info' },
  DELIVERED: { label: 'Đã giao', variant: 'success' },
  CANCELLED: { label: 'Đã hủy', variant: 'danger' },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const res = await fetchAPI('/admin/orders');
      if (res.success) setOrders(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Quản lý Đơn hàng</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Theo dõi toàn bộ đơn hàng diễn ra trên Marketplace.</p>
      </div>

      {loading ? (
        <div style={{ padding: '2rem' }}>Đang tải đơn hàng...</div>
      ) : orders.length === 0 ? (
        <Card style={{ padding: '4rem', textAlign: 'center' }}>
          <ShoppingCart size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Chưa có đơn hàng nào</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>Các đơn hàng giao dịch sẽ hiển thị tại đây.</p>
        </Card>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem' }}>Mã Đơn</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem' }}>Nông Trại (Mua)</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem' }}>Doanh Nghiệp (Bán)</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.8rem' }}>Tổng tiền</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.8rem' }}>Hoa hồng</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const si = STATUS_MAP[order.status] || { label: order.status, variant: 'default' };
                return (
                  <tr key={order._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600 }}>{order._id.substring(0, 8).toUpperCase()}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{order.farm?.email || 'N/A'}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{order.company?.email || 'N/A'}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>{order.totalAmount?.toLocaleString('vi-VN')}đ</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--color-primary-600)' }}>
                      {order.commissionAmount?.toLocaleString('vi-VN')}đ <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>({order.commissionRate}%)</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <Badge variant={si.variant as any}>{si.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
