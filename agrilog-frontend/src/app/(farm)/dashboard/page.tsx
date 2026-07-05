'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/farmDashboard.module.css';
import { LayoutDashboard, CalendarClock, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#ea580c', '#64748b'];

export default function DashboardPage() {
  const [stats, setStats] = useState({
    boardsCount: 0,
    tasksPending: 0,
    inventoryAlerts: 0,
  });
  const [reportStats, setReportStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [cBoardsRes, fBoardsRes, pBoardsRes, tasksRes, inventoryRes, reportsRes] = await Promise.all([
        fetchAPI('/cultivation-boards'),
        fetchAPI('/fertilizer-boards'),
        fetchAPI('/pesticide-boards'),
        fetchAPI('/tasks'),
        fetchAPI('/materials'),
        fetchAPI('/farm/reports-stats'),
      ]);

      let boardsCount = 0;
      let tasksPending = 0;
      let inventoryAlerts = 0;

      if (cBoardsRes.success) boardsCount += cBoardsRes.data.length;
      if (fBoardsRes.success) boardsCount += fBoardsRes.data.length;
      if (pBoardsRes.success) boardsCount += pBoardsRes.data.length;
      
      if (tasksRes.success) tasksPending = tasksRes.data.filter((t: any) => t.status === 'PENDING').length;
      if (inventoryRes.success) inventoryAlerts = inventoryRes.data.filter((m: any) => m.quantity <= m.minQuantityAlert).length;

      setStats({ boardsCount, tasksPending, inventoryAlerts });
      if (reportsRes.success) {
        setReportStats(reportsRes.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Đang tải tổng quan...</div>;

  const harvestData = reportStats?.harvestData || [];
  const costData = reportStats?.costData || [];

  // Aggregate cost data for the PieChart
  const totalFertilizer = costData.reduce((acc: number, c: any) => acc + (c.phanBon || 0), 0);
  const totalPesticide = costData.reduce((acc: number, c: any) => acc + (c.thuocBVTV || 0), 0);

  const costStructure = [
    { name: 'Phân bón', value: totalFertilizer },
    { name: 'Thuốc BVTV', value: totalPesticide },
  ].filter(c => c.value > 0);

  if (costStructure.length === 0) {
    costStructure.push({ name: 'Chưa có chi phí bón phân & phun thuốc', value: 1 });
  }

  return (
    <div className={styles.container}>
      <div className={styles.welcomeCard}>
        <div className={styles.welcomeTitle}>Chào mừng trở lại AgriLog!</div>
        <div className={styles.welcomeSubtitle}>Hệ thống quản lý nhật ký canh tác số hoá dành cho nông trại thông minh.</div>
      </div>

      <div className={styles.header}>
        <h2 className={styles.title}>Tổng quan hoạt động</h2>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <LayoutDashboard size={28} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statTitle}>Bảng ghi chép đang mở</div>
            <div className={styles.statValue}>{stats.boardsCount}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <CalendarClock size={28} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statTitle}>Công việc chờ xử lý</div>
            <div className={styles.statValue}>{stats.tasksPending}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
            <AlertTriangle size={28} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statTitle}>Vật tư sắp hết</div>
            <div className={styles.statValue} style={{ color: stats.inventoryAlerts > 0 ? '#dc2626' : 'inherit' }}>
              {stats.inventoryAlerts}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.chartGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Sản lượng thu hoạch thực tế (Tấn)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={harvestData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} Tấn`, 'Sản lượng']} />
                <Bar dataKey="sanLuong" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Cơ cấu chi phí vật tư đã sử dụng</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={costStructure}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {costStructure.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [
                  name === 'Chưa có chi phí bón phân & phun thuốc' ? '—' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value)),
                  name
                ]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
