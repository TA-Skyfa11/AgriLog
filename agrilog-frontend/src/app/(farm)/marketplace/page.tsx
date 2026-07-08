/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Search, ShoppingCart, Eye } from 'lucide-react';
import Link from 'next/link';

const CATEGORY_LABELS: Record<string, string> = {
  ALL: 'Tất cả',
  FERTILIZER: 'Phân bón',
  PESTICIDE: 'Thuốc BVTV',
  SEED: 'Hạt giống',
  TOOL: 'Nông cụ',
  OTHER: 'Khác',
};

export default function FarmMarketplacePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');

  const loadProducts = async () => {
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (category !== 'ALL') query.append('category', category);
      
      const res = await fetchAPI(`/products?${query.toString()}`);
      if (res.success) setProducts(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadProducts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, category]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Chợ Nông Nghiệp</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Khám phá và mua sắm vật tư nông nghiệp từ các doanh nghiệp uy tín.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              placeholder="Tìm kiếm sản phẩm..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '0.65rem 1rem 0.65rem 2.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.9rem', width: '250px' }}
            />
          </div>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            style={{ padding: '0.65rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.9rem', backgroundColor: 'white' }}
          >
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải sản phẩm...</div>
      ) : products.length === 0 ? (
        <Card style={{ padding: '4rem', textAlign: 'center' }}>
          <ShoppingCart size={48} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Không tìm thấy sản phẩm</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {products.map(p => (
            <Link key={p._id} href={`/marketplace/${p._id}`} style={{ textDecoration: 'none' }}>
              <Card style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', transition: 'transform 0.2s', cursor: 'pointer' }} className="hover:shadow-lg">
                <div style={{ height: '180px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.images && p.images.length > 0 ? (
                    <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ color: '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <ShoppingCart size={32} />
                      <span>No Image</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary-600)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                    {CATEGORY_LABELS[p.category]}
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                    {p.name}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.description}
                  </p>
                  
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                        {p.price.toLocaleString('vi-VN')}đ
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        / {p.unit} • Tồn: {p.stock}
                      </div>
                    </div>
                    
                    <div 
                      style={{ 
                        padding: '0.5rem 1rem', 
                        backgroundColor: p.stock > 0 ? 'var(--color-primary-50)' : '#e5e7eb', 
                        color: p.stock > 0 ? 'var(--color-primary-700)' : '#9ca3af', 
                        borderRadius: '6px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem'
                      }}
                    >
                      <Eye size={16} /> Xem
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
