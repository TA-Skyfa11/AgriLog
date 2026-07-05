'use client';

import React from 'react';
import styles from '@/css/billing.module.css';
import { Check } from 'lucide-react';

export default function BillingPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gói Dịch Vụ & Thanh Toán</h1>
        <p className={styles.subtitle}>Nâng cấp để mở khóa toàn bộ tính năng quản lý nông trại nâng cao</p>
      </div>

      <div className={styles.pricingGrid}>
        <div className={styles.pricingCard}>
          <div className={styles.planName}>Cơ Bản</div>
          <div className={styles.planDesc}>Dành cho nông trại nhỏ, mới bắt đầu số hoá.</div>
          <div className={styles.planPrice}>
            Miễn phí <span>/ trọn đời</span>
          </div>
          <div className={styles.featureList}>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Tối đa 2 bảng nhật ký canh tác</div>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Quản lý công việc cơ bản</div>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Hỗ trợ báo cáo thu hoạch đơn giản</div>
          </div>
          <button className={`${styles.button} ${styles.btnDisabled}`}>Gói hiện tại</button>
        </div>

        <div className={`${styles.pricingCard} ${styles.popular}`}>
          <div className={styles.popularBadge}>Phổ biến nhất</div>
          <div className={styles.planName}>Chuyên Nghiệp</div>
          <div className={styles.planDesc}>Phù hợp với hợp tác xã, trang trại quy mô vừa.</div>
          <div className={styles.planPrice}>
            499.000đ <span>/ tháng</span>
          </div>
          <div className={styles.featureList}>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Không giới hạn bảng nhật ký</div>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Quản lý kho vật tư toàn diện</div>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Báo cáo doanh thu & chi phí chi tiết</div>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Hỗ trợ khách hàng ưu tiên (24/7)</div>
          </div>
          <button className={`${styles.button} ${styles.btnSolid}`}>Nâng cấp ngay</button>
        </div>

        <div className={styles.pricingCard}>
          <div className={styles.planName}>Doanh Nghiệp</div>
          <div className={styles.planDesc}>Giải pháp tuỳ chỉnh cho các tập đoàn nông nghiệp lớn.</div>
          <div className={styles.planPrice}>
            Liên hệ
          </div>
          <div className={styles.featureList}>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Tất cả tính năng của gói Chuyên Nghiệp</div>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Kết nối cảm biến IoT tại vườn</div>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Hệ thống truy xuất nguồn gốc Blockchain</div>
            <div className={styles.featureItem}><Check size={18} color="#16a34a" /> Cổng thông tin (Marketplace) riêng</div>
          </div>
          <button className={`${styles.button} ${styles.btnOutline}`}>Liên hệ tư vấn</button>
        </div>
      </div>
    </div>
  );
}
