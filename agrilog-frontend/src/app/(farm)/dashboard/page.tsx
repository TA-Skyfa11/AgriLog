/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/farmDashboard.module.css';
import { 
  LayoutDashboard, ClipboardCheck, Package, ShoppingCart, 
  CloudRain, Wind, ArrowRight, Check, Plus, BellRing, Droplets, Sun, CloudSun, Cloud,
  Leaf, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [stats, setStats] = useState({
    boardsCount: 0,
    tasksToday: 0,
    tasksCompleted: 0,
    inventoryCount: 0,
    inventoryAlerts: 0,
  });
  
  const [userName, setUserName] = useState('');
  const [weather, setWeather] = useState({ 
    temp: '--', condition: 'Đang tải...', icon: '', 
    humidity: '--', wind: '--', chanceOfRain: '--',
    hourly: [] as {time: string, temp: string}[]
  });
  const [recentBoards, setRecentBoards] = useState<any[]>([]);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const fetchSafe = async (url: string) => {
        try {
          return await fetchAPI(url);
        } catch (e) {
          return { success: false, data: null };
        }
      };

      const [cBoardsRes, fBoardsRes, pBoardsRes, tasksRes, inventoryRes, profileRes] = await Promise.all([
        fetchSafe('/cultivation-boards'),
        fetchSafe('/fertilizer-boards'),
        fetchSafe('/pesticide-boards'),
        fetchSafe('/tasks'),
        fetchSafe('/materials'),
        fetchSafe('/farm/profile')
      ]);

      fetchSafe('/weather').then(weatherRes => {
        if (weatherRes.success && weatherRes.data) {
          const wData = weatherRes.data;
          setWeather({
            temp: wData.temp + '°',
            condition: wData.desc,
            icon: wData.desc.toLowerCase(),
            humidity: wData.humidity,
            wind: wData.wind,
            chanceOfRain: wData.chanceOfRain,
            hourly: wData.hourly || []
          });
        } else {
          setWeather(prev => ({ ...prev, condition: 'Lỗi tải thời tiết' }));
        }
      });

      if (profileRes.success && profileRes.data) {
        setUserName(profileRes.data.user?.name || profileRes.data.farmName || 'Admin');
      } else {
        setUserName('Admin');
      }

      let boardsCount = 0;
      let allBoards: any[] = [];
      let allEntries: any[] = [];

      if (cBoardsRes.success) {
        boardsCount += cBoardsRes.data.length;
        allBoards = [...allBoards, ...cBoardsRes.data.map((b: any) => ({ ...b, type: 'cultivation' }))];
        
        // Fetch entries for recent timeline (just from cultivation for now to keep it simple, or all)
        for (const b of cBoardsRes.data.slice(0, 2)) {
          const eRes = await fetchAPI(`/cultivation-boards/${b._id}/entries`);
          if (eRes.success) {
            allEntries = [...allEntries, ...eRes.data.map((e: any) => ({ ...e, boardName: b.name, type: 'cultivation' }))];
          }
        }
      }
      
      if (fBoardsRes.success) {
        boardsCount += fBoardsRes.data.length;
        allBoards = [...allBoards, ...fBoardsRes.data.map((b: any) => ({ ...b, type: 'fertilizer' }))];
      }

      if (pBoardsRes.success) {
        boardsCount += pBoardsRes.data.length;
        allBoards = [...allBoards, ...pBoardsRes.data.map((b: any) => ({ ...b, type: 'pesticide' }))];
      }
      
      // Sort boards by date desc
      allBoards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentBoards(allBoards.slice(0, 2));

      // Sort entries by date desc
      allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentEntries(allEntries.slice(0, 3));

      let tasksToday = 0;
      let tasksCompleted = 0;
      let todayList: any[] = [];
      if (tasksRes.success) {
        const todayStr = new Date().toISOString().split('T')[0];
        todayList = tasksRes.data.filter((t: any) => t.dueDate && t.dueDate.startsWith(todayStr));
        tasksToday = todayList.length;
        tasksCompleted = todayList.filter((t: any) => t.status === 'COMPLETED').length;
        setTodayTasks(todayList);
      }

      let inventoryCount = 0;
      let inventoryAlerts = 0;
      if (inventoryRes.success) {
        inventoryCount = inventoryRes.data.length;
        inventoryAlerts = inventoryRes.data.filter((m: any) => m.quantity <= m.minQuantityAlert).length;
      }

      setStats({ boardsCount, tasksToday, tasksCompleted, inventoryCount, inventoryAlerts });



    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Đang tải tổng quan...</div>;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.welcomeSection}>
        <div className={styles.welcomeTitle}>Xin chào, {userName}</div>
        <div className={styles.welcomeSubtitle}>Chúc bạn có một ngày làm việc hiệu quả.</div>
      </div>

      {/* Top Grid */}
      <div className={styles.topGrid}>
        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <div className={styles.statIconWrapper} style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                <LayoutDashboard size={20} />
              </div>
              <div className={styles.statTitle}>Số bảng canh tác</div>
            </div>
            <div>
              <div className={styles.statValue}>{stats.boardsCount}</div>
              <div className={styles.statSubtext} style={{ color: '#16a34a' }}>+2 từ tháng trước</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <div className={styles.statIconWrapper} style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
                <ClipboardCheck size={20} />
              </div>
              <div className={styles.statTitle}>Công việc hôm nay</div>
            </div>
            <div>
              <div className={styles.statValue}>{stats.tasksToday}</div>
              <div className={styles.statSubtext} style={{ color: '#64748b' }}>{stats.tasksCompleted} việc đã hoàn thành</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <div className={styles.statIconWrapper} style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                <Package size={20} />
              </div>
              <div className={styles.statTitle}>Vật tư tồn kho</div>
            </div>
            <div>
              <div className={styles.statValue}>{stats.inventoryCount}</div>
              <div className={styles.statSubtext} style={{ color: stats.inventoryAlerts > 0 ? '#ef4444' : '#64748b' }}>
                {stats.inventoryAlerts > 0 ? `${stats.inventoryAlerts} loại sắp hết hàng` : 'Đủ vật tư'}
              </div>
            </div>
          </div>

        </div>

        {/* Weather Card */}
        <div className={styles.weatherCard}>
          <div>
            <div className={styles.weatherTitle}>Thời tiết hiện tại</div>
            <div className={styles.weatherLocation}>Hà Nội, Việt Nam</div>
            
            <div className={styles.weatherTempWrapper}>
              <div className={styles.weatherTemp}>
                {weather.temp} <span style={{ fontSize: '20px', fontWeight: 500 }}>
                  {weather.condition}
                </span>
              </div>
              {weather.icon.includes('sun') || weather.icon.includes('clear') ? <Sun size={48} color="white" /> :
               weather.icon.includes('rain') || weather.icon.includes('drizzle') || weather.icon.includes('shower') ? <CloudRain size={48} color="white" /> :
               weather.icon.includes('partly') ? <CloudSun size={48} color="white" /> :
               <Cloud size={48} color="white" />}
            </div>

            <div className={styles.weatherDetails}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Droplets size={14} /> Độ ẩm: {weather.humidity}%
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wind size={14} /> Gió: {weather.wind} km/h
              </div>
            </div>
          </div>

          <div className={styles.weatherHourly}>
            {weather.hourly.length > 0 ? (
              weather.hourly.map((h, i) => (
                <div key={i} className={styles.hourlyItem}>
                  <span>{h.time}</span>
                  <strong>{h.temp}°</strong>
                </div>
              ))
            ) : (
              <div className={styles.hourlyItem}>Đang tải...</div>
            )}
          </div>
        </div>
      </div>

      {/* Middle Grid */}
      <div className={styles.middleGrid}>
        {/* Left Column */}
        <div>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>Bảng canh tác gần đây</div>
            <div className={styles.viewAllLink} onClick={() => router.push('/diary')}>Xem tất cả <ArrowRight size={14} /></div>
          </div>

          <div className={styles.boardCards}>
            {recentBoards.map(board => (
              <div key={board._id} className={styles.boardCard}>
                <div className={styles.boardHeader}>
                  <div className={styles.boardIcon}>
                    <LayoutDashboard size={20} />
                  </div>
                  <div className={styles.boardBadge} style={{ 
                    backgroundColor: board.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                    color: board.status === 'ACTIVE' ? '#15803d' : '#b91c1c'
                  }}>
                    {board.status === 'ACTIVE' ? 'Đang chăm sóc' : board.status === 'HARVESTED' ? 'Đã thu hoạch' : 'Đã hủy'}
                  </div>
                </div>
                <div className={styles.boardTitle}>{board.name}</div>
                <div className={styles.boardDate}>Ngày tạo: {format(new Date(board.createdAt), 'dd/MM/yyyy')}</div>
                <div className={styles.boardFooter}>
                  <div className={styles.boardAvatars}>
                    <div className={styles.avatar}></div>
                    <div className={styles.avatar}></div>
                  </div>
                  <button className={styles.openBoardBtn} onClick={() => router.push(`/diary/cultivation/${board._id}`)}>Mở bảng</button>
                </div>
              </div>
            ))}
            {recentBoards.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', width: '100%', background: 'white', borderRadius: '16px' }}>
                Chưa có bảng canh tác nào
              </div>
            )}
          </div>

          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>Hoạt động canh tác mới nhất</div>
          </div>

          <div className={styles.timelineCard}>
            {recentEntries.length > 0 ? recentEntries.map((entry, idx) => (
              <div key={entry._id} className={styles.timelineItem}>
                <div className={styles.timelineLine}></div>
                <div className={styles.timelineDot} style={{ backgroundColor: idx === 0 ? '#16a34a' : idx === 1 ? '#3b82f6' : '#ea580c' }}></div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineTime}>{format(new Date(entry.date), 'dd/MM/yyyy')}</div>
                  <div className={styles.timelineTitle}>{entry.activityName} cho <span>{entry.boardName}</span></div>
                  <div className={styles.timelineSubtitle}>Người thực hiện: {entry.performer || 'Chưa cập nhật'}</div>
                </div>
              </div>
            )) : (
              <div style={{ color: '#64748b', textAlign: 'center' }}>Chưa có hoạt động nào được ghi lại.</div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>Công việc hôm nay</div>
            <div className={styles.boardBadge} style={{ backgroundColor: '#15803d', color: 'white' }}>
              {stats.tasksCompleted}/{stats.tasksToday} Xong
            </div>
          </div>

          <div className={styles.tasksList}>
            {todayTasks.length > 0 ? todayTasks.map(task => (
              <div key={task._id} className={styles.taskCard}>
                <div className={`${styles.taskCheckbox} ${task.status === 'COMPLETED' ? styles.completed : ''}`}>
                  {task.status === 'COMPLETED' && <Check size={14} />}
                </div>
                <div className={styles.taskInfo}>
                  <div className={styles.taskName}>{task.title}</div>
                  <div className={styles.taskTime}>{task.notes || 'Không có ghi chú'}</div>
                </div>
              </div>
            )) : (
              <div className={styles.taskCard}>
                <div className={styles.taskInfo}>
                  <div className={styles.taskName} style={{ color: '#64748b' }}>Không có công việc nào hôm nay</div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Floating Add Button */}
      <div className={styles.fabContainer}>
        {showQuickAdd && (
          <div className={styles.quickAddMenu}>
            <button className={styles.quickAddItem} onClick={() => router.push('/diary')}>
              <Leaf size={18} />
              <span>Nhật ký Canh tác</span>
            </button>
            <button className={styles.quickAddItem} onClick={() => router.push('/tasks')}>
              <Calendar size={18} />
              <span>Công việc mới</span>
            </button>
            <button className={styles.quickAddItem} onClick={() => router.push('/inventory')}>
              <Package size={18} />
              <span>Nhập vật tư</span>
            </button>
          </div>
        )}
        <button 
          className={styles.floatingAddBtn} 
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          style={{ transform: showQuickAdd ? 'rotate(45deg)' : 'none' }}
        >
          <Plus size={28} />
        </button>
      </div>

    </div>
  );
}
