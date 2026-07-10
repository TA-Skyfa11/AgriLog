'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ShoppingCart, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/context/AppProvider';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCheckout = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      clearCart();
    }, 1500);
  };

  if (success) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 1rem' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Đặt hàng thành công!</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
          Đơn hàng của bạn đã được ghi nhận. Nhà cung cấp sẽ liên hệ với bạn trong thời gian sớm nhất.
        </p>
        <Link href="/marketplace" style={{ display: 'inline-block', padding: '0.75rem 2rem', backgroundColor: 'var(--color-primary-600)', color: 'white', borderRadius: '8px', fontWeight: 600, textDecoration: 'none' }}>
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Link href="/marketplace" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', textDecoration: 'none', fontWeight: 600, width: 'fit-content' }}>
        <ArrowLeft size={18} /> Quay lại chợ
      </Link>

      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-main)' }}>Thanh toán giỏ hàng</h1>

      {cart.length === 0 ? (
        <Card style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <ShoppingCart size={64} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Giỏ hàng của bạn đang trống</h3>
          <Link href="/marketplace" style={{ display: 'inline-block', padding: '0.75rem 2rem', backgroundColor: 'var(--color-primary-600)', color: 'white', borderRadius: '8px', fontWeight: 600, textDecoration: 'none' }}>
            Khám phá vật tư
          </Link>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Card>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>Thông tin giao hàng</h2>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Họ và tên người nhận</label>
                  <input type="text" placeholder="Nhập họ và tên..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Số điện thoại</label>
                  <input type="tel" placeholder="Nhập số điện thoại..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Địa chỉ nhận hàng chi tiết</label>
                  <input type="text" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Ghi chú đơn hàng (Tùy chọn)</label>
                  <textarea placeholder="Lưu ý cho người bán hoặc người giao hàng..." rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', resize: 'vertical' }}></textarea>
                </div>
              </div>
            </Card>

            <Card>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>Danh sách sản phẩm ({cart.length})</h2>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {cart.map(item => (
                  <div key={item.product._id} style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: '80px', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.product.images && item.product.images.length > 0 ? (
                        <img src={item.product.images[0]} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <ShoppingCart color="#9ca3af" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{item.product.name}</div>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Đơn vị: {item.product.unit}</div>
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      {item.quantity} x {item.product.price.toLocaleString('vi-VN')}đ
                    </div>
                    <div style={{ fontWeight: 700, color: '#ef4444', minWidth: '100px', textAlign: 'right' }}>
                      {(item.quantity * item.product.price).toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card style={{ height: 'fit-content' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>Tổng quan đơn hàng</h2>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}>
                <span>Tạm tính ({cart.length} sản phẩm):</span>
                <span>{total.toLocaleString('vi-VN')}đ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}>
                <span>Phí vận chuyển:</span>
                <span>Thỏa thuận</span>
              </div>
              <div style={{ borderTop: '1px dashed #e2e8f0', margin: '0.5rem 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.25rem' }}>
                <span>Tổng cộng:</span>
                <span style={{ color: '#ef4444' }}>{total.toLocaleString('vi-VN')}đ</span>
              </div>
              
              <button 
                onClick={handleCheckout}
                disabled={loading}
                style={{
                  width: '100%', padding: '1rem', marginTop: '1rem',
                  backgroundColor: loading ? '#9ca3af' : 'var(--color-primary-600)',
                  color: 'white', borderRadius: '8px', fontWeight: 700, fontSize: '1.1rem',
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
