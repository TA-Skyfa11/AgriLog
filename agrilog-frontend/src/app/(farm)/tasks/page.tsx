/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/tasks.module.css';
import { Plus, ChevronLeft, ChevronRight, Clock, Repeat, CheckCircle2, Circle, Trash2, X, AlertCircle, Calendar } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    dueDate: new Date().toISOString().split('T')[0],
    notes: '',
    priority: 'MEDIUM',
    recurrence: 'NONE',
    recurrenceCustomDays: 3,
    recurrenceEndDate: '',
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
    const { name, value } = e.target;
    
    if (name === 'recurrence' && value !== 'NONE' && !formData.recurrenceEndDate) {
      // Pre-fill end date with 3 months from due date
      const base = formData.dueDate ? parseISO(formData.dueDate) : new Date();
      const threeMonthsLater = addMonths(base, 3).toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, [name]: value, recurrenceEndDate: threeMonthsLater }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      const res = await fetchAPI('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          recurrenceCustomDays: formData.recurrence === 'CUSTOM' ? Number(formData.recurrenceCustomDays) || 3 : undefined,
          recurrenceEndDate: formData.recurrence !== 'NONE' ? formData.recurrenceEndDate : undefined,
        }),
      });

      if (res.success) {
        toast.success(formData.recurrence !== 'NONE' ? 'Đã thêm công việc và tạo chuỗi lặp lại thành công!' : 'Đã thêm công việc thành công!');
        setFormData({
          title: '',
          dueDate: new Date().toISOString().split('T')[0],
          notes: '',
          priority: 'MEDIUM',
          recurrence: 'NONE',
          recurrenceCustomDays: 3,
          recurrenceEndDate: '',
        });
        setShowModal(false);
        loadTasks();
      } else {
        toast.error(res.message || 'Lỗi thêm công việc');
      }
    } catch (error: any) {
      toast.error('Lỗi thêm công việc: ' + (error.message || ''));
    }
  };

  const toggleComplete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetchAPI(`/tasks/${id}/complete`, { method: 'PUT' });
      if (res.success) {
        toast.success(res.data.status === 'COMPLETED' ? 'Đã hoàn thành công việc!' : 'Đã chuyển thành chưa hoàn thành');
        loadTasks();
        if (selectedTask && selectedTask._id === id) {
          setSelectedTask(res.data);
        }
      }
    } catch (error) {
      toast.error('Lỗi cập nhật trạng thái');
    }
  };

  const handleDeleteTask = async (task: any, deleteSeries: boolean = false) => {
    try {
      const url = deleteSeries ? `/tasks/${task._id}?deleteSeries=true` : `/tasks/${task._id}`;
      const res = await fetchAPI(url, { method: 'DELETE' });
      if (res.success) {
        toast.success(deleteSeries ? 'Đã xóa toàn bộ chuỗi công việc lặp lại' : 'Đã xóa công việc');
        setSelectedTask(null);
        setShowDeletePrompt(false);
        loadTasks();
      } else {
        toast.error(res.message || 'Lỗi khi xóa');
      }
    } catch (error) {
      toast.error('Lỗi khi xóa công việc');
    }
  };

  const isRecurring = (t: any) => {
    return (t.recurrence && t.recurrence !== 'NONE') || !!t.parentTaskId;
  };

  const getRecurrenceLabel = (t: any) => {
    if (t.recurrence === 'WEEKLY') return 'Lặp lại hàng tuần';
    if (t.recurrence === 'MONTHLY') return 'Lặp lại hàng tháng';
    if (t.recurrence === 'CUSTOM') return `Lặp lại mỗi ${t.recurrenceCustomDays || 3} ngày`;
    if (t.parentTaskId) return 'Công việc lặp lại trong chuỗi';
    return 'Không lặp lại';
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
          {dayTasks.map(t => {
            const recurring = isRecurring(t);
            return (
              <div 
                key={t._id} 
                className={`${styles.taskPill} ${styles[t.priority ? t.priority.toLowerCase() : 'medium']}`}
                onClick={() => {
                  setSelectedTask(t);
                  setShowDeletePrompt(false);
                }}
                title={t.title + (recurring ? ' (Lặp lại)' : '')}
                style={{ textDecoration: t.status === 'COMPLETED' ? 'line-through' : 'none', opacity: t.status === 'COMPLETED' ? 0.6 : 1 }}
              >
                <div className={styles.taskPillContent}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</span>
                  {recurring && <Repeat size={10} style={{ flexShrink: 0, opacity: 0.8 }} />}
                </div>
              </div>
            );
          })}
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
    .slice(0, 7);

  if (loading) return <div style={{ padding: '2rem' }}>Đang tải danh sách công việc...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Lịch công việc</h1>
          <div className={styles.subtitle}>Quản lý và lập kế hoạch công việc canh tác định kỳ</div>
        </div>
        <button className={styles.button} onClick={() => setShowModal(true)}>
          <Plus size={18} /> Thêm công việc
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.calendarCard}>
          <div className={styles.calendarHeader}>
            <button className={styles.navBtn} onClick={prevMonth} title="Tháng trước"><ChevronLeft size={20} /></button>
            <div className={styles.monthTitle}>
              {format(currentDate, 'MMMM yyyy', { locale: vi }).replace(/^\w/, c => c.toUpperCase())}
            </div>
            <button className={styles.navBtn} onClick={nextMonth} title="Tháng sau"><ChevronRight size={20} /></button>
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
              upcomingTasks.map(t => {
                const recurring = isRecurring(t);
                return (
                  <div 
                    key={t._id} 
                    className={styles.taskItem}
                    onClick={() => {
                      setSelectedTask(t);
                      setShowDeletePrompt(false);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.taskItemLeft}>
                      <div className={styles.taskItemTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div 
                          onClick={(e) => toggleComplete(t._id, e)}
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: t.status === 'COMPLETED' ? '#16a34a' : '#9ca3af' }}
                          title={t.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                        >
                          {t.status === 'COMPLETED' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                        </div>
                        <span style={{ textDecoration: t.status === 'COMPLETED' ? 'line-through' : 'none' }}>
                          {t.title}
                        </span>
                        {recurring && (
                          <span className={styles.repeatBadge} title={getRecurrenceLabel(t)}>
                            <Repeat size={10} /> Lặp lại
                          </span>
                        )}
                      </div>
                      <div className={styles.taskItemDate}>
                        <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {format(parseISO(t.dueDate), 'dd/MM/yyyy')}
                      </div>
                    </div>
                    <div className={`${styles.priorityTag} ${styles[t.priority ? t.priority.toLowerCase() : 'medium']}`}>
                      {t.priority === 'HIGH' ? 'Cao' : t.priority === 'LOW' ? 'Thấp' : 'TB'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal Thêm công việc mới */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className={styles.modalTitle} style={{ margin: 0 }}>Thêm công việc mới</h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Tên công việc *</label>
                <input 
                  type="text" 
                  name="title" 
                  className={styles.input} 
                  required 
                  value={formData.title} 
                  onChange={handleInputChange} 
                  placeholder="VD: Bón phân thúc, Phun thuốc trừ sâu, Làm cỏ..." 
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>Ngày thực hiện *</label>
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

              {/* Phần lặp lại lịch công việc */}
              <div className={styles.formGroup}>
                <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Repeat size={15} color="#16a34a" /> Lặp lại lịch trình
                </label>
                <select name="recurrence" className={styles.input} value={formData.recurrence} onChange={handleInputChange}>
                  <option value="NONE">Không lặp lại (Chỉ một lần)</option>
                  <option value="WEEKLY">Hàng tuần (Mỗi tuần vào ngày này)</option>
                  <option value="MONTHLY">Hàng tháng (Mỗi tháng vào ngày này)</option>
                  <option value="CUSTOM">Tùy chỉnh khoảng thời gian (Sau mỗi X ngày)</option>
                </select>
              </div>

              {formData.recurrence !== 'NONE' && (
                <div className={styles.recurrenceBox}>
                  {formData.recurrence === 'CUSTOM' && (
                    <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                      <label className={styles.label}>Lặp lại sau mỗi (số ngày) *</label>
                      <input 
                        type="number" 
                        name="recurrenceCustomDays" 
                        className={styles.input} 
                        min="1" 
                        max="365"
                        value={formData.recurrenceCustomDays} 
                        onChange={handleInputChange} 
                        placeholder="VD: 3 (cứ 3 ngày lặp lại 1 lần)" 
                      />
                    </div>
                  )}

                  <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                    <label className={styles.label}>Kết thúc lặp lại vào ngày</label>
                    <input 
                      type="date" 
                      name="recurrenceEndDate" 
                      className={styles.input} 
                      value={formData.recurrenceEndDate} 
                      onChange={handleInputChange} 
                    />
                  </div>

                  <div className={styles.recurrenceInfo}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>
                      {formData.recurrence === 'WEEKLY' && 'Hệ thống sẽ tự động tạo công việc lặp lại mỗi 7 ngày cho đến ngày kết thúc.'}
                      {formData.recurrence === 'MONTHLY' && 'Hệ thống sẽ tự động tạo công việc vào ngày này mỗi tháng cho đến ngày kết thúc.'}
                      {formData.recurrence === 'CUSTOM' && `Hệ thống sẽ tự động tạo công việc sau mỗi ${formData.recurrenceCustomDays || 3} ngày cho đến ngày kết thúc.`}
                    </span>
                  </div>
                </div>
              )}

              <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                <label className={styles.label}>Ghi chú thêm</label>
                <textarea name="notes" className={styles.input} rows={2} value={formData.notes} onChange={handleInputChange} placeholder="Nhập ghi chú chi tiết..."></textarea>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className={styles.button}>Thêm công việc</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chi tiết / Thao tác Công việc */}
      {selectedTask && (
        <div className={styles.modalOverlay} onClick={() => { setSelectedTask(null); setShowDeletePrompt(false); }}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)' }}>
                  {selectedTask.title}
                </h2>
                <div style={{ marginTop: '0.25rem' }}>
                  {selectedTask.status === 'COMPLETED' ? (
                    <span className={styles.statusCompleted}><CheckCircle2 size={12} /> Đã hoàn thành</span>
                  ) : (
                    <span className={styles.statusPending}><Clock size={12} /> Chưa hoàn thành</span>
                  )}
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} onClick={() => { setSelectedTask(null); setShowDeletePrompt(false); }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '1rem 0', margin: '1rem 0' }}>
              <div className={styles.detailRow}>
                <div className={styles.detailLabel}><Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} /> Ngày thực hiện:</div>
                <div className={styles.detailValue}><strong>{format(parseISO(selectedTask.dueDate), 'dd/MM/yyyy')}</strong></div>
              </div>

              <div className={styles.detailRow}>
                <div className={styles.detailLabel}>Mức độ ưu tiên:</div>
                <div className={styles.detailValue}>
                  <span className={`${styles.priorityTag} ${styles[selectedTask.priority ? selectedTask.priority.toLowerCase() : 'medium']}`}>
                    {selectedTask.priority === 'HIGH' ? 'Cao' : selectedTask.priority === 'LOW' ? 'Thấp' : 'Trung bình'}
                  </span>
                </div>
              </div>

              <div className={styles.detailRow}>
                <div className={styles.detailLabel}><Repeat size={14} style={{ display: 'inline', marginRight: '6px' }} /> Tần suất lặp:</div>
                <div className={styles.detailValue}>
                  {isRecurring(selectedTask) ? (
                    <span style={{ color: 'var(--color-primary-700)', fontWeight: 600 }}>{getRecurrenceLabel(selectedTask)}</span>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)' }}>Không lặp lại</span>
                  )}
                </div>
              </div>

              {selectedTask.notes && (
                <div className={styles.detailRow} style={{ marginBottom: 0 }}>
                  <div className={styles.detailLabel}>Ghi chú:</div>
                  <div className={styles.detailValue}>{selectedTask.notes}</div>
                </div>
              )}
            </div>

            {/* Hộp thoại xác nhận xóa */}
            {showDeletePrompt ? (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '1rem', marginTop: '1rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#991b1b', marginBottom: '0.75rem' }}>
                  {isRecurring(selectedTask) ? 'Công việc này thuộc một chuỗi lặp lại. Bạn muốn xóa như thế nào?' : 'Bạn có chắc chắn muốn xóa công việc này không?'}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button type="button" className={styles.btnCancel} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => setShowDeletePrompt(false)}>
                    Hủy
                  </button>
                  <button type="button" className={styles.btnDelete} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => handleDeleteTask(selectedTask, false)}>
                    Chỉ xóa công việc này
                  </button>
                  {isRecurring(selectedTask) && (
                    <button type="button" className={styles.btnDeleteSeries} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => handleDeleteTask(selectedTask, true)}>
                      Xóa toàn bộ chuỗi lặp
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                <button type="button" className={styles.btnDelete} onClick={() => setShowDeletePrompt(true)}>
                  <Trash2 size={16} /> Xóa
                </button>

                <button 
                  type="button" 
                  className={selectedTask.status === 'COMPLETED' ? styles.btnCancel : styles.btnComplete}
                  onClick={() => toggleComplete(selectedTask._id)}
                >
                  {selectedTask.status === 'COMPLETED' ? (
                    <>Đánh dấu chưa xong</>
                  ) : (
                    <><CheckCircle2 size={16} /> Hoàn thành</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
