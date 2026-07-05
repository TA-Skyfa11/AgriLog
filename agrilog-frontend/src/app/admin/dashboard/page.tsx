'use client';

import React, { useState, useEffect } from 'react';
import { Download, PlusCircle, CheckCircle, ShoppingCart, UserPlus, Package, MessageSquare, AlertTriangle, CloudRain, TreePine } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/Card';
import styles from '@/css/Dashboard.module.css';
import { fetchAPI } from '@/lib/api';

export default function DashboardPage() {
  const [chartTab, setChartTab] = useState<'users' | 'orders'>('users');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetchAPI('/admin/dashboard');
        if (res.success) {
          setStats(res.data);
        }
      } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return <div className={styles.container} style={{ padding: '2rem' }}>Đang tải dữ liệu...</div>;
  }

  const kpis = [
    { label: 'Tổng Nông trại', value: stats?.totalFarms || 0, growth: '+0%', isPos: true, icon: TreePine },
    { label: 'Người dùng mới (30 ngày)', value: stats?.newUsers || 0, growth: '+0%', isPos: true, icon: UserPlus },
    { label: 'Sản phẩm Marketplace', value: 'Đang cập nhật', growth: 'N/A', isPos: true, icon: Package },
    { label: 'Tổng số Nhật ký canh tác', value: stats?.totalBoards || 0, growth: '+0%', isPos: true, icon: ShoppingCart },
  ];

  // Placeholder trend data since we don't have historical DB data yet
  const trendChart = [
    { name: 'Tháng 1', users: 5, orders: 0 },
    { name: 'Tháng 2', users: 12, orders: 0 },
    { name: 'Tháng 3', users: 8, orders: 0 },
    { name: 'Tháng 4', users: 20, orders: 0 },
    { name: 'Tháng 5', users: 15, orders: 0 },
    { name: 'Tháng 6', users: Math.max(stats?.newUsers || 0, 1), orders: 0 },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tổng quan hệ thống</h1>
        </div>
      </div>
      <div className={styles.kpiGrid}>
        {kpis.map((kpi, index) => (
          <Card key={index} className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon}>
                <kpi.icon size={18} />
              </div>
              <span className={`${styles.kpiGrowth} ${kpi.isPos ? styles.growthPositive : styles.growthNegative}`}>
                {kpi.growth} {kpi.isPos ? '↗' : '↘'}
              </span>
            </div>
            <div>
              <div className={styles.kpiLabel}>{kpi.label}</div>
              <div className={styles.kpiValue}>{kpi.value}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>
          <Card className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h3 className={styles.chartTitle}>Xu hướng đơn hàng & Người dùng</h3>
              </div>
              <div className={styles.chartTabs}>
                <button 
                  className={`${styles.chartTab} ${chartTab === 'users' ? styles.active : ''}`}
                  onClick={() => setChartTab('users')}
                >
                  Người dùng
                </button>
                <button 
                  className={`${styles.chartTab} ${chartTab === 'orders' ? styles.active : ''}`}
                  onClick={() => setChartTab('orders')}
                >
                  Đơn hàng
                </button>
              </div>
            </div>
            <div className={styles.chartArea}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendChart} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar 
                    dataKey={chartTab} 
                    fill={chartTab === 'users' ? '#10b981' : '#f59e0b'} 
                    radius={[4, 4, 0, 0]} 
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className={styles.quickActions}>
            <Card className={styles.quickActionCard}>
              <h4 className={styles.quickActionTitle}>Thêm sản phẩm mới</h4>
              <p className={styles.quickActionDesc}>Chức năng Marketplace đang phát triển.</p>
              <button className={styles.quickActionBtn}>
                <PlusCircle size={18} /> Đang cập nhật
              </button>
            </Card>
            <Card className={styles.quickActionCard}>
              <h4 className={styles.quickActionTitle}>Duyệt người dùng</h4>
              <p className={styles.quickActionDesc}>Không có hồ sơ nào đang chờ duyệt.</p>
              <button className={styles.quickActionBtn}>
                <CheckCircle size={18} /> Xem danh sách
              </button>
            </Card>
          </div>
        </div>

        <div className={styles.rightCol}>
          <Card>
            <h3 className={styles.sectionTitle}>
              Hoạt động gần đây
            </h3>
            <div className={styles.activityList}>
              <div className={styles.activityItem}>
                <div className={`${styles.activityIcon} ${styles.iconUser}`}>
                  <UserPlus size={16} />
                </div>
                <div className={styles.activityContent}>
                  <div className={styles.activityText}>
                  </div>
                  <div className={styles.activityTime}>Vừa xong</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className={`${styles.card} ${styles.weatherWidget}`}>
            <div className={styles.weatherContent}>
              <div className={styles.weatherHeader}>
                <div>
                  <div className={styles.weatherLabel}>Thời tiết khu vực canh tác</div>
                  <div className={styles.weatherLoc}>Đà Lạt, Lâm Đồng</div>
                </div>
                <CloudRain className={styles.weatherIcon} size={24} />
              </div>
              <div className={styles.weatherTempBox}>
                <div className={styles.weatherTemp}>24°C</div>
                <div className={styles.weatherCond}>Mưa rào nhẹ</div>
              </div>
            </div>
            <TreePine className={styles.weatherBg} size={120} />
          </Card>
        </div>
      </div>
    </div>
  );
}
