'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/tasks.module.css';
import { Plus, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    dueDate: new Date().toISOString().split('T')[0],
    notes: '',
    priority: 'MEDIUM'
  });

  const loadTasks = async () => {
    try {
      const res = await fetchAPI('/tasks');
      if (res.success) setTasks(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchAPI('/tasks', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (res.success) {
        setFormData({ title: '', dueDate: new Date().toISOString().split('T')[0], notes: '', priority: 'MEDIUM' });
        setShowModal(false);
        loadTasks();
      }
    } catch (error) {
      alert('Lỗi thêm công việc');
    }
  };

  const markComplete = async (id: string) => {
    try {
      const res = await fetchAPI(`/tasks/${id}/complete`, { method: 'PUT' });
      if (res.success) loadTasks();
    } catch (error) {
      alert('Lỗi cập nhật');
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Calendar rendering logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      
      // Find tasks for this day
      const dayTasks = tasks.filter(t => isSameDay(parseISO(t.dueDate), cloneDay));

      days.push(
        <div 
          className={`${styles.dayCell} ${!isSameMonth(day, monthStart) ? styles.otherMonth : ''} ${isSameDay(day, new Date()) ? styles.today : ''}`} 
          key={day.toString()}
        >
          <span className={styles.dayNumber}>{formattedDate}</span>
          {dayTasks.map(t => (
            <div key={t._id} className={`${styles.taskPill} ${styles[t.priority ? t.priority.toLowerCase() : 'medium']}`}>
              {t.title}
            </div>
          ))}
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <React.Fragment key={day.toString()}>
        {days}
      </React.Fragment>
    );
    days = [];
  }

  const upcomingTasks = tasks
    .filter(t => t.status === 'PENDING')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  if (loading) return <div>Đang tải danh sách công việc...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Lịch công việc</h1>
          <div className={styles.subtitle}>Quản lý và phân công công việc theo ngày</div>
        </div>
        <button className={styles.button} onClick={() => setShowModal(true)}>
          <Plus size={18} /> Thêm công việc
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.calendarCard}>
          <div className={styles.calendarHeader}>
            <button className={styles.navBtn} onClick={prevMonth}><ChevronLeft size={20} /></button>
            <div className={styles.monthTitle}>
              {format(currentDate, 'MMMM yyyy', { locale: vi }).replace(/^\w/, c => c.toUpperCase())}
            </div>
            <button className={styles.navBtn} onClick={nextMonth}><ChevronRight size={20} /></button>
          </div>
          
          <div className={styles.calendarGrid}>
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
              <div key={d} className={styles.weekday}>{d}</div>
            ))}
            {rows}
          </div>
        </div>

        <div className={styles.upcomingCard}>
          <h2 className={styles.upcomingTitle}>Công việc sắp tới</h2>
          <div className={styles.taskList}>
            {upcomingTasks.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Không có công việc nào sắp tới.</div>
            ) : (
              upcomingTasks.map(t => (
                <div key={t._id} className={styles.taskItem}>
                  <div className={styles.taskItemLeft}>
                    <div className={styles.taskItemTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="checkbox" 
                        title="Đánh dấu hoàn thành"
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        onChange={() => markComplete(t._id)}
                      />
                      {t.title}
                    </div>
                    <div className={styles.taskItemAssignee}>Người thực hiện: Nông trại</div>
                    <div className={styles.taskItemDate}>
                      <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {format(parseISO(t.dueDate), 'dd/MM/yyyy')}
                    </div>
                  </div>
                  <div className={`${styles.priorityTag} ${styles[t.priority ? t.priority.toLowerCase() : 'medium']}`}>
                    {t.priority === 'HIGH' ? 'Cao' : t.priority === 'LOW' ? 'Thấp' : 'TB'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Thêm công việc mới</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Tên công việc</label>
                <input type="text" name="title" className={styles.input} required value={formData.title} onChange={handleInputChange} placeholder="VD: Bón phân thúc, Phun thuốc..." />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>Ngày thực hiện</label>
                  <input type="date" name="dueDate" className={styles.input} required value={formData.dueDate} onChange={handleInputChange} />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>Mức độ ưu tiên</label>
                  <select name="priority" className={styles.input} value={formData.priority} onChange={handleInputChange}>
                    <option value="LOW">Thấp</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HIGH">Cao</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Ghi chú thêm</label>
                <textarea name="notes" className={styles.input} rows={3} value={formData.notes} onChange={handleInputChange} placeholder="Nhập ghi chú..."></textarea>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className={styles.button}>Thêm công việc</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
