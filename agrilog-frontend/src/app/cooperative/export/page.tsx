'use client';

import React, { useState, useEffect } from 'react';
import { getApiUrl, fetchAPI } from '@/lib/api';
import styles from '@/css/cooperative.module.css';
import { 
  FileText, Printer, Download, CheckCircle, Building, 
  ArrowLeft, Eye, ShieldCheck, Award
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function ExportSeasonDossierPage() {
  const [dossierInfo, setDossierInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = getApiUrl();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const loadInfo = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI('/cooperative/export-season-dossier?format=json');
      if (res.success) {
        setDossierInfo(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInfo();
  }, []);

  const handleOpenPrintPreview = () => {
    window.open(`${apiUrl}/cooperative/export-season-dossier?print=1`, '_blank');
  };

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
            <Award size={28} color="#16a34a" /> Xuất Hồ sơ Mùa vụ Toàn bộ Xã viên (VietGAP / Bao tiêu)
          </h1>
          <p className={styles.headerSubtitle}>
            Bấm 1 nút xuất trọn bộ hồ sơ nhật ký của tất cả các xã viên để nộp cho cơ quan chứng nhận tiêu chuẩn hoặc đối tác thu mua bao tiêu sản phẩm.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={handleOpenPrintPreview} className={styles.btnPrimary} style={{ padding: '0.625rem 1.25rem' }}>
            <Printer size={18} /> In / Xuất Trọn bộ Hồ sơ (PDF / A4)
          </button>
        </div>
      </div>

      {/* Dossier Summary Cards */}
      {dossierInfo && (
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrapper} style={{ background: '#ecfdf5', color: '#16a34a' }}>
              <Building size={24} />
            </div>
            <div className={styles.kpiInfo}>
              <div className={styles.kpiLabel}>Hợp tác xã</div>
              <div style={{ fontWeight: 700, fontSize: '1.125rem', color: '#0f172a' }}>{dossierInfo.cooperative?.name}</div>
              <div className={styles.kpiSub}>Mã số: {dossierInfo.cooperative?.code}</div>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrapper} style={{ background: '#eff6ff', color: '#2563eb' }}>
              <FileText size={24} />
            </div>
            <div className={styles.kpiInfo}>
              <div className={styles.kpiLabel}>Quy mô hồ sơ</div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>{dossierInfo.totalMembers} Hộ xã viên</div>
              <div className={styles.kpiSub}>Diện tích: {dossierInfo.totalAreaSqm?.toLocaleString('vi-VN')} m²</div>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrapper} style={{ background: '#fdf4ff', color: '#a855f7' }}>
              <ShieldCheck size={24} />
            </div>
            <div className={styles.kpiInfo}>
              <div className={styles.kpiLabel}>Tiêu chuẩn chứng nhận</div>
              <div style={{ fontWeight: 700, fontSize: '1.125rem', color: '#7e22ce' }}>
                {(dossierInfo.cooperative?.certificationStandards || ['VietGAP']).join(', ')}
              </div>
              <div className={styles.kpiSub}>Đạt chuẩn cách ly an toàn PHI</div>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={styles.kpiIconWrapper} style={{ background: '#fef3c7', color: '#d97706' }}>
              <Award size={24} />
            </div>
            <div className={styles.kpiInfo}>
              <div className={styles.kpiLabel}>Sản lượng bao tiêu</div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#d97706' }}>
                {(dossierInfo.totalExpectedYield || 0).toLocaleString('vi-VN')} kg
              </div>
              <div className={styles.kpiSub}>Sẵn sàng cung ứng doanh nghiệp</div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Document Preview */}
      <div className={styles.card} style={{ padding: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.75rem' }}>
          <div style={{ fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Eye size={18} color="#16a34a" /> Xem trước Bản in Tài liệu Hồ sơ Chuẩn in ấn A4
          </div>
          <button onClick={handleOpenPrintPreview} className={styles.btnOutline} style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>
            Mở cửa sổ in ấn toàn màn hình ↗
          </button>
        </div>

        <iframe 
          src={`${apiUrl}/cooperative/export-season-dossier`}
          style={{
            width: '100%',
            height: '750px',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            background: '#ffffff'
          }}
          title="Season Dossier Document"
        />
      </div>
    </div>
  );
}
