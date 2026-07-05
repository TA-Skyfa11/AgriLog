/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/diaryDetail.module.css';

export default function DiaryDetailPage() {
  const { boardId } = useParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [board, setBoard] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [entries, setEntries] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
        fetchAPI(`/boards/${boardId}`),
        fetchAPI(`/boards/${boardId}/diary`),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let selectedMaterialName = undefined;
      let selectedMaterialId = undefined;

      if (activeTab !== 'ACTIVITY' && formData.materialId) {
        selectedMaterialId = formData.materialId;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mat = materials.find((m: any) => m._id === formData.materialId);
        if (mat) selectedMaterialName = mat.name;
      }

      const res = await fetchAPI(`/boards/${boardId}/diary`, {
        method: 'POST',
        body: JSON.stringify({
          type: activeTab,
          date: formData.date,
          activityName: activeTab === 'ACTIVITY' ? formData.activityName : undefined,
          material: selectedMaterialId,
          materialName: selectedMaterialName,
          quantity: activeTab !== 'ACTIVITY' ? Number(formData.quantity) : undefined,
          unit: activeTab !== 'ACTIVITY' ? formData.unit : undefined,
          phiDays: activeTab === 'PESTICIDE' ? Number(formData.phiDays) : undefined,
          notes: formData.notes,
        }),
      });

      if (res.success) {
        setFormData({ ...formData, activityName: '', materialId: '', quantity: '', phiDays: '', notes: '' });
        loadData();
      }
    } catch (error) {
      alert('Lỗi thêm nhật ký');
    }
  };

  if (loading) return <div>Đang tải dữ liệu bảng canh tác...</div>;
  if (!board) return <div>Không tìm thấy bảng canh tác</div>;

  const filteredEntries = entries.filter(e => e.type === activeTab);
  const availableMaterials = materials.filter(m => m.type === activeTab);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{board.name}</h1>
          <p className={styles.subtitle}>Cây trồng: {board.cropType} | Diện tích: {board.areaSqm} m²</p>
        </div>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'ACTIVITY' ? styles.active : ''}`}
          onClick={() => setActiveTab('ACTIVITY')}
        >Nhật ký Canh tác</button>
        <button 
          className={`${styles.tab} ${activeTab === 'FERTILIZER' ? styles.active : ''}`}
          onClick={() => setActiveTab('FERTILIZER')}
        >Nhật ký Phân bón</button>
        <button 
          className={`${styles.tab} ${activeTab === 'PESTICIDE' ? styles.active : ''}`}
          onClick={() => setActiveTab('PESTICIDE')}
        >Nhật ký Thuốc BVTV</button>
      </div>

      <div className={styles.content}>
        <div className={styles.formCard}>
          <h2 className={styles.formCardTitle}>
            Thêm mới {activeTab === 'ACTIVITY' ? 'Canh tác' : activeTab === 'FERTILIZER' ? 'Phân bón' : 'Thuốc BVTV'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Ngày thực hiện</label>
              <input type="date" name="date" className={styles.input} value={formData.date} onChange={handleInputChange} required />
            </div>

            {activeTab === 'ACTIVITY' && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Tên công việc</label>
                <input type="text" name="activityName" className={styles.input} placeholder="VD: Làm đất, tưới nước..." value={formData.activityName} onChange={handleInputChange} required />
              </div>
            )}

            {activeTab !== 'ACTIVITY' && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Tên {activeTab === 'FERTILIZER' ? 'Phân bón' : 'Thuốc'} từ Kho</label>
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
                      <option value="lit">lit</option>
                      <option value="ml">ml</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'PESTICIDE' && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Thời gian cách ly (PHI) - ngày</label>
                <input type="number" name="phiDays" className={styles.input} value={formData.phiDays} onChange={handleInputChange} required />
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>Ghi chú</label>
              <textarea name="notes" className={styles.input} rows={3} value={formData.notes} onChange={handleInputChange}></textarea>
            </div>

            <button type="submit" className={styles.button}>Thêm bản ghi</button>
          </form>
        </div>

        <div className={styles.list}>
          {filteredEntries.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
              Chưa có bản ghi nào.
            </div>
          ) : (
            filteredEntries.map(entry => (
              <div key={entry._id} className={styles.entryCard}>
                <div className={styles.entryHeader}>
                  <span className={styles.entryDate}>{new Date(entry.date).toLocaleDateString('vi-VN')}</span>
                  <span className={`${styles.entryType} ${styles[`type${entry.type}`]}`}>
                    {entry.type === 'ACTIVITY' ? 'Canh tác' : entry.type === 'FERTILIZER' ? 'Phân bón' : 'Thuốc BVTV'}
                  </span>
                </div>
                <div className={styles.entryBody}>
                  {entry.type === 'ACTIVITY' && <p><strong>Công việc:</strong> {entry.activityName}</p>}
                  {entry.type !== 'ACTIVITY' && (
                    <p><strong>Vật tư:</strong> {entry.materialName} ({entry.quantity} {entry.unit})</p>
                  )}
                  {entry.type === 'PESTICIDE' && <p><strong>Cách ly (PHI):</strong> {entry.phiDays} ngày</p>}
                  {entry.notes && <p style={{ marginTop: '0.5rem', color: 'var(--color-text-muted)' }}><em>Ghi chú: {entry.notes}</em></p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
