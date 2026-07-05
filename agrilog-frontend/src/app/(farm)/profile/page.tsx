/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/profile.module.css';

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    farmName: '',
    address: '',
    areaSqm: '',
    mainCropType: '',
    contactPhone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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
        });
      }
    } catch (error: any) {
      // Ignored initially if not found, we will create one
      console.log('No profile yet or error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <h1 className={styles.title}>Hồ sơ Nông trại</h1>
        <p className={styles.subtitle}>Quản lý thông tin chung về nông trại của bạn</p>
      </div>

      {message.text && (
        <div className={message.type === 'success' ? styles.alertSuccess : styles.alertError}>
          {message.text}
        </div>
      )}

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Tên nông trại (*)</label>
              <input
                className={styles.input}
                type="text"
                name="farmName"
                value={formData.farmName}
                onChange={handleChange}
                required
                placeholder="VD: Nông trại Xanh"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Diện tích (m2)</label>
              <input
                className={styles.input}
                type="number"
                name="areaSqm"
                value={formData.areaSqm}
                onChange={handleChange}
                placeholder="VD: 5000"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Loại cây trồng chính</label>
              <input
                className={styles.input}
                type="text"
                name="mainCropType"
                value={formData.mainCropType}
                onChange={handleChange}
                placeholder="VD: Sầu riêng, Bưởi"
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Địa chỉ</label>
              <input
                className={styles.input}
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Nhập địa chỉ đầy đủ"
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Số điện thoại liên hệ</label>
              <input
                className={styles.input}
                type="text"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="Số điện thoại"
              />
            </div>
          </div>

          <div className={styles.footer}>
            <button type="submit" className={styles.button} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

