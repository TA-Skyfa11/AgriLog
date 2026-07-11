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
  Building, PackagePlus, ClipboardList, PieChart, Menu, ChevronLeft
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
  const { language, t, cart, removeFromCart } = useAppContext();
  
  const currentLocale = language === 'en' ? enUS : vi;
  const todayStr = format(new Date(), 'EEEE, dd/MM/yyyy', { locale: currentLocale });

  const [userName, setUserName] = React.useState('Nguyễn Văn Tâm');
  const [userInitials, setUserInitials] = React.useState('NT');
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showCart, setShowCart] = React.useState(false);
  const [time, setTime] = React.useState(new Date());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
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
      <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.brand} style={{ justifyContent: isSidebarCollapsed ? 'center' : 'space-between', padding: isSidebarCollapsed ? '0' : '0 1.5rem' }}>
          {!isSidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className={styles.brandIcon}><Leaf size={24} color="white" /></div>
              <span>AgriLog {role === 'ADMIN' ? 'Admin' : ''}</span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', padding: isSidebarCollapsed ? '1rem' : '0' }}
          >
             {isSidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
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
                style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '0.75rem 0' : '0.75rem 1.25rem' }}
                title={isSidebarCollapsed ? link.label : ''}
              >
                {link.icon}
                {!isSidebarCollapsed && <span style={{ marginLeft: '12px' }}>{link.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className={styles.userProfileBottom} style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: isSidebarCollapsed ? '1.25rem 0' : '1.25rem 1rem' }}>
          <div className={styles.avatar}>{userInitials}</div>
          {!isSidebarCollapsed && (
            <div className={styles.userInfoText}>
              <div className={styles.userName}>{userName}</div>
              <div className={styles.userRole}>{role === 'FARM' ? 'Quản lý nông trại' : role === 'ADMIN' ? 'Admin' : 'Doanh nghiệp'}</div>
            </div>
          )}
          {!isSidebarCollapsed && (
            <button className={styles.logoutBtn} title={t('logout')} onClick={handleLogout}>
              <LogOut size={20} />
            </button>
          )}
        </div>
      </aside>
      
      <main className={`${styles.main} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
        <header className={styles.header}>
          <div className={styles.searchBar}>
            <Search size={20} color="#9ca3af" />
            <input type="text" placeholder="Tìm kiếm..." className={styles.searchInput} />
          </div>
          <div className={styles.headerWidgets}>
            <div className={styles.dateWidget}>
              <Calendar size={18} color="#9ca3af" />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span suppressHydrationWarning style={{ fontWeight: 500, lineHeight: 1.2 }}>{todayStr}</span>
                <span suppressHydrationWarning style={{ fontSize: '0.75rem', color: '#64748b' }}>{time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
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
            
            <div style={{ position: 'relative' }}>
              <button className={styles.iconBtn} onClick={() => setShowCart(!showCart)}>
                <ShoppingCart size={20} />
                {cart && cart.length > 0 && <span className={styles.badge}>{cart.length}</span>}
              </button>
              
              {showCart && (
                <div className={styles.notificationDropdown}>
                  <div className={styles.notificationHeader}>
                    <h4>Giỏ hàng</h4>
                    <button onClick={() => setShowCart(false)} className={styles.closeBtn}><X size={16} /></button>
                  </div>
                  <div className={styles.notificationList}>
                    {!cart || cart.length === 0 ? (
                      <div className={styles.noNotifications}>Giỏ hàng đang trống</div>
                    ) : (
                      <>
                        {cart.map(item => (
                          <div key={item.product._id} className={styles.notificationItem} style={{ cursor: 'default' }}>
                            <div className={styles.notifIcon} style={{ fontSize: '24px' }}>📦</div>
                            <div className={styles.notifContent}>
                              <div className={styles.notifTitle} style={{ paddingRight: '20px' }}>{item.product.name}</div>
                              <div className={styles.notifMessage}>{item.quantity} {item.product.unit} x {item.product.price.toLocaleString('vi-VN')}đ</div>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeFromCart(item.product._id); }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', position: 'absolute', right: '1rem', top: '1rem' }}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                        <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                            <span>Tổng tiền:</span>
                            <span style={{ color: '#ef4444' }}>
                              {cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                          <Link href="/marketplace/checkout" style={{ display: 'block', textAlign: 'center', padding: '0.75rem', backgroundColor: 'var(--color-primary-600)', color: 'white', borderRadius: '6px', fontWeight: 600, textDecoration: 'none', marginTop: '0.5rem' }}>
                            Thanh toán ngay
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
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
