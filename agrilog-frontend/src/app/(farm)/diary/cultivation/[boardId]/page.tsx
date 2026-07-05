'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import styles from './diaryDetail.module.css';
import { Trash2, Edit2, Calendar, FileText, Beaker } from 'lucide-react';
import { format } from 'date-fns';

export default function DiaryDetailPage() {
  const { boardId } = useParams();
  const [board, setBoard] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Decide default tab based on board type
  const [activeTab, setActiveTab] = useState<'ACTIVITY' | 'FERTILIZER' | 'PESTICIDE'>('ACTIVITY');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    activityName: '',
    materialId: '',
    quantity: '',
    unit: 'kg',
    phiDays: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      const [boardRes, entriesRes, materialsRes] = await Promise.all([
  const loadBoardData = async () => {
    try {
      const boardRes = await fetchAPI(`/cultivation-boards/${params.boardId}`);
      if (boardRes.success) {
        setBoard(boardRes.data);
      }

      const entriesRes = await fetchAPI(`/cultivation-boards/${params.boardId}/entries`);
      if (entriesRes.success) {
        setEntries(entriesRes.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoardData();
  }, [params.boardId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchAPI(`/cultivation-boards/${params.boardId}/entries`, {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          date: new Date().toISOString(),
          type: 'ACTIVITY'
        }),
      });

      if (res.success) {
        setFormData({ activityName: '', notes: '' });
        loadBoardData();
      }
    } catch (error) {
      alert('Lỗi thêm nhật ký');
    }
  };
  
  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) return;
    try {
      const res = await fetchAPI(`/cultivation-boards/entries/${id}`, { method: 'DELETE' });
      if (res.success) {
        loadBoardData();
      }
    } catch (error) {
      alert('Lỗi xóa bản ghi');
    }
  };

  if (loading) return <div>Đang tải dữ liệu bảng canh tác...</div>;
  if (!board) return <div>Không tìm thấy bảng canh tác</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><FileText size={24} color="#16a34a" /> {board.name}</h1>
          <p className={styles.subtitle}>Cây trồng: <strong>{board.cropType}</strong> | Diện tích: <strong>{board.areaSqm} m²</strong> | Ngày tạo: {format(new Date(board.startDate), 'dd/MM/yyyy')}</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.formCard}>
          <h2 className={styles.formCardTitle}>
            Thêm mới Nhật ký
          </h2>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tên hoạt động *</label>
              <input 
                type="text" 
                className={styles.input} 
                required 
                value={formData.activityName} 
                onChange={(e) => setFormData({...formData, activityName: e.target.value})}
                placeholder="VD: Làm cỏ, tưới nước..."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Ghi chú thêm</label>
              <textarea name="notes" className={styles.input} rows={2} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}></textarea>
            </div>

            <button type="submit" className={styles.button}>Thêm bản ghi</button>
          </form>
        </div>

        <div className={styles.list}>
          {entries.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Chưa có bản ghi nào trong mục này.
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Hoạt động</th>
                  <th>Ghi chú</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry._id}>
                    <td style={{ fontWeight: 600 }}>{format(new Date(entry.date), 'dd/MM/yyyy HH:mm')}</td>
                    <td style={{ color: 'var(--color-primary-600)', fontWeight: 600 }}>{entry.activityName}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{entry.notes || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className={styles.actionBtn} onClick={() => handleDeleteEntry(entry._id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
