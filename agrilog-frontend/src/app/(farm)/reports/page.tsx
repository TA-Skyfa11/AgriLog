/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/css/reports.module.css';
import { BarChart2, Download } from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Legend 
} from 'recharts';

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetchAPI('/farm/reports-stats');
        if (res.success) {
          setStats(res.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const exportToPDF = () => {
    window.print();
  };

  if (loading) return <div style={{ padding: '2rem' }}>Đang tải báo cáo thống kê...</div>;

  const costData = stats?.costData || [];
  const harvestData = stats?.harvestData || [];
  const currentVal = stats?.currentInventoryValue || 0;

  // Calculate monthly total expense trend for the line chart
  const expenseTrend = costData.map((c: any) => ({
    month: c.month,
    tongChiPhi: (c.phanBon || 0) + (c.thuocBVTV || 0) + (c.giong || 0),
  }));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}><BarChart2 size={24} color="#16a34a" /> Báo cáo & Thống kê</h1>
          <div className={styles.subtitle}>Phân tích chi tiết về hoạt động sản xuất, chi phí và doanh thu từ dữ liệu thực tế</div>
        </div>
        <button className={styles.button} onClick={exportToPDF}>
          <Download size={18} /> In Báo cáo (PDF)
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Tổng giá trị kho vật tư hiện tại</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-700)' }}>
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentVal)}
          </div>
        </div>
        <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Tổng chi phí vật tư dùng (6 tháng)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444' }}>
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(expenseTrend.reduce((acc: number, e: any) => acc + e.tongChiPhi, 0))}
          </div>
        </div>
        <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Tổng sản lượng thu hoạch (6 tháng)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6' }}>
            {harvestData.reduce((acc: number, h: any) => acc + (h.sanLuong || 0), 0).toFixed(2)} Tấn
          </div>
        </div>
      </div>

      <div className={styles.chartGrid}>
        <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
          <h3 className={styles.chartTitle}>Chi phí vật tư bón phân & phun thuốc theo tháng (VNĐ)</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <AreaChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))} />
                <Legend />
                <Area type="monotone" dataKey="phanBon" name="Phân bón" stackId="1" stroke="#f59e0b" fill="#fef3c7" />
                <Area type="monotone" dataKey="thuocBVTV" name="Thuốc BVTV" stackId="1" stroke="#ef4444" fill="#fee2e2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Sản lượng thu hoạch thực tế (Tấn)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={harvestData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} Tấn`, 'Sản lượng']} />
                <Bar dataKey="sanLuong" name="Sản lượng" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Xu hướng tổng chi phí vật tư đã dùng (VNĐ)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={expenseTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value))} />
                <Line type="monotone" dataKey="tongChiPhi" name="Tổng chi phí" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
