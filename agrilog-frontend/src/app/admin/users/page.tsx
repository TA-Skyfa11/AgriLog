'use client';

import React from 'react';
import { Filter, UserPlus, Shield, Sprout, Ban, Building } from 'lucide-react';
import { usersData } from '@/lib/mockData';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import styles from '@/css/Users.module.css';

export default function UsersPage() {
  const kpis = [
    { label: 'Tổng người dùng', value: usersData.kpis.totalUsers.value, meta: usersData.kpis.totalUsers.growth, isPos: true },
    { label: 'Nông trại hoạt động', value: usersData.kpis.activeFarms.value, meta: usersData.kpis.activeFarms.status, isPos: true },
    { label: 'Đăng ký mới (Tháng)', value: usersData.kpis.newRegistrations.value, meta: usersData.kpis.newRegistrations.growth, isPos: true },
    { label: 'Gói cao cấp (Pro)', value: usersData.kpis.premiumPlans.value, meta: usersData.kpis.premiumPlans.label, isPos: false },
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
              <th>Người Đại Diện</th>
              <th>Liên Hệ</th>
              <th>Ngày Đăng Ký</th>
              <th>Gói Dịch Vụ</th>
              <th>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {usersData.table.map((row) => {
              let Icon = Sprout;
              if (row.status === 'Khóa') Icon = Ban;
              if (row.plan === 'Enterprise') Icon = Building;

              return (
                <tr key={row.id}>
                  <td style={{ color: 'var(--color-text-muted)' }}>{row.id}</td>
                  <td>
                    <div className={styles.farmCell}>
                      <div className={styles.farmLogo}><Icon size={16} /></div>
                      <span className={styles.farmName}>{row.farmName}</span>
                    </div>
                  </td>
                  <td>{row.rep}</td>
                  <td>
                    <div className={styles.contactCell}>
                      <span className={styles.contactEmail}>{row.email}</span>
                      <span className={styles.contactPhone}>{row.phone}</span>
                    </div>
                  </td>
                  <td>{row.regDate}</td>
                  <td>
                    <Badge variant={row.planColor as any}>{row.plan}</Badge>
                  </td>
                  <td>
                    <Badge variant={row.status === 'Hoạt động' ? 'success' : 'danger'}>
                      {row.status}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className={styles.pagination}>
          <div className={styles.pageInfo}>Hiển thị 1-10 của 1,284 tài khoản</div>
          <div className={styles.pageControls}>
            <button className={styles.pageBtn}>&lt;</button>
            <button className={`${styles.pageBtn} ${styles.active}`}>1</button>
            <button className={styles.pageBtn}>2</button>
            <button className={styles.pageBtn}>3</button>
            <span>...</span>
            <button className={styles.pageBtn}>129</button>
            <button className={styles.pageBtn}>&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
