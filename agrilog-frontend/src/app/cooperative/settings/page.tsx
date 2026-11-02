/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { 
  Building, Lock, Eye, EyeOff, Save, Shield, Check, Copy, 
  Globe, Layout, Award, Users, Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAppContext } from '@/context/AppProvider';

export default function CooperativeSettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    name: '',
    code: '',
    address: '',
    contactPhone: '',
    email: '',
    establishedYear: '',
    certificationStandards: [] as string[],
    description: '',
  });
  const [standardInput, setStandardInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // Security state
  const [allowAdminReset, setAllowAdminReset] = useState(true);
  const [togglingReset, setTogglingReset] = useState(false);

  const { theme, setTheme, language, setLanguage } = useAppContext();

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, meRes] = await Promise.all([
          fetchAPI('/cooperative/profile').catch(() => ({ success: false })),
          fetchAPI('/auth/me').catch(() => ({ success: false })),
        ]);

        if (profileRes.success && profileRes.data) {
          setProfile({
            name: profileRes.data.name || '',
            code: profileRes.data.code || '',
            address: profileRes.data.address || '',
            contactPhone: profileRes.data.contactPhone || '',
            email: profileRes.data.email || '',
            establishedYear: profileRes.data.establishedYear ? String(profileRes.data.establishedYear) : '',
            certificationStandards: profileRes.data.certificationStandards || [],
            description: profileRes.data.description || '',
          });
        }

        if (meRes.success && meRes.data) {
          setAllowAdminReset(meRes.data.allowAdminReset !== false);
        }
      } catch (e) {
        console.warn('Lỗi tải thông tin cài đặt HTX:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetchAPI('/cooperative/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      });

      if (res.success) {
        toast.success('Cập nhật hồ sơ Hợp tác xã thành công!');
        setMessage({ type: 'success', text: 'Cập nhật thông tin Hợp tác xã thành công!' });
      } else {
        toast.error(res.message || 'Lỗi cập nhật');
        setMessage({ type: 'error', text: res.message || 'Lỗi cập nhật' });
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu thông tin');
      setMessage({ type: 'error', text: err.message || 'Lỗi khi lưu thông tin' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (newPassword !== confirmNewPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp!' });
      return;
    }
    setChangingPw(true);
    try {
      const res = await fetchAPI('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast.success(res.message || 'Đổi mật khẩu thành công!');
      setMessage({ type: 'success', text: res.message || 'Đổi mật khẩu thành công!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi đổi mật khẩu');
      setMessage({ type: 'error', text: err.message || 'Lỗi đổi mật khẩu' });
    } finally {
      setChangingPw(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleToggleAdminReset = async () => {
    setTogglingReset(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetchAPI('/auth/toggle-admin-reset', {
        method: 'PUT',
        body: JSON.stringify({ allow: !allowAdminReset }),
      });
      setAllowAdminReset(!allowAdminReset);
      toast.success(res.message || 'Cập nhật thành công');
      setMessage({ type: 'success', text: res.message || 'Cập nhật thành công' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Cập nhật thất bại' });
    } finally {
      setTogglingReset(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleAddStandard = () => {
    const s = standardInput.trim();
    if (s && !profile.certificationStandards.includes(s)) {
      setProfile({
        ...profile,
        certificationStandards: [...profile.certificationStandards, s],
      });
      setStandardInput('');
    }
  };

  const handleRemoveStandard = (std: string) => {
    setProfile({
      ...profile,
      certificationStandards: profile.certificationStandards.filter(s => s !== std),
    });
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    fontSize: '0.9rem',
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-main)',
  };

  const labelStyle = {
    display: 'block' as const,
    marginBottom: '0.4rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--color-text-main)',
  };

  const tabStyle = (t: string) => ({
    padding: '0.75rem 1.25rem',
    borderRadius: '8px',
    cursor: 'pointer' as const,
    display: 'flex',
    alignItems: 'center' as const,
    gap: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: activeTab === t ? 600 : 400,
    backgroundColor: activeTab === t ? '#ecfdf5' : 'transparent',
    color: activeTab === t ? '#15803d' : 'var(--color-text-muted)',
    border: 'none',
    transition: 'all 0.2s',
  });

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        Đang tải thông tin cài đặt Hợp tác xã...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto', padding: '0.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building size={26} color="#16a34a" /> Cài đặt Hợp tác xã
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Quản lý thông tin pháp nhân Hợp tác xã, mã liên kết xã viên và bảo mật tài khoản quản lý.
        </p>
      </div>

      {message.text && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          fontSize: '0.875rem',
          backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: message.type === 'success' ? '#15803d' : '#b91c1c',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: '1.5rem' }}>
        {/* Navigation Sidebar */}
        <Card style={{ padding: '1rem', height: 'fit-content', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={tabStyle('profile')} onClick={() => setActiveTab('profile')}>
              <Building size={18} /> Hồ sơ HTX
            </div>
            <div style={tabStyle('password')} onClick={() => setActiveTab('password')}>
              <Lock size={18} /> Mật khẩu
            </div>
            <div style={tabStyle('security')} onClick={() => setActiveTab('security')}>
              <Shield size={18} /> Bảo mật
            </div>
            <div style={tabStyle('appearance')} onClick={() => setActiveTab('appearance')}>
              <Layout size={18} /> Giao diện & Ngôn ngữ
            </div>
          </div>
        </Card>

        {/* Content Panel */}
        <Card style={{ padding: '2rem', border: '1px solid var(--color-border)' }}>
          {/* TAB: Hồ sơ HTX */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Thông tin Hợp tác xã</h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', margin: '0.25rem 0 0 0' }}>
                    Thông tin hiển thị trên hồ sơ mùa vụ và gửi cho các hộ xã viên liên kết.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f0fdf4', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#166534', fontWeight: 600 }}>Mã HTX:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#15803d', fontSize: '1rem' }}>{profile.code}</strong>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(profile.code);
                      toast.success(`Đã sao chép mã ${profile.code}!`);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803d', padding: '2px', display: 'flex', alignItems: 'center' }}
                    title="Sao chép mã"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Tên Hợp tác xã <span style={{ color: 'red' }}>*</span></label>
                  <input
                    style={inputStyle}
                    value={profile.name}
                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                    placeholder="VD: Hợp tác xã Nông nghiệp Sạch Hòa Bình"
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Mã định danh HTX (Mã liên kết xã viên)</label>
                  <input
                    style={{ ...inputStyle, backgroundColor: 'var(--color-bg)', fontWeight: 700, fontFamily: 'monospace', color: '#15803d' }}
                    value={profile.code}
                    readOnly
                    title="Mã định danh do hệ thống cấp cố định"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Năm thành lập</label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={profile.establishedYear}
                    onChange={e => setProfile({ ...profile, establishedYear: e.target.value })}
                    placeholder="VD: 2020"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Số điện thoại Hotline / Quản lý</label>
                  <input
                    style={inputStyle}
                    value={profile.contactPhone}
                    onChange={e => setProfile({ ...profile, contactPhone: e.target.value })}
                    placeholder="VD: 0981234567"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Email liên hệ HTX</label>
                  <input
                    style={inputStyle}
                    type="email"
                    value={profile.email}
                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                    placeholder="VD: htx.hoabinh@gmail.com"
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Địa chỉ trụ sở Hợp tác xã</label>
                  <input
                    style={inputStyle}
                    value={profile.address}
                    onChange={e => setProfile({ ...profile, address: e.target.value })}
                    placeholder="VD: Xã Hòa Bình, Huyện Thường Tín, TP. Hà Nội"
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Tiêu chuẩn chứng nhận áp dụng</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      value={standardInput}
                      onChange={e => setStandardInput(e.target.value)}
                      placeholder="VD: VietGAP, GlobalGAP, OCOP 4 Sao, Hữu cơ..."
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddStandard();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddStandard}
                      style={{
                        padding: '0.75rem 1.25rem',
                        backgroundColor: '#16a34a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Thêm
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {profile.certificationStandards.map((std, i) => (
                      <span
                        key={i}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: '#ecfdf5',
                          color: '#059669',
                          border: '1px solid #a7f3d0',
                          padding: '0.3rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                        }}
                      >
                        <Award size={14} /> {std}
                        <button
                          type="button"
                          onClick={() => handleRemoveStandard(std)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#059669', padding: '0 2px', fontWeight: 700 }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Giới thiệu / Tôn chỉ hoạt động HTX</label>
                  <textarea
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    value={profile.description}
                    onChange={e => setProfile({ ...profile, description: e.target.value })}
                    placeholder="Mô tả về quy mô, định hướng sản xuất an toàn, các mặt hàng chủ lực và cam kết bao tiêu của Hợp tác xã..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  alignSelf: 'flex-start',
                  padding: '0.75rem 1.75rem',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                }}
              >
                <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu thông tin HTX'}
              </button>
            </form>
          )}

          {/* TAB: Mật khẩu */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePw} style={{ maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Đổi mật khẩu tài khoản Quản lý</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', margin: '0.25rem 0 0 0' }}>
                  Để bảo mật thông tin HTX, vui lòng không chia sẻ mật khẩu quản trị cho người ngoài.
                </p>
              </div>

              <div>
                <label style={labelStyle}>Mật khẩu hiện tại</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={inputStyle}
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                  >
                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Mật khẩu mới</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={inputStyle}
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Xác nhận mật khẩu mới</label>
                <input
                  style={inputStyle}
                  type="password"
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={changingPw}
                style={{
                  alignSelf: 'flex-start',
                  padding: '0.75rem 1.75rem',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: changingPw ? 'not-allowed' : 'pointer',
                }}
              >
                {changingPw ? 'Đang cập nhật...' : 'Xác nhận Đổi mật khẩu'}
              </button>
            </form>
          )}

          {/* TAB: Bảo mật */}
          {activeTab === 'security' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Cài đặt bảo mật</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Quản lý các tùy chọn bảo mật và quyền khôi phục tài khoản quản lý HTX.
              </p>

              <div style={{
                padding: '1.5rem',
                backgroundColor: 'var(--color-surface)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                maxWidth: '620px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                      Cho phép Quản trị viên (Admin) hỗ trợ đặt lại mật khẩu
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                      Khi bật (mặc định), Quản trị viên hệ thống có thể hỗ trợ cấp lại mật khẩu cho tài khoản quản lý HTX khi quên.
                      Nếu tắt, chỉ bạn mới có thể tự khôi phục mật khẩu qua email cá nhân.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleAdminReset}
                    disabled={togglingReset}
                    style={{
                      flexShrink: 0,
                      width: '52px',
                      height: '28px',
                      borderRadius: '14px',
                      border: 'none',
                      cursor: togglingReset ? 'not-allowed' : 'pointer',
                      backgroundColor: allowAdminReset ? '#16a34a' : '#d1d5db',
                      position: 'relative',
                      transition: 'background-color 0.3s ease',
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '3px',
                      left: allowAdminReset ? '26px' : '3px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      transition: 'left 0.3s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}></span>
                  </button>
                </div>
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  backgroundColor: allowAdminReset ? '#f0fdf4' : '#fef3c7',
                  color: allowAdminReset ? '#15803d' : '#92400e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  {allowAdminReset ? <Check size={14} /> : <Shield size={14} />}
                  {allowAdminReset 
                    ? 'Admin hiện có quyền hỗ trợ cấp lại mật khẩu cho bạn.' 
                    : 'Chỉ bạn mới có quyền tự thay đổi mật khẩu của mình.'}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Giao diện & Ngôn ngữ */}
          {activeTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Giao diện & Ngôn ngữ</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  Tùy chỉnh chế độ hiển thị màu sắc và ngôn ngữ làm việc của hệ thống.
                </p>
              </div>

              <div>
                <label style={labelStyle}>Chủ đề giao diện</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      border: `2px solid ${theme === 'light' ? '#16a34a' : 'var(--color-border)'}`,
                      backgroundColor: theme === 'light' ? '#f0fdf4' : 'var(--color-surface)',
                      color: theme === 'light' ? '#16a34a' : 'var(--color-text-main)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ☀️ Chế độ Sáng (Mặc định)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      border: `2px solid ${theme === 'dark' ? '#16a34a' : 'var(--color-border)'}`,
                      backgroundColor: theme === 'dark' ? '#f0fdf4' : 'var(--color-surface)',
                      color: theme === 'dark' ? '#16a34a' : 'var(--color-text-main)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    🌙 Chế độ Tối (Dark mode)
                  </button>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Ngôn ngữ hiển thị</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setLanguage('vi')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      border: `2px solid ${language === 'vi' ? '#16a34a' : 'var(--color-border)'}`,
                      backgroundColor: language === 'vi' ? '#f0fdf4' : 'var(--color-surface)',
                      color: language === 'vi' ? '#16a34a' : 'var(--color-text-main)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    🇻🇳 Tiếng Việt
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      border: `2px solid ${language === 'en' ? '#16a34a' : 'var(--color-border)'}`,
                      backgroundColor: language === 'en' ? '#f0fdf4' : 'var(--color-surface)',
                      color: language === 'en' ? '#16a34a' : 'var(--color-text-main)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
