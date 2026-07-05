/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import styles from './tasks.module.css';

export default function TasksPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    dueDate: new Date().toISOString().split('T')[0],
    notes: '',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        setFormData({ title: '', dueDate: new Date().toISOString().split('T')[0], notes: '' });
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

  if (loading) return <div>Đang tải danh sách công việc...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Lịch Công Việc</h1>
      </div>

      <div className={styles.taskGrid}>
        <div className={styles.formCard}>
          <h2 className={styles.formCardTitle}>Thêm công việc mới</h2>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tên công việc</label>
              <input type="text" name="title" className={styles.input} required value={formData.title} onChange={handleInputChange} placeholder="VD: Bón phân thúc, Phun thuốc..." />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Ngày thực hiện</label>
              <input type="date" name="dueDate" className={styles.input} required value={formData.dueDate} onChange={handleInputChange} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Ghi chú</label>
              <textarea name="notes" className={styles.input} rows={3} value={formData.notes} onChange={handleInputChange}></textarea>
            </div>
            <button type="submit" className={styles.button} style={{ width: '100%' }}>Thêm công việc</button>
          </form>
        </div>

        <div className={styles.list}>
          {tasks.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
              Chưa có công việc nào.
            </div>
          ) : (
            tasks.map(task => (
              <div key={task._id} className={styles.taskCard}>
                <div className={styles.taskInfo}>
                  <div className={styles.taskTitle}>{task.title}</div>
                  <div className={styles.taskDate}>
                    Ngày đến hạn: {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                    <span className={`${styles.badge} ${task.status === 'COMPLETED' ? styles.badgeCompleted : styles.badgePending}`} style={{ marginLeft: '1rem' }}>
                      {task.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Chờ thực hiện'}
                    </span>
                  </div>
                  {task.notes && <div className={styles.taskNotes}>{task.notes}</div>}
                </div>
                {task.status === 'PENDING' && (
                  <button className={styles.completeBtn} onClick={() => markComplete(task._id)}>
                    Đánh dấu Hoàn thành
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

