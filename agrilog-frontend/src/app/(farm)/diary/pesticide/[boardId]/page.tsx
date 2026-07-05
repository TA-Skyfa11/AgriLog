'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/diaryDetail.module.css';
import { Trash2, Plus, ShieldAlert, Download, Printer, ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

const AutoResizeTextarea = (props: any) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [props.value]);

  return (
    <textarea
      {...props}
      ref={textareaRef}
      rows={1}
      onInput={(e) => {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
        if (props.onInput) props.onInput(e);
      }}
      style={{
        ...props.style,
        overflow: 'hidden',
        resize: 'none',
      }}
    />
  );
};

export default function PesticideDiaryDetailPage() {
  const params = useParams();
  const [board, setBoard] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const inlineInputStyle: React.CSSProperties = {
    width: '100%',
    minWidth: '0',
    border: '1px solid #e5e7eb',
    background: '#f9fafb',
    padding: '6px 8px',
    fontFamily: 'inherit',
    fontSize: '0.875rem',
    color: 'inherit',
    borderRadius: '6px',
    transition: 'all 0.2s'
  };

  const loadData = async () => {
    try {
      const [boardRes, entriesRes, materialsRes] = await Promise.all([
        fetchAPI(`/pesticide-boards/${params.boardId}`),
        fetchAPI(`/pesticide-boards/${params.boardId}/entries`),
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

  const updateLocalEntry = (index: number, field: string, value: any) => {
    const newEntries = [...entries];
    newEntries[index][field] = value;
    setEntries(newEntries);
  };

  const handleBlurSave = async (index: number) => {
    const entry = entries[index];
    if (!entry.materialName || entry.materialName.trim() === '') return;
    
    setSavingId(entry._id || `new-${index}`);
    try {
      if (entry._id) {
        await fetchAPI(`/pesticide-boards/entries/${entry._id}`, {
          method: 'PUT',
          body: JSON.stringify(entry),
        });
      } else {
        const res = await fetchAPI(`/pesticide-boards/${params.boardId}/entries`, {
          method: 'POST',
          body: JSON.stringify({
            ...entry,
            date: entry.date ? new Date(entry.date).toISOString() : new Date().toISOString(),
            quantity: entry.quantity || '',
            phiDays: Number(entry.phiDays) || 0,
            cost: Number(entry.cost) || 0,
          }),
        });
        if (res.success) {
          const newEntries = [...entries];
          newEntries[index] = res.data;
          setEntries(newEntries);
        }
      }
    } catch (error) {
      console.error('Lỗi lưu', error);
    } finally {
      setSavingId(null);
    }
  };

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        const newEntries = [...entries];
        if (!newEntries[index].imageUrls) {
          newEntries[index].imageUrls = [];
        }
        const baseUrl = apiUrl.replace(/\/api$/, '');
        newEntries[index].imageUrls.push(`${baseUrl}${data.imageUrl}`);
        setEntries(newEntries);
        handleBlurSave(index);
      } else {
        alert(data.message || 'Lỗi tải ảnh lên');
      }
    } catch (error) {
      alert('Có lỗi xảy ra khi thêm cột');
    }
  };

  const handleEditColumn = async (oldName: string) => {
    const newName = prompt('Nhập tên mới cho cột:', oldName);
    if (!newName || !newName.trim() || newName.trim() === oldName) return;
    const trimmedName = newName.trim();
    if (board.customColumns?.includes(trimmedName)) {
      alert('Tên cột đã tồn tại!');
      return;
    }
    
    if (!confirm('Đổi tên cột sẽ mất một chút thời gian để cập nhật dữ liệu cũ. Bạn có tiếp tục?')) return;

    try {
      const updatedColumns = board.customColumns?.map((col: string) => col === oldName ? trimmedName : col) || [];
      await fetchAPI(`/pesticide-boards/${params.boardId}`, {
        method: 'PUT',
        body: JSON.stringify({ customColumns: updatedColumns })
      });

      const entriesToUpdate = entries.filter(e => e.customValues && e.customValues[oldName] !== undefined);
      for (const entry of entriesToUpdate) {
        const val = entry.customValues[oldName];
        delete entry.customValues[oldName];
        entry.customValues[trimmedName] = val;
        await fetchAPI(`/pesticide-boards/entries/${entry._id}`, {
          method: 'PUT',
          body: JSON.stringify({ customValues: entry.customValues })
        });
      }

      alert('Đổi tên cột thành công!');
      loadData();
    } catch (e) {
      alert('Lỗi khi đổi tên cột');
    }
  };

  const handleDeleteColumn = async (colName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa cột "${colName}" không? Dữ liệu của cột này sẽ không còn được hiển thị.`)) return;
    
    try {
      const updatedColumns = board.customColumns?.filter((col: string) => col !== colName) || [];
      const res = await fetchAPI(`/pesticide-boards/${params.boardId}`, {
        method: 'PUT',
        body: JSON.stringify({ customColumns: updatedColumns })
      });
      if (res.success) {
        alert('Xóa cột thành công!');
        loadData();
      }
    } catch (e) {
      alert('Lỗi khi xóa cột');
    }
  };

  const handleAddNewColumn = async () => {
    const colName = prompt('Nhập tên cột mới:');
    if (!colName || !colName.trim()) return;
    
    const maxColumns = 5;
    const currentCustomColumns = board.customColumns?.length || 0;

    if (currentCustomColumns >= maxColumns) {
      alert(`Bạn chỉ cho phép thêm tối đa ${maxColumns} cột tùy chỉnh.`);
      return;
    }

    try {
      const updatedColumns = [...(board.customColumns || []), colName.trim()];
      const res = await fetchAPI(`/pesticide-boards/${params.boardId}`, {
        method: 'PUT',
        body: JSON.stringify({ customColumns: updatedColumns })
      });
      if (res.success) {
        loadData();
      }
    } catch (e) {
      alert('Lỗi khi thêm cột');
    }
  };

  const handleAddNewRow = () => {
    setEntries([
      ...entries,
      {
        date: new Date().toISOString().split('T')[0],
        materialName: '',
        activeIngredient: '',
        targetPest: '',
        quantity: '',
        phiDays: '',
        performer: '',
        cost: '',
        notes: '',
        customValues: {}
      }
    ]);
  };
  
  const handleDeleteEntry = async (id: string, index: number) => {
    if (!confirm('Bạn có chắc muốn xóa hàng này?')) return;
    if (!id) {
      const newEntries = [...entries];
      newEntries.splice(index, 1);
      setEntries(newEntries);
      return;
    }
    try {
      const res = await fetchAPI(`/pesticide-boards/entries/${id}`, { method: 'DELETE' });
      if (res.success) {
        loadData();
      } else {
        alert(res.message || 'Lỗi xóa hàng');
      }
    } catch (error) {
      alert('Lỗi xóa hàng');
    }
  };

  const exportToExcel = () => {
    const headers = ['STT', 'Ngày sử dụng', 'Tên thuốc', 'Hoạt chất', 'Mục tiêu phòng trừ', 'Liều lượng', 'Cách ly (PHI - Ngày)', 'Người thực hiện', 'Chi phí (VNĐ)', 'Ghi chú'];
    const csvRows = [headers.join(',')];

    entries.forEach((e, idx) => {
      const formattedDate = format(new Date(e.date), 'dd/MM/yyyy');
      const row = [
        idx + 1,
        formattedDate,
        `"${(e.materialName || '—').replace(/"/g, '""')}"`,
        `"${(e.activeIngredient || '—').replace(/"/g, '""')}"`,
        `"${(e.targetPest || '—').replace(/"/g, '""')}"`,
        `"${(e.quantity || '—').replace(/"/g, '""')}"`,
        e.phiDays || 0,
        `"${(e.performer || '—').replace(/"/g, '""')}"`,
        e.cost || 0,
        `"${(e.notes || '—').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${board?.name || 'nhat_ky'}_thuoc_bvtv.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    window.print();
  };

  if (loading) return <div style={{ padding: '2rem' }}>Đang tải dữ liệu bảng thuốc BVTV...</div>;
  if (!board) return <div style={{ padding: '2rem' }}>Không tìm thấy bảng thuốc BVTV</div>;

  return (
    <div className={styles.container}>
      <div className={styles.actionHeader}>
        <Link href="/diary/pesticide" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={16} /> Danh sách bảng thuốc BVTV
        </Link>
        <div className={styles.actionButtons}>
          <button className={styles.spreadsheetBtn} onClick={handleAddNewColumn}>
            + Thêm cột
          </button>
          <button className={styles.spreadsheetBtn} onClick={exportToPDF}>
            <Printer size={16} /> PDF
          </button>
          <button className={styles.spreadsheetBtn} onClick={exportToExcel}>
            <Download size={16} /> Excel
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className={styles.title}><ShieldAlert size={24} color="#ea580c" /> {board.name}</h1>
          <p className={styles.subtitle}>
            Cây trồng: <strong>{board.cropType}</strong> | 
            Diện tích: <strong>{board.areaSqm} m²</strong> | 
            Ngày bắt đầu: {format(new Date(board.startDate), 'dd/MM/yyyy')}
          </p>
        </div>
        <div style={{ fontSize: '0.875rem', fontWeight: 700, padding: '0.5rem 1rem', borderRadius: '9999px', backgroundColor: '#fff7ed', color: '#ea580c' }}>
          Đang sử dụng
        </div>
      </div>

      <div className={styles.list}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '50px' }}>#</th>
              <th>Ngày sử dụng</th>
              <th>Tên thuốc</th>
              <th>Hoạt chất</th>
              <th>Mục tiêu phòng trừ</th>
              <th>Liều lượng</th>
              <th>Thời gian cách ly</th>
              <th>Người thực hiện</th>
              <th>Chi phí (VNĐ)</th>
              <th>Ghi chú</th>
              {board.customColumns?.map((col: string, idx: number) => (
                <th key={idx}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span>{col}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => handleEditColumn(col)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ea580c', fontSize: '14px' }} title="Sửa tên cột">✎</button>
                      <button onClick={() => handleDeleteColumn(col)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red', fontSize: '14px' }} title="Xóa cột">✕</button>
                    </div>
                  </div>
                </th>
              ))}
              <th>Hình ảnh</th>
              <th className={styles.actionColumnHeader} style={{ width: '80px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={13} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  Bảng đang trống. Click nút bên dưới để thêm hàng.
                </td>
              </tr>
            ) : (
              entries.map((entry, index) => (
                <tr key={entry._id || `new-${index}`}>
                  <td>{index + 1}</td>
                  <td>
                    <input 
                      type="date" 
                      style={inlineInputStyle}
                      value={entry.date ? entry.date.split('T')[0] : ''}
                      onChange={(e) => updateLocalEntry(index, 'date', e.target.value)}
                      onBlur={() => handleBlurSave(index)}
                    />
                  </td>
                  <td>
                    <AutoResizeTextarea 
                      style={inlineInputStyle}
                      value={entry.materialName || ''}
                      onChange={(e: any) => updateLocalEntry(index, 'materialName', e.target.value)}
                      onBlur={() => handleBlurSave(index)}
                    />
                  </td>
                  <td>
                    <AutoResizeTextarea 
                      style={inlineInputStyle}
                      value={entry.activeIngredient || ''}
                      onChange={(e: any) => updateLocalEntry(index, 'activeIngredient', e.target.value)}
                      onBlur={() => handleBlurSave(index)}
                    />
                  </td>
                  <td>
                    <AutoResizeTextarea 
                      style={inlineInputStyle}
                      value={entry.targetPest || ''}
                      onChange={(e: any) => updateLocalEntry(index, 'targetPest', e.target.value)}
                      onBlur={() => handleBlurSave(index)}
                    />
                  </td>
                  <td>
                    <AutoResizeTextarea 
                      style={inlineInputStyle}
                      value={entry.quantity || ''}
                      onChange={(e: any) => updateLocalEntry(index, 'quantity', e.target.value)}
                      onBlur={() => handleBlurSave(index)}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      style={inlineInputStyle}
                      value={entry.phiDays || ''}
                      onChange={(e) => updateLocalEntry(index, 'phiDays', e.target.value)}
                      onBlur={() => handleBlurSave(index)}
                    />
                  </td>
                  <td>
                    <AutoResizeTextarea 
                      style={inlineInputStyle}
                      value={entry.performer || ''}
                      onChange={(e: any) => updateLocalEntry(index, 'performer', e.target.value)}
                      onBlur={() => handleBlurSave(index)}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      style={inlineInputStyle}
                      value={entry.cost || ''}
                      onChange={(e) => updateLocalEntry(index, 'cost', e.target.value)}
                      onBlur={() => handleBlurSave(index)}
                    />
                  </td>
                  <td>
                    <AutoResizeTextarea 
                      style={inlineInputStyle}
                      value={entry.notes || ''}
                      onChange={(e: any) => updateLocalEntry(index, 'notes', e.target.value)}
                      onBlur={() => handleBlurSave(index)}
                    />
                  </td>
                  {board.customColumns?.map((col: string, cIdx: number) => (
                    <td key={cIdx}>
                      <AutoResizeTextarea 
                        style={inlineInputStyle}
                        value={entry.customValues?.[col] || ''}
                        onChange={(e: any) => {
                          const newEntries = [...entries];
                          if (!newEntries[index].customValues) newEntries[index].customValues = {};
                          newEntries[index].customValues[col] = e.target.value;
                          setEntries(newEntries);
                        }}
                        onBlur={() => handleBlurSave(index)}
                      />
                    </td>
                  ))}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {entry.imageUrls?.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer">
                          <img src={url} alt="Uploaded" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                        </a>
                      ))}
                      <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '12px', background: '#e5e7eb', borderRadius: '4px' }}>
                        <ImageIcon size={14} /> Tải
                        <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleImageUpload(index, e)} />
                      </label>
                    </div>
                  </td>
                  <td className={styles.actionColumnCell} style={{ textAlign: 'center' }}>
                    <button className={styles.actionBtn} onClick={() => handleDeleteEntry(entry._id, index)}>
                      <Trash2 size={16} />
                    </button>
                    {(savingId === entry._id || savingId === `new-${index}`) && <span style={{ fontSize: '10px', color: '#16a34a' }}>Đang lưu...</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button className={styles.addRowBtn} onClick={handleAddNewRow}>
        <Plus size={16} /> Thêm hàng
      </button>

      <style dangerouslySetInnerHTML={{__html: `
        .${styles.inlineInputHover}:hover, .${styles.inlineInputHover}:focus {
          border: 1px solid #d1d5db !important;
          background-color: #fff !important;
          outline: none;
        }
      `}} />
    </div>
  );
}
