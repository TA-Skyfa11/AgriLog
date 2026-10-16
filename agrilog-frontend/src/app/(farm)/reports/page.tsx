'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/css/reports.module.css';
import { 
  BarChart2, Download, Users, Briefcase, Droplet, Sprout, Package, 
  FileSpreadsheet, DollarSign, Eye, EyeOff, Layers, ShieldCheck
} from 'lucide-react';
import { fetchAPI, getApiUrl } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CULTIVATION' | 'FERTILIZER' | 'PESTICIDE' | 'INVENTORY'>('ALL');
  
  // Toggles to view detailed diary entries vs grouped summaries
  const [showCultivationDetails, setShowCultivationDetails] = useState(false);
  const [showFertilizerDetails, setShowFertilizerDetails] = useState(false);
  const [showPesticideDetails, setShowPesticideDetails] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [allowExport, setAllowExport] = useState<boolean>(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const [res, profileRes] = await Promise.all([
          fetchAPI(`/farm/reports-stats?month=${selectedMonth}`),
          fetchAPI('/farm/profile')
        ]);
        if (res.success) {
          setStats(res.data);
        }
        if (profileRes.success) {
          setAllowExport(profileRes.data.allowExport !== false);
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [selectedMonth]);

  const exportToPDF = async () => {
    if (!allowExport) {
      toast.error('Gói cước hiện tại không hỗ trợ in PDF (Không có tính năng lưu trữ/xuất hồ sơ). Vui lòng nâng cấp gói cước.');
      return;
    }
    const toastId = toast.loading('Đang khởi tạo file PDF báo cáo...');
    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/export/pdf/reports?month=${selectedMonth}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Lỗi khi xuất file PDF');
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Bao_cao_nong_trai_${selectedMonth}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Xuất file PDF thành công!', { id: toastId });
    } catch (error: any) {
      toast.error(error.message || 'Không thể xuất file PDF', { id: toastId });
    }
  };

  const exportToExcel = () => {
    if (!allowExport) {
      toast.error('Gói cước hiện tại không hỗ trợ xuất file Excel (Không có tính năng lưu trữ/xuất hồ sơ). Vui lòng nâng cấp gói cước.');
      return;
    }
    import('xlsx').then((XLSX) => {
      const { 
        cultivationDetails = [], 
        fertilizerDetails = [], 
        pesticideDetails = [],
        inventoryReport = []
      } = stats || {};

      const wb = XLSX.utils.book_new();

      // Sheet 1: Canh tác chi tiết
      const wsCultivation = XLSX.utils.json_to_sheet(cultivationDetails.map((row: any, idx: number) => ({
        'STT': idx + 1,
        'Ngày thực hiện': row.date ? format(new Date(row.date), 'dd/MM/yyyy') : '',
        'Bảng canh tác': row.boardName,
        'Cây trồng': row.cropType,
        'Giai đoạn': row.stage,
        'Hoạt động / Công việc': row.activityName,
        'Người thực hiện': row.performer,
        'Số công': row.laborCount,
        'Chi phí (VNĐ)': row.cost,
        'Thời tiết': row.weather,
        'Ghi chú': row.notes,
        'Trạng thái': row.isCompleted ? 'Đã hoàn thành' : 'Đang xử lý'
      })));
      XLSX.utils.book_append_sheet(wb, wsCultivation, 'Nhật Ký Canh Tác');

      // Sheet 2: Phân bón chi tiết
      const wsFertilizer = XLSX.utils.json_to_sheet(fertilizerDetails.map((row: any, idx: number) => ({
        'STT': idx + 1,
        'Ngày bón': row.date ? format(new Date(row.date), 'dd/MM/yyyy') : '',
        'Bảng canh tác': row.boardName,
        'Cây trồng': row.cropType,
        'Tên phân bón': row.materialName,
        'Nhà sản xuất': row.manufacturer,
        'Liều lượng': row.quantity,
        'Diện tích áp dụng (m²)': row.appliedArea,
        'Chi phí (VNĐ)': row.cost,
        'Người thực hiện': row.performer,
        'Thời tiết': row.weather,
        'Ghi chú': row.notes
      })));
      XLSX.utils.book_append_sheet(wb, wsFertilizer, 'Nhật Ký Phân Bón');

      // Sheet 3: Thuốc BVTV chi tiết
      const wsPesticide = XLSX.utils.json_to_sheet(pesticideDetails.map((row: any, idx: number) => ({
        'STT': idx + 1,
        'Ngày phun': row.date ? format(new Date(row.date), 'dd/MM/yyyy') : '',
        'Bảng canh tác': row.boardName,
        'Cây trồng': row.cropType,
        'Tên thuốc BVTV': row.materialName,
        'Nhà sản xuất': row.manufacturer,
        'Đối tượng sâu bệnh': row.targetPest,
        'Liều lượng': row.quantity,
        'Cách ly PHI (ngày)': row.phiDays,
        'Chi phí (VNĐ)': row.cost,
        'Người thực hiện': row.performer,
        'Thời tiết': row.weather,
        'Ghi chú': row.notes
      })));
      XLSX.utils.book_append_sheet(wb, wsPesticide, 'Nhật Ký Thuốc BVTV');

      // Sheet 4: Kho vật tư & Tồn kho
      const wsInventory = XLSX.utils.json_to_sheet(inventoryReport.map((row: any, idx: number) => ({
        'STT': idx + 1,
        'Tên vật tư': row.name,
        'Phân loại': row.typeLabel,
        'Nhà sản xuất': row.manufacturer,
        'Tồn kho hiện tại': `${row.quantity} ${row.unit}`,
        'Đã dùng trong tháng': row.usedInMonth,
        'Ngưỡng cảnh báo': `${row.minQuantityAlert} ${row.unit}`,
        'Hạn sử dụng': row.expiryDate,
        'Trạng thái': row.statusText
      })));
      XLSX.utils.book_append_sheet(wb, wsInventory, 'Kho Vật Tư');

      XLSX.writeFile(wb, `BaoCao_NongTrai_${selectedMonth}.xlsx`);
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid #16a34a', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <div>Đang tổng hợp báo cáo và thống kê...</div>
        </div>
      </div>
    );
  }

  const { 
    summary = {}, 
    cultivationReport = [], 
    fertilizerReport = [], 
    pesticideReport = [],
    inventoryReport = [],
    cultivationDetails = [],
    fertilizerDetails = [],
    pesticideDetails = []
  } = stats || {};

  const [yearStr, monthStr] = selectedMonth.split('-');

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <BarChart2 size={26} color="#16a34a" /> 
            Báo cáo & Thống kê Sản xuất (Tháng {monthStr}/{yearStr})
          </h1>
          <div className={styles.subtitle}>
            Tổng hợp dữ liệu toàn diện từ các bảng nhật ký canh tác, phân bón, thuốc BVTV và biến động kho vật tư
          </div>
        </div>
        <div className="no-print" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', fontWeight: 600, color: 'var(--color-text-main)' }}
          />
          <button className={styles.button} onClick={exportToPDF} disabled={!allowExport} style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', opacity: !allowExport ? 0.5 : 1, cursor: !allowExport ? 'not-allowed' : 'pointer' }}>
            <Download size={18} /> In PDF
          </button>
          <button className={styles.button} onClick={exportToExcel} disabled={!allowExport} style={{ backgroundColor: '#10b981', opacity: !allowExport ? 0.5 : 1, cursor: !allowExport ? 'not-allowed' : 'pointer' }}>
            <FileSpreadsheet size={18} /> Xuất Excel
          </button>
        </div>
      </div>

      {/* Top Executive KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-surface)', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={16} color="#16a34a" /> Tổng đầu việc thực hiện
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
            {summary.totalTasks || 0} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>lượt</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px' }}>
            Canh tác: {cultivationDetails.length} • Phân bón: {fertilizerDetails.length} • Thuốc: {pesticideDetails.length}
          </div>
        </div>
        
        <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-surface)', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="#f59e0b" /> Tổng công lao động
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>
            {summary.totalLabor || 0} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>công</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Nhân lực tham gia trực tiếp
          </div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-surface)', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={16} color="#9333ea" /> Vật tư trong kho
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#9333ea' }}>
            {summary.materialsTotal || 0} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>loại</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: summary.materialsAlertCount > 0 ? '#ef4444' : '#16a34a', marginTop: '4px', fontWeight: 600 }}>
            {summary.materialsAlertCount > 0 ? `⚠️ ${summary.materialsAlertCount} loại cần lưu ý (sắp hết/hết hạn)` : '✓ Kho vật tư ổn định'}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'ALL' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('ALL')}
        >
          <Layers size={16} /> Tất cả báo cáo
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'CULTIVATION' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('CULTIVATION')}
        >
          <Sprout size={16} /> Canh tác & Lao động ({cultivationDetails.length})
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'FERTILIZER' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('FERTILIZER')}
        >
          <Package size={16} /> Bón phân & Dinh dưỡng ({fertilizerDetails.length})
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'PESTICIDE' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('PESTICIDE')}
        >
          <Droplet size={16} /> Thuốc BVTV & An toàn ({pesticideDetails.length})
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'INVENTORY' ? styles.tabButtonActive : ''}`}
          onClick={() => setActiveTab('INVENTORY')}
        >
          <ShieldCheck size={16} /> Kho Vật tư & Tiêu hao ({inventoryReport.length})
        </button>
      </div>

      <div className={styles.chartGrid}>
        
        {/* ========================================================= */}
        {/* 1. CANH TÁC & LAO ĐỘNG                                      */}
        {/* ========================================================= */}
        {(activeTab === 'ALL' || activeTab === 'CULTIVATION') && (
          <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h3 className={styles.chartTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Sprout size={20} color="#16a34a"/> 1. Nhật ký Canh tác & Công việc nông vụ
              </h3>
              <button 
                className={styles.toggleBtn}
                onClick={() => setShowCultivationDetails(!showCultivationDetails)}
              >
                {showCultivationDetails ? <EyeOff size={14} /> : <Eye size={14} />}
                {showCultivationDetails ? 'Xem bảng tổng hợp' : 'Xem chi tiết từng lần làm'}
              </button>
            </div>

            {!showCultivationDetails ? (
              /* Grouped Summary Table */
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Hoạt động canh tác</th>
                      <th>Cây trồng áp dụng</th>
                      <th style={{ textAlign: 'center' }}>Số lần làm</th>
                      <th style={{ textAlign: 'center' }}>Số ngày</th>
                      <th style={{ textAlign: 'center' }}>Số người làm</th>
                      <th style={{ textAlign: 'center' }}>Tổng số công</th>
                      <th style={{ textAlign: 'right' }}>Tổng chi phí</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cultivationReport.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Chưa có hoạt động canh tác nào trong tháng này</td></tr>
                    ) : cultivationReport.map((row: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{row.activity}</td>
                        <td><span className={styles.badge} style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>{row.crops}</span></td>
                        <td style={{ textAlign: 'center' }}>{row.taskCount}</td>
                        <td style={{ textAlign: 'center' }}>{row.daysCount} ngày</td>
                        <td style={{ textAlign: 'center' }}>{row.peopleCount} người</td>
                        <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>{row.laborCount} công</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{(row.totalCost || 0).toLocaleString('vi-VN')} đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Detailed Entries Table */
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Ngày</th>
                      <th>Bảng / Cây trồng</th>
                      <th>Giai đoạn</th>
                      <th>Hoạt động</th>
                      <th>Người thực hiện</th>
                      <th style={{ textAlign: 'center' }}>Số công</th>
                      <th style={{ textAlign: 'right' }}>Chi phí</th>
                      <th>Thời tiết</th>
                      <th>Ghi chú</th>
                      <th style={{ textAlign: 'center' }}>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cultivationDetails.length === 0 ? (
                      <tr><td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Chưa có chi tiết canh tác trong tháng này</td></tr>
                    ) : cultivationDetails.map((entry: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{entry.date ? format(new Date(entry.date), 'dd/MM/yyyy') : '—'}</td>
                        <td>
                          <strong>{entry.boardName}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{entry.cropType} ({entry.areaSqm} m²)</div>
                        </td>
                        <td><span className={styles.badge} style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>{entry.stage}</span></td>
                        <td style={{ fontWeight: 600 }}>{entry.activityName}</td>
                        <td>{entry.performer}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#16a34a' }}>{entry.laborCount} công</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{(entry.cost || 0).toLocaleString('vi-VN')} đ</td>
                        <td>{entry.weather}</td>
                        <td style={{ maxWidth: '200px', fontSize: '0.8125rem', color: '#64748b' }}>{entry.notes || '—'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={styles.badge} style={{ backgroundColor: entry.isCompleted ? '#dcfce7' : '#fef9c3', color: entry.isCompleted ? '#15803d' : '#854d0e' }}>
                            {entry.isCompleted ? 'Hoàn thành' : 'Đang xử lý'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. BÓN PHÂN & DINH DƯỠNG                                    */}
        {/* ========================================================= */}
        {(activeTab === 'ALL' || activeTab === 'FERTILIZER') && (
          <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h3 className={styles.chartTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Package size={20} color="#f59e0b"/> 2. Tổng hợp Bón phân & Dinh dưỡng cây trồng
              </h3>
              <button 
                className={styles.toggleBtn}
                onClick={() => setShowFertilizerDetails(!showFertilizerDetails)}
              >
                {showFertilizerDetails ? <EyeOff size={14} /> : <Eye size={14} />}
                {showFertilizerDetails ? 'Xem bảng tổng hợp' : 'Xem chi tiết từng lần bón'}
              </button>
            </div>

            {!showFertilizerDetails ? (
              /* Grouped Summary Table */
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Tên loại phân bón</th>
                      <th>Nhà sản xuất</th>
                      <th style={{ textAlign: 'center' }}>Số lần bón</th>
                      <th style={{ textAlign: 'center' }}>Tổng lượng bón</th>
                      <th style={{ textAlign: 'center' }}>Tổng diện tích áp dụng</th>
                      <th style={{ textAlign: 'center' }}>Số công</th>
                      <th style={{ textAlign: 'right' }}>Tổng chi phí</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fertilizerReport.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Chưa có dữ liệu bón phân trong tháng này</td></tr>
                    ) : fertilizerReport.map((row: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{row.name}</td>
                        <td>{row.manufacturer}</td>
                        <td style={{ textAlign: 'center' }}>{row.timesUsed} lần</td>
                        <td style={{ textAlign: 'center', color: '#ef4444', fontWeight: 700 }}>{row.totalQuantity}</td>
                        <td style={{ textAlign: 'center' }}>{row.totalArea} m²</td>
                        <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>{row.laborCount} công</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{(row.totalCost || 0).toLocaleString('vi-VN')} đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Detailed Entries Table */
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Ngày bón</th>
                      <th>Bảng / Cây trồng</th>
                      <th>Tên phân bón</th>
                      <th>Nhà sản xuất</th>
                      <th style={{ textAlign: 'center' }}>Lượng bón</th>
                      <th style={{ textAlign: 'center' }}>Diện tích (m²)</th>
                      <th style={{ textAlign: 'right' }}>Chi phí</th>
                      <th>Người thực hiện</th>
                      <th>Thời tiết</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fertilizerDetails.length === 0 ? (
                      <tr><td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Chưa có chi tiết bón phân trong tháng này</td></tr>
                    ) : fertilizerDetails.map((entry: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{entry.date ? format(new Date(entry.date), 'dd/MM/yyyy') : '—'}</td>
                        <td>
                          <strong>{entry.boardName}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{entry.cropType}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{entry.materialName}</td>
                        <td>{entry.manufacturer}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#ef4444' }}>{entry.quantity}</td>
                        <td style={{ textAlign: 'center' }}>{entry.appliedArea} m²</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{(entry.cost || 0).toLocaleString('vi-VN')} đ</td>
                        <td>{entry.performer}</td>
                        <td>{entry.weather}</td>
                        <td style={{ maxWidth: '200px', fontSize: '0.8125rem', color: '#64748b' }}>{entry.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. THUỐC BVTV & AN TOÀN PHI                                 */}
        {/* ========================================================= */}
        {(activeTab === 'ALL' || activeTab === 'PESTICIDE') && (
          <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h3 className={styles.chartTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Droplet size={20} color="#3b82f6"/> 3. Tổng hợp Sử dụng Thuốc Bảo vệ Thực vật & An toàn (PHI)
              </h3>
              <button 
                className={styles.toggleBtn}
                onClick={() => setShowPesticideDetails(!showPesticideDetails)}
              >
                {showPesticideDetails ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPesticideDetails ? 'Xem bảng tổng hợp' : 'Xem chi tiết từng lần phun'}
              </button>
            </div>

            {!showPesticideDetails ? (
              /* Grouped Summary Table */
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Tên thuốc BVTV</th>
                      <th>Nhà sản xuất</th>
                      <th>Đối tượng phòng trừ</th>
                      <th style={{ textAlign: 'center' }}>Số lần phun</th>
                      <th style={{ textAlign: 'center' }}>Tổng lượng dùng</th>
                      <th style={{ textAlign: 'center' }}>Cách ly (PHI)</th>
                      <th style={{ textAlign: 'center' }}>Số công</th>
                      <th style={{ textAlign: 'right' }}>Tổng chi phí</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pesticideReport.length === 0 ? (
                      <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Chưa có dữ liệu phun thuốc trong tháng này</td></tr>
                    ) : pesticideReport.map((row: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{row.name}</td>
                        <td>{row.manufacturer || '—'}</td>
                        <td><span className={styles.badge} style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>{row.targetPest}</span></td>
                        <td style={{ textAlign: 'center' }}>{row.timesUsed} lần</td>
                        <td style={{ textAlign: 'center', color: '#ef4444', fontWeight: 700 }}>{row.totalQuantity}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{row.phiDays} ngày</td>
                        <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>{row.laborCount} công</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{(row.totalCost || 0).toLocaleString('vi-VN')} đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Detailed Entries Table */
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Ngày phun</th>
                      <th>Bảng / Cây trồng</th>
                      <th>Tên thuốc BVTV</th>
                      <th>Nhà sản xuất</th>
                      <th>Đối tượng sâu bệnh</th>
                      <th style={{ textAlign: 'center' }}>Liều lượng</th>
                      <th style={{ textAlign: 'center' }}>Cách ly PHI</th>
                      <th style={{ textAlign: 'right' }}>Chi phí</th>
                      <th>Người thực hiện</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pesticideDetails.length === 0 ? (
                      <tr><td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Chưa có chi tiết phun thuốc trong tháng này</td></tr>
                    ) : pesticideDetails.map((entry: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{entry.date ? format(new Date(entry.date), 'dd/MM/yyyy') : '—'}</td>
                        <td>
                          <strong>{entry.boardName}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{entry.cropType}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{entry.materialName}</td>
                        <td>{entry.manufacturer}</td>
                        <td><span className={styles.badge} style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>{entry.targetPest}</span></td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#ef4444' }}>{entry.quantity}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#ea580c' }}>{entry.phiDays} ngày</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{(entry.cost || 0).toLocaleString('vi-VN')} đ</td>
                        <td>{entry.performer}</td>
                        <td style={{ maxWidth: '200px', fontSize: '0.8125rem', color: '#64748b' }}>{entry.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. KHO VẬT TƯ & TIÊU HAO                                     */}
        {/* ========================================================= */}
        {(activeTab === 'ALL' || activeTab === 'INVENTORY') && (
          <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
            <h3 className={styles.chartTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#9333ea"/> 4. Báo cáo Kho Vật tư, Tồn kho & Mức độ Tiêu hao
            </h3>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Tên vật tư</th>
                    <th>Phân loại</th>
                    <th>Nhà sản xuất</th>
                    <th style={{ textAlign: 'center' }}>Tồn kho hiện tại</th>
                    <th style={{ textAlign: 'center' }}>Đã dùng trong tháng</th>
                    <th style={{ textAlign: 'center' }}>Ngưỡng cảnh báo</th>
                    <th style={{ textAlign: 'center' }}>Hạn sử dụng</th>
                    <th style={{ textAlign: 'center' }}>Trạng thái kho</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryReport.length === 0 ? (
                    <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Chưa có vật tư nào được lưu trong kho</td></tr>
                  ) : inventoryReport.map((mat: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{mat.name}</td>
                      <td>
                        <span className={styles.badge} style={{ backgroundColor: mat.type === 'FERTILIZER' ? '#fef3c7' : '#e0e7ff', color: mat.type === 'FERTILIZER' ? '#d97706' : '#4338ca' }}>
                          {mat.typeLabel}
                        </span>
                      </td>
                      <td>{mat.manufacturer}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.95rem' }}>
                        {mat.quantity} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>{mat.unit}</span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: '#16a34a' }}>
                        {mat.usedInMonth}
                      </td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>
                        {mat.minQuantityAlert} {mat.unit}
                      </td>
                      <td style={{ textAlign: 'center' }}>{mat.expiryDate}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={styles.badge} style={{ 
                          backgroundColor: mat.status === 'NORMAL' ? '#dcfce7' : mat.status === 'LOW' ? '#fef9c3' : '#fee2e2', 
                          color: mat.status === 'NORMAL' ? '#15803d' : mat.status === 'LOW' ? '#854d0e' : '#b91c1c' 
                        }}>
                          {mat.statusText}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
