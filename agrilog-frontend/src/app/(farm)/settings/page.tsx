/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/settings.module.css';
import { User, Lock, Bell, Globe, Layout, Shield, Save, Eye, EyeOff, Check } from 'lucide-react';
import { useAppContext } from '@/context/AppProvider';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    farmName: '',
    address: '',
    areaSqm: '',
    mainCropType: '',
    contactPhone: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('account');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notifSettings, setNotifSettings] = useState({
    push: true,
    email: false,
    tasks: true,
    billing: true
  });
  const { theme, setTheme, language, setLanguage, timezone, setTimezone, t } = useAppContext();
  const [loginHistory, setLoginHistory] = useState<any[]>([]);

  // Password tab state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Security tab state
  const [allowAdminReset, setAllowAdminReset] = useState(false);
  const [togglingReset, setTogglingReset] = useState(false);

  const loadProfile = async () => {
    try {
      const [profileRes, meRes] = await Promise.all([
        fetchAPI('/farm/profile').catch(() => ({ success: false })),
        fetchAPI('/auth/me').catch(() => ({ success: false })),
      ]);

      if (profileRes.success && profileRes.data) {
        setFormData({
          farmName: profileRes.data.farmName || '',
          address: profileRes.data.address || '',
          areaSqm: profileRes.data.areaSqm || '',
          mainCropType: profileRes.data.mainCropType || '',
          contactPhone: profileRes.data.contactPhone || '',
          email: meRes.success ? meRes.data.email : '',
        });

        if (profileRes.data.notificationPreferences) {
          setNotifSettings(profileRes.data.notificationPreferences);
        }
      } else if (meRes.success) {
        setFormData(prev => ({ ...prev, email: meRes.data.email }));
      }

      if (meRes.success && meRes.data) {
        setAllowAdminReset(meRes.data.allowAdminReset || false);
      }
      
      const historyRes = await fetchAPI('/auth/login-history');
      if (historyRes.success && historyRes.data) {
        setLoginHistory(historyRes.data);
      }
    } catch (error: any) {
      console.log('No profile yet or error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await fetchAPI('/farm/profile', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Lỗi khi cập nhật' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

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

  const handleToggleAdminReset = async () => {
    setTogglingReset(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetchAPI('/auth/toggle-admin-reset', {
        method: 'PUT',
        body: JSON.stringify({ allow: !allowAdminReset }),
      });
      setAllowAdminReset(!allowAdminReset);
      setMessage({ type: 'success', text: res.message || 'Cập nhật thành công' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Cập nhật thất bại' });
    } finally {
      setTogglingReset(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  if (loading) return <div>Đang tải thông tin...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Cài đặt</h1>
        <p className={styles.subtitle}>Quản lý tài khoản và tùy chỉnh hệ thống</p>
      </div>

      {message.text && (
        <div className={message.type === 'success' ? styles.alertSuccess : styles.alertError}>
          {message.text}
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.sidebar}>
          <div className={`${styles.navItem} ${activeTab === 'account' ? styles.active : ''}`} onClick={() => setActiveTab('account')}>
            <User size={18} /> Tài khoản
          </div>
          <div className={`${styles.navItem} ${activeTab === 'password' ? styles.active : ''}`} onClick={() => setActiveTab('password')}>
            <Lock size={18} /> Mật khẩu
          </div>
          <div className={`${styles.navItem} ${activeTab === 'security' ? styles.active : ''}`} onClick={() => setActiveTab('security')}>
            <Shield size={18} /> Bảo mật
          </div>
          <div className={`${styles.navItem} ${activeTab === 'notifications' ? styles.active : ''}`} onClick={() => setActiveTab('notifications')}>
            <Bell size={18} /> Thông báo
          </div>
          <div className={`${styles.navItem} ${activeTab === 'language' ? styles.active : ''}`} onClick={() => setActiveTab('language')}>
            <Globe size={18} /> Ngôn ngữ
          </div>
          <div className={`${styles.navItem} ${activeTab === 'appearance' ? styles.active : ''}`} onClick={() => setActiveTab('appearance')}>
            <Layout size={18} /> Giao diện
          </div>
        </div>

        <div className={styles.mainPanel}>
          {/* ===== TAB: Tài khoản ===== */}
          {activeTab === 'account' && (
            <>
              <h2 className={styles.panelTitle}>{t('settings.account')}</h2>
              <form onSubmit={handleSubmit}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tên Nông Trại</label>
                    <input
                      className={styles.input}
                      type="text"
                      name="farmName"
                      value={formData.farmName}
                      onChange={handleChange}
                      placeholder="VD: Nông trại Xanh Tâm"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Email</label>
                    <input
                      className={styles.input}
                      type="email"
                      name="email"
                      value={formData.email}
                      readOnly
                      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-muted)' }}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Số điện thoại</label>
                    <input
                      className={styles.input}
                      type="text"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      placeholder="VD: 0912 345 678"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Địa chỉ</label>
                    <input
                      className={styles.input}
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="VD: Xã A, Huyện B, Tỉnh C"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Diện tích tổng (m²)</label>
                    <input
                      className={styles.input}
                      type="number"
                      name="areaSqm"
                      value={formData.areaSqm}
                      onChange={handleChange}
                      placeholder="VD: 10000"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Cây trồng chính</label>
                    <input
                      className={styles.input}
                      type="text"
                      name="mainCropType"
                      value={formData.mainCropType}
                      onChange={handleChange}
                      placeholder="VD: Lúa, Sầu riêng..."
                    />
                  </div>

                  <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                    <label className={styles.label}>Vai trò tài khoản</label>
                    <input
                      className={styles.input}
                      type="text"
                      value="Quản lý nông trại (Chủ sở hữu)"
                      readOnly
                      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-muted)' }}
                    />
                  </div>
                </div>

                <button type="submit" className={styles.button} disabled={saving}>
                  <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>
            </>
          )}

          {/* ===== TAB: Mật khẩu ===== */}
          {activeTab === 'password' && (
            <>
              <h2 className={styles.panelTitle}>Đổi mật khẩu</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu với người khác.
              </p>
              <form onSubmit={handleChangePassword} style={{ maxWidth: '480px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Mật khẩu hiện tại</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className={styles.input}
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

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Mật khẩu mới</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className={styles.input}
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

                  <div className={styles.formGroup}>
                      <label className={styles.label}>Xác nhận mật khẩu mới</label>
                      <input
                        className={styles.input}
                        type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button type="submit" className={styles.button} disabled={changingPassword} style={{ marginTop: '1.5rem' }}>
                  <Lock size={18} /> {changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </form>
            </>
          )}

          {/* ===== TAB: Bảo mật ===== */}
          {activeTab === 'security' && (
            <>
              <h2 className={styles.panelTitle}>Cài đặt bảo mật</h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Quản lý các tùy chọn bảo mật cho tài khoản của bạn.
              </p>

              <div style={{ 
                padding: '1.5rem', 
                backgroundColor: 'var(--color-surface)', 
                borderRadius: 'var(--radius-xl)', 
                border: '1px solid var(--color-border)',
                maxWidth: '600px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                      Cho phép Admin đặt lại mật khẩu
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                      Khi bật, Admin hệ thống có thể đặt lại mật khẩu cho tài khoản của bạn trong trường hợp bạn quên mật khẩu. 
                      Nếu tắt, chỉ bạn mới có thể thay đổi mật khẩu của mình.
                    </div>
                  </div>
                  <button
                    onClick={handleToggleAdminReset}
                    disabled={togglingReset}
                    style={{
                      flexShrink: 0,
                      width: '52px',
                      height: '28px',
                      borderRadius: '14px',
                      border: 'none',
                      cursor: togglingReset ? 'not-allowed' : 'pointer',
                      backgroundColor: allowAdminReset ? 'var(--color-primary-600)' : '#d1d5db',
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
                  gap: '0.5rem'
                }}>
                  {allowAdminReset ? <Check size={14} /> : <Shield size={14} />}
                  {allowAdminReset 
                    ? 'Admin hiện có thể hỗ trợ đặt lại mật khẩu cho bạn.' 
                    : 'Chỉ bạn mới có thể thay đổi mật khẩu của mình.'}
                </div>
              </div>

          )}

          {activeTab === 'notifications' && (
            <>
              <h2 className={styles.panelTitle}>Cài đặt thông báo</h2>
              <div className={styles.settingsList}>
                <div className={styles.settingItem}>
                  <div>
                    <div className={styles.settingLabel}>Thông báo đẩy (Trình duyệt)</div>
                    <div className={styles.settingDesc}>Nhận thông báo ngay trên màn hình khi bạn đang sử dụng ứng dụng.</div>
                  </div>
                  <label className={styles.switch}>
                    <input type="checkbox" checked={notifSettings.push} onChange={async (e) => {
                      const newSet = {...notifSettings, push: e.target.checked};
                      setNotifSettings(newSet);
                      await fetchAPI('/farm/profile', { method: 'PUT', body: JSON.stringify({ notificationPreferences: newSet }) });
                      toast.success('Cập nhật thành công');
                    }} />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <div>
                    <div className={styles.settingLabel}>Thông báo qua Email</div>
                    <div className={styles.settingDesc}>Nhận bản tóm tắt các thông báo quan trọng qua email định kỳ.</div>
                  </div>
                  <label className={styles.switch}>
                    <input type="checkbox" checked={notifSettings.email} onChange={async (e) => {
                      const newSet = {...notifSettings, email: e.target.checked};
                      setNotifSettings(newSet);
                      await fetchAPI('/farm/profile', { method: 'PUT', body: JSON.stringify({ notificationPreferences: newSet }) });
                      toast.success('Cập nhật thành công');
                    }} />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <div>
                    <div className={styles.settingLabel}>Nhắc nhở Công việc</div>
                    <div className={styles.settingDesc}>Nhận thông báo khi có công việc sắp đến hạn hoặc quá hạn.</div>
                  </div>
                  <label className={styles.switch}>
                    <input type="checkbox" checked={notifSettings.tasks} onChange={async (e) => {
                      const newSet = {...notifSettings, tasks: e.target.checked};
                      setNotifSettings(newSet);
                      await fetchAPI('/farm/profile', { method: 'PUT', body: JSON.stringify({ notificationPreferences: newSet }) });
                      toast.success('Cập nhật thành công');
                    }} />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                <div className={styles.settingItem}>
                  <div>
                    <div className={styles.settingLabel}>Nhắc nhở Gói dịch vụ</div>
                    <div className={styles.settingDesc}>Cảnh báo khi gói cước sắp hết hạn hoặc thanh toán thành công.</div>
                  </div>
                  <label className={styles.switch}>
                    <input type="checkbox" checked={notifSettings.billing} onChange={async (e) => {
                      const newSet = {...notifSettings, billing: e.target.checked};
                      setNotifSettings(newSet);
                      await fetchAPI('/farm/profile', { method: 'PUT', body: JSON.stringify({ notificationPreferences: newSet }) });
                      toast.success('Cập nhật thành công');
                    }} />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
            </>
          )}

          {activeTab === 'language' && (
            <>
              <h2 className={styles.panelTitle}>Ngôn ngữ khu vực</h2>
              <div className={styles.settingsList}>
                <div className={styles.settingItem}>
                  <div>
                    <div className={styles.settingLabel}>Ngôn ngữ hiển thị</div>
                    <div className={styles.settingDesc}>Chọn ngôn ngữ giao diện của hệ thống.</div>
                  </div>
                  <select className={styles.select} value={language} onChange={(e) => {
                    setLanguage(e.target.value as any);
                    toast.success('Đã thay đổi ngôn ngữ');
                  }}>
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English (Tiếng Anh)</option>
                  </select>
                </div>
                <div className={styles.settingItem}>
                  <div>
                    <div className={styles.settingLabel}>Múi giờ</div>
                    <div className={styles.settingDesc}>Hệ thống sẽ đồng bộ thời gian theo múi giờ này.</div>
                  </div>
                  <select className={styles.select} value={timezone} onChange={(e) => {
                    setTimezone(e.target.value);
                    toast.success('Đã cập nhật múi giờ');
                  }}>
                    <option value="GMT+7">(GMT+07:00) Băng Cốc, Hà Nội, Jakarta</option>
                    <option value="GMT+8">(GMT+08:00) Bắc Kinh, Singapore, Đài Bắc</option>
                    <option value="GMT+9">(GMT+09:00) Tokyo, Seoul, Osaka</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {activeTab === 'appearance' && (
            <>
              <h2 className={styles.panelTitle}>Tùy chỉnh Giao diện</h2>
              <div className={styles.settingsList}>
                <div className={styles.settingItem}>
                  <div>
                    <div className={styles.settingLabel}>Giao diện (Theme)</div>
                    <div className={styles.settingDesc}>Chuyển đổi giữa chế độ nền sáng và nền tối.</div>
                  </div>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="theme" value="light" checked={theme === 'light'} onChange={() => setTheme('light')} /> Sáng
                    </label>
                    <label className={styles.radioLabel}>
                      <input type="radio" name="theme" value="dark" checked={theme === 'dark'} onChange={() => setTheme('dark')} /> Tối
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <>
              <h2 className={styles.panelTitle} style={{marginTop: '2rem'}}>Lịch sử đăng nhập</h2>
              <div className={styles.settingsList}>
                <div className={styles.settingItem}>
                  <div>
                    <div className={styles.settingLabel}>Lịch sử đăng nhập</div>
                    <div className={styles.settingDesc}>Danh sách các phiên đăng nhập gần đây.</div>
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  {loginHistory.length === 0 ? <p>Chưa có dữ liệu</p> : (
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <th style={{ padding: '0.75rem' }}>Thời gian</th>
                          <th style={{ padding: '0.75rem' }}>IP Address</th>
                          <th style={{ padding: '0.75rem' }}>Thiết bị (User Agent)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loginHistory.map(h => (
                          <tr key={h._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '0.75rem' }}>{new Date(h.createdAt).toLocaleString('vi-VN')}</td>
                            <td style={{ padding: '0.75rem' }}>{h.ipAddress}</td>
                            <td style={{ padding: '0.75rem' }}>{h.userAgent.substring(0, 50)}...</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
