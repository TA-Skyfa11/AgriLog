/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import React, { useState, useEffect } from 'react';
import { Search, Bell, Check } from 'lucide-react';
import styles from '../../css/AdminLayout.module.css';
import { fetchAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

export function Header() {
  const router = useRouter();
  const [time, setTime] = useState(new Date());
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await fetchAPI('/notifications');
        if (res.success && res.data) {
          setNotifications(res.data);
        }
      } catch (e) {}
    };
    loadNotifications();
  }, []);

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const markAsRead = async (id: string) => {
    try {
      await fetchAPI(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setShowNotifications(false);
    } catch (e) {}
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className={styles.header}>
      <div className={styles.searchBar}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, fontSize: '1.1rem', color: '#1e293b' }} suppressHydrationWarning>{getGreeting()}, Admin!</span>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }} suppressHydrationWarning>Bây giờ là {time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      <div className={styles.headerRight}>
        <div style={{ position: 'relative' }}>
          <button 
            className={styles.notificationBtn} 
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell />
            {unreadCount > 0 && <span className={styles.notificationBadge}>{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div style={{ position: 'absolute', top: '120%', right: 0, width: '320px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', zIndex: 50 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>Thông báo</div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>Không có thông báo nào</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n._id} 
                      onClick={() => markAsRead(n._id)}
                      style={{ 
                        padding: '12px 16px', 
                        borderBottom: '1px solid #f1f5f9',
                        background: n.isRead ? 'transparent' : '#f8fafc',
                        cursor: 'pointer',
                        display: 'flex', gap: '12px', alignItems: 'flex-start'
                      }}
                    >
                      <div style={{ background: n.isRead ? '#e2e8f0' : '#dbeafe', color: n.isRead ? '#64748b' : '#3b82f6', padding: '8px', borderRadius: '50%' }}>
                        {n.isRead ? <Check size={16} /> : <Bell size={16} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: n.isRead ? 500 : 600, fontSize: '0.9rem', color: '#1e293b' }}>{n.title}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>{n.message}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>{new Date(n.createdAt).toLocaleString('vi-VN')}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <div className={styles.userProfile}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>Lê Văn An</span>
            <span className={styles.userRole}>System Admin</span>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b' }}>
             <span style={{ fontSize: 14, fontWeight: 600 }}>LA</span>
          </div>
        </div>
      </div>
    </header>
  );
}