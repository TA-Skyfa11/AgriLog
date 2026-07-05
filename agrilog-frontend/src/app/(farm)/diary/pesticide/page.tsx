'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/diary.module.css';
import { ShieldAlert, Search, Plus, X } from 'lucide-react';
import { format } from 'date-fns';

export default function PesticideDiaryPage() {
  const router = useRouter();
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cropType: '',
    areaText: '',
    areaSqm: '',
    startDate: new Date().toISOString().split('T')[0],
    description: ''
  });

  const loadBoards = async () => {
    try {
      const res = await fetchAPI('/pesticide-boards');
      if (res.success) {
        setBoards(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoards();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cropType) return;
    
    try {
      const res = await fetchAPI('/pesticide-boards', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          cropType: formData.cropType,
          areaText: formData.areaText,
          areaSqm: Number(formData.areaSqm) || 0,
          startDate: formData.startDate,
          description: formData.description
        }),
      });
      if (res.success) {
        setShowModal(false);
        router.push(`/diary/pesticide/${res.data._id}`);
      } else {
        alert(res.message || 'Có lỗi xảy ra khi tạo bảng thuốc BVTV');
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi tạo bảng thuốc BVTV');
    }
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Nhật ký thuốc BVTV</h1>
          <div className={styles.subtitle}>Quản lý sử dụng thuốc bảo vệ thực vật</div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.searchBar}>
            <Search size={18} color="#9ca3af" />
            <input type="text" placeholder="Tìm kiếm..." className={styles.searchInput} />
          </div>
          <button className={styles.button} onClick={() => setShowModal(true)}>
            <Plus size={18} /> Tạo bảng
          </button>
        </div>
      </div>

      {boards.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
            <ShieldAlert size={32} />
          </div>
          <div>
            <div className={styles.emptyTitle}>Chưa có bảng nào</div>
            <div className={styles.emptySubtitle}>Tạo bảng đầu tiên để bắt đầu ghi chép</div>
            <button className={styles.button} style={{ margin: '0 auto' }} onClick={() => setShowModal(true)}>
              <Plus size={18} /> Tạo bảng đầu tiên
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          {boards.map(board => (
            <Link href={`/diary/pesticide/${board._id}`} key={board._id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.cardIcon} style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
                  <ShieldAlert size={24} />
                </div>
                <div className={`${styles.statusBadge} ${board.status === 'ACTIVE' ? styles.statusActive : ''}`}>
                  {board.status === 'ACTIVE' ? 'Đang sử dụng' : 'Đã đóng'}
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.boardName}>{board.name}</div>
                <div className={styles.cropType}>{board.cropType}</div>
                <div className={styles.boardDetails}>
                  Từ {format(new Date(board.startDate), 'yyyy-MM-dd')}
                </div>
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.dataCount}>{board.entryCount || 0} dòng dữ liệu</span>
                <button className={styles.openBtn}>Mở bảng</button>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Tạo bảng nhật ký thuốc BVTV</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Tên bảng *</label>
                <input 
                  type="text" 
                  name="name" 
                  className={styles.input} 
                  required 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  placeholder="VD: Phun thuốc Vụ Hè Thu 2025" 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Tên cây trồng *</label>
                <input 
                  type="text" 
                  name="cropType" 
                  className={styles.input} 
                  required 
                  value={formData.cropType} 
                  onChange={handleInputChange} 
                  placeholder="VD: Lúa IR504, Rau muống..." 
                />
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                  <label className={styles.label}>Khu vực</label>
                  <input 
                    type="text" 
                    name="areaText" 
                    className={styles.input} 
                    value={formData.areaText} 
                    onChange={handleInputChange} 
                    placeholder="VD: Lô A3, Khu vực B" 
                  />
                </div>
                <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                  <label className={styles.label}>Diện tích (m²)</label>
                  <input 
                    type="number" 
                    name="areaSqm" 
                    className={styles.input} 
                    value={formData.areaSqm} 
                    onChange={handleInputChange} 
                    placeholder="VD: 5000" 
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Ngày bắt đầu</label>
                <input 
                  type="date" 
                  name="startDate" 
                  className={styles.input} 
                  value={formData.startDate} 
                  onChange={handleInputChange} 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Mô tả</label>
                <textarea 
                  name="description" 
                  className={styles.textarea} 
                  rows={3} 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  placeholder="Ghi chú thêm..."
                ></textarea>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className={styles.btnSubmit}>Tạo bảng</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
