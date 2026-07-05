/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import styles from './admin.module.css';

export default function AdminDashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [farms, setFarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFarms = async () => {
    try {
      const res = await fetchAPI('/admin/farms');
      if (res.success) setFarms(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarms();
  }, []);

  if (loading) return <div>Đang tải dữ liệu...</div>;

  const totalFarms = farms.length;
  const totalBoards = farms.reduce((sum, f) => sum + (f.boardCount || 0), 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Quản trị Hệ thống (Admin)</h1>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Tổng số Nông trại</div>
          <div className={styles.statValue}>{totalFarms}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Tổng số Bảng canh tác</div>
          <div className={styles.statValue}>{totalBoards}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Tài khoản hoạt động</div>
          <div className={styles.statValue}>{totalFarms}</div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableCardTitle}>Danh sách Nông trại đăng ký</div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email / Tài khoản</th>
              <th>Tên Nông trại</th>
              <th>Khu vực</th>
              <th>Số bảng canh tác</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {farms.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Chưa có nông trại nào</td>
              </tr>
            ) : (
              farms.map((f) => (
                <tr key={f.user._id}>
                  <td style={{ fontWeight: 500 }}>{f.user.email}</td>
                  <td>{f.profile?.farmName || <span style={{color: 'var(--color-text-muted)'}}>Chưa cập nhật</span>}</td>
                  <td>{f.profile?.address || '-'}</td>
                  <td>{f.boardCount}</td>
                  <td><span className={styles.badge}>Hoạt động</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

