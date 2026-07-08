/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Lock, Eye, EyeOff, Save } from 'lucide-react';

export default function CompanySettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({ companyName: '', address: '', contactPhone: '', businessType: '', taxCode: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchAPI('/company/profile');
        if (res.success && res.data) {
          setProfile({
            companyName: res.data.companyName || '',
            address: res.data.address || '',
            contactPhone: res.data.contactPhone || '',
            businessType: res.data.businessType || '',
            taxCode: res.data.taxCode || '',
          });
        }
      } catch (e) {} finally { setLoading(false); }
    };
    load();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMessage({ type: '', text: '' });
    try {
      await fetchAPI('/company/profile', { method: 'PUT', body: JSON.stringify(profile) });
      setMessage({ type: 'success', text: 'Cập nhật thành công!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally { setSaving(false); setTimeout(() => setMessage({ type: '', text: '' }), 3000); }
  };

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage({ type: '', text: '' });
    if (newPassword !== confirmNewPassword) { setMessage({ type: 'error', text: 'Mật khẩu mới không khớp' }); return; }
    setChangingPw(true);
    try {
      const res = await fetchAPI('/auth/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) });
      setMessage({ type: 'success', text: res.message || 'Đổi mật khẩu thành công!' });
      setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally { setChangingPw(false); setTimeout(() => setMessage({ type: '', text: '' }), 4000); }
  };

  const inputStyle = { width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: 'var(--color-surface)' };
  const labelStyle = { display: 'block' as const, marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-main)' };
  const tabStyle = (t: string) => ({ padding: '0.75rem 1.25rem', borderRadius: '8px', cursor: 'pointer' as const, display: 'flex', alignItems: 'center' as const, gap: '0.5rem', fontSize: '0.9rem', fontWeight: activeTab === t ? 600 : 400, backgroundColor: activeTab === t ? 'var(--color-primary-50)' : 'transparent', color: activeTab === t ? 'var(--color-primary-700)' : 'var(--color-text-muted)', border: 'none' });

  if (loading) return <div>Đang tải...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Cài đặt</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Quản lý thông tin doanh nghiệp và bảo mật.</p>
      </div>

      {message.text && <div style={{ padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem', backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2', color: message.type === 'success' ? '#15803d' : '#b91c1c' }}>{message.text}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.5rem' }}>
        <Card style={{ padding: '1rem', height: 'fit-content' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={tabStyle('profile')} onClick={() => setActiveTab('profile')}><Save size={18} /> Hồ sơ</div>
            <div style={tabStyle('password')} onClick={() => setActiveTab('password')}><Lock size={18} /> Mật khẩu</div>
          </div>
        </Card>

        <Card style={{ padding: '2rem' }}>
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Thông tin doanh nghiệp</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={labelStyle}>Tên công ty <span style={{ color: 'red' }}>*</span></label><input style={inputStyle} value={profile.companyName} onChange={e => setProfile({...profile, companyName: e.target.value})} required /></div>
                <div><label style={labelStyle}>Mã số thuế</label><input style={inputStyle} value={profile.taxCode} onChange={e => setProfile({...profile, taxCode: e.target.value})} /></div>
                <div><label style={labelStyle}>Loại hình kinh doanh</label><input style={inputStyle} value={profile.businessType} onChange={e => setProfile({...profile, businessType: e.target.value})} placeholder="VD: Sản xuất phân bón" /></div>
                <div><label style={labelStyle}>Số điện thoại</label><input style={inputStyle} value={profile.contactPhone} onChange={e => setProfile({...profile, contactPhone: e.target.value})} /></div>
                <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Địa chỉ</label><input style={inputStyle} value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} /></div>
              </div>
              <button type="submit" disabled={saving} style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem', backgroundColor: 'var(--color-primary-600)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </form>
          )}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePw} style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Đổi mật khẩu</h2>
              <div><label style={labelStyle}>Mật khẩu hiện tại</label><div style={{ position: 'relative' }}><input style={inputStyle} type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required /><button type="button" onClick={() => setShowCurrent(!showCurrent)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>{showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
              <div><label style={labelStyle}>Mật khẩu mới</label><div style={{ position: 'relative' }}><input style={inputStyle} type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} /><button type="button" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>{showNew ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
              <div><label style={labelStyle}>Xác nhận mật khẩu mới</label><input style={inputStyle} type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required minLength={6} /></div>
              <button type="submit" disabled={changingPw} style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem', backgroundColor: 'var(--color-primary-600)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                {changingPw ? 'Đang đổi...' : 'Đổi mật khẩu'}
              </button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
