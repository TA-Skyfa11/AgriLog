/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import styles from './MainLayout.module.css';
import logoImg from '../../../public/images/landing/logo.png';

import { 
  Home, Leaf, FlaskConical, ShieldAlert, Package, 
  ShoppingBag, Calendar, BarChart2, CreditCard, 
  User, Settings, Search, Sun, Bell, ShoppingCart, LogOut, Check, X,
  Building, PackagePlus, ClipboardList, PieChart, Menu, ChevronLeft, Sparkles, CheckCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { Toaster, toast } from 'react-hot-toast';
import { useAppContext } from '@/context/AppProvider';
import SelectTrialModal from '@/components/trial/SelectTrialModal';
import { logoutOneSignal } from '@/lib/onesignal';


interface MainLayoutProps {
  children: React.ReactNode;
  role: 'FARM' | 'ADMIN' | 'COMPANY';
}

export default function MainLayout({ children, role }: MainLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, t, cart, removeFromCart, clearCart, isFeatureEnabled, disabledPaths } = useAppContext();
  
  const currentLocale = language === 'en' ? enUS : vi;
  const todayStr = format(new Date(), 'EEEE, dd/MM/yyyy', { locale: currentLocale });

  const [userName, setUserName] = React.useState('Nguyễn Văn Tâm');
  const [userInitials, setUserInitials] = React.useState('NT');
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showCart, setShowCart] = React.useState(false);
  const [time, setTime] = React.useState(new Date());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [farmProfile, setFarmProfile] = React.useState<any>(null);
  const [showTrialModal, setShowTrialModal] = React.useState(false);

  const notificationRef = React.useRef<HTMLDivElement>(null);
  const cartRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowNotifications(false);
    setShowCart(false);
  }, [pathname]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (showNotifications && notificationRef.current && !notificationRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (showCart && cartRef.current && !cartRef.current.contains(target)) {
        setShowCart(false);
      }
    };

    if (showNotifications || showCart) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showNotifications, showCart]);

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
        if (data.success && data.data) {
           setFarmProfile(data.data);
           if (data.data.farmName) {
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
            // Only toast recent notifications (e.g. less than 24 hours old) to avoid bombarding user with old notifications on login
            let toastedIds = JSON.parse(localStorage.getItem('toastedIds') || '[]');
            const now = new Date().getTime();
            const unread = res.data.filter((n: any) => {
              const isRecent = now - new Date(n.createdAt).getTime() < 24 * 60 * 60 * 1000;
              return !n.isRead && !toastedIds.includes(n._id) && isRecent;
            });
            
            const hasFetched = sessionStorage.getItem('has_fetched_notifications');
            
            unread.forEach((n: any) => {
              toastedIds.push(n._id);
            });

            if (!hasFetched) {
              sessionStorage.setItem('has_fetched_notifications', 'true');
            }

            if (toastedIds.length > 100) {
              toastedIds = toastedIds.slice(toastedIds.length - 100);
            }
            localStorage.setItem('toastedIds', JSON.stringify(toastedIds));
          }
        }
      } catch (e) {}
    };

    Promise.all([loadProfileData(), loadNotifications()]);
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

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id);
      if (unreadIds.length === 0) return;
      await Promise.all(unreadIds.map(id => fetchAPI(`/notifications/${id}/read`, { method: 'PUT' })));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = async () => {
    try {
      await logoutOneSignal().catch(() => {});
    } catch (e) {
      console.warn('OneSignal logout failed:', e);
    }

    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userPlan');
      localStorage.removeItem('toastedIds');
      localStorage.removeItem('has_fetched_notifications');
      sessionStorage.clear();
      clearCart();
    } catch (e) {
      console.warn('Storage cleanup failed:', e);
    }

    try {
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; max-age=0;';
      document.cookie = 'role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; max-age=0;';
      if (typeof window !== 'undefined' && window.location.hostname) {
        document.cookie = `token=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:01 GMT; max-age=0;`;
        document.cookie = `role=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:01 GMT; max-age=0;`;
      }
    } catch (e) {
      console.warn('Cookie cleanup failed:', e);
    }

    // Force hard redirect to purge all in-memory React and router state
    window.location.href = '/';
  };

  interface NavLinkItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    featureKey?: string;
  }

  const farmLinks: NavLinkItem[] = [
    { href: '/dashboard', label: t('dashboard.title'), icon: <Home size={20} /> },
    { featureKey: 'diary_cultivation', href: '/diary', label: t('diary.cultivation'), icon: <Leaf size={20} /> },
    { featureKey: 'diary_fertilizer', href: '/diary/fertilizer', label: t('diary.fertilizer'), icon: <FlaskConical size={20} /> },
    { featureKey: 'diary_pesticide', href: '/diary/pesticide', label: t('diary.pesticide'), icon: <ShieldAlert size={20} /> },
    { featureKey: 'inventory', href: '/inventory', label: t('inventory'), icon: <Package size={20} /> },
    { featureKey: 'marketplace', href: '/marketplace', label: t('marketplace'), icon: <ShoppingBag size={20} /> },
    { featureKey: 'tasks', href: '/tasks', label: t('tasks'), icon: <Calendar size={20} /> },
    { featureKey: 'reports', href: '/reports', label: t('reports'), icon: <BarChart2 size={20} /> },
    { featureKey: 'billing', href: '/billing', label: t('billing'), icon: <CreditCard size={20} /> },
    { href: '/settings', label: t('settings.title'), icon: <Settings size={20} /> },
  ];

  const adminLinks: NavLinkItem[] = [
    { href: '/admin/dashboard', label: t('dashboard.title'), icon: <Home size={20} /> },
    { href: '/admin/users', label: 'Quản lý người dùng', icon: <User size={20} /> },
    { href: '/admin/marketplace', label: 'Kiểm duyệt sản phẩm', icon: <ShoppingBag size={20} /> },
    { href: '/admin/orders', label: 'Đơn hàng', icon: <ShoppingCart size={20} /> },
    { href: '/admin/settings', label: 'Cài đặt', icon: <Settings size={20} /> },
  ];

  const companyLinks: NavLinkItem[] = [
    { href: '/company/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { featureKey: 'company_products', href: '/company/products', label: 'Sản phẩm', icon: <PackagePlus size={20} /> },
    { featureKey: 'company_orders', href: '/company/orders', label: 'Đơn hàng', icon: <ClipboardList size={20} /> },
    { href: '/company/settings', label: 'Cài đặt', icon: <Settings size={20} /> },
  ];

  const rawLinks: NavLinkItem[] = role === 'FARM' ? farmLinks : role === 'ADMIN' ? adminLinks : companyLinks;
  // Lọc chỉ hiển thị các liên kết thuộc tính năng đang BẬT
  const links = rawLinks.filter(link => !link.featureKey || isFeatureEnabled(link.featureKey));

  // Danh sách tab cho thanh điều hướng dưới đáy (Mobile Bottom Navigation)
  const bottomNavTabs = React.useMemo(() => {
    if (role === 'FARM') {
      return [
        { label: 'Trang chủ', href: '/dashboard', icon: <Home size={20} /> },
        { label: 'Nhật ký', href: '/diary', icon: <Leaf size={20} /> },
        { label: 'Công việc', href: '/tasks', icon: <Calendar size={20} /> },
        { label: 'Kho vật tư', href: '/inventory', icon: <Package size={20} /> },
        { label: 'Menu', isAction: true, onClick: () => setIsMobileMenuOpen(prev => !prev), icon: <Menu size={20} /> },
      ];
    }
    if (role === 'ADMIN') {
      return [
        { label: 'Tổng quan', href: '/admin/dashboard', icon: <Home size={20} /> },
        { label: 'Người dùng', href: '/admin/users', icon: <User size={20} /> },
        { label: 'Chợ vật tư', href: '/admin/marketplace', icon: <ShoppingBag size={20} /> },
        { label: 'Đơn hàng', href: '/admin/orders', icon: <ShoppingCart size={20} /> },
        { label: 'Menu', isAction: true, onClick: () => setIsMobileMenuOpen(prev => !prev), icon: <Menu size={20} /> },
      ];
    }
    return [
      { label: 'Dashboard', href: '/company/dashboard', icon: <Home size={20} /> },
      { label: 'Sản phẩm', href: '/company/products', icon: <PackagePlus size={20} /> },
      { label: 'Đơn hàng', href: '/company/orders', icon: <ClipboardList size={20} /> },
      { label: 'Cài đặt', href: '/company/settings', icon: <Settings size={20} /> },
      { label: 'Menu', isAction: true, onClick: () => setIsMobileMenuOpen(prev => !prev), icon: <Menu size={20} /> },
    ];
  }, [role]);

  // Kiểm tra nếu route hiện tại đang truy cập thuộc tính năng bị tắt bởi Admin
  const isCurrentRouteDisabled = role !== 'ADMIN' && (disabledPaths || []).some(dp => {
    if (!dp) return false;
    return pathname === dp || pathname.startsWith(dp + '/');
  });

  return (
    <div className={styles.layout}>
      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className={styles.backdrop} 
          onClick={() => setIsMobileMenuOpen(false)} 
          aria-label="Đóng menu trượt"
        />
      )}

      {/* Mobile-only backdrop for open notifications or cart sheet */}
      {(showNotifications || showCart) && (
        <div 
          className={styles.mobileSheetBackdrop} 
          onClick={() => {
            setShowNotifications(false);
            setShowCart(false);
          }} 
          aria-label="Đóng bảng chi tiết"
        />
      )}

      <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.brand} style={{ justifyContent: isSidebarCollapsed ? 'center' : 'space-between', padding: isSidebarCollapsed ? '0' : '0 1.25rem' }}>
          {!isSidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className={styles.brandIcon} style={{ background: 'transparent', width: 'auto', height: 'auto' }}>
                <Image src={logoImg} alt="AgriLog Logo" width={42} height={42} priority style={{ objectFit: 'contain' }} />
              </div>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary-800, #166534)' }}>
                AgriLog {role === 'ADMIN' ? 'Admin' : ''}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button 
              className={styles.drawerCloseBtn} 
              onClick={() => setIsMobileMenuOpen(false)} 
              aria-label="Đóng menu trượt"
            >
              <X size={22} />
            </button>
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', padding: isSidebarCollapsed ? '1rem' : '0.25rem' }}
              aria-label="Thu gọn thanh điều hướng"
            >
               {isSidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
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
                onClick={() => setIsMobileMenuOpen(false)}
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
        <div 
          className={styles.userProfileBottom} 
          style={{ 
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', 
            padding: isSidebarCollapsed ? '1rem 0' : '1.25rem 1rem',
            flexDirection: isSidebarCollapsed ? 'column' : 'row',
            gap: isSidebarCollapsed ? '0.625rem' : '0.75rem',
            alignItems: 'center'
          }}
        >
          <div className={styles.avatar}>{userInitials}</div>
          {!isSidebarCollapsed && (
            <div className={styles.userInfoText}>
              <div className={styles.userName}>{userName}</div>
              <div className={styles.userRole}>{role === 'FARM' ? 'Quản lý nông trại' : role === 'ADMIN' ? 'Admin' : 'Doanh nghiệp'}</div>
            </div>
          )}
          <button 
            className={styles.logoutBtn} 
            title={t('logout')} 
            onClick={handleLogout} 
            aria-label={t('logout')}
            style={isSidebarCollapsed ? { width: '38px', height: '38px', marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' } : undefined}
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>
      
      <main className={`${styles.main} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
        <header className={styles.header}>
          {/* Mobile Header Left with Hamburger and Logo */}
          <div className={styles.mobileHeaderLeft}>
            <button 
              className={styles.mobileMenuBtn} 
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Mở thanh điều hướng"
            >
              <Menu size={24} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Image src={logoImg} alt="AgriLog Logo" width={32} height={32} priority style={{ objectFit: 'contain' }} />
              <span className={styles.mobileHeaderBrand}>AgriLog</span>
            </div>
          </div>

          <div className={styles.searchBar} style={{ visibility: 'hidden' }}>
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
            
            <div 
              className={styles.headerAvatar} 
              title={`${userName} (${role}) - Nhấn để đăng xuất`}
              onClick={handleLogout}
              style={{ cursor: 'pointer' }}
            >
              {userInitials}
            </div>
          </div>
        </header>
        {/* Banner hết hạn gói cước */}
        {role === 'FARM' && farmProfile?.isPlanExpired && pathname !== '/billing' && (
          <div style={{
            backgroundColor: '#fef2f2',
            borderBottom: '1px solid #fecaca',
            padding: '0.65rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            color: '#991b1b',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} color="#ef4444" />
              <span>
                <strong>Gói dịch vụ {farmProfile?.isTrial ? 'dùng thử ' : ''}của bạn đã hết hạn.</strong> Các thao tác tạo mới và ghi chép canh tác hiện đã bị tạm khóa.
              </span>
            </div>
            <Link
              href="/billing"
              style={{
                padding: '0.35rem 0.85rem',
                backgroundColor: '#dc2626',
                color: 'white',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.8rem',
                textDecoration: 'none',
                boxShadow: '0 2px 4px rgba(220,38,38,0.2)',
                whiteSpace: 'nowrap'
              }}
            >
              Mua gói gia hạn ngay &rarr;
            </Link>
          </div>
        )}

        {/* Banner nhắc chọn gói dùng thử */}
        {role === 'FARM' && !farmProfile?.isPlanExpired && farmProfile?.isTrial && (farmProfile?.plan === 'ALL' || farmProfile?.isTrialAll) && pathname !== '/billing' && (
          <div style={{
            backgroundColor: '#ecfdf5',
            borderBottom: '1px solid #a7f3d0',
            padding: '0.65rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            color: '#065f46',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sparkles size={18} color="#059669" />
              <span>
                <strong>Dùng thử miễn phí {farmProfile?.trialDurationMonths || 6} tháng:</strong> {farmProfile?.trialPromptMessage || 'Vui lòng chọn 1 gói cước để bắt đầu trải nghiệm và tạo bảng nhật ký.'}
              </span>
            </div>
            <button
              onClick={() => setShowTrialModal(true)}
              style={{
                padding: '0.35rem 0.95rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.825rem',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(16,185,129,0.25)',
                whiteSpace: 'nowrap'
              }}
            >
              Chọn gói dùng thử ngay &rarr;
            </button>
          </div>
        )}

        {/* Banner thông báo tài khoản đang dùng gói Miễn phí (Free) */}
        {role === 'FARM' && !farmProfile?.isTrial && farmProfile?.plan === 'FREE' && pathname !== '/billing' && !farmProfile?.isPlanExpired && (
          <div style={{
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '0.55rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            color: '#475569',
            fontSize: '0.825rem',
            fontWeight: 500,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={16} color="#64748b" />
              <span>
                Tài khoản đang áp dụng <strong>Gói Miễn phí (Free)</strong>: Tối đa 1 bảng mỗi nhật ký, không xuất Excel/PDF và không tải ảnh.
              </span>
            </div>
            <Link
              href="/billing"
              style={{
                padding: '0.3rem 0.75rem',
                backgroundColor: '#0284c7',
                color: 'white',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.78rem',
                textDecoration: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              Nâng cấp gói cước &rarr;
            </Link>
          </div>
        )}
        <div className={styles.content}>
          {isCurrentRouteDisabled ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              textAlign: 'center',
              padding: '2rem',
              backgroundColor: 'var(--color-surface, #ffffff)',
              borderRadius: '12px',
              border: '1px solid var(--color-border, #e2e8f0)',
              margin: '1.5rem',
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                color: '#d97706',
              }}>
                <ShieldAlert size={36} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text-main, #1e293b)' }}>
                Tính năng đang tạm đóng
              </h2>
              <p style={{ maxWidth: '500px', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.6, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                Chức năng này hiện đang được Quản trị viên hệ thống tạm ẩn để bảo trì hoặc nâng cấp hệ thống. Vui lòng quay lại sau!
              </p>
              <button 
                onClick={() => router.push(role === 'COMPANY' ? '/company/dashboard' : '/dashboard')}
                style={{
                  padding: '0.75rem 1.75rem',
                  backgroundColor: 'var(--color-primary-600, #16a34a)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'opacity 0.2s',
                }}
              >
                Quay về Trang chủ
              </button>
            </div>
          ) : (
            children
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className={styles.bottomNav} aria-label="Thanh điều hướng dưới">
        {bottomNavTabs.map((tab) => {
          const isActive = tab.isAction ? isMobileMenuOpen : (
            tab.href === '/diary'
              ? pathname === '/diary' || pathname.startsWith('/diary/board')
              : pathname === tab.href || pathname.startsWith(tab.href + '/')
          );

          if (tab.isAction) {
            return (
              <button
                key={tab.label}
                type="button"
                className={`${styles.bottomNavItem} ${isActive ? styles.active : ''}`}
                onClick={tab.onClick}
                aria-label={tab.label}
              >
                {isActive && <div className={styles.bottomNavActivePill} />}
                <div className={styles.bottomNavIconWrapper}>{tab.icon}</div>
                <span>{tab.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href!}
              className={`${styles.bottomNavItem} ${isActive ? styles.active : ''}`}
            >
              {isActive && <div className={styles.bottomNavActivePill} />}
              <div className={styles.bottomNavIconWrapper}>{tab.icon}</div>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <SelectTrialModal
        isOpen={showTrialModal}
        onClose={() => setShowTrialModal(false)}
        subtitle={farmProfile?.trialPromptMessage}
        onSuccess={() => {
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }}
      />
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
    </div>
  );
}
