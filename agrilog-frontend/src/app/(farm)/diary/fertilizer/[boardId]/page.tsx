'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/diaryDetail.module.css';
import { Trash2, Edit2, Calendar, FileText, FlaskConical } from 'lucide-react';
import { format } from 'date-fns';

export default function FertilizerDetailPage() {
  const params = useParams();
  const [board, setBoard] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    materialId: '',
    quantity: '',
    unit: 'kg',
    notes: '',
  });

  const loadData = async () => {
    try {
      const [boardRes, entriesRes, materialsRes] = await Promise.all([
        fetchAPI(`/fertilizer-boards/${params.boardId}`),
        fetchAPI(`/fertilizer-boards/${params.boardId}/entries`),
        fetchAPI('/materials')
      ]);
      if (boardRes.success) setBoard(boardRes.data);
      if (entriesRes.success) setEntries(entriesRes.data);
      if (materialsRes.success) setMaterials(materialsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [params.boardId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let selectedMaterialName = undefined;

      if (formData.materialId) {
        const mat = materials.find((m: any) => m._id === formData.materialId);
        if (mat) selectedMaterialName = mat.name;
      }

      const res = await fetchAPI(`/fertilizer-boards/${params.boardId}/entries`, {
        method: 'POST',
        body: JSON.stringify({
          date: new Date().toISOString(),
          material: formData.materialId,
          materialName: selectedMaterialName,
          quantity: Number(formData.quantity),
          unit: formData.unit,
          notes: formData.notes,
        }),
      });

      if (res.success) {
        setFormData({ ...formData, materialId: '', quantity: '', notes: '' });
        loadData();
      }
    } catch (error) {
      alert('Lỗi thêm nhật ký');
    }
  };
  
  const handleDelete = async (entryId: string) => {
    if(!confirm('Bạn có chắc muốn xóa bản ghi này?')) return;
    try {
      const res = await fetchAPI(`/fertilizer-boards/entries/${entryId}`, { method: 'DELETE' });
      if (res.success) loadData();
    } catch (error) {
      alert('Lỗi xóa bản ghi');
    }
  };

  if (loading) return <div>Đang tải dữ liệu bảng phân bón...</div>;
  if (!board) return <div>Không tìm thấy bảng phân bón</div>;

  const availableMaterials = materials.filter(m => m.type === 'FERTILIZER');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}><FlaskConical size={24} color="#3b82f6" /> {board.name}</h1>
          <p className={styles.subtitle}>Cây trồng: <strong>{board.cropType}</strong> | Diện tích: <strong>{board.areaSqm} m²</strong> | Ngày tạo: {format(new Date(board.startDate), 'dd/MM/yyyy')}</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.formCard}>
          <h2 className={styles.formCardTitle}>Thêm mới Nhật ký Bón phân</h2>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Ngày thực hiện</label>
              <input type="date" name="date" className={styles.input} value={formData.date} onChange={handleInputChange} required />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tên Phân bón</label>
              <select name="materialId" className={styles.input} value={formData.materialId} onChange={handleInputChange} required>
                <option value="">-- Chọn vật tư --</option>
                {availableMaterials.map(m => (
                  <option key={m._id} value={m._id}>{m.name} (Tồn: {m.quantity} {m.unit})</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label className={styles.label}>Số lượng dùng</label>
                <input type="number" name="quantity" className={styles.input} value={formData.quantity} onChange={handleInputChange} required />
              </div>
              <div className={styles.formGroup} style={{ width: '80px' }}>
                <label className={styles.label}>Đơn vị</label>
                <select name="unit" className={styles.input} value={formData.unit} onChange={handleInputChange}>
                  <option value="kg">kg</option>
                  <option value="lit">lít</option>
                  <option value="ml">ml</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Ghi chú thêm</label>
              <textarea name="notes" className={styles.input} rows={2} value={formData.notes} onChange={handleInputChange}></textarea>
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
                  <th>Phân bón</th>
                  <th>Số lượng</th>
                  <th>Ghi chú</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry._id}>
                    <td>{format(new Date(entry.date), 'dd/MM/yyyy HH:mm')}</td>
                    <td style={{ color: '#3b82f6', fontWeight: 600 }}>{entry.materialName}</td>
                    <td>{entry.quantity} {entry.unit}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{entry.notes || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className={styles.actionBtn} onClick={() => handleDelete(entry._id)}>
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
