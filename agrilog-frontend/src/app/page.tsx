'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/css/landing.module.css';
import { fetchAPI } from '@/lib/api';
import heroImg from '../../public/images/landing/hero_real.jpg';
import greenhouseImg from '../../public/images/landing/greenhouse_real.jpg';

export default function LandingPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const resServices = await fetchAPI('/services');
        if (resServices.success) setPackages(resServices.data);
        
        const resProducts = await fetchAPI('/products/public');
        if (resProducts.success) setProducts(resProducts.data);
      } catch (err) {}
    };
    loadData();
  }, []);

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = '/'; }} className={styles.logo} style={{ textDecoration: 'none' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            AgriLog
          </a>
          <nav className={styles.navLinks}>
            <a href="#features" className={styles.navLink}>Tính năng</a>
            <a href="#store" className={styles.navLink}>Vật tư</a>
            <a href="#pricing" className={styles.navLink}>Bảng giá</a>
          </nav>
          <div className={styles.headerActions}>
            <Link href="/login" className={styles.loginBtn}>Đăng nhập</Link>
            <Link href="/register" className={styles.signupBtn}>Đăng ký dùng thử</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div>
            <span className={styles.heroBadge}>✨ Nền tảng số hóa Nông nghiệp số 1</span>
            <h1 className={styles.heroTitle}>
              Số hóa quản lý nông trại <span className={styles.heroTitleHighlight}>một cách đơn giản</span> và hiệu quả.
            </h1>
            <p className={styles.heroDesc}>
              Quản lý nhật ký canh tác, vật tư nông nghiệp, lịch công việc và hồ sơ sản xuất trên một nền tảng duy nhất — được thiết kế riêng cho người làm nông nghiệp Việt Nam.
            </p>
            <div className={styles.heroActions}>
              <Link href="/register" className={styles.heroPrimaryBtn}>Đăng ký miễn phí ➔</Link>
              <button className={styles.heroSecondaryBtn}>Xem Demo ▾</button>
            </div>
          </div>
          <div style={{ position: 'relative', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--shadow-xl)', position: 'relative' }}>
              <img 
                src={heroImg.src}
                alt="AgriLog Dashboard Preview" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className={styles.statsGrid}>
          <div>
            <div className={styles.statNumber}>1.500+</div>
            <div className={styles.statLabel}>Nông trại</div>
          </div>
          <div>
            <div className={styles.statNumber}>50.000+</div>
            <div className={styles.statLabel}>Luống sản xuất</div>
          </div>
          <div>
            <div className={styles.statNumber}>12.000+</div>
            <div className={styles.statLabel}>Đơn vị xuất</div>
          </div>
          <div>
            <div className={styles.statNumber}>20+</div>
            <div className={styles.statLabel}>Tỉnh thành</div>
          </div>
        </div>
      </section>

      {/* Feature Detail Section */}
      <section id="features" className={styles.featureDetail}>
        <div className={styles.featureDetailContent}>
          <div>
            <h2 className={styles.sectionTitle}>Nền tảng quản lý nông trại được xây dựng cho người Việt</h2>
            <p className={styles.sectionDesc}>
              AgriLog được thiết kế từ góc nhìn của người làm nông nghiệp thực thụ. Giao diện dễ bắt đầu, mạnh mẽ khi cần mở rộng. Từ hộ nông dân đến hợp tác xã lớn, AgriLog đều có thể đáp ứng.
            </p>
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureItemIcon}>✓</div>
                <div>
                  <h4 className={styles.featureItemTitle}>Tối ưu hóa quy trình</h4>
                  <p className={styles.featureItemDesc}>Theo dõi từ gieo hạt đến thu hoạch trên điện thoại.</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureItemIcon}>✓</div>
                <div>
                  <h4 className={styles.featureItemTitle}>Tiết kiệm thời gian</h4>
                  <p className={styles.featureItemDesc}>Ghi chép tự động, tự trừ vật tư tồn kho.</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureItemIcon}>✓</div>
                <div>
                  <h4 className={styles.featureItemTitle}>Dễ dàng truy xuất</h4>
                  <p className={styles.featureItemDesc}>Minh bạch quá trình canh tác cho khách hàng.</p>
                </div>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureItemIcon}>✓</div>
                <div>
                  <h4 className={styles.featureItemTitle}>Hỗ trợ chuẩn GlobalGAP</h4>
                  <p className={styles.featureItemDesc}>Định dạng báo cáo xuất khẩu chuẩn quốc tế.</p>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.featureImageWrapper}>
            <div style={{ width: '100%', height: '400px', position: 'relative' }}>
              <img 
                src={greenhouseImg.src}
                alt="Modern Greenhouse" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className={styles.featuresGrid}>
        <div className={styles.featuresGridContainer}>
          <h2 className={styles.sectionTitle}>Mọi công cụ bạn cần để quản lý nông trại</h2>
          <p className={styles.sectionDesc} style={{ maxWidth: '600px', margin: '0 auto' }}>
            Tối giản hóa hàng ngày với toàn bộ công cụ cần thiết cho sản xuất, từ lập kế hoạch đến quản lý tồn kho.
          </p>
          
          <div className={styles.gridCards}>
            <div className={styles.gridCard}>
              <div className={styles.gridIcon}>🌱</div>
              <h3 className={styles.gridCardTitle}>Nhật ký canh tác</h3>
              <p className={styles.gridCardDesc}>Ghi chép chi tiết quá trình chăm sóc, thu hoạch của từng luống/bảng.</p>
            </div>
            <div className={styles.gridCard}>
              <div className={styles.gridIcon}>📦</div>
              <h3 className={styles.gridCardTitle}>Kho vật tư</h3>
              <p className={styles.gridCardDesc}>Quản lý nhập xuất phân bón, thuốc BVTV. Cảnh báo sắp hết hàng.</p>
            </div>
            <div className={styles.gridCard}>
              <div className={styles.gridIcon}>📅</div>
              <h3 className={styles.gridCardTitle}>Lịch công việc</h3>
              <p className={styles.gridCardDesc}>Giao việc, nhắc nhở công việc mỗi ngày cho nhân sự nông trại.</p>
            </div>
            <div className={styles.gridCard}>
              <div className={styles.gridIcon}>📊</div>
              <h3 className={styles.gridCardTitle}>Báo cáo & Thống kê</h3>
              <p className={styles.gridCardDesc}>Xuất báo cáo chi phí, năng suất trực quan để ra quyết định.</p>
            </div>
            <div className={styles.gridCard}>
              <div className={styles.gridIcon}>🔍</div>
              <h3 className={styles.gridCardTitle}>Truy xuất nguồn gốc</h3>
              <p className={styles.gridCardDesc}>Minh bạch thông tin canh tác và nhật ký sản phẩm cho người tiêu dùng.</p>
            </div>
            <div className={styles.gridCard}>
              <div className={styles.gridIcon}>⚙️</div>
              <h3 className={styles.gridCardTitle}>Kết nối IoT (Sắp ra mắt)</h3>
              <p className={styles.gridCardDesc}>Tích hợp trạm thời tiết, cảm biến độ ẩm để quản lý tự động.</p>
            </div>
          </div>
        </div>
      </section>
      {/* Store Section */}
      <section id="store" className={styles.store}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 className={styles.sectionTitle}>Vật tư Nông nghiệp</h2>
          <p className={styles.sectionDesc} style={{ margin: '0 auto', maxWidth: '600px' }}>
            Khám phá các sản phẩm vật tư chất lượng từ Marketplace.
          </p>
        </div>
        <div className={styles.storeCards}>
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', width: '100%', padding: '2rem', gridColumn: '1 / -1' }}>Đang tải vật tư...</div>
          ) : (
            products.slice(0, 6).map((product) => (
              <div key={product._id} className={styles.productCard}>
                <div className={styles.productImg}>
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>No Image</div>
                  )}
                </div>
                <div className={styles.productInfo}>
                  <div className={styles.productCategory}>{product.category}</div>
                  <h4 className={styles.productTitle}>{product.name}</h4>
                  <div className={styles.productPrice}>
                    {product.price.toLocaleString('vi-VN')}đ <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>/ {product.unit}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link href="/login" style={{ padding: '0.75rem 2.5rem', border: '2px solid var(--color-primary-600)', color: 'var(--color-primary-600)', fontWeight: 600, borderRadius: '9999px', textDecoration: 'none', display: 'inline-block', transition: 'all 0.2s' }}>
            Xem tất cả sản phẩm ➔
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={styles.pricing}>
        <h2 className={styles.sectionTitle}>Gói dịch vụ phù hợp với mọi quy mô</h2>
        <p className={styles.sectionDesc} style={{ maxWidth: '600px', margin: '0 auto' }}>
          Bắt đầu miễn phí, nâng cấp khi cần. Không ràng buộc thẻ tín dụng.
        </p>

        <div className={styles.pricingCards}>
          {packages.length === 0 ? (
            <div style={{ textAlign: 'center', width: '100%', padding: '2rem' }}>Đang tải bảng giá...</div>
          ) : (
            packages.map((pkg) => (
              <div key={pkg._id} className={`${styles.pricingCard} ${pkg.code === 'STANDARD' ? styles.popular : ''}`}>
                {pkg.code === 'STANDARD' && <div className={styles.popularBadge}>PHỔ BIẾN NHẤT</div>}
                <div className={styles.planName}>{pkg.name}</div>
                <div className={styles.planDesc}>{pkg.description}</div>
                <div className={styles.planPrice}>
                  {pkg.price === 0 ? 'Liên hệ' : pkg.price.toLocaleString('vi-VN')} <span>/ tháng</span>
                </div>
                <ul className={styles.planFeatures}>
                  {pkg.features && pkg.features.map((feature: string, idx: number) => (
                    <li key={idx}><span className={styles.featureCheck}>✓</span> {feature}</li>
                  ))}
                </ul>
                <Link href="/register" style={{ textDecoration: 'none' }}>
                  <button className={`${styles.planBtn} ${pkg.code === 'STANDARD' ? styles.filled : styles.outline}`}>
                    Đăng ký ngay
                  </button>
                </Link>
              </div>
            ))
          )}
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.ctaContainer}>
          <h2 className={styles.ctaTitle}>Bắt đầu hành trình số hóa nông trại ngay hôm nay.</h2>
          <p className={styles.ctaDesc}>Đăng ký miễn phí trong 30 ngày. Không cần thẻ tín dụng. Cài đặt trong 5 phút.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{ padding: '1rem 2rem', backgroundColor: 'var(--color-primary-600)', color: 'white', fontWeight: '600', borderRadius: '9999px', textDecoration: 'none' }}>Đăng ký miễn phí ➔</Link>
            <button style={{ padding: '1rem 2rem', backgroundColor: 'white', border: '1px solid var(--color-border)', color: 'var(--color-text-main)', fontWeight: '600', borderRadius: '9999px' }}>Liên hệ tư vấn</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div>
            <div className={styles.footerLogo}>AgriLog</div>
            <p className={styles.footerDesc}>Nền tảng số hóa quản lý nông trại dành cho người Việt. Tiện lợi, hiệu quả, dễ sử dụng.</p>
          </div>
          <div>
            <h4 className={styles.footerColTitle}>Sản phẩm</h4>
            <ul className={styles.footerLinks}>
              <li><a href="#">Tính năng</a></li>
              <li><a href="#">Bảng giá</a></li>
              <li><a href="#">Tích hợp</a></li>
              <li><a href="#">Hướng dẫn sử dụng</a></li>
            </ul>
          </div>
          <div>
            <h4 className={styles.footerColTitle}>Công ty</h4>
            <ul className={styles.footerLinks}>
              <li><a href="#">Về chúng tôi</a></li>
              <li><a href="#">Tuyển dụng</a></li>
              <li><a href="#">Đối tác</a></li>
              <li><a href="#">Liên hệ</a></li>
            </ul>
          </div>
          <div>
            <h4 className={styles.footerColTitle}>Pháp lý</h4>
            <ul className={styles.footerLinks}>
              <li><a href="#">Điều khoản dịch vụ</a></li>
              <li><a href="#">Chính sách bảo mật</a></li>
            </ul>
          </div>
        </div>
        <div className={styles.footerBottom}>
          © 2026 AgriLog. Đã đăng ký bản quyền.
        </div>
      </footer>
    </div>
  );
}
