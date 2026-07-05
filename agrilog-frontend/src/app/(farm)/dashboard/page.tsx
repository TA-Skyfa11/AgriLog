/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/farmDashboard.module.css';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    boardsCount: 0,
    tasksPending: 0,
    inventoryAlerts: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [boardsRes, tasksRes, inventoryRes] = await Promise.all([
        fetchAPI('/boards'),
        fetchAPI('/tasks'),
        fetchAPI('/materials'),
      ]);

      let boardsCount = 0;
      let tasksPending = 0;
      let inventoryAlerts = 0;

      if (boardsRes.success) boardsCount = boardsRes.data.length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (tasksRes.success) tasksPending = tasksRes.data.filter((t: any) => t.status === 'PENDING').length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (inventoryRes.success) inventoryAlerts = inventoryRes.data.filter((m: any) => m.quantity <= m.minQuantityAlert).length;

      setStats({ boardsCount, tasksPending, inventoryAlerts });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div>Đang tải tổng quan...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.welcomeCard}>
        <div className={styles.welcomeTitle}>Chào mừng trở lại AgriLog!</div>
        <div className={styles.welcomeSubtitle}>Hệ thống quản lý nhật ký canh tác số hoá dành cho nông trại.</div>
      </div>

      <div className={styles.header}>
        <h2 className={styles.title}>Tổng quan Nông trại</h2>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Bảng canh tác</div>
          <div className={styles.statValue}>{stats.boardsCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Công việc cần làm</div>
          <div className={styles.statValue}>{stats.tasksPending}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Vật tư sắp hết</div>
          <div className={styles.statValue} style={{ color: stats.inventoryAlerts > 0 ? 'var(--color-error)' : 'inherit' }}>
            {stats.inventoryAlerts}
          </div>
        </div>
      </div>
    </div>
  );
}

