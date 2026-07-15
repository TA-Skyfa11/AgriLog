/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/inventory.module.css';
import { Package, Search, Plus, AlertCircle, CheckCircle2, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDialog } from '@/context/DialogContext';

let hasShownStockAlert = false;

export default function InventoryPage() {
  const dialog = useDialog();

  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'FERTILIZER',
    quantity: '',
    unit: 'kg',
    expiryDate: '',
    supplier: '',
    manufacturer: '',
  });

  const loadInventory = async () => {
    try {
      const res = await fetchAPI('/materials');
      if (res.success) {
        setMaterials(res.data);
        const lowStockMaterials = res.data.filter((m: any) => m.quantity > 0 && m.quantity <= (m.minQuantityAlert || (m.type === 'FERTILIZER' ? 50 : 5)));
        const outOfStockMaterials = res.data.filter((m: any) => m.quantity <= 0);
        
        if (!hasShownStockAlert) {
          if (outOfStockMaterials.length > 0) {
            toast.error(`Có ${outOfStockMaterials.length} vật tư đã hết hàng trong kho! Vui lòng nhập thêm.`, { duration: 5000, id: 'out-of-stock-alert' });
          }
          if (lowStockMaterials.length > 0) {
            toast.custom((t) => (
              <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '4px solid #f59e0b' }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: '#374151' }}>Vật tư sắp hết!</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Có {lowStockMaterials.length} vật tư sắp hết. Hãy kiểm tra kho!</p>
                </div>
              </div>
            ), { duration: 5000, id: 'low-stock-alert' });
          }
          if (outOfStockMaterials.length > 0 || lowStockMaterials.length > 0) {
            hasShownStockAlert = true;
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'type') {
      const defaultUnit = value === 'FERTILIZER' ? 'kg' : 'ml';
      setFormData({ ...formData, [name]: value, unit: defaultUnit });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleEditClick = async (material: any) => {
    setFormData({
      name: material.name,
      type: material.type,
      quantity: material.quantity,
      unit: material.unit,
      expiryDate: material.expiryDate ? new Date(material.expiryDate).toISOString().split('T')[0] : '',
      supplier: material.supplier || '',
      manufacturer: material.manufacturer || '',
    });
    setEditingId(material._id);
    setShowModal(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (await dialog.confirm('Bạn có chắc chắn muốn xóa vật tư này? Toàn bộ dữ liệu liên quan có thể bị ảnh hưởng.')) {
      try {
        const res = await fetchAPI(`/materials/${id}`, { method: 'DELETE' });
        if (res.success) loadInventory();
      } catch (error) {
        toast.error('Lỗi xóa vật tư');
      }
    }
  };

  const handleCloseModal = async () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', type: 'FERTILIZER', quantity: '', unit: 'kg', expiryDate: '', supplier: '', manufacturer: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/materials/${editingId}` : '/materials';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetchAPI(url, {
        method: method,
        body: JSON.stringify({
          ...formData,
          quantity: Number(formData.quantity)
        }),
      });

      if (res.success) {
        handleCloseModal();
        loadInventory();
      }
    } catch (error) {
      toast.error(editingId ? 'Lỗi cập nhật' : 'Lỗi nhập kho');
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
          <button className={styles.button} onClick={() => {
            setEditingId(null);
            setFormData({ name: '', type: 'FERTILIZER', quantity: '', unit: 'kg', expiryDate: '', supplier: '', manufacturer: '' });
            setShowModal(true);
          }}>
            <Plus size={18} /> Nhập kho
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tên vật tư</th>
              <th>Nhà sản xuất</th>
              <th>Phân loại</th>
              <th>Tồn kho</th>
              <th>Đơn vị</th>
              <th>Hạn sử dụng</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {materials.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  Kho đang trống. Vui lòng nhập thêm vật tư.
                </td>
              </tr>
            ) : (
              materials.map((m) => (
                <tr key={m._id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{m.name}</td>
                  <td>{m.manufacturer || '—'}</td>
                  <td>
                     <span className={`${styles.badge} ${styles[`type${m.type}`]}`}>
                      {m.type === 'FERTILIZER' ? 'Phân bón' : 'Thuốc BVTV'}
                    </span>
                  </td>
                  <td className={m.quantity <= 0 ? styles.errorText : m.quantity <= (m.minQuantityAlert || (m.type === 'FERTILIZER' ? 50 : 5)) ? styles.warningText : ''} style={{ fontWeight: 700 }}>
                    {m.quantity}
                  </td>
                  <td>{m.unit}</td>
                  <td>{m.expiryDate ? new Date(m.expiryDate).toLocaleDateString('vi-VN') : '—'}</td>
                  <td>
                    {m.quantity <= 0 ? (
                      <span className={styles.errorText} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <AlertCircle size={14} /> Hết hàng
                      </span>
                    ) : m.quantity <= (m.minQuantityAlert || (m.type === 'FERTILIZER' ? 50 : 5)) ? (
                      <span className={styles.warningText} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <AlertCircle size={14} /> Sắp hết
                      </span>
                    ) : (
                      <span style={{color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                        <CheckCircle2 size={14} /> Bình thường
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => handleEditClick(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', marginRight: '8px' }} title="Sửa">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteClick(m._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Xóa">
                      <Trash2 size={16} />
                    </button>
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
            <h2 className={styles.modalTitle}>{editingId ? 'Sửa thông tin vật tư' : 'Nhập kho vật tư mới'}</h2>
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
                <label className={styles.label}>Hạn sử dụng (Tuỳ chọn)</label>
                <input type="date" name="expiryDate" className={styles.input} value={formData.expiryDate} onChange={handleInputChange} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Nhà cung cấp (Tuỳ chọn)</label>
                <input type="text" name="supplier" className={styles.input} value={formData.supplier} onChange={handleInputChange} placeholder="VD: Đại lý Vật tư Nông nghiệp A" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Nhà sản xuất (Tuỳ chọn)</label>
                <input type="text" name="manufacturer" className={styles.input} value={formData.manufacturer} onChange={handleInputChange} placeholder="VD: Đạm Phú Mỹ" />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={handleCloseModal}>Hủy</button>
                <button type="submit" className={styles.button}>{editingId ? 'Cập nhật' : 'Xác nhận nhập'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
