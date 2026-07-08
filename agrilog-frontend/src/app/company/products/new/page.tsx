/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('FERTILIZER');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [stock, setStock] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterWarning, setFilterWarning] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFilterWarning('');
    setLoading(true);

    try {
      const res = await fetchAPI('/products', {
        method: 'POST',
        body: JSON.stringify({
          name, description, category,
          price: Number(price), unit,
          stock: Number(stock) || 0,
        }),
      });

      if (res.success) {
        if (!res.filterPassed) {
          setFilterWarning(res.message);
        } else {
          router.push('/company/products');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Tạo sản phẩm thất bại');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem',
    border: '1px solid var(--color-border)', borderRadius: '8px',
    fontSize: '0.9rem', backgroundColor: 'var(--color-surface)',
  };
  const labelStyle = { display: 'block' as const, marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-main)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '700px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/company/products" style={{ color: 'var(--color-text-muted)' }}><ArrowLeft size={20} /></Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Thêm sản phẩm mới</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Sản phẩm sẽ được kiểm tra tự động và chờ Admin duyệt.</p>
        </div>
      </div>

      {error && <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.875rem' }}>{error}</div>}
      {filterWarning && (
        <div style={{ padding: '1rem', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '8px', fontSize: '0.875rem', lineHeight: 1.5 }}>
          <strong>⚠ Sản phẩm bị từ chối tự động:</strong><br />{filterWarning}
          <div style={{ marginTop: '0.75rem' }}>
            <Link href="/company/products" style={{ color: '#92400e', fontWeight: 600 }}>← Quay lại danh sách</Link>
          </div>
        </div>
      )}

      <Card style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={labelStyle}>Tên sản phẩm <span style={{ color: 'red' }}>*</span></label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="VD: Phân bón NPK 16-16-8" required />
          </div>

          <div>
            <label style={labelStyle}>Mô tả sản phẩm <span style={{ color: 'red' }}>*</span></label>
            <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' as const }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Mô tả chi tiết về sản phẩm, công dụng, hướng dẫn sử dụng..." required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Danh mục <span style={{ color: 'red' }}>*</span></label>
              <select style={inputStyle} value={category} onChange={e => setCategory(e.target.value)}>
                <option value="FERTILIZER">Phân bón</option>
                <option value="PESTICIDE">Thuốc BVTV</option>
                <option value="SEED">Hạt giống</option>
                <option value="TOOL">Nông cụ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Đơn vị tính <span style={{ color: 'red' }}>*</span></label>
              <input style={inputStyle} value={unit} onChange={e => setUnit(e.target.value)} placeholder="VD: kg, bao, chai..." required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Giá (VNĐ) <span style={{ color: 'red' }}>*</span></label>
              <input style={inputStyle} type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="VD: 150000" required min={0} />
            </div>
            <div>
              <label style={labelStyle}>Số lượng tồn kho</label>
              <input style={inputStyle} type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="VD: 100" min={0} />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            padding: '0.85rem', backgroundColor: 'var(--color-primary-600)', color: 'white',
            border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '0.5rem'
          }}>
            {loading ? 'Đang gửi...' : 'Đăng sản phẩm'}
          </button>
        </form>
      </Card>
    </div>
  );
}
