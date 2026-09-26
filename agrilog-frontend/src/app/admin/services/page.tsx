/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Check, X as XIcon, Save, Sparkles, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { fetchAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useDialog } from '@/context/DialogContext';

export default function ServicesPage() {
  const dialog = useDialog();

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Trial Policy State
  const [trialPolicy, setTrialPolicy] = useState({
    isEnabled: true,
    durationMonths: 1,
    trialPlan: 'PREMIUM',
    lockOnExpiry: true
  });
  const [trialLoading, setTrialLoading] = useState(false);
  const [savingTrial, setSavingTrial] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    price: 0,
    maxBoards: 5,
    maxImages: 0,
    isActive: true
  });
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI('/services');
      if (res.success) {
        setServices(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTrialPolicy = async () => {
    setTrialLoading(true);
    try {
      const res = await fetchAPI('/services/trial-policy');
      if (res.success && res.data) {
        setTrialPolicy({
          isEnabled: res.data.isEnabled ?? true,
          durationMonths: res.data.durationMonths ?? 1,
          trialPlan: res.data.trialPlan || 'PREMIUM',
          lockOnExpiry: res.data.lockOnExpiry ?? true
        });
      }
    } catch (err) {
      console.error('Lỗi tải cấu hình dùng thử:', err);
    } finally {
      setTrialLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
    loadTrialPolicy();
  }, []);

  const handleSaveTrialPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTrial(true);
    try {
      const res = await fetchAPI('/services/trial-policy', {
        method: 'PUT',
        body: JSON.stringify(trialPolicy)
      });
      if (res.success) {
        toast.success('Đã lưu cấu hình chính sách dùng thử miễn phí!');
        if (res.data) {
          setTrialPolicy(res.data);
        }
      } else {
        toast.error(res.message || 'Không thể lưu cấu hình dùng thử');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu cấu hình');
    } finally {
      setSavingTrial(false);
    }
  };

  const handleOpenModal = async (service?: any) => {
    if (service) {
      setEditingId(service._id);
      setFormData({
        code: service.code,
        name: service.name,
        description: service.description,
        price: service.price,
        maxBoards: service.maxBoards,
        maxImages: service.maxImages,
        isActive: service.isActive
      });
    } else {
      setEditingId(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        price: 0,
        maxBoards: 5,
        maxImages: 0,
        isActive: true
      });
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');

    try {
      let res;
      if (editingId) {
        res = await fetchAPI(`/services/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetchAPI('/services', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }

      if (res.success) {
        setIsModalOpen(false);
        loadServices();
      } else {
        setError(res.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      setError(err.message || 'Thao tác thất bại');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await dialog.confirm('Bạn có chắc chắn muốn xóa gói dịch vụ này?'))) return;
    try {
      const res = await fetchAPI(`/services/${id}`, { method: 'DELETE' });
      if (res.success) {
        loadServices();
      }
    } catch (err) {
      toast.error('Không thể xóa gói dịch vụ.');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Đang tải...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>Quản lý gói dịch vụ</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Cấu hình chính sách dùng thử miễn phí và quản lý các gói dịch vụ đăng ký cho nông trại.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' }}
        >
          <Plus size={18} /> Thêm gói mới
        </button>
      </div>

      {/* Cấu hình Chính sách Dùng thử Miễn phí cho Tài khoản mới */}
      <Card style={{ padding: '1.5rem', backgroundColor: 'var(--color-surface, #ffffff)', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <form onSubmit={handleSaveTrialPolicy}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
              }}>
                <Sparkles size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--color-text-main)' }}>
                    Chính sách Dùng thử Miễn phí (Tài khoản Nông trại Mới)
                  </h2>
                  <Badge variant={trialPolicy.isEnabled ? 'success' : 'neutral'}>
                    {trialPolicy.isEnabled ? 'Đang kích hoạt' : 'Đang tắt'}
                  </Badge>
                </div>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Cho phép người dùng sau khi lập tài khoản lập tức được trải nghiệm miễn phí trọn vẹn mọi chức năng trong X tháng.
                </p>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={savingTrial || trialLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1.25rem', backgroundColor: '#10b981', color: 'white',
                border: 'none', borderRadius: '8px', fontWeight: 600, cursor: savingTrial ? 'not-allowed' : 'pointer',
                opacity: savingTrial ? 0.7 : 1, transition: 'all 0.2s', fontSize: '0.875rem'
              }}
            >
              <Save size={16} /> {savingTrial ? 'Đang lưu...' : 'Lưu cài đặt dùng thử'}
            </button>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem', padding: '1.25rem', backgroundColor: '#f8fafc',
            borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1rem'
          }}>
            {/* Bật/Tắt Dùng thử */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                Trạng thái áp dụng
              </label>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                cursor: 'pointer', padding: '0.5rem 0.75rem', backgroundColor: '#fff',
                border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 500
              }}>
                <input
                  type="checkbox"
                  checked={trialPolicy.isEnabled}
                  onChange={(e) => setTrialPolicy({ ...trialPolicy, isEnabled: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                />
                <span>{trialPolicy.isEnabled ? 'Bật dùng thử tự động' : 'Tắt dùng thử (bắt buộc mua ngay)'}</span>
              </label>
            </div>

            {/* Thời hạn dùng thử (X tháng) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                Thời lượng dùng thử (Số tháng - X)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={trialPolicy.durationMonths}
                  onChange={(e) => setTrialPolicy({ ...trialPolicy, durationMonths: Math.max(1, Number(e.target.value) || 1) })}
                  disabled={!trialPolicy.isEnabled}
                  style={{
                    width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1',
                    borderRadius: '6px', fontSize: '0.875rem', backgroundColor: trialPolicy.isEnabled ? '#fff' : '#f1f5f9'
                  }}
                  required
                />
                <span style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>tháng</span>
              </div>
            </div>

            {/* Gói cước cấp trong thời gian dùng thử */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                Gói tính năng được cấp
              </label>
              <select
                value={trialPolicy.trialPlan}
                onChange={(e) => setTrialPolicy({ ...trialPolicy, trialPlan: e.target.value })}
                disabled={!trialPolicy.isEnabled}
                style={{
                  width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1',
                  borderRadius: '6px', fontSize: '0.875rem', backgroundColor: trialPolicy.isEnabled ? '#fff' : '#f1f5f9'
                }}
              >
                <option value="PREMIUM">PREMIUM (Đầy đủ tất cả chức năng - Khuyên dùng)</option>
                <option value="STANDARD">STANDARD (Gói tiêu chuẩn)</option>
                <option value="BASIC">BASIC (Gói cơ bản)</option>
              </select>
            </div>

            {/* Tự động khóa sau khi hết hạn */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                Khi hết hạn {trialPolicy.durationMonths} tháng
              </label>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                cursor: 'pointer', padding: '0.5rem 0.75rem', backgroundColor: '#fff',
                border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 500
              }}>
                <input
                  type="checkbox"
                  checked={trialPolicy.lockOnExpiry}
                  onChange={(e) => setTrialPolicy({ ...trialPolicy, lockOnExpiry: e.target.checked })}
                  disabled={!trialPolicy.isEnabled}
                  style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                />
                <span>Khóa tính năng &amp; yêu cầu mua gói</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
            <AlertCircle size={16} color="#0284c7" style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>
              Cơ chế: Khi người dùng Nông trại mới đăng ký, hệ thống sẽ tự động kích hoạt gói {trialPolicy.trialPlan} với thời hạn {trialPolicy.durationMonths} tháng.
              Sau {trialPolicy.durationMonths} tháng, nếu chưa mua gói cước, hệ thống sẽ khóa chức năng ghi chép canh tác/tạo bảng và hiển thị thông báo yêu cầu mua gói tại trang Thanh toán.
            </span>
          </div>
        </form>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {services.map((svc) => (
          <Card key={svc._id} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{svc.name}</h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>{svc.code}</span>
              </div>
              <Badge variant={svc.isActive ? 'success' : 'danger'}>{svc.isActive ? 'Kích hoạt' : 'Ẩn'}</Badge>
            </div>
            
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '1rem' }}>
              {svc.price === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(svc.price)}
            </div>
            
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem', flex: 1 }}>{svc.description}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <Check size={16} color="#10b981" /> {svc.maxBoards === -1 ? 'Không giới hạn' : svc.maxBoards} bảng canh tác
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <Check size={16} color="#10b981" /> {svc.maxImages === -1 ? 'Không giới hạn' : svc.maxImages} sản phẩm chợ
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
              <button 
                onClick={() => handleOpenModal(svc)}
                style={{ flex: 1, padding: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, color: '#334155' }}
              >
                <Edit size={16} /> Sửa
              </button>
              <button 
                onClick={() => handleDelete(svc._id)}
                style={{ padding: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fef2f2', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Card style={{ width: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>{editingId ? 'Sửa gói dịch vụ' : 'Thêm gói dịch vụ mới'}</h2>
            
            {error && <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.875rem', padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '8px' }}>{error}</div>}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Mã gói (VD: BASIC)</label>
                  <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Tên hiển thị</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} required />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Giá (VNĐ / Tháng)</label>
                <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} required min={0} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Giới hạn bảng (-1 là vô hạn)</label>
                  <input type="number" value={formData.maxBoards} onChange={e => setFormData({...formData, maxBoards: Number(e.target.value)})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} required min={-1} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Giới hạn SP chợ</label>
                  <input type="number" value={formData.maxImages} onChange={e => setFormData({...formData, maxImages: Number(e.target.value)})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} required min={-1} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Mô tả chi tiết</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '80px' }} required />
              </div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} style={{ width: '16px', height: '16px' }} />
                Kích hoạt gói dịch vụ này
              </label>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" disabled={submitLoading} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: submitLoading ? 'not-allowed' : 'pointer', opacity: submitLoading ? 0.7 : 1 }}>
                  {submitLoading ? 'Đang lưu...' : 'Lưu gói dịch vụ'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
