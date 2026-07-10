/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI, API_URL } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, Upload, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('FERTILIZER');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [stock, setStock] = useState('');
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterWarning, setFilterWarning] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageMode === 'url') setImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFilterWarning('');
    setLoading(true);

    try {
      let images: string[] = [];

      if (imageMode === 'upload' && imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);

        const token = localStorage.getItem('token');
        const uploadRes = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
        });

        let uploadData;
        const contentType = uploadRes.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          uploadData = await uploadRes.json();
        } else {
          const text = await uploadRes.text();
          throw new Error(`Upload API returned non-JSON (Status ${uploadRes.status}): ` + text.substring(0, 100));
        }
        
        if (!uploadData.success) {
          throw new Error(uploadData.message || 'Lỗi tải ảnh lên');
        }
        images.push(uploadData.imageUrl);
      } else if (imageMode === 'url' && imageUrl) {
        images.push(imageUrl);
      }

      if (images.length === 0) {
        throw new Error('Vui lòng cung cấp hình ảnh sản phẩm');
      }

      const token = localStorage.getItem('token');
      const resResponse = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name, description, category,
          price: Number(price), unit,
          stock: Number(stock) || 0,
          images
        }),
      });

      let res;
      const resContentType = resResponse.headers.get('content-type');
      if (resContentType && resContentType.includes('application/json')) {
        res = await resResponse.json();
      } else {
        const text = await resResponse.text();
        throw new Error(`Products API returned non-JSON (Status ${resResponse.status}): ` + text.substring(0, 100));
      }
      
      if (!resResponse.ok) {
        throw new Error(res.message || 'Có lỗi xảy ra khi tạo sản phẩm');
      }

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '700px', margin: '0 auto' }}>
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
          
          <div>
            <label style={labelStyle}>Hình ảnh sản phẩm <span style={{ color: 'red' }}>*</span></label>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button type="button" onClick={() => setImageMode('url')} style={{
                    padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--color-border)',
                    backgroundColor: imageMode === 'url' ? 'var(--color-primary-100)' : 'white',
                    color: imageMode === 'url' ? 'var(--color-primary-700)' : 'var(--color-text-main)',
                    fontWeight: imageMode === 'url' ? 600 : 400, cursor: 'pointer'
                }}>Gắn link ảnh</button>
                <button type="button" onClick={() => setImageMode('upload')} style={{
                    padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--color-border)',
                    backgroundColor: imageMode === 'upload' ? 'var(--color-primary-100)' : 'white',
                    color: imageMode === 'upload' ? 'var(--color-primary-700)' : 'var(--color-text-main)',
                    fontWeight: imageMode === 'upload' ? 600 : 400, cursor: 'pointer'
                }}>Tải ảnh từ máy</button>
            </div>

            {imageMode === 'url' && (
                <div style={{ marginBottom: '1rem' }}>
                    <input style={inputStyle} value={imageUrl} onChange={e => {
                        setImageUrl(e.target.value);
                        setImagePreview(e.target.value);
                    }} placeholder="Nhập đường link ảnh (VD: https://...)" />
                </div>
            )}

            {imageMode === 'upload' && !imagePreview && (
              <div style={{ 
                border: '2px dashed var(--color-border)', borderRadius: '8px', padding: '2rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                backgroundColor: '#f8fafc', cursor: 'pointer', marginBottom: '1rem'
              }}
              onClick={() => document.getElementById('imageUpload')?.click()}
              >
                <Upload size={32} color="#94a3b8" style={{ marginBottom: '1rem' }} />
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Nhấn để chọn ảnh (Tối đa 5MB)</span>
                <input id="imageUpload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
              </div>
            )}

            {imagePreview && (
              <div style={{ position: 'relative', width: '200px', height: '200px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                <Image src={imagePreview} alt="Preview" fill style={{ objectFit: 'cover' }} unoptimized />
                <button 
                  type="button" 
                  onClick={removeImage}
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
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

          <button type="submit" disabled={loading || (!imageFile && !imageUrl)} style={{
            padding: '0.85rem', backgroundColor: 'var(--color-primary-600)', color: 'white',
            border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '1rem',
            cursor: loading || (!imageFile && !imageUrl) ? 'not-allowed' : 'pointer', opacity: loading || (!imageFile && !imageUrl) ? 0.7 : 1, marginTop: '0.5rem'
          }}>
            {loading ? 'Đang gửi...' : 'Đăng sản phẩm'}
          </button>
        </form>
      </Card>
    </div>
  );
}