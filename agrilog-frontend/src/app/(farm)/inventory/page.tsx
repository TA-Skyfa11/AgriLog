/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/inventory.module.css';
import { Package, Search, Plus, AlertCircle, AlertTriangle, Clock, CheckCircle2, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDialog } from '@/context/DialogContext';

let hasShownStockAlert = false;

// Helper tính toán chi tiết trạng thái hạn sử dụng
export const getExpiryInfo = (expiryDateStr?: string) => {
  if (!expiryDateStr) {
    return { isExpired: false, isNearExpiry: false, daysLeft: null, diffDays: null, formattedDate: '—' };
  }
  const exp = new Date(expiryDateStr);
  if (isNaN(exp.getTime())) {
    return { isExpired: false, isNearExpiry: false, daysLeft: null, diffDays: null, formattedDate: '—' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDay = new Date(exp);
  expDay.setHours(0, 0, 0, 0);

  const diffTime = expDay.getTime() - today.getTime();
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return {
      isExpired: true,
      isNearExpiry: false,
      daysLeft: days,
      diffDays: Math.abs(days),
      formattedDate: exp.toLocaleDateString('vi-VN'),
    };
  } else if (days === 0) {
    return {
      isExpired: true,
      isNearExpiry: false,
      daysLeft: 0,
      diffDays: 0,
      formattedDate: exp.toLocaleDateString('vi-VN'),
    };
  } else if (days <= 30) {
    return {
      isExpired: false,
      isNearExpiry: true,
      daysLeft: days,
      diffDays: days,
      formattedDate: exp.toLocaleDateString('vi-VN'),
    };
  } else {
    return {
      isExpired: false,
      isNearExpiry: false,
      daysLeft: days,
      diffDays: days,
      formattedDate: exp.toLocaleDateString('vi-VN'),
    };
  }
};

export default function InventoryPage() {
  const dialog = useDialog();

  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [minImportDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [filterTab, setFilterTab] = useState<'ALL' | 'EXPIRED' | 'NEAR_EXPIRY' | 'LOW_STOCK'>('ALL');

  const [formData, setFormData] = useState({
    name: '',
    type: 'FERTILIZER',
    quantity: '',
    unit: 'kg',
    expiryDate: '',
    supplier: '',
    manufacturer: '',
    activeIngredient: '',
  });

  const loadInventory = async () => {
    try {
      const res = await fetchAPI('/materials');
      if (res.success) {
        setMaterials(res.data);
        
        const expiredList = res.data.filter((m: any) => getExpiryInfo(m.expiryDate).isExpired);
        const nearExpiryList = res.data.filter((m: any) => getExpiryInfo(m.expiryDate).isNearExpiry);
        const outOfStockMaterials = res.data.filter((m: any) => m.quantity <= 0);
        const lowStockMaterials = res.data.filter((m: any) => m.quantity > 0 && m.quantity <= (m.minQuantityAlert || (m.type === 'FERTILIZER' ? 50 : 5)));
        
        if (!hasShownStockAlert) {
          // 1. Cảnh báo vật tư hết hạn (Ưu tiên cao nhất)
          if (expiredList.length > 0) {
            toast.error(
              `⚠️ Cảnh báo: Có ${expiredList.length} vật tư đã HẾT HẠN SỬ DỤNG (${expiredList.map((m: any) => m.name).slice(0, 3).join(', ')}${expiredList.length > 3 ? '...' : ''})!`,
              { duration: 6000, id: 'expired-stock-alert' }
            );
          }
          // 2. Cảnh báo hết hàng
          if (outOfStockMaterials.length > 0) {
            toast.error(`Có ${outOfStockMaterials.length} vật tư đã hết hàng trong kho! Vui lòng nhập thêm.`, { duration: 5000, id: 'out-of-stock-alert' });
          }
          // 3. Cảnh báo sắp hết hạn
          if (nearExpiryList.length > 0) {
            toast(`⏳ Có ${nearExpiryList.length} vật tư sắp hết hạn trong 30 ngày tới.`, { duration: 5000, id: 'near-expiry-alert' });
          } else if (lowStockMaterials.length > 0) {
            toast(`⚠️ Có ${lowStockMaterials.length} vật tư sắp hết trong kho.`, { duration: 5000, id: 'low-stock-alert' });
          }
          
          if (expiredList.length > 0 || outOfStockMaterials.length > 0 || nearExpiryList.length > 0 || lowStockMaterials.length > 0) {
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
      const defaultUnit = value === 'FERTILIZER' ? 'kg' : 'lít';
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
      activeIngredient: material.activeIngredient || '',
    });
    setEditingId(material._id);
    setShowModal(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (await dialog.confirm('Bạn có chắc chắn muốn xóa vật tư này? Toàn bộ dữ liệu liên quan có thể bị ảnh hưởng.')) {
      try {
        const res = await fetchAPI(`/materials/${id}`, { method: 'DELETE' });
        if (res.success) {
          toast.success('Đã xóa vật tư thành công');
          loadInventory();
        }
      } catch (error) {
        toast.error('Lỗi xóa vật tư');
      }
    }
  };

  const handleCloseModal = async () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', type: 'FERTILIZER', quantity: '', unit: 'kg', expiryDate: '', supplier: '', manufacturer: '', activeIngredient: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.expiryDate) {
      toast.error('Vui lòng chọn hạn sử dụng!');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedExpiry = new Date(formData.expiryDate);
    selectedExpiry.setHours(0, 0, 0, 0);

    // Khi nhập kho mới: hạn sử dụng phải lớn hơn hôm nay
    // Khi chỉnh sửa vật tư cũ: cho phép lưu ngày hạn thực tế (kể cả đã hết hạn)
    if (!editingId && selectedExpiry <= today) {
      toast.error('Ngày hạn sử dụng phải lớn hơn ngày nhập kho hiện tại!');
      return;
    }

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
        if (editingId) {
          if (selectedExpiry <= today) {
            toast('Đã cập nhật (Vật tư này đã hết hạn sử dụng)', { icon: '⚠️' });
          } else {
            toast.success('Cập nhật vật tư thành công!');
          }
        } else {
          toast.success('Nhập kho thành công!');
        }
      } else {
        toast.error(res.message || (editingId ? 'Lỗi cập nhật' : 'Lỗi nhập kho'));
      }
    } catch (error: any) {
      toast.error(error.message || (editingId ? 'Lỗi cập nhật' : 'Lỗi nhập kho'));
    }
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    let expired = 0;
    let nearExpiry = 0;
    let lowStock = 0;
    materials.forEach((m) => {
      const exp = getExpiryInfo(m.expiryDate);
      if (exp.isExpired) expired++;
      else if (exp.isNearExpiry) nearExpiry++;
      if (m.quantity <= (m.minQuantityAlert || (m.type === 'FERTILIZER' ? 50 : 5))) lowStock++;
    });
    return { expired, nearExpiry, lowStock, total: materials.length };
  }, [materials]);

  // Lọc theo tìm kiếm và tab
  const filteredMaterials = useMemo(() => {
    let list = materials;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.manufacturer && m.manufacturer.toLowerCase().includes(q)) ||
          (m.supplier && m.supplier.toLowerCase().includes(q)) ||
          (m.activeIngredient && m.activeIngredient.toLowerCase().includes(q))
      );
    }
    if (filterTab === 'EXPIRED') {
      list = list.filter((m) => getExpiryInfo(m.expiryDate).isExpired);
    } else if (filterTab === 'NEAR_EXPIRY') {
      list = list.filter((m) => getExpiryInfo(m.expiryDate).isNearExpiry);
    } else if (filterTab === 'LOW_STOCK') {
      list = list.filter((m) => m.quantity <= (m.minQuantityAlert || (m.type === 'FERTILIZER' ? 50 : 5)));
    }
    return list;
  }, [materials, searchQuery, filterTab]);

  const expiredMaterialsList = useMemo(() => {
    return materials.filter((m) => getExpiryInfo(m.expiryDate).isExpired);
  }, [materials]);

  if (loading) return <div>Đang tải dữ liệu kho...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}><Package size={24} color="#16a34a" /> Quản lý Kho vật tư</h1>
          <div className={styles.subtitle}>Theo dõi số lượng phân bón, thuốc BVTV, hạn sử dụng và vật tư</div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.searchBar}>
            <Search size={18} color="#9ca3af" />
            <input 
              type="text" 
              placeholder="Tìm vật tư, NSX, hoạt chất..." 
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className={styles.button} onClick={() => {
            setEditingId(null);
            setFormData({ name: '', type: 'FERTILIZER', quantity: '', unit: 'kg', expiryDate: '', supplier: '', manufacturer: '', activeIngredient: '' });
            setShowModal(true);
          }}>
            <Plus size={18} /> Nhập kho
          </button>
        </div>
      </div>

      {/* CẢNH BÁO NỔI BẬT NẾU CÓ VẬT TƯ HẾT HẠN SỬ DỤNG */}
      {expiredMaterialsList.length > 0 && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(220, 38, 38, 0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <AlertTriangle size={22} color="#dc2626" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.925rem' }}>
                Cảnh báo: Có {expiredMaterialsList.length} vật tư đã HẾT HẠN SỬ DỤNG trong kho!
              </div>
              <div style={{ color: '#b91c1c', fontSize: '0.825rem', marginTop: '2px' }}>
                Vui lòng kiểm tra, tiêu hủy hoặc không sử dụng để tránh làm hại cây trồng.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFilterTab(filterTab === 'EXPIRED' ? 'ALL' : 'EXPIRED')}
            style={{
              background: filterTab === 'EXPIRED' ? '#991b1b' : '#dc2626',
              color: '#fff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s',
            }}
          >
            {filterTab === 'EXPIRED' ? '✕ Bỏ lọc hết hạn' : 'Xem vật tư hết hạn'}
          </button>
        </div>
      )}

      {/* TABS LỌC NHANH TRẠNG THÁI */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setFilterTab('ALL')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.825rem',
            fontWeight: filterTab === 'ALL' ? 700 : 500,
            background: filterTab === 'ALL' ? '#16a34a' : '#f3f4f6',
            color: filterTab === 'ALL' ? '#fff' : '#374151',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Tất cả ({stats.total})
        </button>
        {stats.expired > 0 && (
          <button
            type="button"
            onClick={() => setFilterTab('EXPIRED')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.825rem',
              fontWeight: filterTab === 'EXPIRED' ? 700 : 600,
              background: filterTab === 'EXPIRED' ? '#dc2626' : '#fee2e2',
              color: filterTab === 'EXPIRED' ? '#fff' : '#dc2626',
              border: '1px solid #fca5a5',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <AlertTriangle size={13} /> Đã hết hạn ({stats.expired})
          </button>
        )}
        {stats.nearExpiry > 0 && (
          <button
            type="button"
            onClick={() => setFilterTab('NEAR_EXPIRY')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.825rem',
              fontWeight: filterTab === 'NEAR_EXPIRY' ? 700 : 600,
              background: filterTab === 'NEAR_EXPIRY' ? '#d97706' : '#fef3c7',
              color: filterTab === 'NEAR_EXPIRY' ? '#fff' : '#d97706',
              border: '1px solid #fde68a',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Clock size={13} /> Sắp hết hạn ({stats.nearExpiry})
          </button>
        )}
        {stats.lowStock > 0 && (
          <button
            type="button"
            onClick={() => setFilterTab('LOW_STOCK')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.825rem',
              fontWeight: filterTab === 'LOW_STOCK' ? 700 : 500,
              background: filterTab === 'LOW_STOCK' ? '#4b5563' : '#f3f4f6',
              color: filterTab === 'LOW_STOCK' ? '#fff' : '#4b5563',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Hết / Sắp hết hàng ({stats.lowStock})
          </button>
        )}
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
            {filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  {searchQuery || filterTab !== 'ALL'
                    ? 'Không tìm thấy vật tư nào khớp với bộ lọc.'
                    : 'Kho đang trống. Vui lòng nhập thêm vật tư.'}
                </td>
              </tr>
            ) : (
              filteredMaterials.map((m) => {
                const expInfo = getExpiryInfo(m.expiryDate);
                const isOutOfStock = m.quantity <= 0;
                const isLowStock = m.quantity > 0 && m.quantity <= (m.minQuantityAlert || (m.type === 'FERTILIZER' ? 50 : 5));

                return (
                  <tr 
                    key={m._id}
                    style={{
                      background: expInfo.isExpired ? '#fef2f2' : undefined,
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ fontWeight: 600, color: expInfo.isExpired ? '#991b1b' : 'var(--color-text-main)' }}>
                      {m.name}
                    </td>
                    <td>{m.manufacturer || '—'}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[`type${m.type}`]}`}>
                        {m.type === 'FERTILIZER' ? 'Phân bón' : 'Thuốc BVTV'}
                      </span>
                    </td>
                    <td className={isOutOfStock ? styles.errorText : isLowStock ? styles.warningText : ''} style={{ fontWeight: 700 }}>
                      {m.quantity}
                    </td>
                    <td>{m.unit}</td>

                    {/* CỘT HẠN SỬ DỤNG - VẪN GHI RÕ NGÀY ĐỂ NGƯỜI DÙNG BIẾT */}
                    <td>
                      {m.expiryDate ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span
                            style={{
                              color: expInfo.isExpired ? '#dc2626' : expInfo.isNearExpiry ? '#d97706' : 'var(--color-text-main)',
                              fontWeight: expInfo.isExpired || expInfo.isNearExpiry ? 700 : 500,
                              fontSize: '0.875rem',
                            }}
                          >
                            {expInfo.formattedDate}
                          </span>
                          {expInfo.isExpired && (
                            <span style={{ fontSize: '0.725rem', color: '#dc2626', fontWeight: 600 }}>
                              {expInfo.diffDays === 0 ? 'Hết hạn hôm nay' : `Quá hạn ${expInfo.diffDays} ngày`}
                            </span>
                          )}
                          {expInfo.isNearExpiry && (
                            <span style={{ fontSize: '0.725rem', color: '#d97706', fontWeight: 500 }}>
                              Còn {expInfo.daysLeft} ngày
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </td>

                    {/* CỘT TRẠNG THÁI - TỰ ĐỘNG ĐỔI THÀNH HẾT HẠN NẾU ĐÃ QUÁ HẠN */}
                    <td>
                      {expInfo.isExpired ? (
                        <span
                          style={{
                            color: '#dc2626',
                            background: '#fee2e2',
                            border: '1px solid #fca5a5',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 700,
                            fontSize: '0.825rem',
                          }}
                        >
                          <AlertTriangle size={13} /> Hết hạn
                        </span>
                      ) : isOutOfStock ? (
                        <span className={styles.errorText} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                          <AlertCircle size={14} /> Hết hàng
                        </span>
                      ) : expInfo.isNearExpiry ? (
                        <span
                          style={{
                            color: '#d97706',
                            background: '#fef3c7',
                            border: '1px solid #fde68a',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600,
                            fontSize: '0.825rem',
                          }}
                        >
                          <Clock size={13} /> Sắp hết hạn
                        </span>
                      ) : isLowStock ? (
                        <span className={styles.warningText} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                          <AlertCircle size={14} /> Sắp hết
                        </span>
                      ) : (
                        <span style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
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
                );
              })
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
                <label className={styles.label}>
                  Loại vật tư <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select name="type" className={styles.input} value={formData.type} onChange={handleInputChange}>
                  <option value="FERTILIZER">Phân bón</option>
                  <option value="PESTICIDE">Thuốc BVTV</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Tên vật tư <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input type="text" name="name" className={styles.input} required value={formData.name} onChange={handleInputChange} placeholder="VD: Phân Ure, Thuốc trừ sâu..." />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.label}>
                    Số lượng nhập <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input type="number" name="quantity" className={styles.input} required value={formData.quantity} onChange={handleInputChange} placeholder="0" min="0.01" step="any" />
                </div>
                <div className={styles.formGroup} style={{ width: '130px' }}>
                  <label className={styles.label}>
                    Đơn vị <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select name="unit" className={styles.input} required value={formData.unit} onChange={handleInputChange}>
                    {formData.type === 'FERTILIZER' ? (
                      <>
                        <option value="kg">kg</option>
                        <option value="bao">bao</option>
                        <option value="tấn">tấn</option>
                        <option value="g">g</option>
                      </>
                    ) : (
                      <>
                        <option value="lít">lít</option>
                        <option value="ml">ml</option>
                        <option value="chai">chai</option>
                        <option value="gói">gói</option>
                      </>
                    )}
                    {formData.unit && !['kg', 'bao', 'tấn', 'g', 'lít', 'ml', 'chai', 'gói'].includes(formData.unit) && (
                      <option value={formData.unit}>{formData.unit}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Hạn sử dụng <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  type="date" 
                  name="expiryDate" 
                  className={styles.input} 
                  required 
                  min={editingId ? undefined : minImportDate}
                  value={formData.expiryDate} 
                  onChange={handleInputChange} 
                />
                {editingId && formData.expiryDate && getExpiryInfo(formData.expiryDate).isExpired && (
                  <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '4px', fontWeight: 500 }}>
                    ⚠️ Ngày này đã qua hạn hiện tại. Vật tư sẽ hiển thị trạng thái &quot;Hết hạn&quot;.
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Nhà cung cấp</label>
                <input type="text" name="supplier" className={styles.input} value={formData.supplier} onChange={handleInputChange} placeholder="VD: Đại lý Vật tư Nông nghiệp A" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Nhà sản xuất</label>
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
