/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import styles from './MainLayout.module.css';

import { 
  Home, Leaf, FlaskConical, ShieldAlert, Package, 
  ShoppingBag, Calendar, BarChart2, CreditCard, 
  User, Settings, Search, Sun, Bell, ShoppingCart, LogOut, Check, X,
  Building, PackagePlus, ClipboardList, PieChart
} from 'lucide-react';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { Toaster, toast } from 'react-hot-toast';
import { useAppContext } from '@/context/AppProvider';

interface MainLayoutProps {
  children: React.ReactNode;
  role: 'FARM' | 'ADMIN' | 'COMPANY';
}

export default function MainLayout({ children, role }: MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, t } = useAppContext();
  
  const currentLocale = language === 'en' ? enUS : vi;
  const todayStr = format(new Date(), 'EEEE, dd/MM/yyyy', { locale: currentLocale });

  const [userName, setUserName] = React.useState('Nguyễn Văn Tâm');
  const [userInitials, setUserInitials] = React.useState('NT');
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const loadProfileData = async () => {
      let currentRole = role;
      let fallbackName = 'Người dùng';
      let fallbackInitials = 'ND';
      
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user) {
            if (user.role) currentRole = user.role;
            if (user.email) {
              fallbackName = user.email.split('@')[0];
              fallbackInitials = fallbackName.substring(0, 2).toUpperCase();
            }
          }
        }
      } catch (e) {}

      if (currentRole === 'ADMIN') {
        setUserName('Quản trị viên');
        setUserInitials('AD');
        return;
      }

      if (currentRole === 'COMPANY') {
        try {
          const data = await fetchAPI('/company/profile');
          if (data.success && data.data && data.data.companyName) {
            setUserName(data.data.companyName);
            const parts = data.data.companyName.trim().split(/\s+/);
            let initials = '';
            if (parts.length >= 2) {
              initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            } else if (parts.length === 1) {
              initials = parts[0].substring(0, 2).toUpperCase();
            }
            if (initials) setUserInitials(initials);
            return;
          }
        } catch (e) {}
        setUserName(fallbackName);
        setUserInitials(fallbackInitials);
        return;
      }

      try {
        const data = await fetchAPI('/farm/profile');
        if (data.success && data.data && data.data.farmName) {
           localStorage.setItem('userPlan', data.data.plan || 'BASIC');
           setUserName(data.data.farmName);
           const parts = data.data.farmName.trim().split(/\s+/);
           let initials = '';
           if (parts.length >= 2) {
              initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
           } else if (parts.length === 1 && parts[0].length >= 1) {
              initials = parts[0].substring(0, 2).toUpperCase();
           }
           if (initials) {
             setUserInitials(initials);
           }
           return;
        }
      } catch (e) {}
      
      setUserName(fallbackName);
      setUserInitials(fallbackInitials);
    };

    const loadNotifications = async () => {
      try {
        if (role === 'FARM') {
          const res = await fetchAPI('/notifications');
          if (res.success && res.data) {
            setNotifications(res.data);
            
            // Show toasts for unread notifications that haven't been toasted yet in this session
            const toastedIds = JSON.parse(sessionStorage.getItem('toastedIds') || '[]');
            const unread = res.data.filter((n: any) => !n.isRead && !toastedIds.includes(n._id));
            
            unread.forEach((n: any) => {
              toast(n.title + ': ' + n.message, {
                icon: n.type === 'BILLING' ? '💎' : n.type === 'TASK' ? '📅' : '🔔',
                duration: 6000,
              });
              toastedIds.push(n._id);
            });
            sessionStorage.setItem('toastedIds', JSON.stringify(toastedIds));
          }
        }
      } catch (e) {}
    };

    loadProfileData();
    loadNotifications();
  }, [role, pathname]);

  const markAsRead = async (id: string, type?: string) => {
    try {
      await fetchAPI(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      
      if (type === 'TASK') {
        router.push('/tasks');
      } else if (type === 'BILLING') {
        router.push('/billing');
      }
      setShowNotifications(false);
    } catch (e) {}
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/');
  };

  const farmLinks = [
    { href: '/dashboard', label: t('dashboard.title'), icon: <Home size={20} /> },
    { href: '/diary', label: t('diary.cultivation'), icon: <Leaf size={20} /> },
    { href: '/diary/fertilizer', label: t('diary.fertilizer'), icon: <FlaskConical size={20} /> },
    { href: '/diary/pesticide', label: t('diary.pesticide'), icon: <ShieldAlert size={20} /> },
    { href: '/inventory', label: t('inventory'), icon: <Package size={20} /> },
    { href: '/marketplace', label: t('marketplace'), icon: <ShoppingBag size={20} /> },
    { href: '/tasks', label: t('tasks'), icon: <Calendar size={20} /> },
    { href: '/reports', label: t('reports'), icon: <BarChart2 size={20} /> },
    { href: '/billing', label: t('billing'), icon: <CreditCard size={20} /> },
    { href: '/settings', label: t('settings.title'), icon: <Settings size={20} /> },
  ];

  const adminLinks = [
    { href: '/admin/dashboard', label: t('dashboard.title'), icon: <Home size={20} /> },
    { href: '/admin/users', label: 'Quản lý người dùng', icon: <User size={20} /> },
    { href: '/admin/marketplace', label: 'Kiểm duyệt sản phẩm', icon: <ShoppingBag size={20} /> },
    { href: '/admin/orders', label: 'Đơn hàng', icon: <ShoppingCart size={20} /> },
    { href: '/admin/settings', label: 'Cài đặt', icon: <Settings size={20} /> },
  ];

  const companyLinks = [
    { href: '/company/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { href: '/company/products', label: 'Sản phẩm', icon: <PackagePlus size={20} /> },
    { href: '/company/orders', label: 'Đơn hàng', icon: <ClipboardList size={20} /> },
    { href: '/company/settings', label: 'Cài đặt', icon: <Settings size={20} /> },
  ];

  const links = role === 'FARM' ? farmLinks : role === 'ADMIN' ? adminLinks : companyLinks;

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
          <div className={styles.avatar}>{userInitials}</div>
          <div className={styles.userInfoText}>
            <div className={styles.userName}>{userName}</div>
            <div className={styles.userRole}>{role === 'FARM' ? 'Quản lý nông trại' : role === 'ADMIN' ? 'Admin' : 'Doanh nghiệp'}</div>
          </div>
          <button className={styles.logoutBtn} title={t('logout')} onClick={handleLogout}>
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
            <div className={styles.dateWidget}>
              <Calendar size={18} color="#9ca3af" />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 500, lineHeight: 1.2 }}>{todayStr}</span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{time.toLocaleTimeString('vi-VN')}</span>
              </div>
            </div>
            
            <div style={{ position: 'relative' }}>
              <button 
                className={styles.iconBtn} 
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
              </button>
              
              {showNotifications && (
                <div className={styles.notificationDropdown}>
                  <div className={styles.notificationHeader}>
                    <h4>Thông báo</h4>
                    <button onClick={() => setShowNotifications(false)} className={styles.closeBtn}><X size={16} /></button>
                  </div>
                  <div className={styles.notificationList}>
                    {notifications.length === 0 ? (
                      <div className={styles.noNotifications}>Không có thông báo nào</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n._id} className={`${styles.notificationItem} ${!n.isRead ? styles.unread : ''}`} onClick={() => markAsRead(n._id, n.type)}>
                          <div className={styles.notifIcon}>{n.type === 'BILLING' ? '💎' : n.type === 'TASK' ? '📅' : '🔔'}</div>
                          <div className={styles.notifContent}>
                            <div className={styles.notifTitle}>{n.title}</div>
                            <div className={styles.notifMessage}>{n.message}</div>
                            <div className={styles.notifTime}>{format(new Date(n.createdAt), 'dd/MM/yyyy HH:mm')}</div>
                          </div>
                          {!n.isRead && <div className={styles.unreadDot}></div>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <button className={styles.iconBtn}><ShoppingCart size={20} /></button>
            <div className={styles.headerAvatar}>{userInitials}</div>
          </div>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </main>
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
    </div>
  );
}
