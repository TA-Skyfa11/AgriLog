'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import styles from './settings.module.css';
import { User, Lock, Bell, Globe, Layout, Shield, Save } from 'lucide-react';

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
          email: 'nongtrainguyentam@gmail.com', // Mock email as it's typically tied to user account
        });
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
              <h2 className={styles.panelTitle}>Thông tin tài khoản</h2>
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
          {activeTab !== 'account' && (
            <div>Chức năng đang được phát triển...</div>
          )}
        </div>
      </div>
    </div>
  );
}
