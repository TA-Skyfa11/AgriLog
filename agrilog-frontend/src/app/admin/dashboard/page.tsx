'use client';

import React, { useState } from 'react';
import { Download, PlusCircle, CheckCircle, ShoppingCart, UserPlus, Package, MessageSquare, AlertTriangle, CloudRain, TreePine } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardData } from '@/lib/mockData';
import { Card } from '@/components/ui/Card';
import styles from '@/css/Dashboard.module.css';

export default function DashboardPage() {
  const [chartTab, setChartTab] = useState<'users' | 'orders'>('users');
  const kpis = [
    { label: 'Tổng nông trại', value: dashboardData.kpis.totalFarms.value, growth: dashboardData.kpis.totalFarms.growth, isPos: dashboardData.kpis.totalFarms.isPositive, icon: TreePine },
    { label: 'Người dùng mới', value: dashboardData.kpis.newUsers.value, growth: dashboardData.kpis.newUsers.growth, isPos: dashboardData.kpis.newUsers.isPositive, icon: UserPlus },
    { label: 'Sản phẩm Marketplace', value: dashboardData.kpis.marketplaceProducts.value, growth: dashboardData.kpis.marketplaceProducts.growth, isPos: dashboardData.kpis.marketplaceProducts.isPositive, icon: Package },
    { label: 'Đơn hàng', value: dashboardData.kpis.orders.value, growth: dashboardData.kpis.orders.growth, isPos: dashboardData.kpis.orders.isPositive, icon: ShoppingCart },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tổng quan hệ thống</h1>
          <p className={styles.subtitle}>Xin chào An, đây là số liệu vận hành AgriLog hôm nay.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnLight}>
            30 ngày qua
          </button>
          <button className={styles.btnPrimary}>
            <Download size={16} /> Xuất báo cáo
          </button>
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
                <p className={styles.chartSubtitle}>Dữ liệu tổng hợp từ 6 tháng gần nhất</p>
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
                <BarChart data={dashboardData.trendChart} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
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
              <p className={styles.quickActionDesc}>Cập nhật danh mục Marketplace với các loại giống cây mới nhất.</p>
              <button className={styles.quickActionBtn}>
                <PlusCircle size={18} /> Bắt đầu thêm
              </button>
            </Card>
            <Card className={styles.quickActionCard}>
              <h4 className={styles.quickActionTitle}>Duyệt người dùng</h4>
              <p className={styles.quickActionDesc}>Có 14 hồ sơ đăng ký hợp tác nông trại đang chờ phê duyệt.</p>
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
              <span className={styles.linkAll}>Xem tất cả</span>
            </h3>
            <div className={styles.activityList}>
              {dashboardData.recentActivities.map(act => {
                let Icon = MessageSquare;
                let iconClass = styles.iconFeedback;
                if (act.type === 'order') { Icon = ShoppingCart; iconClass = styles.iconOrder; }
                if (act.type === 'user') { Icon = UserPlus; iconClass = styles.iconUser; }
                if (act.type === 'alert') { Icon = AlertTriangle; iconClass = styles.iconAlert; }

                return (
                  <div key={act.id} className={styles.activityItem}>
                    <div className={`${styles.activityIcon} ${iconClass}`}>
                      <Icon size={16} />
                    </div>
                    <div className={styles.activityContent}>
                      <div className={styles.activityText}>
                        <strong>{act.title}</strong> {act.desc}
                      </div>
                      <div className={styles.activityTime}>{act.time}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card>
            <h3 className={styles.sectionTitle}>Top sản phẩm chạy nhất</h3>
            <div className={styles.productList}>
              {dashboardData.topProducts.map(prod => (
                <div key={prod.id} className={styles.productItem}>
                  <div className={styles.productHeader}>
                    <div className={styles.productImg} />
                    <div className={styles.productInfo}>
                      <span className={styles.productName}>{prod.name}</span>
                      <span className={styles.productSales}>{prod.sales}/th</span>
                    </div>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${(prod.sales / prod.max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className={`${styles.card} ${styles.weatherWidget}`}>
            <div className={styles.weatherContent}>
              <div className={styles.weatherHeader}>
                <div>
                  <div className={styles.weatherLabel}>Thời tiết khu vực canh tác</div>
                  <div className={styles.weatherLoc}>{dashboardData.weather.location}</div>
                </div>
                <CloudRain className={styles.weatherIcon} size={24} />
              </div>
              <div className={styles.weatherTempBox}>
                <div className={styles.weatherTemp}>{dashboardData.weather.temp}</div>
                <div className={styles.weatherCond}>{dashboardData.weather.condition}</div>
              </div>
            </div>
            <TreePine className={styles.weatherBg} size={120} />
          </Card>
        </div>
      </div>
    </div>
  );
}
