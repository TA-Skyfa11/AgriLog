'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/cooperative.module.css';
import { 
  Building, Users, Layers, TrendingUp, ShieldAlert, AlertTriangle, Copy, 
  CheckCircle, ArrowRight, FileText, Send, Calendar, Sprout, BarChart3
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CooperativeDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [complianceAlerts, setComplianceAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSendingWarning, setIsSendingWarning] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, alertsRes] = await Promise.all([
        fetchAPI('/cooperative/dashboard').catch(() => ({ success: false, data: null })),
        fetchAPI('/cooperative/compliance-alerts').catch(() => ({ success: false, data: [] })),
      ]);

      if (dashRes.success && dashRes.data) {
        setData(dashRes.data);
      }
      if (alertsRes.success && alertsRes.data) {
        setComplianceAlerts(alertsRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi tải dữ liệu bảng điều khiển HTX');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSendWarning = async (alert: any) => {
    try {
      setIsSendingWarning(true);
      const res = await fetchAPI('/cooperative/compliance-alerts/send-warning', {
        method: 'POST',
        body: JSON.stringify({
          farmProfileId: alert.farmProfileId,
          alertMessage: alert.message,
          title: '⚠️ CẢNH BÁO AN TOÀN PHI: KHÔNG ĐƯỢC THU HOẠCH SỚM!',
        }),
      });

      if (res.success) {
        toast.success(`Đã gửi cảnh báo trực tiếp đến ${alert.ownerName} (${alert.farmName})!`, {
          icon: '📢',
        });
      } else {
        toast.error(res.message || 'Lỗi gửi cảnh báo');
      }
    } catch (e: any) {
      toast.error('Lỗi khi gửi thông báo cảnh báo');
    } finally {
      setIsSendingWarning(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid #16a34a', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <div>Đang tải dữ liệu Bảng điều khiển Hợp tác xã...</div>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {
    totalMembers: 0,
    totalAreaSqm: 0,
    totalAreaHectare: '0',
    totalExpectedYield: 0,
    totalActualYield: 0,
    activePhiWarningsCount: 0,
    criticalPhiCount: 0,
  };

  const coop = data?.cooperative || {
    name: 'Hợp tác xã Nông nghiệp Sạch Hòa Bình',
    code: 'HTX-HB01',
    address: 'Xã Hòa Bình, Thường Tín, Hà Nội',
    certificationStandards: ['VietGAP', 'GlobalGAP'],
  };

  const criticalAlerts = complianceAlerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'WARNING');

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>
            <Building size={28} color="#16a34a" /> {coop.name}
          </h1>
          <p className={styles.headerSubtitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span>Mã HTX: <strong style={{ fontFamily: 'monospace', color: '#15803d' }}>{coop.code}</strong></span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(coop.code);
                toast.success(`Đã sao chép mã ${coop.code}!`);
              }}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                padding: '0.15rem 0.45rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: '#334155',
              }}
            >
              <Copy size={12} /> Sao chép
            </button>
            <span>| Địa chỉ: {coop.address}</span>
            <span>| Tiêu chuẩn: 
              <span style={{ marginLeft: '4px', color: '#15803d', fontWeight: 600 }}>
                {(coop.certificationStandards || ['VietGAP']).join(', ')}
              </span>
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/cooperative/compliance" className={styles.btnOutline}>
            <ShieldAlert size={16} /> Giám sát an toàn PHI
          </Link>
          <Link href="/cooperative/export" className={styles.btnPrimary}>
            <FileText size={16} /> Xuất hồ sơ mùa vụ (1-Click)
          </Link>
        </div>
      </div>

      {/* KPI Cards (Theo đúng yêu cầu ảnh 1: Thống kê tổng số hộ, diện tích, sản lượng dự kiến toàn HTX) */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ background: '#ecfdf5', color: '#16a34a' }}>
            <Users size={26} />
          </div>
          <div className={styles.kpiInfo}>
            <div className={styles.kpiLabel}>Tổng số hộ thành viên</div>
            <div className={styles.kpiValue}>{kpis.totalMembers} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>hộ</span></div>
            <div className={styles.kpiSub}>100% xã viên liên kết HTX</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Layers size={26} />
          </div>
          <div className={styles.kpiInfo}>
            <div className={styles.kpiLabel}>Tổng diện tích canh tác</div>
            <div className={styles.kpiValue}>
              {kpis.totalAreaHectare} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>ha</span>
            </div>
            <div className={styles.kpiSub}>{kpis.totalAreaSqm?.toLocaleString('vi-VN')} m² toàn vùng trồng</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ background: '#fdf4ff', color: '#a855f7' }}>
            <TrendingUp size={26} />
          </div>
          <div className={styles.kpiInfo}>
            <div className={styles.kpiLabel}>Sản lượng dự kiến toàn HTX</div>
            <div className={styles.kpiValue}>
              {(kpis.totalExpectedYield / 1000).toFixed(1)} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>tấn</span>
            </div>
            <div className={styles.kpiSub}>{kpis.totalExpectedYield?.toLocaleString('vi-VN')} kg trong vụ mùa</div>
          </div>
        </div>

        <div className={styles.kpiCard} style={{ borderColor: criticalAlerts.length > 0 ? '#fde68a' : '#e2e8f0' }}>
          <div className={styles.kpiIconWrapper} style={{ background: criticalAlerts.length > 0 ? '#fef3c7' : '#ecfdf5', color: criticalAlerts.length > 0 ? '#d97706' : '#16a34a' }}>
            <ShieldAlert size={26} />
          </div>
          <div className={styles.kpiInfo}>
            <div className={styles.kpiLabel}>Giám sát tuân thủ PHI</div>
            <div className={styles.kpiValue} style={{ color: criticalAlerts.length > 0 ? '#d97706' : '#15803d' }}>
              {criticalAlerts.length} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>cảnh báo</span>
            </div>
            <div className={styles.kpiSub}>{criticalAlerts.length > 0 ? 'Cần giám sát không thu hoạch sớm' : '100% đạt chuẩn cách ly'}</div>
          </div>
        </div>
      </div>

      {/* CẢNH BÁO GIÁM SÁT TUÂN THỦ AN TOÀN (PHI) - Đúng tình huống trong ảnh 1 */}
      {criticalAlerts.length > 0 && (
        <div className={`${styles.alertBanner} ${criticalAlerts.some(a => a.severity === 'CRITICAL') ? styles.alertBannerCritical : ''}`}>
          <div className={`${styles.alertIcon} ${criticalAlerts.some(a => a.severity === 'CRITICAL') ? styles.alertIconCritical : ''}`}>
            <AlertTriangle size={28} />
          </div>
          <div className={styles.alertContent}>
            <div className={`${styles.alertTitle} ${criticalAlerts.some(a => a.severity === 'CRITICAL') ? styles.alertTitleCritical : ''}`}>
              🚨 CẢNH BÁO AN TOÀN CÁCH LY THUỐC BVTV (PHI) - KHÔNG ĐƯỢC THU HOẠCH SỚM!
            </div>
            <div className={styles.alertText}>
              {criticalAlerts[0]?.message || 'Có xã viên vừa phun thuốc BVTV chưa đủ thời gian cách ly PHI theo quy định!'}
            </div>
            <div className={styles.alertActions}>
              <button 
                className={styles.btnDanger} 
                onClick={() => handleSendWarning(criticalAlerts[0])}
                disabled={isSendingWarning}
              >
                <Send size={14} /> {isSendingWarning ? 'Đang gửi...' : 'Gửi cảnh báo đến nông hộ'}
              </button>
              <Link href="/cooperative/compliance" className={styles.btnOutline} style={{ color: '#92400e', borderColor: '#d97706' }}>
                Xem danh sách tất cả ({criticalAlerts.length}) cảnh báo <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Content */}
      <div className={styles.gridTwoCols}>
        {/* Column 1: Tiến độ mùa vụ các xã viên */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>
              <Sprout size={18} color="#16a34a" /> Tiến độ mùa vụ các hộ xã viên
            </div>
            <Link href="/cooperative/members" style={{ fontSize: '0.8125rem', color: '#16a34a', textDecoration: 'none', fontWeight: 600 }}>
              Xem tất cả xã viên →
            </Link>
          </div>

          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Hộ xã viên</th>
                  <th>Vụ mùa & Cây trồng</th>
                  <th>Diện tích</th>
                  <th>Sản lượng DK</th>
                  <th>Trạng thái vụ mùa</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentBoards || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      Chưa có dữ liệu mùa vụ của xã viên.
                    </td>
                  </tr>
                ) : (
                  (data?.recentBoards || []).map((b: any) => {
                    const st = b.status === 'ACTIVE' ? 'IN_PROGRESS' : b.status === 'HARVESTED' ? 'COMPLETED' : b.status;
                    return (
                      <tr key={b._id}>
                        <td>
                          <strong>{b.farmProfile?.farmName || b.farmProfile?.ownerName || 'Hộ xã viên'}</strong>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{b.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{b.cropType}</div>
                        </td>
                        <td>{Number(b.areaSqm || 0).toLocaleString('vi-VN')} m²</td>
                        <td><strong>{Number(b.expectedYield || 0).toLocaleString('vi-VN')} kg</strong></td>
                        <td>
                          {st === 'PLANNING' && <span className={`${styles.badge} ${styles.badgePlanning}`}>Lập kế hoạch</span>}
                          {st === 'IN_PROGRESS' && <span className={`${styles.badge} ${styles.badgeInProgress}`}>Đang canh tác</span>}
                          {st === 'HARVESTING' && <span className={`${styles.badge} ${styles.badgeHarvesting}`}>Thu hoạch</span>}
                          {st === 'COMPLETED' && <span className={`${styles.badge} ${styles.badgeCompleted}`}>Kết thúc vụ (Lưu trữ)</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link href="/cooperative/export" className={styles.btnPrimary} style={{ width: '100%', justifyContent: 'center' }}>
              <FileText size={16} /> Bấm 1 nút xuất trọn bộ hồ sơ mùa vụ toàn HTX (Nộp VietGAP/Bao tiêu)
            </Link>
          </div>
        </div>

        {/* Column 2: Cơ cấu cây trồng & Vòng đời vụ mùa */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Vòng đời vụ mùa HTX */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <Calendar size={18} color="#2563eb" /> Vòng đời vụ mùa HTX
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span className={`${styles.badge} ${styles.badgePlanning}`}>1. LẬP KẾ HOẠCH</span>
                <span style={{ fontWeight: 700 }}>{data?.statusCounts?.PLANNING || 0} luống</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span className={`${styles.badge} ${styles.badgeInProgress}`}>2. ĐANG CANH TÁC</span>
                <span style={{ fontWeight: 700 }}>{data?.statusCounts?.IN_PROGRESS || 0} luống</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span className={`${styles.badge} ${styles.badgeHarvesting}`}>3. THU HOẠCH</span>
                <span style={{ fontWeight: 700 }}>{data?.statusCounts?.HARVESTING || 0} luống</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                <span className={`${styles.badge} ${styles.badgeCompleted}`}>4. KẾT THÚC VỤ (LƯU TRỮ)</span>
                <span style={{ fontWeight: 700 }}>{data?.statusCounts?.COMPLETED || 0} luống</span>
              </div>
            </div>
          </div>

          {/* Cơ cấu cây trồng */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <BarChart3 size={18} color="#16a34a" /> Cơ cấu diện tích cây trồng
              </div>
            </div>

            <div>
              {(data?.cropDistribution || []).map((c: any) => (
                <div key={c.crop} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                    <strong>{c.crop}</strong>
                    <span style={{ color: '#64748b' }}>{c.areaSqm?.toLocaleString('vi-VN')} m² ({c.percentage}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ width: `${c.percentage}%`, height: '100%', background: '#16a34a', borderRadius: '9999px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
