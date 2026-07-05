'use client';

import React, { useState } from 'react';
import { Download, Filter, ArrowUpDown, BadgeCheck, ClipboardList, CheckCircle2, XCircle } from 'lucide-react';
import { ordersData } from '@/lib/mockData';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import styles from '@/css/Orders.module.css';

export default function OrdersPage() {
  const [filterTab, setFilterTab] = useState<'all' | 'newest' | 'high_value'>('all');
  
  const kpis = [
    { label: 'Đơn hàng mới', value: ordersData.kpis.newOrders.value, meta: ordersData.kpis.newOrders.growth, icon: BadgeCheck, iconClass: styles.iconNew, metaClass: styles.growthPos },
    { label: 'Đang xử lý', value: ordersData.kpis.processing.value, meta: ordersData.kpis.processing.label, icon: ClipboardList, iconClass: styles.iconProcess, metaClass: styles.growthWarn },
    { label: 'Đã hoàn thành', value: ordersData.kpis.completed.value, meta: ordersData.kpis.completed.percentage, icon: CheckCircle2, iconClass: styles.iconDone, metaClass: styles.growthSucc },
    { label: 'Đã hủy', value: ordersData.kpis.cancelled.value, meta: ordersData.kpis.cancelled.growth, icon: XCircle, iconClass: styles.iconCancel, metaClass: styles.growthNeg },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý đơn hàng</h1>
          <p className={styles.subtitle}>Theo dõi và quản lý toàn bộ quy trình giao dịch nông sản trên hệ thống AgriLog.</p>
        </div>
        <button className={styles.btnPrimary}>
          <Download size={16} /> Xuất báo cáo
        </button>
      </div>

      <div className={styles.kpiGrid}>
        {kpis.map((kpi, index) => (
          <Card key={index} className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={`${styles.kpiIcon} ${kpi.iconClass}`}>
                <kpi.icon size={20} />
              </div>
              <span className={`${styles.kpiGrowth} ${kpi.metaClass}`}>
                {kpi.meta}
              </span>
            </div>
            <div>
              <div className={styles.kpiLabel}>{kpi.label}</div>
              <div className={styles.kpiValue}>{kpi.value}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className={styles.tableSection}>
        <div className={styles.filterBar}>
          <div className={styles.filterTabs}>
            <button className={`${styles.tab} ${filterTab === 'all' ? styles.active : ''}`} onClick={() => setFilterTab('all')}>Tất cả</button>
            <button className={`${styles.tab} ${filterTab === 'newest' ? styles.active : ''}`} onClick={() => setFilterTab('newest')}>Mới nhất</button>
            <button className={`${styles.tab} ${filterTab === 'high_value' ? styles.active : ''}`} onClick={() => setFilterTab('high_value')}>Giá trị cao</button>
          </div>
          <div className={styles.filterActions}>
            <button className={styles.btnOutline}>
              <Filter size={16} /> Lọc dữ liệu
            </button>
            <button className={styles.btnOutline}>
              <ArrowUpDown size={16} /> Sắp xếp
            </button>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Tên Nông Trại</th>
                <th>Ngày Đặt</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
                <th>Thanh Toán</th>
              </tr>
            </thead>
            <tbody>
              {ordersData.table.map((row) => (
                <tr key={row.id}>
                  <td className={styles.idCell}>{row.id}</td>
                  <td>
                    <div className={styles.farmCell}>
                      <div className={styles.farmImg} />
                      <span className={styles.farmName}>{row.farmName}</span>
                    </div>
                  </td>
                  <td>{row.date}</td>
                  <td className={styles.amountCell}>{row.amount}</td>
                  <td>
                    <Badge variant={row.statusColor as any}>{row.status}</Badge>
                  </td>
                  <td>
                    <Badge variant={row.paymentColor as any}>{row.payment}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.pagination}>
          <div className={styles.pageInfo}>Hiển thị 1-10 trên 1,504 đơn hàng</div>
          <div className={styles.pageControls}>
            <button className={styles.pageBtn}>&lt;</button>
            <button className={`${styles.pageBtn} ${styles.active}`}>1</button>
            <button className={styles.pageBtn}>2</button>
            <button className={styles.pageBtn}>3</button>
            <span>...</span>
            <button className={styles.pageBtn}>150</button>
            <button className={styles.pageBtn}>&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
