'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './MainLayout.module.css';

import { 
  Home, Leaf, FlaskConical, ShieldAlert, Package, 
  ShoppingBag, Calendar, BarChart2, CreditCard, 
  User, Settings, Search, Sun, Bell, ShoppingCart, LogOut
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface MainLayoutProps {
  children: React.ReactNode;
  role: 'FARM' | 'ADMIN';
}

export default function MainLayout({ children, role }: MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const todayStr = format(new Date(), 'EEEE, dd/MM/yyyy', { locale: vi });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/');
  };

  const farmLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { href: '/diary', label: 'Nhật ký canh tác', icon: <Leaf size={20} /> },
    { href: '/diary/fertilizer', label: 'Nhật ký phân bón', icon: <FlaskConical size={20} /> },
    { href: '/diary/pesticide', label: 'Nhật ký thuốc BVTV', icon: <ShieldAlert size={20} /> },
    { href: '/inventory', label: 'Kho vật tư', icon: <Package size={20} /> },
    { href: '/marketplace', label: 'Marketplace', icon: <ShoppingBag size={20} /> },
    { href: '/tasks', label: 'Lịch công việc', icon: <Calendar size={20} /> },
    { href: '/reports', label: 'Báo cáo', icon: <BarChart2 size={20} /> },
    { href: '/billing', label: 'Gói dịch vụ', icon: <CreditCard size={20} /> },
    { href: '/profile', label: 'Hồ sơ nông trại', icon: <User size={20} /> },
    { href: '/settings', label: 'Cài đặt', icon: <Settings size={20} /> },
  ];

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { href: '/admin/users', label: 'Quản lý người dùng', icon: <User size={20} /> },
  ];

  const links = role === 'FARM' ? farmLinks : adminLinks;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}><Leaf size={24} color="white" /></div>
          AgriLog {role === 'ADMIN' ? 'Admin' : ''}
        </div>
        <nav className={styles.nav}>
          {links.map((link) => {
            const isActive = link.href === '/diary' 
              ? pathname === '/diary' || pathname.startsWith('/diary/board')
              : pathname.startsWith(link.href);
              
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                {link.icon}
                <span style={{ marginLeft: '12px' }}>{link.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className={styles.userProfileBottom}>
          <div className={styles.avatar}>NT</div>
          <div className={styles.userInfoText}>
            <div className={styles.userName}>Nguyễn Văn Tâm</div>
            <div className={styles.userRole}>{role === 'FARM' ? 'Quản lý nông trại' : 'Admin'}</div>
          </div>
          <button className={styles.logoutBtn} title="Đăng xuất" onClick={handleLogout}>
            <LogOut size={20} />
          </button>
        </div>
      </aside>
      
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.searchBar}>
            <Search size={20} color="#9ca3af" />
            <input type="text" placeholder="Tìm kiếm..." className={styles.searchInput} />
          </div>
          <div className={styles.headerWidgets}>
            <div className={styles.weatherWidget}>
              <Sun size={18} color="#f59e0b" />
              <span>28°C – Nắng</span>
            </div>
            <div className={styles.dateWidget}>
              <Calendar size={18} color="#9ca3af" />
              <span>{todayStr}</span>
            </div>
            <button className={styles.iconBtn}><Bell size={20} /><span className={styles.badge}></span></button>
            <button className={styles.iconBtn}><ShoppingCart size={20} /></button>
            <div className={styles.headerAvatar}>NT</div>
          </div>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
