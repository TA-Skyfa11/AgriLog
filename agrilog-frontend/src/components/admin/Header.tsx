'use client';
import { Search, Bell } from 'lucide-react';
import styles from '../../css/AdminLayout.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.searchBar}>
        <Search />
        <input type="text" placeholder="Tìm kiếm hệ thống..." className={styles.searchInput} />
      </div>
      <div className={styles.headerRight}>
        <button className={styles.notificationBtn}>
          <Bell />
          <span className={styles.notificationBadge}></span>
        </button>
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
