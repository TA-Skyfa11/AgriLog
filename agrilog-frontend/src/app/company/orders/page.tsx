/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'react-hot-toast';

const STATUS_MAP: Record<string, { label: string; variant: string }> = {
  PENDING: { label: 'Chờ xác nhận', variant: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', variant: 'info' },
  SHIPPING: { label: 'Đang giao', variant: 'info' },
  DELIVERED: { label: 'Đã giao', variant: 'success' },
  CANCELLED: { label: 'Đã hủy', variant: 'danger' },
};

export default function CompanyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const res = await fetchAPI('/orders/company');
      if (res.success) setOrders(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadOrders(); }, []);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await fetchAPI(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      loadOrders();
    } catch (e: any) {
      toast.error(e.message || 'Cập nhật thất bại');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Đang tải đơn hàng...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Đơn hàng nhận được</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Quản lý đơn hàng từ các nông trại trên hệ thống.</p>
      </div>

      {orders.length === 0 ? (
        <Card style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>Chưa có đơn hàng nào.</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(order => {
            const si = STATUS_MAP[order.status] || { label: order.status, variant: 'default' };
            return (
              <Card key={order._id} style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Mã đơn: </span>
                    <strong style={{ fontSize: '0.85rem' }}>{order._id.substring(0, 10)}...</strong>
                    <span style={{ margin: '0 0.5rem', color: 'var(--color-text-muted)' }}>|</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Từ: {order.farm?.email || 'N/A'}</span>
                  </div>
                  <Badge variant={si.variant as any}>{si.label}</Badge>
                </div>

                <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                      <span>{item.productName} × {item.quantity}</span>
                      <span>{(item.priceAtPurchase * item.quantity).toLocaleString('vi-VN')}đ</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.85rem' }}>
                    <strong>Tổng: {order.totalAmount?.toLocaleString('vi-VN')}đ</strong>
                    <span style={{ color: 'var(--color-text-muted)', marginLeft: '1rem' }}>Hoa hồng: {order.commissionAmount?.toLocaleString('vi-VN')}đ ({order.commissionRate}%)</span>
                  </div>
                  {order.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => updateStatus(order._id, 'CONFIRMED')} style={{ padding: '0.4rem 0.75rem', backgroundColor: 'var(--color-primary-600)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Xác nhận</button>
                      <button onClick={() => updateStatus(order._id, 'CANCELLED')} style={{ padding: '0.4rem 0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Hủy</button>
                    </div>
                  )}
                  {order.status === 'CONFIRMED' && (
                    <button onClick={() => updateStatus(order._id, 'SHIPPING')} style={{ padding: '0.4rem 0.75rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Giao hàng</button>
                  )}
                  {order.status === 'SHIPPING' && (
                    <button onClick={() => updateStatus(order._id, 'DELIVERED')} style={{ padding: '0.4rem 0.75rem', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Đã giao</button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
