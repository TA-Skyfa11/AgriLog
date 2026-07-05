'use client';

import React from 'react';
import { Filter, Plus, Package, TrendingUp, AlertTriangle, EyeOff, Edit2, Trash2, BarChart2 } from 'lucide-react';
import { marketplaceData } from '@/lib/mockData';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import styles from '@/css/Marketplace.module.css';

export default function MarketplacePage() {
  const kpis = [
    { label: 'Tổng sản phẩm', value: marketplaceData.kpis.totalProducts.value, icon: Package, iconClass: styles.iconTotal },
    { label: 'Đang bán', value: marketplaceData.kpis.selling.value, icon: TrendingUp, iconClass: styles.iconSelling },
    { label: 'Sắp hết hàng', value: marketplaceData.kpis.lowStock.value, icon: AlertTriangle, iconClass: styles.iconLow },
    { label: 'Đang ẩn', value: marketplaceData.kpis.hidden.value, icon: EyeOff, iconClass: styles.iconHidden },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản lý Marketplace</h1>
          <p className={styles.subtitle}>Quản lý danh mục sản phẩm, tồn kho và trạng thái hiển thị.</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnLight}>
            <Filter size={16} /> Bộ lọc
          </button>
          <button className={styles.btnPrimary}>
            <Plus size={16} /> Thêm sản phẩm
          </button>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        {kpis.map((kpi, index) => (
          <Card key={index} className={styles.kpiCard}>
            <div className={styles.kpiTop}>
              <div className={`${styles.kpiIcon} ${kpi.iconClass}`}>
                <kpi.icon size={18} />
              </div>
              <div className={styles.kpiLabel}>{kpi.label}</div>
            </div>
            <div className={styles.kpiValue}>{kpi.value}</div>
          </Card>
        ))}
      </div>

      <div className={styles.tableSection}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sản Phẩm</th>
                <th>Loại</th>
                <th>Thương Hiệu</th>
                <th>Giá Bán</th>
                <th>Tồn Kho</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {marketplaceData.table.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className={styles.productCell}>
                      <div className={styles.productImg} />
                      <div className={styles.productInfo}>
                        <span className={styles.productName}>{row.name}</span>
                        <span className={styles.productSku}>SKU: {row.sku}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge variant={row.categoryColor as any}>{row.category}</Badge>
                  </td>
                  <td>{row.brand}</td>
                  <td className={styles.priceCell}>{row.price}</td>
                  <td>
                    <div className={styles.stockCell}>
                      <span style={{ color: row.stock < 20 ? 'var(--color-error)' : 'var(--color-success)', fontWeight: 600 }}>{row.stock}</span>
                      <div className={styles.stockBar}>
                        <div className={styles.stockFill} style={{ width: `${Math.min((row.stock / 150) * 100, 100)}%`, backgroundColor: row.stock < 20 ? 'var(--color-error)' : 'var(--color-success)' }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: row.statusColor === 'success' ? 'var(--color-success)' : 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: row.statusColor === 'success' ? 'var(--color-success)' : 'var(--color-text-muted)' }} />
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionCell}>
                      <button className={styles.actionBtn}><Edit2 size={16} /></button>
                      <button className={styles.actionBtn}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.pagination}>
          <div className={styles.pageInfo}>Hiển thị 1-10 trên 1,284 sản phẩm</div>
          <div className={styles.pageControls}>
            <button className={styles.pageBtn}>&lt;</button>
            <button className={`${styles.pageBtn} ${styles.active}`}>1</button>
            <button className={styles.pageBtn}>2</button>
            <button className={styles.pageBtn}>3</button>
            <span>...</span>
            <button className={styles.pageBtn}>128</button>
            <button className={styles.pageBtn}>&gt;</button>
          </div>
        </div>
      </div>

      <div className={styles.bottomSection}>
        <Card className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            <BarChart2 size={20} style={{ color: 'var(--color-primary)', display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Phân tích xu hướng Marketplace
          </h3>
          <div className={styles.chartPlaceholder}>
            Biểu đồ tăng trưởng doanh số sẽ được hiển thị ở đây.
          </div>
        </Card>
        
        <Card>
          <h3 className={styles.chartTitle}>Hoạt động gần đây</h3>
          <div className={styles.activityList}>
            {marketplaceData.recentActivities.map(act => (
              <div key={act.id} className={styles.activityItem}>
                <div className={`${styles.activityDot} ${act.type === 'success' ? styles.dotSuccess : styles.dotDanger}`} />
                <div className={styles.activityContent}>
                  <div className={styles.activityAction}>{act.action}</div>
                  <div className={styles.activityMeta}>Bởi {act.user} • {act.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
