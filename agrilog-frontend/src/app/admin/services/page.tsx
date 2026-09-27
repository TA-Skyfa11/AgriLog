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
    trialPlan: 'ALL',
    lockOnExpiry: true
  });
  const [applyToExistingUsers, setApplyToExistingUsers] = useState(true);
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
    features: [] as string[],
    isActive: true
  });
  const [newFeatureText, setNewFeatureText] = useState('');
  const [isRawFeatureMode, setIsRawFeatureMode] = useState(false);
  const [rawFeaturesText, setRawFeaturesText] = useState('');
  
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
          trialPlan: res.data.trialPlan || 'ALL',
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
        body: JSON.stringify({
          ...trialPolicy,
          applyToExistingUsers
        })
      });
      if (res.success) {
        if (res.updatedUsersCount && res.updatedUsersCount > 0) {
          toast.success(`Đã lưu cài đặt và cấp quyền dùng thử cho ${res.updatedUsersCount} tài khoản trước đó kèm thông báo!`);
        } else {
          toast.success(res.message || 'Đã lưu cấu hình chính sách dùng thử miễn phí!');
        }
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
      const feats = Array.isArray(service.features) ? [...service.features] : [];
      setFormData({
        code: service.code,
        name: service.name,
        description: service.description || '',
        price: service.price ?? 0,
        maxBoards: service.maxBoards ?? 5,
        maxImages: service.maxImages ?? 0,
        features: feats,
        isActive: service.isActive ?? true
      });
      setRawFeaturesText(feats.join('\n'));
    } else {
      setEditingId(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        price: 0,
        maxBoards: 5,
        maxImages: 0,
        features: [],
        isActive: true
      });
      setRawFeaturesText('');
    }
    setNewFeatureText('');
    setIsRawFeatureMode(false);
    setError('');
    setIsModalOpen(true);
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    const updated = [...formData.features, newFeatureText.trim()];
    setFormData({ ...formData, features: updated });
    setRawFeaturesText(updated.join('\n'));
    setNewFeatureText('');
  };

  const handleRemoveFeature = (idx: number) => {
    const updated = formData.features.filter((_, i) => i !== idx);
    setFormData({ ...formData, features: updated });
    setRawFeaturesText(updated.join('\n'));
  };

  const handleRawFeaturesChange = (text: string) => {
    setRawFeaturesText(text);
    const parsed = text.split('\n').map(s => s.trim()).filter(Boolean);
    setFormData({ ...formData, features: parsed });
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
        toast.success(editingId ? 'Cập nhật gói dịch vụ thành công!' : 'Tạo gói dịch vụ mới thành công!');
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
        toast.success('Đã xóa gói dịch vụ thành công.');
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
                  borderRadius: '6px', fontSize: '0.875rem', backgroundColor: trialPolicy.isEnabled ? '#fff' : '#f1f5f9',
                  fontWeight: 600
                }}
              >
                <option value="ALL">CẢ 3 GÓI (Toàn bộ gói Basic + Standard + Premium - Trọn quyền lợi)</option>
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

          {/* Áp dụng cho các tài khoản đã đăng ký trước đó */}
          <div style={{
            padding: '0.85rem 1rem',
            backgroundColor: applyToExistingUsers ? '#ecfdf5' : '#f8fafc',
            borderRadius: '8px',
            border: applyToExistingUsers ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
            marginBottom: '1rem',
            transition: 'all 0.2s'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: applyToExistingUsers ? '#065f46' : '#64748b' }}>
              <input
                type="checkbox"
                checked={applyToExistingUsers}
                onChange={(e) => setApplyToExistingUsers(e.target.checked)}
                disabled={!trialPolicy.isEnabled}
                style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
              />
              <span>
                Đồng thời áp dụng cho tất cả tài khoản nông trại đã đăng ký trước đó &amp; gửi thông báo kích hoạt {trialPolicy.trialPlan === 'ALL' ? 'cả 3 gói' : `gói ${trialPolicy.trialPlan}`} trong {trialPolicy.durationMonths} tháng
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
            <AlertCircle size={16} color="#0284c7" style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>
              Cơ chế: Khi người dùng Nông trại mới đăng ký (hoặc khi lưu áp dụng cho tài khoản trước đó), hệ thống sẽ kích hoạt {trialPolicy.trialPlan === 'ALL' ? 'toàn bộ cả 3 gói dịch vụ (Basic + Standard + Premium)' : `gói ${trialPolicy.trialPlan}`} với thời hạn {trialPolicy.durationMonths} tháng.
              Sau {trialPolicy.durationMonths} tháng, nếu chưa mua gói cước, hệ thống sẽ khóa chức năng ghi chép canh tác/tạo bảng và hiển thị thông báo yêu cầu mua gói tại trang Thanh toán.
            </span>
          </div>
        </form>
      </Card>

      {/* Danh sách các gói dịch vụ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {services.map((svc) => (
          <Card key={svc._id} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-main)', margin: '0 0 0.25rem 0' }}>{svc.name}</h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>{svc.code}</span>
              </div>
              <Badge variant={svc.isActive ? 'success' : 'danger'}>{svc.isActive ? 'Kích hoạt' : 'Ẩn'}</Badge>
            </div>
            
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
              {svc.price === 0 ? 'Miễn phí' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(svc.price)}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}> / tháng</span>
            </div>
            
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.25rem', lineHeight: 1.5 }}>{svc.description || 'Chưa có mô tả'}</p>
            
            {/* Thông số kỹ thuật & Giới hạn */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '0.5rem',
              padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '8px',
              border: '1px solid #e2e8f0', marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                <Check size={16} color="#10b981" /> {svc.maxBoards === -1 ? 'Không giới hạn' : svc.maxBoards} bảng canh tác
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                <Check size={16} color="#10b981" /> {svc.maxImages === -1 ? 'Không giới hạn' : svc.maxImages} sản phẩm chợ / hình ảnh
              </div>
            </div>

            {/* Danh sách tính năng chi tiết của gói */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem', flex: 1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Nội dung &amp; Tính năng gói:
              </div>
              {svc.features && svc.features.length > 0 ? (
                svc.features.map((feat: string, idx: number) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: '#334155' }}>
                    <Check size={15} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{feat}</span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.825rem', color: '#94a3b8', fontStyle: 'italic' }}>Chưa có danh sách tính năng.</div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
              <button 
                onClick={() => handleOpenModal(svc)}
                style={{ flex: 1, padding: '0.6rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#334155', fontSize: '0.875rem' }}
              >
                <Edit size={16} /> Sửa toàn bộ gói
              </button>
              <button 
                onClick={() => handleDelete(svc._id)}
                style={{ padding: '0.6rem 0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fef2f2', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }}
                title="Xóa gói"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal Sửa / Thêm Gói dịch vụ */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <Card style={{ width: '100%', maxWidth: '620px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', borderRadius: '14px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                {editingId ? 'Sửa toàn bộ nội dung gói dịch vụ' : 'Thêm gói dịch vụ mới'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
              >
                <XIcon size={20} />
              </button>
            </div>
            
            {error && <div style={{ color: '#b91c1c', marginBottom: '1rem', fontSize: '0.875rem', padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>{error}</div>}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Mã gói (Code)</label>
                  <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }} required placeholder="VD: BASIC, PREMIUM..." />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Tên hiển thị</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }} required placeholder="VD: Premium (Cao Cấp)" />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Giá cước (VNĐ / Tháng)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }} required min={0} />
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>VNĐ</span>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Giới hạn bảng (-1 là vô hạn)</label>
                  <input type="number" value={formData.maxBoards} onChange={e => setFormData({...formData, maxBoards: Number(e.target.value)})} style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }} required min={-1} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Giới hạn SP chợ (-1 là vô hạn)</label>
                  <input type="number" value={formData.maxImages} onChange={e => setFormData({...formData, maxImages: Number(e.target.value)})} style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }} required min={-1} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Mô tả chi tiết</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '70px', fontSize: '0.875rem' }} placeholder="VD: Dành cho nông hộ nhỏ hoặc HTX..." />
              </div>
              
              {/* Quản lý danh sách tính năng của gói */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>
                    Danh sách tính năng &amp; đặc quyền ({formData.features.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsRawFeatureMode(!isRawFeatureMode)}
                    style={{ fontSize: '0.75rem', color: '#0284c7', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {isRawFeatureMode ? 'Chuyển về dạng danh sách' : 'Soạn nhanh dạng văn bản (xuống dòng)'}
                  </button>
                </div>

                {isRawFeatureMode ? (
                  <div>
                    <textarea
                      value={rawFeaturesText}
                      onChange={(e) => handleRawFeaturesChange(e.target.value)}
                      placeholder="Mỗi dòng là một tính năng, ví dụ:&#10;Tạo tối đa 15 bảng nhật ký&#10;Tối đa 25 cột thông tin/sheet&#10;Hỗ trợ hồ sơ VietGAP"
                      style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', minHeight: '120px', fontSize: '0.85rem', fontFamily: 'inherit' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                      Nhập mỗi tính năng trên 1 dòng. Hệ thống sẽ tự động tách thành danh sách gạch đầu dòng.
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Input thêm tính năng mới */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <input
                        type="text"
                        value={newFeatureText}
                        onChange={(e) => setNewFeatureText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
                        placeholder="Thêm tính năng mới (Enter để thêm)..."
                        style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem' }}
                      />
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#0284c7', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        + Thêm
                      </button>
                    </div>

                    {/* Danh sách các tính năng hiện tại */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                      {formData.features.map((feat, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.75rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, marginRight: '0.5rem' }}>
                            <Check size={14} color="#10b981" style={{ flexShrink: 0 }} />
                            <span>{feat}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(idx)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px', display: 'flex', alignItems: 'center' }}
                            title="Xóa tính năng này"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      {formData.features.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontSize: '0.825rem' }}>
                          Chưa có tính năng nào. Hãy nhập tính năng ở trên và bấm Thêm.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', color: '#1e293b' }}>
                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: '#10b981' }} />
                Kích hoạt gói dịch vụ này (hiển thị cho người dùng)
              </label>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Hủy</button>
                <button type="submit" disabled={submitLoading} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: submitLoading ? 'not-allowed' : 'pointer', opacity: submitLoading ? 0.7 : 1 }}>
                  {submitLoading ? 'Đang lưu...' : (editingId ? 'Cập nhật toàn bộ gói' : 'Tạo gói dịch vụ')}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
