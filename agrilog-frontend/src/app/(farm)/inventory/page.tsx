/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/inventory.module.css';
import { Package, Search, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function InventoryPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'FERTILIZER',
    quantity: '',
    unit: 'kg',
    pricePerUnit: '',
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
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchAPI('/materials', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          quantity: Number(formData.quantity),
          pricePerUnit: Number(formData.pricePerUnit) || 0
        }),
      });

      if (res.success) {
        setShowModal(false);
        setFormData({ name: '', type: 'FERTILIZER', quantity: '', unit: 'kg', pricePerUnit: '', supplier: '' });
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
        <div className={styles.headerLeft}>
          <h1 className={styles.title}><Package size={24} color="#16a34a" /> Quản lý Kho vật tư</h1>
          <div className={styles.subtitle}>Theo dõi số lượng phân bón, thuốc BVTV và vật tư khác</div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.searchBar}>
            <Search size={18} color="#9ca3af" />
            <input type="text" placeholder="Tìm vật tư..." className={styles.searchInput} />
          </div>
          <button className={styles.button} onClick={() => setShowModal(true)}>
            <Plus size={18} /> Nhập kho
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tên vật tư</th>
              <th>Phân loại</th>
              <th>Tồn kho</th>
              <th>Đơn vị</th>
              <th>Đơn giá</th>
              <th>Tổng giá trị</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {materials.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  Kho đang trống. Vui lòng nhập thêm vật tư.
                </td>
              </tr>
            ) : (
              materials.map((m) => (
                <tr key={m._id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{m.name}</td>
                  <td>
                     <span className={`${styles.badge} ${styles[`type${m.type}`]}`}>
                      {m.type === 'FERTILIZER' ? 'Phân bón' : 'Thuốc BVTV'}
                    </span>
                  </td>
                  <td className={m.quantity <= m.minQuantityAlert ? styles.warningText : ''} style={{ fontWeight: 700 }}>
                    {m.quantity}
                  </td>
                  <td>{m.unit}</td>
                  <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(m.pricePerUnit || 0)}</td>
                  <td style={{ fontWeight: 600 }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((m.quantity || 0) * (m.pricePerUnit || 0))}</td>
                  <td>
                    {m.quantity <= m.minQuantityAlert ? (
                      <span className={styles.warningText} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <AlertCircle size={14} /> Sắp hết
                      </span>
                    ) : (
                      <span style={{color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                        <CheckCircle2 size={14} /> Bình thường
                      </span>
                    )}
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
            <h2 className={styles.modalTitle}>Nhập kho vật tư mới</h2>
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
                <input type="text" name="name" className={styles.input} required value={formData.name} onChange={handleInputChange} placeholder="VD: Phân Ure, Thuốc trừ sâu..." />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>Số lượng nhập</label>
                  <input type="number" name="quantity" className={styles.input} required value={formData.quantity} onChange={handleInputChange} placeholder="0" />
                </div>
                <div className={styles.formGroup} style={{ width: '100px' }}>
                  <label className={styles.label}>Đơn vị</label>
                  <input type="text" name="unit" className={styles.input} required value={formData.unit} onChange={handleInputChange} placeholder="kg, lít..." />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Đơn giá nhập (VNĐ)</label>
                <input type="number" name="pricePerUnit" className={styles.input} required value={formData.pricePerUnit} onChange={handleInputChange} placeholder="VD: 15000" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Nhà cung cấp (Tuỳ chọn)</label>
                <input type="text" name="supplier" className={styles.input} value={formData.supplier} onChange={handleInputChange} placeholder="VD: Đại lý Vật tư Nông nghiệp A" />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className={styles.button}>Xác nhận nhập</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
