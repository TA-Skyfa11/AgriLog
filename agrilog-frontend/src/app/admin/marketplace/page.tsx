/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDialog } from '@/context/DialogContext';

const CATEGORY_LABELS: Record<string, string> = {
  FERTILIZER: 'Phân bón',
  PESTICIDE: 'Thuốc BVTV',
  SEED: 'Hạt giống',
  TOOL: 'Nông cụ',
  OTHER: 'Khác',
};

export default function AdminMarketplacePage() {
  const dialog = useDialog();

  const [activeTab, setActiveTab] = useState('pending'); // pending, all
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectModal, setRejectModal] = useState<string | null>(null); // productId

  const loadProducts = async () => {
    try {
      const endpoint = activeTab === 'pending' ? '/products/pending' : '/products/all';
      const res = await fetchAPI(endpoint);
      if (res.success) setProducts(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadProducts();
  }, [activeTab]);

  const handleApprove = async (id: string) => {
    if (!(await dialog.confirm('Duyệt sản phẩm này lên Marketplace?'))) return;
    try {
      await fetchAPI(`/products/${id}/approve`, { method: 'PUT' });
      loadProducts();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModal || !rejectReason.trim()) return;
    try {
      await fetchAPI(`/products/${rejectModal}/reject`, { 
        method: 'PUT',
        body: JSON.stringify({ reason: rejectReason })
      });
      setRejectModal(null);
      setRejectReason('');
      loadProducts();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Kiểm duyệt Sản phẩm</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Quản lý và kiểm duyệt các sản phẩm do doanh nghiệp đăng lên Marketplace.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('pending')}
          style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, color: activeTab === 'pending' ? 'var(--color-primary-600)' : 'var(--color-text-muted)', borderBottom: activeTab === 'pending' ? '2px solid var(--color-primary-600)' : '2px solid transparent' }}
        >
          Chờ kiểm duyệt
        </button>
        <button 
          onClick={() => setActiveTab('all')}
          style={{ background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, color: activeTab === 'all' ? 'var(--color-primary-600)' : 'var(--color-text-muted)', borderBottom: activeTab === 'all' ? '2px solid var(--color-primary-600)' : '2px solid transparent' }}
        >
          Tất cả sản phẩm
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '2rem' }}>Đang tải...</div>
      ) : products.length === 0 ? (
        <Card style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>Không có sản phẩm nào.</p>
        </Card>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem' }}>Tên sản phẩm</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem' }}>Doanh nghiệp</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem' }}>Danh mục</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.8rem' }}>Giá</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem' }}>Auto-Filter</th>
                {activeTab === 'all' && <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem' }}>Trạng thái</th>}
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', maxWidth: '250px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{p.company?.email || 'N/A'}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>{CATEGORY_LABELS[p.category]}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>{p.price.toLocaleString()}đ</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    {p.filterPassed ? <Badge variant="success">Pass</Badge> : <Badge variant="danger">Failed</Badge>}
                  </td>
                  {activeTab === 'all' && (
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <Badge variant={p.status === 'APPROVED' ? 'success' : p.status === 'REJECTED' ? 'danger' : 'warning'}>{p.status}</Badge>
                    </td>
                  )}
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    {p.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyItems: 'center', justifyContent: 'center' }}>
                        <button onClick={() => handleApprove(p._id)} style={{ padding: '0.3rem 0.5rem', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem' }}><CheckCircle size={14} /> Duyệt</button>
                        <button onClick={() => setRejectModal(p._id)} style={{ padding: '0.3rem 0.5rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem' }}><XCircle size={14} /> Từ chối</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Card style={{ width: '400px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Từ chối sản phẩm</h3>
            <form onSubmit={handleReject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Lý do từ chối (bắt buộc)</label>
                <textarea 
                  value={rejectReason} 
                  onChange={(e) => setRejectReason(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', minHeight: '80px', resize: 'vertical' }}
                  placeholder="Sản phẩm không phù hợp với tiêu chí..."
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setRejectModal(null); setRejectReason(''); }} style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid var(--color-border)', borderRadius: '6px', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Xác nhận Từ chối</button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
