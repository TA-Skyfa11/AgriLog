/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { fetchAPI } from '@/lib/api';
import { Lock, Eye, EyeOff, Save, User, Shield, DollarSign } from 'lucide-react';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('password');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Commission state
  const [commissionRate, setCommissionRate] = useState<number>(5);
  const [savingCommission, setSavingCommission] = useState(false);

  React.useEffect(() => {
    const loadCommission = async () => {
      try {
        const res = await fetchAPI('/admin/commission');
        if (res.success && res.data) {
          setCommissionRate(res.data.rate);
        }
      } catch (e) {}
    };
    loadCommission();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmNewPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu mới và xác nhận không khớp' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetchAPI('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setMessage({ type: 'success', text: res.message || 'Đổi mật khẩu thành công!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Đổi mật khẩu thất bại' });
    } finally {
      setChangingPassword(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleSaveCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSavingCommission(true);
    try {
      const res = await fetchAPI('/admin/commission', {
        method: 'PUT',
        body: JSON.stringify({ rate: commissionRate, description: 'Mức hoa hồng mặc định' })
      });
      if (res.success) {
        setMessage({ type: 'success', text: res.message || 'Cập nhật hoa hồng thành công' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Cập nhật thất bại' });
    } finally {
      setSavingCommission(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const tabStyle = (tab: string) => ({
    padding: '0.75rem 1.25rem',
    borderRadius: '8px',
    cursor: 'pointer' as const,
    display: 'flex',
    alignItems: 'center' as const,
    gap: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: activeTab === tab ? 600 : 400,
    backgroundColor: activeTab === tab ? 'var(--color-primary-50)' : 'transparent',
    color: activeTab === tab ? 'var(--color-primary-700)' : 'var(--color-text-muted)',
    border: 'none',
    transition: 'all 0.2s',
  });

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    fontSize: '0.9rem',
    transition: 'border-color 0.2s',
    backgroundColor: 'var(--color-surface)',
  };

  const labelStyle = {
    display: 'block' as const,
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--color-text-main)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>Cài đặt hệ thống</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Quản lý tài khoản Admin và bảo mật hệ thống.</p>
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

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem' }}>
        {/* Sidebar */}
        <Card style={{ padding: '1rem', height: 'fit-content' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={tabStyle('password')} onClick={() => setActiveTab('password')}>
              <Lock size={18} /> Đổi mật khẩu
            </div>
            <div style={tabStyle('account')} onClick={() => setActiveTab('account')}>
              <User size={18} /> Tài khoản
            </div>
            <div style={tabStyle('commission')} onClick={() => setActiveTab('commission')}>
              <DollarSign size={18} /> Hoa hồng Marketplace
            </div>
            <div style={tabStyle('security')} onClick={() => setActiveTab('security')}>
              <Shield size={18} /> Bảo mật
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <Card style={{ padding: '2rem' }}>
          {activeTab === 'password' && (
            <>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Đổi mật khẩu Admin</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Hãy sử dụng mật khẩu mạnh để bảo vệ tài khoản Admin.
              </p>

              <form onSubmit={handleChangePassword} style={{ maxWidth: '480px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={labelStyle}>Mật khẩu hiện tại</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        style={inputStyle}
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Nhập mật khẩu hiện tại"
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Mật khẩu mới</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        style={inputStyle}
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                        required
                        minLength={6}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Xác nhận mật khẩu mới</label>
                    <input
                      style={inputStyle}
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={changingPassword}
                  style={{ 
                    marginTop: '1.5rem', padding: '0.75rem 1.5rem', 
                    backgroundColor: 'var(--color-primary-600)', color: 'white', 
                    border: 'none', borderRadius: '8px', cursor: changingPassword ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    opacity: changingPassword ? 0.7 : 1, transition: 'all 0.2s'
                  }}
                >
                  <Lock size={18} /> {changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </form>
            </>
          )}

          {activeTab === 'account' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Thông tin tài khoản Admin</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Chức năng đang được phát triển...</p>
            </div>
          )}

          {activeTab === 'commission' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Cài đặt Hoa hồng Marketplace</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Mức hoa hồng này sẽ được áp dụng cho tất cả các giao dịch mua bán trên Marketplace.
              </p>
              
              <form onSubmit={handleSaveCommission} style={{ maxWidth: '400px' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>Mức phần trăm hoa hồng (%)</label>
                  <input
                    style={inputStyle}
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    required
                  />
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                    Ví dụ: 5% — Hệ thống sẽ tự động trích 5% từ tổng giá trị đơn hàng của Doanh nghiệp.
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={savingCommission}
                  style={{ 
                    padding: '0.75rem 1.5rem', 
                    backgroundColor: 'var(--color-primary-600)', color: 'white', 
                    border: 'none', borderRadius: '8px', cursor: savingCommission ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    opacity: savingCommission ? 0.7 : 1, transition: 'all 0.2s'
                  }}
                >
                  <Save size={18} /> {savingCommission ? 'Đang lưu...' : 'Lưu cài đặt'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>Bảo mật hệ thống</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Chức năng đang được phát triển...</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
