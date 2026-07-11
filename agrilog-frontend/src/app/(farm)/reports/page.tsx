/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/css/reports.module.css';
import { BarChart2, Download, Users, Briefcase, Droplet, Sprout, Package, FileSpreadsheet } from 'lucide-react';
import { fetchAPI } from '@/lib/api';

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const res = await fetchAPI(`/farm/reports-stats?month=${selectedMonth}`);
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
  }, [selectedMonth]);

  const exportToPDF = () => {
    window.print();
  };

  const exportToExcel = () => {
    import('xlsx').then((XLSX) => {
      const { cultivationReport = [], fertilizerReport = [], pesticideReport = [] } = stats || {};
      const wb = XLSX.utils.book_new();

      const wsCultivation = XLSX.utils.json_to_sheet(cultivationReport.map((row: any) => ({
        'Hoạt động': row.activity,
        'Số lần thực hiện': row.taskCount,
        'Số người tham gia': row.peopleCount,
        'Số ngày làm': row.daysCount,
        'Tổng số công': row.laborCount,
      })));
      XLSX.utils.book_append_sheet(wb, wsCultivation, 'Canh tác');

      const wsFertilizer = XLSX.utils.json_to_sheet(fertilizerReport.map((row: any) => ({
        'Tên phân bón': row.name,
        'Tổng khối lượng': row.quantityDetails,
        'Số người thực hiện': row.peopleCount,
        'Số ngày làm': row.daysCount,
        'Tổng số công': row.laborCount,
      })));
      XLSX.utils.book_append_sheet(wb, wsFertilizer, 'Phân bón');

      const wsPesticide = XLSX.utils.json_to_sheet(pesticideReport.map((row: any) => ({
        'Tên thuốc': row.name,
        'Tổng lượng dùng': row.quantityDetails,
        'Số người thực hiện': row.peopleCount,
        'Số ngày làm': row.daysCount,
        'Tổng số công': row.laborCount,
      })));
      XLSX.utils.book_append_sheet(wb, wsPesticide, 'Thuốc BVTV');

      XLSX.writeFile(wb, 'BaoCao_NongTrai.xlsx');
    });
  };

  if (loading) return <div style={{ padding: '2rem' }}>Đang tải báo cáo thống kê...</div>;

  const { totalTasks = 0, cultivationReport = [], fertilizerReport = [], pesticideReport = [] } = stats || {};

  const [yearStr, monthStr] = selectedMonth.split('-');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}><BarChart2 size={24} color="#16a34a" /> Báo cáo & Thống kê (Tháng {monthStr}/{yearStr})</h1>
          <div className={styles.subtitle}>Phân tích chi tiết về hoạt động sản xuất, nhân công và vật tư sử dụng</div>
        </div>
        <div className="no-print" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--color-border)', outline: 'none', fontWeight: 600, color: 'var(--color-text-main)' }}
          />
          <button className={styles.button} onClick={exportToPDF} style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}>
            <Download size={18} /> In PDF
          </button>
          <button className={styles.button} onClick={exportToExcel} style={{ backgroundColor: '#10b981' }}>
            <FileSpreadsheet size={18} /> Xuất Excel
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={16} /> Tổng số đầu việc
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-700)' }}>
            {totalTasks}
          </div>
        </div>
        
        <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Users size={16} /> Tổng công canh tác
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>
            {cultivationReport.reduce((acc: number, r: any) => acc + r.laborCount, 0)} công
          </div>
        </div>
      </div>

      <div className={styles.chartGrid}>
        
        {/* Canh tac */}
        <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
          <h3 className={styles.chartTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Sprout size={18} color="#16a34a"/> Báo cáo tình trạng canh tác</h3>
          <table className={styles.table} style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px' }}>Hoạt động</th>
                <th style={{ padding: '12px 8px' }}>Số lần thực hiện</th>
                <th style={{ padding: '12px 8px' }}>Số người tham gia</th>
                <th style={{ padding: '12px 8px' }}>Số ngày làm</th>
                <th style={{ padding: '12px 8px' }}>Tổng số công</th>
              </tr>
            </thead>
            <tbody>
              {cultivationReport.length === 0 && <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>Chưa có dữ liệu tháng này</td></tr>}
              {cultivationReport.map((row: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 600 }}>{row.activity}</td>
                  <td style={{ padding: '12px 8px' }}>{row.taskCount}</td>
                  <td style={{ padding: '12px 8px' }}>{row.peopleCount} người</td>
                  <td style={{ padding: '12px 8px' }}>{row.daysCount} ngày</td>
                  <td style={{ padding: '12px 8px', color: '#16a34a', fontWeight: 600 }}>{row.laborCount} công</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Phan bon */}
        <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
          <h3 className={styles.chartTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Package size={18} color="#f59e0b"/> Tổng hợp sử dụng Phân bón</h3>
          <table className={styles.table} style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px' }}>Tên phân bón</th>
                <th style={{ padding: '12px 8px' }}>Tổng khối lượng</th>
                <th style={{ padding: '12px 8px' }}>Số người thực hiện</th>
                <th style={{ padding: '12px 8px' }}>Số ngày làm</th>
                <th style={{ padding: '12px 8px' }}>Tổng số công</th>
              </tr>
            </thead>
            <tbody>
              {fertilizerReport.length === 0 && <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>Chưa có dữ liệu tháng này</td></tr>}
              {fertilizerReport.map((row: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 600 }}>{row.name}</td>
                  <td style={{ padding: '12px 8px', color: '#ef4444', fontWeight: 600 }}>{row.quantityDetails}</td>
                  <td style={{ padding: '12px 8px' }}>{row.peopleCount} người</td>
                  <td style={{ padding: '12px 8px' }}>{row.daysCount} ngày</td>
                  <td style={{ padding: '12px 8px', color: '#16a34a', fontWeight: 600 }}>{row.laborCount} công</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Thuoc BVTV */}
        <div className={styles.chartCard} style={{ gridColumn: '1 / -1' }}>
          <h3 className={styles.chartTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Droplet size={18} color="#3b82f6"/> Tổng hợp sử dụng Thuốc BVTV</h3>
          <table className={styles.table} style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px' }}>Tên thuốc</th>
                <th style={{ padding: '12px 8px' }}>Tổng lượng dùng</th>
                <th style={{ padding: '12px 8px' }}>Số người thực hiện</th>
                <th style={{ padding: '12px 8px' }}>Số ngày làm</th>
                <th style={{ padding: '12px 8px' }}>Tổng số công</th>
              </tr>
            </thead>
            <tbody>
              {pesticideReport.length === 0 && <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>Chưa có dữ liệu tháng này</td></tr>}
              {pesticideReport.map((row: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 600 }}>{row.name}</td>
                  <td style={{ padding: '12px 8px', color: '#ef4444', fontWeight: 600 }}>{row.quantityDetails}</td>
                  <td style={{ padding: '12px 8px' }}>{row.peopleCount} người</td>
                  <td style={{ padding: '12px 8px' }}>{row.daysCount} ngày</td>
                  <td style={{ padding: '12px 8px', color: '#16a34a', fontWeight: 600 }}>{row.laborCount} công</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
