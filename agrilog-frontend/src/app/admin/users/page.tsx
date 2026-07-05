'use client';

import React, { useState, useEffect } from 'react';
import { Filter, UserPlus, Shield, Sprout, Ban, Building } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import styles from '@/css/Users.module.css';
import { fetchAPI } from '@/lib/api';

export default function UsersPage() {
  const [farmsData, setFarmsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFarms = async () => {
      try {
        const res = await fetchAPI('/admin/farms');
        if (res.success) {
          setFarmsData(res.data);
        }
      } catch (error) {
        console.error('Error fetching farms:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFarms();
  }, []);

  if (loading) {
    return <div className={styles.container} style={{ padding: '2rem' }}>Đang tải dữ liệu...</div>;
  }

  const kpis = [
    { label: 'Tổng Nông trại', value: farmsData.length, meta: 'Dữ liệu thực', isPos: true },
    { label: 'Nông trại hoạt động', value: farmsData.filter(f => f.user.isActive !== false).length, meta: 'Đang hoạt động', isPos: true },
    { label: 'Tổng số bảng canh tác', value: farmsData.reduce((acc, f) => acc + (f.boardCount || 0), 0), meta: 'Trên toàn hệ thống', isPos: true },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý người dùng</h1>
          <p className={styles.subtitle}>Theo dõi và quản lý các tài khoản nông trại trên hệ thống AgriLog.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnLight}>
            <Filter size={16} /> Bộ lọc
          </button>
          <button className={styles.btnPrimary}>
            <UserPlus size={16} /> Thêm tài khoản
          </button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        {kpis.map((kpi, index) => (
          <Card key={index} className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{kpi.label}</div>
            <div className={styles.kpiValueRow}>
              <span className={styles.kpiValue}>{kpi.value}</span>
              <span className={`${styles.kpiMeta} ${kpi.isPos ? styles.kpiMetaPos : styles.kpiMetaLabel}`}>
                {kpi.meta} {kpi.isPos && '↗'}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên Nông Trại</th>
              <th>Email Đăng Ký</th>
              <th>Tỉnh Thành</th>
              <th>Ngày Đăng Ký</th>
              <th>Số lượng Nhật ký</th>
              <th>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {farmsData.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Không có dữ liệu.</td>
              </tr>
            )}
            {farmsData.map((row) => {
              const Icon = Sprout;

              return (
                <tr key={row.user._id}>
                  <td style={{ color: 'var(--color-text-muted)' }}>{row.user._id.substring(0, 8)}...</td>
                  <td>
                    <div className={styles.farmCell}>
                      <div className={styles.farmLogo}><Icon size={16} /></div>
                      <span className={styles.farmName}>{row.profile?.farmName || 'Chưa cập nhật'}</span>
                    </div>
                  </td>
                  <td>{row.user.email}</td>
                  <td>{row.profile?.location?.province || 'Chưa cập nhật'}</td>
                  <td>{new Date(row.user.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>{row.boardCount}</td>
                  <td>
                    <Badge variant={row.user.isActive === false ? 'danger' : 'success'}>
                      {row.user.isActive === false ? 'Bị Khóa' : 'Hoạt động'}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className={styles.pagination}>
          <div className={styles.pageInfo}>Hiển thị {farmsData.length} tài khoản</div>
          <div className={styles.pageControls}>
            <button className={styles.pageBtn}>&lt;</button>
            <button className={`${styles.pageBtn} ${styles.active}`}>1</button>
            <button className={styles.pageBtn}>&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
