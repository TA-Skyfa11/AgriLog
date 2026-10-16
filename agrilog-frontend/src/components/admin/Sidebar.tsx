/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Store, ShoppingCart, Package, Settings, HelpCircle, LogOut } from 'lucide-react';
import styles from '../../css/AdminLayout.module.css';
import logoImg from '../../../public/images/landing/logo.png';

export function Sidebar() {
  const pathname = usePathname();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userPlan');
      localStorage.removeItem('toastedIds');
      sessionStorage.clear();
    } catch (err) {}
    try {
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; max-age=0;';
      document.cookie = 'role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; max-age=0;';
      if (typeof window !== 'undefined' && window.location.hostname) {
        document.cookie = `token=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:01 GMT; max-age=0;`;
        document.cookie = `role=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:01 GMT; max-age=0;`;
      }
    } catch (err) {}
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
        <div className={styles.logoIcon} style={{ background: 'transparent', width: 'auto', height: 'auto' }}>
          <Image src={logoImg} alt="AgriLog" width={48} height={48} priority style={{ objectFit: 'contain' }} />
        </div>
        <div className={styles.logoText}>
          <span className={styles.logoTitle} style={{ fontSize: '1.4rem' }}>AgriLog</span>
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
        <a href="#" onClick={handleLogout} className={`${styles.navItem} ${styles.logout}`}>
          <LogOut />
          Đăng xuất
        </a>
      </div>
    </aside>
  );
}
