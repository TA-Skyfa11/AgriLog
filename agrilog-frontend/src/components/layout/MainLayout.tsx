'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './MainLayout.module.css';

interface MainLayoutProps {
  children: React.ReactNode;
  role: 'FARM' | 'ADMIN';
}

export default function MainLayout({ children, role }: MainLayoutProps) {
  const pathname = usePathname();

  const farmLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/diary', label: 'Bảng canh tác' },
    { href: '/inventory', label: 'Kho vật tư' },
    { href: '/tasks', label: 'Lịch công việc' },
    { href: '/profile', label: 'Hồ sơ nông trại' },
  ];

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/users', label: 'Quản lý người dùng' },
  ];

  const links = role === 'FARM' ? farmLinks : adminLinks;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>AgriLog {role === 'ADMIN' ? 'Admin' : ''}</div>
        <nav className={styles.nav}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navItem} ${pathname.startsWith(link.href) ? styles.active : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.userInfo}>
            Xin chào, {role === 'FARM' ? 'Nông trại' : 'Quản trị viên'}
          </div>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
