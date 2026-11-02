'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/cooperative.module.css';
import { 
  BarChart2, TrendingUp, DollarSign, Award, ArrowLeft, 
  Sprout, RefreshCw, Layers
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function CooperativeSeasonComparisonPage() {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [coop, setCoop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI('/cooperative/season-comparison');
      if (res.success) {
        setSeasons(res.data || []);
        if (res.cooperative) setCoop(res.cooperative);
      }
    } catch (e) {
      toast.error('Lỗi tải dữ liệu so sánh mùa vụ HTX');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className={styles.container}>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/cooperative/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: '#64748b', textDecoration: 'none', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Quay lại Bảng điều khiển HTX
        </Link>
      </div>

      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>
            <BarChart2 size={28} color="#16a34a" /> So sánh Hiệu quả Giữa các Mùa vụ Toàn Hợp tác xã
          </h1>
          <p className={styles.headerSubtitle}>
            Theo dõi năng suất đạt được, so sánh cơ cấu chi phí vật tư (giống, phân bón, thuốc BVTV) và giá thành sản xuất giữa các vụ trong năm để đánh giá và tối ưu hiệu quả canh tác.
          </p>
        </div>
        <button onClick={loadData} className={styles.btnOutline}>
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {/* Summary comparison cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ background: '#ecfdf5', color: '#16a34a' }}>
            <Award size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <div className={styles.kpiLabel}>Tổng số vụ mùa so sánh</div>
            <div className={styles.kpiValue}>{seasons.length} <span style={{ fontSize: '1rem', color: '#64748b' }}>vụ</span></div>
            <div className={styles.kpiSub}>Toàn bộ các hộ thành viên</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <div className={styles.kpiLabel}>Tổng sản lượng thu hoạch</div>
            <div className={styles.kpiValue}>
              {(seasons.reduce((sum, s) => sum + (s.actualYield || 0), 0) / 1000).toFixed(1)} <span style={{ fontSize: '1rem', color: '#64748b' }}>tấn</span>
            </div>
            <div className={styles.kpiSub}>Đã đạt qua các vụ mùa</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ background: '#fef3c7', color: '#d97706' }}>
            <DollarSign size={24} />
          </div>
          <div className={styles.kpiInfo}>
            <div className={styles.kpiLabel}>Chi phí bình quân / kg</div>
            <div className={styles.kpiValue}>
              {seasons.length > 0 
                ? Math.round(seasons.reduce((sum, s) => sum + (s.costPerKg || 0), 0) / seasons.length).toLocaleString('vi-VN')
                : 0} <span style={{ fontSize: '1rem', color: '#64748b' }}>đ/kg</span>
            </div>
            <div className={styles.kpiSub}>Tối ưu giá thành sản xuất</div>
          </div>
        </div>
      </div>

      {/* Detailed comparison table */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>
            <Layers size={18} color="#16a34a" /> Bảng so sánh chi tiết Năng suất & Chi phí đầu vào các vụ
          </div>
        </div>

        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Hộ xã viên</th>
                <th>Tên Vụ mùa & Cây trồng</th>
                <th>Diện tích (m²)</th>
                <th>Sản lượng thực tế</th>
                <th>Tiền giống</th>
                <th>Tiền phân bón</th>
                <th>Tiền thuốc BVTV</th>
                <th>Tổng chi phí</th>
                <th>Giá thành / kg</th>
                <th>Tuân thủ PHI</th>
              </tr>
            </thead>
            <tbody>
              {seasons.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    Chưa có mùa vụ nào hoàn thành để so sánh.
                  </td>
                </tr>
              ) : (
                seasons.map(s => (
                  <tr key={s.boardId}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{s.memberOwner}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.farmName}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.boardName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>{s.cropType}</div>
                    </td>
                    <td>{Number(s.areaSqm || 0).toLocaleString('vi-VN')}</td>
                    <td>
                      <strong style={{ color: '#0284c7' }}>{Number(s.actualYield || 0).toLocaleString('vi-VN')} kg</strong>
                      {s.expectedYield > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          (KH: {s.expectedYield?.toLocaleString('vi-VN')} kg)
                        </div>
                      )}
                    </td>
                    <td>{Number(s.totalSeedCost || 0).toLocaleString('vi-VN')} đ</td>
                    <td>{Number(s.totalFertilizerCost || 0).toLocaleString('vi-VN')} đ</td>
                    <td>{Number(s.totalPesticideCost || 0).toLocaleString('vi-VN')} đ</td>
                    <td><strong style={{ color: '#0f172a' }}>{Number(s.totalCost || 0).toLocaleString('vi-VN')} đ</strong></td>
                    <td>
                      {s.costPerKg > 0 ? (
                        <strong style={{ color: '#15803d' }}>{Number(s.costPerKg).toLocaleString('vi-VN')} đ/kg</strong>
                      ) : '—'}
                    </td>
                    <td>
                      {s.phiComplianceStatus === 'CRITICAL' ? (
                        <span className={`${styles.badge} ${styles.badgeCritical}`}>Vi phạm PHI</span>
                      ) : s.phiComplianceStatus === 'WARNING' ? (
                        <span className={`${styles.badge} ${styles.badgeWarning}`}>Cần theo dõi</span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgeSafe}`}>Đạt chuẩn</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
