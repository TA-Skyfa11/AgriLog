/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/diary.module.css';

export default function DiaryBoardsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [boards, setBoards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBoards = async () => {
    try {
      const res = await fetchAPI('/boards');
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

  const handleCreateNew = async () => {
    const name = prompt('Nhập tên Bảng canh tác mới:');
    if (!name) return;
    
    try {
      const res = await fetchAPI('/boards', {
        method: 'POST',
        body: JSON.stringify({
          name,
          cropType: 'Loại cây (chỉnh sửa sau)',
          areaSqm: 1000,
          startDate: new Date().toISOString(),
        }),
      });
      if (res.success) {
        loadBoards();
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi tạo bảng canh tác');
    }
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Quản lý Bảng Canh Tác</h1>
        <button className={styles.button} onClick={handleCreateNew}>+ Tạo bảng mới</button>
      </div>

      {boards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          Chưa có bảng canh tác nào. Hãy tạo mới để bắt đầu ghi nhật ký!
        </div>
      ) : (
        <div className={styles.grid}>
          {boards.map(board => (
            <Link href={`/diary/${board._id}`} key={board._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.boardName}>{board.name}</div>
                <div className={`${styles.statusBadge} ${board.status === 'ACTIVE' ? styles.statusActive : styles.statusHarvested}`}>
                  {board.status === 'ACTIVE' ? 'Đang canh tác' : 'Đã thu hoạch'}
                </div>
              </div>
              <div className={styles.infoRow}>
                <span>Cây trồng:</span>
                <span style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{board.cropType}</span>
              </div>
              <div className={styles.infoRow}>
                <span>Diện tích:</span>
                <span style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{board.areaSqm} m²</span>
              </div>
              <div className={styles.infoRow}>
                <span>Ngày bắt đầu:</span>
                <span>{new Date(board.startDate).toLocaleDateString('vi-VN')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

