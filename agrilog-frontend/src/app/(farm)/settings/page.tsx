'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/settings.module.css';
import { User, Lock, Bell, Globe, Layout, Shield, Save } from 'lucide-react';
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

  const loadProfile = async () => {
    try {
      const res = await fetchAPI('/farm/profile');
      if (res.success && res.data) {
        setFormData({
          farmName: res.data.farmName || '',
          address: res.data.address || '',
          areaSqm: res.data.areaSqm || '',
          mainCropType: res.data.mainCropType || '',
          contactPhone: res.data.contactPhone || '',
          email: 'nongtrainguyentam@gmail.com',
        });
        
        if (res.data.notificationPreferences) {
          setNotifSettings(res.data.notificationPreferences);
        }
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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp!' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetchAPI('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      });
      if (res.success) {
        setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: res.message || 'Lỗi khi đổi mật khẩu' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Lỗi khi đổi mật khẩu' });
    } finally {
      setSaving(false);
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
          <div className={`${styles.navItem} ${activeTab === 'notifications' ? styles.active : ''}`} onClick={() => setActiveTab('notifications')}>
            <Bell size={18} /> Thông báo
          </div>
          <div className={`${styles.navItem} ${activeTab === 'language' ? styles.active : ''}`} onClick={() => setActiveTab('language')}>
            <Globe size={18} /> Ngôn ngữ
          </div>
          <div className={`${styles.navItem} ${activeTab === 'appearance' ? styles.active : ''}`} onClick={() => setActiveTab('appearance')}>
            <Layout size={18} /> Giao diện
          </div>
          <div className={`${styles.navItem} ${activeTab === 'security' ? styles.active : ''}`} onClick={() => setActiveTab('security')}>
            <Shield size={18} /> Bảo mật
          </div>
        </div>

        <div className={styles.mainPanel}>
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
          
          {activeTab === 'password' && (
            <>
              <h2 className={styles.panelTitle}>Đổi mật khẩu</h2>
              <form onSubmit={handlePasswordSubmit}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                    <label className={styles.label}>Mật khẩu hiện tại</label>
                    <input
                      className={styles.input}
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                    <label className={styles.label}>Mật khẩu mới</label>
                    <input
                      className={styles.input}
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                    <label className={styles.label}>Xác nhận mật khẩu mới</label>
                    <input
                      className={styles.input}
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className={styles.button} disabled={saving}>
                  <Lock size={18} /> {saving ? 'Đang lưu...' : 'Đổi mật khẩu'}
                </button>
              </form>
            </>
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
              <h2 className={styles.panelTitle}>Cài đặt Bảo mật</h2>
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
