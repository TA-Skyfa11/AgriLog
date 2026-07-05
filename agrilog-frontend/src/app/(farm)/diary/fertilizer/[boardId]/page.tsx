'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/diaryDetail.module.css';
import { Trash2, Plus, FlaskConical, Download, Printer, ArrowLeft, X, Image as ImageIcon } from 'lucide-react';
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
        resize: 'none',
        overflow: 'hidden'
      }}
    />
  );
};

export default function FertilizerDiaryDetailPage() {
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
        await fetchAPI(`/fertilizer-boards/entries/${entry._id}`, {
          method: 'PUT',
          body: JSON.stringify(entry),
        });
      } else {
        const res = await fetchAPI(`/fertilizer-boards/${params.boardId}/entries`, {
          method: 'POST',
          body: JSON.stringify({
            ...entry,
            date: entry.date ? new Date(entry.date).toISOString() : new Date().toISOString(),
            quantity: entry.quantity || '',
            appliedArea: Number(entry.appliedArea) || 0,
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
      await fetchAPI(`/fertilizer-boards/${params.boardId}`, {
        method: 'PUT',
        body: JSON.stringify({ customColumns: updatedColumns })
      });

      const entriesToUpdate = entries.filter(e => e.customValues && e.customValues[oldName] !== undefined);
      for (const entry of entriesToUpdate) {
        const val = entry.customValues[oldName];
        delete entry.customValues[oldName];
        entry.customValues[trimmedName] = val;
        await fetchAPI(`/fertilizer-boards/entries/${entry._id}`, {
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
      const res = await fetchAPI(`/fertilizer-boards/${params.boardId}`, {
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

  const handleAddNewRow = () => {
    setEntries([
      ...entries,
      {
        date: new Date().toISOString().split('T')[0],
        materialName: '',
        manufacturer: '',
        quantity: '',
        appliedArea: '',
        performer: '',
        cost: '',
        notes: '',
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
      const res = await fetchAPI(`/fertilizer-boards/entries/${id}`, { method: 'DELETE' });
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
    const headers = ['STT', 'Ngày sử dụng', 'Tên phân bón', 'Nhà sản xuất', 'Liều lượng', 'Diện tích áp dụng (m²)', 'Người thực hiện', 'Chi phí (VNĐ)', 'Ghi chú'];
    const csvRows = [headers.join(',')];

    entries.forEach((e, idx) => {
      const formattedDate = format(new Date(e.date), 'dd/MM/yyyy');
      const row = [
        idx + 1,
        formattedDate,
        `"${(e.materialName || '—').replace(/"/g, '""')}"`,
        `"${(e.manufacturer || '—').replace(/"/g, '""')}"`,
        `"${(e.quantity || '—').replace(/"/g, '""')}"`,
        e.appliedArea || 0,
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
    link.setAttribute('download', `${board?.name || 'nhat_ky'}_phan_bon.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    window.print();
  };

  if (loading) return <div style={{ padding: '2rem' }}>Đang tải dữ liệu bảng phân bón...</div>;
  if (!board) return <div style={{ padding: '2rem' }}>Không tìm thấy bảng phân bón</div>;

  const availableMaterials = materials.filter(m => m.type === 'FERTILIZER');

  return (
    <div className={styles.container}>
      {/* Header action buttons */}
      <div className={styles.actionHeader}>
        <Link href="/diary/fertilizer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={16} /> Danh sách bảng bón phân
        </Link>
        <div className={styles.actionButtons}>
          <button className={styles.spreadsheetBtn} onClick={() => alert('Thêm cột mới hiện tại là mock')}>
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
          <h1 className={styles.title}><FlaskConical size={24} color="#3b82f6" /> {board.name}</h1>
          <p className={styles.subtitle}>
            Cây trồng: <strong>{board.cropType}</strong> | 
            Diện tích: <strong>{board.areaSqm} m²</strong> | 
            Ngày bắt đầu: {format(new Date(board.startDate), 'dd/MM/yyyy')}
          </p>
        </div>
        <div style={{ fontSize: '0.875rem', fontWeight: 700, padding: '0.5rem 1rem', borderRadius: '9999px', backgroundColor: '#dcfce7', color: '#15803d' }}>
          Đang sử dụng
        </div>
      </div>

      {/* Spreadsheet List */}
      <div className={styles.list}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '50px' }}>#</th>
              <th>Ngày sử dụng</th>
              <th>Tên phân bón</th>
              <th>Nhà sản xuất</th>
              <th>Liều lượng</th>
              <th>Diện tích áp dụng (m²)</th>
              <th>Người thực hiện</th>
              <th>Chi phí (VNĐ)</th>
              <th>Ghi chú</th>
              {board.customColumns?.map((col: string, idx: number) => (
                    <th key={idx}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <span>{col}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => handleEditColumn(col)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-600)', fontSize: '14px' }} title="Sửa tên cột">✎</button>
                          <button onClick={() => handleDeleteColumn(col)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', fontSize: '14px' }} title="Xóa cột">✕</button>
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
                <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  Bảng đang trống. Click nút bên dưới để thêm hàng.
                </td>
              </tr>
            ) : (
              entries.map((entry, index) => (
                <tr key={entry._id || `new-${index}`}>
                  <td>{index + 1}</td>
                  <td style={{ fontWeight: 600 }}>
                    <input 
                      type="date" 
                      style={inlineInputStyle}
                      value={entry.date ? entry.date.split('T')[0] : ''}
                      onChange={(e) => updateLocalEntry(index, 'date', e.target.value)}
                      onBlur={() => handleBlurSave(index)}
                      className={styles.inlineInputHover}
                    />
                  </td>
                  <td style={{ color: '#3b82f6', fontWeight: 600 }}>
                    <AutoResizeTextarea 
                      style={inlineInputStyle}
                      value={entry.materialName || ''}
                      onChange={(e: any) => updateLocalEntry(index, 'materialName', e.target.value)}
                      onBlur={() => handleBlurSave(index)}
                      placeholder="Tên phân bón..."
                      className={styles.inlineInputHover}
                    />
                  </td>
                  <td>
                    <AutoResizeTextarea 
                      style={inlineInputStyle}
                      value={entry.manufacturer || ''}
                      onChange={(e: any) => updateLocalEntry(index, 'manufacturer', e.target.value)}
                      onBlur={() => handleBlurSave(index)}
                      placeholder="—"
                      className={styles.inlineInputHover}
                    />
                  </td>
                  <td>
                    <AutoResizeTextarea 
                      style={inlineInputStyle}
                      value={entry.quantity || ''}
                      onChange={(e: any) => updateLocalEntry(index, 'quantity', e.target.value)}
                      onBlur={() => handleBlurSave(index)}
                      placeholder="VD: 50kg, 2 lít..."
                      className={styles.inlineInputHover}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      style={inlineInputStyle}
                      value={entry.appliedArea || ''}
                      onChange={(e) => updateLocalEntry(index, 'appliedArea', e.target.value)}
                      onBlur={() => handleBlurSave(index)}
                      placeholder="—"
                      className={styles.inlineInputHover}
                    />
                  </td>
                  <td>
                    <AutoResizeTextarea 
                      style={inlineInputStyle}
                      value={entry.performer || ''}
                      onChange={(e: any) => updateLocalEntry(index, 'performer', e.target.value)}
                      onBlur={() => handleBlurSave(index)}
                      placeholder="—"
                      className={styles.inlineInputHover}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      style={inlineInputStyle}
                      value={entry.cost || ''}
                      onChange={(e) => updateLocalEntry(index, 'cost', e.target.value)}
                      onBlur={() => handleBlurSave(index)}
                      placeholder="—"
                      className={styles.inlineInputHover}
                    />
                  </td>
                  <td style={{ color: 'var(--color-text-muted)' }}>
                    <AutoResizeTextarea 
                      style={inlineInputStyle}
                      value={entry.notes || ''}
                      onChange={(e: any) => updateLocalEntry(index, 'notes', e.target.value)}
                      onBlur={() => handleBlurSave(index)}
                      placeholder="—"
                      className={styles.inlineInputHover}
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {entry.imageUrls?.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer">
                          <img src={url} alt="Uploaded" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                        </a>
                      ))}
                      <label className={styles.uploadBtn} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '12px' }}>
                        <ImageIcon size={14} /> Tải lên
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
