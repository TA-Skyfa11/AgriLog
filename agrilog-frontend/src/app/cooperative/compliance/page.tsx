'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/cooperative.module.css';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, Clock, Send, 
  Search, Filter, RefreshCw, AlertCircle, Calendar, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function SafetyCompliancePage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, critical: 0, warning: 0, safe: 0 });
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'safe'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI('/cooperative/compliance-alerts');
      if (res.success) {
        setAlerts(res.data || []);
        if (res.stats) setStats(res.stats);
      }
    } catch (e) {
      toast.error('Lỗi tải danh sách giám sát an toàn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleSendWarning = async (item: any) => {
    try {
      setSendingId(item.id);
      const res = await fetchAPI('/cooperative/compliance-alerts/send-warning', {
        method: 'POST',
        body: JSON.stringify({
          farmProfileId: item.farmProfileId,
          alertMessage: item.message,
          title: item.severity === 'CRITICAL' 
            ? '🚨 CẢNH BÁO VI PHẠM THỜI GIAN CÁCH LY THUỐC BVTV (PHI)!'
            : '⚠️ CẢNH BÁO AN TOÀN PHI: KHÔNG ĐƯỢC THU HOẠCH SỚM!',
        }),
      });

      if (res.success) {
        toast.success(`Đã gửi cảnh báo an toàn đến hộ ${item.ownerName}!`, { icon: '📢' });
      } else {
        toast.error(res.message || 'Lỗi gửi cảnh báo');
      }
    } catch (e) {
      toast.error('Lỗi khi gửi cảnh báo');
    } finally {
      setSendingId(null);
    }
  };

  const filteredAlerts = alerts.filter(item => {
    if (filter !== 'all' && item.severity.toLowerCase() !== filter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = (item.ownerName || '').toLowerCase().includes(term);
      const matchFarm = (item.farmName || '').toLowerCase().includes(term);
      const matchPest = (item.pesticideName || '').toLowerCase().includes(term);
      const matchCrop = (item.cropType || '').toLowerCase().includes(term);
      return matchName || matchFarm || matchPest || matchCrop;
    }
    return true;
  });

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
            <ShieldAlert size={28} color="#dc2626" /> Giám sát Tuân thủ An toàn & Thời gian cách ly PHI
          </h1>
          <p className={styles.headerSubtitle}>
            Theo dõi kiểm soát thời gian cách ly thuốc bảo vệ thực vật (Pre-Harvest Interval) của toàn bộ xã viên để bảo đảm 100% không dư lượng hóa chất.
          </p>
        </div>
        <button onClick={loadAlerts} className={styles.btnOutline}>
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      {/* Filter Stats */}
      <div className={styles.kpiGrid}>
        <div 
          className={styles.kpiCard} 
          onClick={() => setFilter('all')} 
          style={{ cursor: 'pointer', border: filter === 'all' ? '2px solid #16a34a' : '1px solid #e2e8f0' }}
        >
          <div className={styles.kpiIconWrapper} style={{ background: '#f1f5f9', color: '#475569' }}>
            <Calendar size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <div className={styles.kpiLabel}>Tất cả lượt phun</div>
            <div className={styles.kpiValue}>{stats.total}</div>
            <div className={styles.kpiSub}>Toàn bộ ghi nhận</div>
          </div>
        </div>

        <div 
          className={styles.kpiCard} 
          onClick={() => setFilter('critical')} 
          style={{ cursor: 'pointer', border: filter === 'critical' ? '2px solid #ef4444' : '1px solid #fee2e2', background: '#fff5f5' }}
        >
          <div className={styles.kpiIconWrapper} style={{ background: '#fee2e2', color: '#dc2626' }}>
            <AlertTriangle size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <div className={styles.kpiLabel} style={{ color: '#dc2626' }}>Vi phạm khẩn cấp</div>
            <div className={styles.kpiValue} style={{ color: '#dc2626' }}>{stats.critical}</div>
            <div className={styles.kpiSub}>Thu hoạch khi chưa hết PHI</div>
          </div>
        </div>

        <div 
          className={styles.kpiCard} 
          onClick={() => setFilter('warning')} 
          style={{ cursor: 'pointer', border: filter === 'warning' ? '2px solid #f59e0b' : '1px solid #fef3c7', background: '#fffbeb' }}
        >
          <div className={styles.kpiIconWrapper} style={{ background: '#fef3c7', color: '#d97706' }}>
            <Clock size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <div className={styles.kpiLabel} style={{ color: '#d97706' }}>Đang cách ly PHI</div>
            <div className={styles.kpiValue} style={{ color: '#d97706' }}>{stats.warning}</div>
            <div className={styles.kpiSub}>Cảnh báo không thu hoạch sớm</div>
          </div>
        </div>

        <div 
          className={styles.kpiCard} 
          onClick={() => setFilter('safe')} 
          style={{ cursor: 'pointer', border: filter === 'safe' ? '2px solid #16a34a' : '1px solid #dcfce7', background: '#f0fdf4' }}
        >
          <div className={styles.kpiIconWrapper} style={{ background: '#dcfce7', color: '#16a34a' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <div className={styles.kpiLabel} style={{ color: '#15803d' }}>Đạt chuẩn an toàn</div>
            <div className={styles.kpiValue} style={{ color: '#15803d' }}>{stats.safe}</div>
            <div className={styles.kpiSub}>Đã đủ thời gian cách ly</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.card} style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div className={styles.filterBar} style={{ marginBottom: 0 }}>
            <button 
              className={`${styles.filterBtn} ${filter === 'all' ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter('all')}
            >
              Tất cả ({stats.total})
            </button>
            <button 
              className={`${styles.filterBtn} ${filter === 'critical' ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter('critical')}
              style={filter === 'critical' ? { background: '#dc2626', borderColor: '#dc2626' } : {}}
            >
              🚨 Vi phạm khẩn cấp ({stats.critical})
            </button>
            <button 
              className={`${styles.filterBtn} ${filter === 'warning' ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter('warning')}
              style={filter === 'warning' ? { background: '#d97706', borderColor: '#d97706' } : {}}
            >
              ⏱️ Đang cách ly ({stats.warning})
            </button>
            <button 
              className={`${styles.filterBtn} ${filter === 'safe' ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter('safe')}
            >
              ✅ Đạt chuẩn VietGAP ({stats.safe})
            </button>
          </div>

          <div style={{ position: 'relative', minWidth: '260px' }}>
            <input 
              type="text" 
              placeholder="Tìm theo xã viên, cây trồng, thuốc..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.4rem 0.75rem 0.4rem 2rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.875rem'
              }}
            />
            <Search size={15} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.card}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Hộ xã viên</th>
                <th>Vụ mùa & Cây trồng</th>
                <th>Thuốc BVTV đã dùng</th>
                <th>Ngày phun</th>
                <th>Thời gian cách ly (PHI)</th>
                <th>Ngày an toàn</th>
                <th>Đánh giá tuân thủ</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    Không có lượt phun thuốc nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.ownerName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.farmName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SĐT: {item.contactPhone}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.boardName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>{item.cropType}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#b91c1c' }}>{item.pesticideName}</div>
                      {item.activeIngredient && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Hoạt chất: {item.activeIngredient}</div>
                      )}
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Liều lượng: {item.quantity}</div>
                    </td>
                    <td>{new Date(item.sprayDate).toLocaleDateString('vi-VN')}</td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#c2410c' }}>
                      {item.phiDays} ngày
                    </td>
                    <td>
                      <strong>{new Date(item.safeHarvestDate).toLocaleDateString('vi-VN')}</strong>
                      {item.remainingDays > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>
                          (còn {item.remainingDays} ngày)
                        </div>
                      )}
                    </td>
                    <td>
                      {item.severity === 'CRITICAL' && (
                        <span className={`${styles.badge} ${styles.badgeCritical}`} title={item.message}>
                          🚨 Thu hoạch sớm khi chưa hết PHI
                        </span>
                      )}
                      {item.severity === 'WARNING' && (
                        <span className={`${styles.badge} ${styles.badgeWarning}`} title={item.message}>
                          ⏱️ Đang cách ly - Cấm thu hoạch
                        </span>
                      )}
                      {item.severity === 'SAFE' && (
                        <span className={`${styles.badge} ${styles.badgeSafe}`}>
                          ✅ Đạt chuẩn an toàn VietGAP
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {(item.severity === 'CRITICAL' || item.severity === 'WARNING') ? (
                        <button 
                          className={styles.btnDanger} 
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                          onClick={() => handleSendWarning(item)}
                          disabled={sendingId === item.id}
                        >
                          <Send size={12} /> {sendingId === item.id ? 'Đang gửi...' : 'Gửi cảnh báo'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>An toàn</span>
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
