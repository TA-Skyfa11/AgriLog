'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Store, ShoppingCart, Package, Settings, HelpCircle, LogOut } from 'lucide-react';
import styles from '../../css/AdminLayout.module.css';

export function Sidebar() {
  const pathname = usePathname();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.href = '/';
  };

  const navItems = [
    { name: 'Trang tổng quan', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Quản lý người dùng', href: '/admin/users', icon: Users },
    { name: 'Quản lý Marketplace', href: '/admin/marketplace', icon: Store },
    { name: 'Quản lý đơn hàng', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Quản lý gói dịch vụ', href: '/admin/services', icon: Package },
    { name: 'Cài đặt hệ thống', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 12"/></svg>
        </div>
        <div className={styles.logoText}>
          <span className={styles.logoTitle}>AgriLog</span>
          <span className={styles.logoSubtitle}>Admin Portal</span>
        </div>
      </div>
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
              <item.icon />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className={styles.footerNav}>
        <Link href="/admin/help" className={styles.navItem}>
          <HelpCircle />
          Trợ giúp
        </Link>
        <a href="#" onClick={handleLogout} className={`${styles.navItem} ${styles.logout}`}>
          <LogOut />
          Đăng xuất
        </a>
      </div>
    </aside>
  );
}
