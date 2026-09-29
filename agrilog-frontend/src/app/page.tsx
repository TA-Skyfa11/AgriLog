'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/css/landing.module.css';
import { fetchAPI } from '@/lib/api';
import { getSafeImageUrl } from '@/lib/image';
import heroImg from '../../public/images/landing/hero_real.jpg';
import greenhouseImg from '../../public/images/landing/greenhouse_real.jpg';
import logoImg from '../../public/images/landing/logo.png';
import { useAppContext } from '@/context/AppProvider';

export default function LandingPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const { isFeatureEnabled } = useAppContext();

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
          <a href="/" className={styles.logo} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={logoImg.src} alt="AgriLog Logo" width="56" height="56" style={{ objectFit: 'contain' }} />
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary-700, #15803d)' }}>AgriLog</span>
          </a>
          <nav className={styles.navLinks}>
            <a href="#" className={styles.navLink}>Trang chủ</a>
            <a href="#about" className={styles.navLink}>Giới thiệu</a>
            <a href="#features" className={styles.navLink}>Tính năng</a>
            <button 
              onClick={() => setIsCatalogOpen(true)} 
              className={styles.navLink}
              style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: 0 }}
            >
              Catalog
            </button>
            {isFeatureEnabled('marketplace') && (
              <a href="#store" className={styles.navLink}>Vật tư</a>
            )}
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
              <button className={styles.heroSecondaryBtn} onClick={() => setIsVideoOpen(true)}>Xem Demo ▾</button>
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


      {/* Feature Detail Section */}
      <section id="about" className={styles.featureDetail}>
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
      <section id="features" className={styles.featuresGrid}>
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
      {isFeatureEnabled('marketplace') && (
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
                      <img src={getSafeImageUrl(product.images[0])} alt={product.name} />
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
      )}

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

      {/* Footer - Giao diện SaaS chuyên nghiệp */}
      <footer style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', marginTop: '4rem', color: '#4b5563', padding: '4rem 0 1.5rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', justifyContent: 'space-between' }}>
            
            {/* Cột 1: Thông tin chung */}
            <div style={{ flex: '1 1 350px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary-700, #15803d)' }}>AgriLog</span>
              </div>
              <p style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1rem', color: '#6b7280' }}>
                Nền tảng số hóa quản lý nông trại đồng hành cùng nông dân, hợp tác xã và doanh nghiệp trong quá trình chuyển đổi số, hướng tới nền nông nghiệp minh bạch và bền vững.
              </p>
            </div>

            {/* Cột 2: Liên hệ */}
            <div style={{ flex: '1 1 300px' }}>
              <h4 style={{ fontWeight: 600, color: '#111827', marginBottom: '1.25rem', fontSize: '1rem' }}>Thông tin liên hệ</h4>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.8' }}>
                <p style={{ margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  <span>Hà Nội, Hanoi, Vietnam</span>
                </p>
                <p style={{ margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  <a href="tel:0392208943" style={{ color: '#4b5563', textDecoration: 'none' }}>039 220 8943</a>
                </p>
                <p style={{ margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  <a href="mailto:nguyenvanhung10022004@gmail.com" style={{ color: '#4b5563', textDecoration: 'none' }}>nguyenvanhung10022004@gmail.com</a>
                </p>
                <p style={{ margin: '0 0 0.8rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                  <a href="#!" onClick={(e) => e.preventDefault()} style={{ color: '#4b5563', textDecoration: 'none' }}>Agrilog- Nhật Kí Canh Tác</a>
                </p>
              </div>
            </div>
            
            {/* Cột 3: Liên kết */}
            <div style={{ flex: '1 1 200px' }}>
              <h4 style={{ fontWeight: 600, color: '#111827', marginBottom: '1.25rem', fontSize: '1rem' }}>Hỗ trợ khách hàng</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.95rem', lineHeight: '2.2' }}>
                <li><Link href="/terms" style={{ color: '#4b5563', textDecoration: 'none' }}>Điều khoản dịch vụ</Link></li>
                <li><Link href="/privacy" style={{ color: '#4b5563', textDecoration: 'none' }}>Chính sách bảo mật</Link></li>
                <li><Link href="/docs" style={{ color: '#4b5563', textDecoration: 'none' }}>Tài liệu HDSD</Link></li>
              </ul>
            </div>

          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '3rem', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <div>© 2026 AgriLog. Toàn quyền bảo lưu.</div>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      {isVideoOpen && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
          }} 
          onClick={() => setIsVideoOpen(false)}
        >
          <div 
            style={{ 
              position: 'relative', width: '100%', maxWidth: '800px', 
              aspectRatio: '16/9', backgroundColor: '#000', 
              borderRadius: '12px', overflow: 'hidden' 
            }} 
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsVideoOpen(false)}
              style={{ 
                position: 'absolute', top: '10px', right: '10px', zIndex: 10, 
                background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', 
                borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' 
              }}
            >
              ×
            </button>
            <video 
              width="100%" height="100%" 
              controls 
              autoPlay 
              muted
              playsInline
              style={{ outline: 'none', backgroundColor: 'black' }}
            >
              <source src="/demo4.mp4?v=2" type="video/mp4" />
              Trình duyệt của bạn không hỗ trợ thẻ video.
            </video>
          </div>
        </div>
      )}

      {/* Catalog Flipbook Modal */}
      {isCatalogOpen && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1.5rem'
          }} 
          onClick={() => setIsCatalogOpen(false)}
        >
          <div 
            style={{ 
              position: 'relative', width: '95vw', maxWidth: '1300px', height: '85vh',
              backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }} 
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsCatalogOpen(false)}
              style={{ 
                position: 'absolute', top: '12px', right: '12px', zIndex: 10, 
                background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', 
                borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' 
              }}
            >
              ×
            </button>
            <iframe 
              sandbox="allow-scripts allow-same-origin"
              allowFullScreen
              allow="autoplay; fullscreen; clipboard-write" 
              scrolling="no" 
              referrerPolicy="no-referrer"
              style={{ width: '100%', height: '100%', border: 'none' }} 
              src="https://heyzine.com/flip-book/56c0bda3eb.html"
            />
          </div>
        </div>
      )}
    </div>
  );
}
