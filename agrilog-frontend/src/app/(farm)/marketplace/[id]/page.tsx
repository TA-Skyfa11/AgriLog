/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { ShoppingCart, ArrowLeft, Building2, Package, Tag } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAppContext } from '@/context/AppProvider';

export default function ProductDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { addToCart } = useAppContext();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchAPI(`/products/${id}`);
        if (res.success) {
          setProduct(res.data);
        } else {
          alert('Không tìm thấy sản phẩm');
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

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải thông tin sản phẩm...</div>;
  if (!product) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <Link href="/marketplace" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', textDecoration: 'none', fontWeight: 600, width: 'fit-content' }}>
        <ArrowLeft size={18} /> Quay lại chợ
      </Link>

      <Card style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ flex: '1', backgroundColor: '#f3f4f6', minHeight: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {product.images && product.images.length > 0 ? (
              <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ color: '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <ShoppingCart size={64} />
                <span style={{ fontSize: '1.25rem' }}>Chưa có hình ảnh</span>
              </div>
            )}
          </div>
          
          <div style={{ flex: '1', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-primary-600)', fontWeight: 600, fontSize: '0.875rem' }}>
              <Tag size={16} /> {product.category}
            </div>
            
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '1rem', lineHeight: 1.2 }}>
              {product.name}
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              <Building2 size={18} /> Cung cấp bởi: <strong>{product.company?.email || 'Doanh nghiệp'}</strong>
            </div>
            
            <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ef4444', marginBottom: '0.5rem' }}>
                {product.price.toLocaleString('vi-VN')}đ
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--color-text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Package size={18} /> Đơn vị: {product.unit}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShoppingCart size={18} /> Tồn kho: <strong style={{ color: product.stock > 0 ? '#10b981' : '#ef4444' }}>{product.stock}</strong>
                </span>
              </div>
            </div>
            
            <div style={{ marginBottom: '2rem', flexGrow: 1 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Mô tả sản phẩm</h3>
              <p style={{ color: 'var(--color-text-main)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {product.description}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => {
                  addToCart(product, 1);
                  toast.success('Đã thêm vào giỏ hàng', { icon: '🛒' });
                }}
                disabled={product.stock <= 0}
                style={{
                  flex: 1, padding: '1rem', 
                  backgroundColor: 'white', color: 'var(--color-primary-600)',
                  border: '2px solid var(--color-primary-600)',
                  borderRadius: '8px', fontWeight: 700, fontSize: '1.1rem',
                  cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                  opacity: product.stock > 0 ? 1 : 0.5,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                <ShoppingCart size={20} /> Thêm vào giỏ
              </button>

              <Link 
                href={`/marketplace/${product._id}/checkout`}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '1rem', backgroundColor: product.stock > 0 ? 'var(--color-primary-600)' : '#e5e7eb',
                  color: product.stock > 0 ? 'white' : '#9ca3af',
                  borderRadius: '8px', fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none',
                  pointerEvents: product.stock > 0 ? 'auto' : 'none'
                }}
              >
                {product.stock > 0 ? 'Mua ngay' : 'Hết hàng'}
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
