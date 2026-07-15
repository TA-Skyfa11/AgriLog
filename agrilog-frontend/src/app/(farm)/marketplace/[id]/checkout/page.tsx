/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function CheckoutPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchAPI(`/products/${id}`);
        if (res.success) {
          setProduct(res.data);
        } else {
          toast.error('Không tìm thấy sản phẩm');
          router.push('/marketplace');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, router]);

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setOrdering(true);
    try {
      const res = await fetchAPI('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: [{
            productId: product._id,
            quantity: quantity
          }],
          note: note
        })
      });
      if (res.success) {
        setSuccess(true);
      } else {
        toast.error(res.message || 'Đặt hàng thất bại');
      }
    } catch (err: any) {
      toast.error(err.message || 'Đặt hàng thất bại');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải thông tin sản phẩm...</div>;
  if (!product) return null;

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem' }}>
        <CheckCircle size={80} color="#10b981" />
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-main)' }}>Đặt hàng thành công!</h1>
        <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '400px' }}>
          Đơn hàng của bạn đã được gửi tới doanh nghiệp. Bạn có thể theo dõi trạng thái đơn hàng trong trang Lịch sử mua hàng.
        </p>
        <Link 
          href="/marketplace"
          style={{ padding: '0.75rem 2rem', backgroundColor: 'var(--color-primary-600)', color: 'white', borderRadius: '8px', fontWeight: 600, textDecoration: 'none', marginTop: '1rem' }}
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <Link href={`/marketplace/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', textDecoration: 'none', fontWeight: 600, width: 'fit-content' }}>
        <ArrowLeft size={18} /> Quay lại chi tiết sản phẩm
      </Link>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Xác nhận đặt hàng</h1>

      <Card style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ width: '100px', height: '100px', backgroundColor: '#f3f4f6', borderRadius: '8px', overflow: 'hidden' }}>
            {product.images && product.images.length > 0 ? (
              <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : null}
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{product.name}</h3>
            <div style={{ color: 'var(--color-primary-600)', fontWeight: 600, marginBottom: '0.5rem' }}>
              {product.price.toLocaleString('vi-VN')}đ / {product.unit}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Cung cấp bởi: {product.company?.email || 'Doanh nghiệp'}
            </div>
          </div>
        </div>

        <form onSubmit={handleOrderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Số lượng</label>
            <input 
              type="number" 
              min={1} 
              max={product.stock} 
              value={quantity} 
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              style={{ width: '100%', maxWidth: '200px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '1rem' }}
            />
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Tối đa có thể mua: {product.stock} {product.unit}</div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Ghi chú giao hàng (Tùy chọn)</label>
            <textarea 
              rows={3}
              placeholder="Nhập ghi chú cho doanh nghiệp..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.9rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Tổng thanh toán:</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444' }}>
              {(product.price * quantity).toLocaleString('vi-VN')}đ
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Link 
              href={`/marketplace/${id}`}
              style={{ padding: '0.75rem 1.5rem', backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: '8px', fontWeight: 600, textDecoration: 'none', color: 'var(--color-text-main)' }}
            >
              Hủy
            </Link>
            <button 
              type="submit" 
              disabled={ordering || quantity < 1 || quantity > product.stock}
              style={{ 
                padding: '0.75rem 2rem', backgroundColor: 'var(--color-primary-600)', color: 'white', 
                border: 'none', borderRadius: '8px', fontWeight: 600, cursor: (ordering || quantity < 1 || quantity > product.stock) ? 'not-allowed' : 'pointer',
                opacity: (ordering || quantity < 1 || quantity > product.stock) ? 0.7 : 1
              }}
            >
              {ordering ? 'Đang xử lý...' : 'Xác nhận đặt mua'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
