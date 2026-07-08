/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';

const CATEGORY_LABELS: Record<string, string> = {
  FERTILIZER: 'Phân bón',
  PESTICIDE: 'Thuốc BVTV',
  SEED: 'Hạt giống',
  TOOL: 'Nông cụ',
  OTHER: 'Khác',
};

const STATUS_MAP: Record<string, { label: string; variant: string }> = {
  PENDING: { label: 'Chờ duyệt', variant: 'warning' },
  APPROVED: { label: 'Đã duyệt', variant: 'success' },
  REJECTED: { label: 'Từ chối', variant: 'danger' },
};

export default function CompanyProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    try {
      const res = await fetchAPI('/products/mine');
      if (res.success) setProducts(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadProducts(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      await fetchAPI(`/products/${id}`, { method: 'DELETE' });
      loadProducts();
    } catch (e: any) {
      alert(e.message || 'Xóa thất bại');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Đang tải sản phẩm...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Sản phẩm của tôi</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Quản lý danh sách sản phẩm đăng bán trên Marketplace.</p>
        </div>
        <Link href="/company/products/new" style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem',
          backgroundColor: 'var(--color-primary-600)', color: 'white', borderRadius: '8px',
          fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none'
        }}>
          <Plus size={18} /> Thêm sản phẩm
        </Link>
      </div>

      {products.length === 0 ? (
        <Card style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>Bạn chưa có sản phẩm nào. Hãy thêm sản phẩm đầu tiên!</p>
        </Card>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Tên sản phẩm</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Danh mục</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Giá</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Tồn kho</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Trạng thái</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const statusInfo = STATUS_MAP[p.status] || { label: p.status, variant: 'default' };
                return (
                  <tr key={p._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>
                      {p.name}
                      {p.status === 'REJECTED' && p.rejectionReason && (
                        <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>Lý do: {p.rejectionReason}</div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{CATEGORY_LABELS[p.category] || p.category}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>{p.price?.toLocaleString('vi-VN')}đ/{p.unit}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{p.stock}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <Badge variant={statusInfo.variant as any}>{statusInfo.label}</Badge>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={() => handleDelete(p._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Xóa">
                          <Trash2 size={16} />
                        </button>
                      </div>
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
