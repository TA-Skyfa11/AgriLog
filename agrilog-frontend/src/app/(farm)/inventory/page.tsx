/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/inventory.module.css';

export default function InventoryPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'FERTILIZER',
    quantity: '',
    unit: 'kg',
    supplier: '',
  });

  const loadInventory = async () => {
    try {
      const res = await fetchAPI('/materials');
      if (res.success) setMaterials(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchAPI('/materials', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (res.success) {
        setShowModal(false);
        setFormData({ name: '', type: 'FERTILIZER', quantity: '', unit: 'kg', supplier: '' });
        loadInventory();
      }
    } catch (error) {
      alert('Lỗi nhập kho');
    }
  };

  if (loading) return <div>Đang tải dữ liệu kho...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Quản lý Kho Vật Tư</h1>
        <button className={styles.button} onClick={() => setShowModal(true)}>+ Nhập kho</button>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tên vật tư</th>
              <th>Loại</th>
              <th>Tồn kho</th>
              <th>Đơn vị</th>
              <th>Cảnh báo</th>
            </tr>
          </thead>
          <tbody>
            {materials.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Kho đang trống</td>
              </tr>
            ) : (
              materials.map((m) => (
                <tr key={m._id}>
                  <td style={{ fontWeight: 500 }}>{m.name}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[`type${m.type}`]}`}>
                      {m.type === 'FERTILIZER' ? 'Phân bón' : 'Thuốc BVTV'}
                    </span>
                  </td>
                  <td className={m.quantity <= m.minQuantityAlert ? styles.warningText : ''}>{m.quantity}</td>
                  <td>{m.unit}</td>
                  <td>
                    {m.quantity <= m.minQuantityAlert ? <span className={styles.warningText}>Sắp hết</span> : <span style={{color: 'var(--color-success)'}}>Bình thường</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Nhập kho vật tư</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Loại vật tư</label>
                <select name="type" className={styles.input} value={formData.type} onChange={handleInputChange}>
                  <option value="FERTILIZER">Phân bón</option>
                  <option value="PESTICIDE">Thuốc BVTV</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Tên vật tư</label>
                <input type="text" name="name" className={styles.input} required value={formData.name} onChange={handleInputChange} />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>Số lượng nhập</label>
                  <input type="number" name="quantity" className={styles.input} required value={formData.quantity} onChange={handleInputChange} />
                </div>
                <div className={styles.formGroup} style={{ width: '100px' }}>
                  <label className={styles.label}>Đơn vị</label>
                  <input type="text" name="unit" className={styles.input} required value={formData.unit} onChange={handleInputChange} placeholder="kg, lit..." />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Nhà cung cấp (Tuỳ chọn)</label>
                <input type="text" name="supplier" className={styles.input} value={formData.supplier} onChange={handleInputChange} />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className={styles.button}>Xác nhận nhập kho</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

