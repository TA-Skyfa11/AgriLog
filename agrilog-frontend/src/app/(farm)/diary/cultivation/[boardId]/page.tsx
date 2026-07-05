'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/diaryDetail.module.css';
import { Trash2, Plus, FileText, Download, Printer, ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
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

export default function CultivationDiaryDetailPage() {
  const { boardId } = useParams();
  const [board, setBoard] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Define new inline input style
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

  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  const [harvestData, setHarvestData] = useState({
    harvestYield: '',
    harvestDate: new Date().toISOString().split('T')[0],
  });

  const loadBoardData = async () => {
    try {
      const [boardRes, entriesRes, profileRes] = await Promise.all([
        fetchAPI(`/cultivation-boards/${boardId}`),
        fetchAPI(`/cultivation-boards/${boardId}/entries`),
        fetchAPI('/farm/profile')
      ]);

      if (boardRes.success) {
        setBoard(boardRes.data);
      }
      if (entriesRes.success) {
        setEntries(entriesRes.data);
      }
      if (profileRes.success) {
        setProfile(profileRes.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoardData();
  }, [boardId]);

  const updateLocalEntry = (index: number, field: string, value: any, isCustom: boolean = false) => {
    const newEntries = [...entries];
    if (isCustom) {
      newEntries[index].customValues = { ...newEntries[index].customValues, [field]: value };
    } else {
      newEntries[index][field] = value;
    }
    setEntries(newEntries);
  };

  const handleBlurSave = async (index: number) => {
    const entry = entries[index];
    if (!entry.activityName || entry.activityName.trim() === '') return; // Don't save if activityName is empty
    
    setSavingId(entry._id || `new-${index}`);
    try {
      if (entry._id) {
        // Update existing
        await fetchAPI(`/cultivation-boards/entries/${entry._id}`, {
          method: 'PUT',
          body: JSON.stringify(entry),
        });
      } else {
        // Create new
        const res = await fetchAPI(`/cultivation-boards/${boardId}/entries`, {
          method: 'POST',
          body: JSON.stringify({
            ...entry,
            date: entry.date ? new Date(entry.date).toISOString() : new Date().toISOString(),
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
      console.error('Lỗi khi lưu', error);
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
        // Save relative path or full URL depending on how backend sends it. 
        // Backend sends /uploads/filename. We prepend the base API URL (without /api)
        const baseUrl = apiUrl.replace(/\/api$/, '');
        newEntries[index].imageUrls.push(`${baseUrl}${data.imageUrl}`);
        setEntries(newEntries);
        
        // Auto save entry
        handleBlurSave(index);
      } else {
        alert(data.message || 'Lỗi tải ảnh lên');
      }
    } catch (error) {
      alert('Lỗi kết nối khi tải ảnh');
    }
  };

  const handleAddNewRow = () => {
    setEntries([
      ...entries,
      {
        date: new Date().toISOString().split('T')[0],
        stage: '',
        activityName: '',
        performer: '',
        cost: '',
        notes: '',
        customValues: {}
      }
    ]);
  };

  const handleHarvestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHarvestData({ ...harvestData, [e.target.name]: e.target.value });
  };



  const handleAddColumn = async () => {
    const colName = prompt('Nhập tên cột mới cần thêm (Ví dụ: Độ ẩm đất, Nhiệt độ...):');
    if (!colName || !colName.trim()) return;

    const trimmedColName = colName.trim();
    if (board.customColumns?.includes(trimmedColName)) {
      alert('Cột này đã tồn tại!');
      return;
    }

    // Dynamic limit check based on current user plan
    const plan = profile?.plan || 'BASIC';
    const limits: Record<string, number> = {
      BASIC: 10,
      STANDARD: 15,
      PREMIUM: 25
    };
    const maxColumns = limits[plan] || 10;
    
    // Limit only applies to custom columns
    const currentCustomColumns = board.customColumns?.length || 0;

    if (currentCustomColumns >= maxColumns) {
      alert(`Gói dịch vụ ${plan} của bạn chỉ cho phép thêm tối đa ${maxColumns} cột tùy chỉnh. Vui lòng nâng cấp gói dịch vụ để thêm!`);
      return;
    }

    try {
      const updatedColumns = [...(board.customColumns || []), trimmedColName];
      const res = await fetchAPI(`/cultivation-boards/${boardId}`, {
        method: 'PUT',
        body: JSON.stringify({
          customColumns: updatedColumns
        }),
      });

      if (res.success) {
        alert(`Đã thêm thành công cột "${trimmedColName}"!`);
        loadBoardData();
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
      // 1. Update board columns
      const updatedColumns = board.customColumns?.map(col => col === oldName ? trimmedName : col) || [];
      await fetchAPI(`/cultivation-boards/${boardId}`, {
        method: 'PUT',
        body: JSON.stringify({ customColumns: updatedColumns })
      });

      // 2. Migrate entries data
      const entriesToUpdate = entries.filter(e => e.customValues && e.customValues[oldName] !== undefined);
      for (const entry of entriesToUpdate) {
        const val = entry.customValues[oldName];
        delete entry.customValues[oldName];
        entry.customValues[trimmedName] = val;
        await fetchAPI(`/cultivation-boards/${boardId}/entries/${entry._id}`, {
          method: 'PUT',
          body: JSON.stringify({ customValues: entry.customValues })
        });
      }

      alert('Đổi tên cột thành công!');
      loadBoardData();
    } catch (e) {
      alert('Lỗi khi đổi tên cột');
    }
  };

  const handleDeleteColumn = async (colName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa cột "${colName}" không? Dữ liệu của cột này sẽ không còn được hiển thị.`)) return;
    
    try {
      const updatedColumns = board.customColumns?.filter(col => col !== colName) || [];
      const res = await fetchAPI(`/cultivation-boards/${boardId}`, {
        method: 'PUT',
        body: JSON.stringify({ customColumns: updatedColumns })
      });
      if (res.success) {
        alert('Xóa cột thành công!');
        loadBoardData();
      }
    } catch (e) {
      alert('Lỗi khi xóa cột');
    }
  };

  const handleHarvestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!harvestData.harvestYield) return;

    try {
      const res = await fetchAPI(`/cultivation-boards/${boardId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'HARVESTED',
          harvestYield: Number(harvestData.harvestYield),
          harvestDate: new Date(harvestData.harvestDate).toISOString(),
        }),
      });

      if (res.success) {
        setShowHarvestModal(false);
        loadBoardData();
      }
    } catch (error) {
      alert('Lỗi cập nhật thu hoạch');
    }
  };

  const handleDeleteEntry = async (id: string, index: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa hàng này?')) return;
    
    if (!id) {
      // It's a new row that hasn't been saved to DB yet
      const newEntries = [...entries];
      newEntries.splice(index, 1);
      setEntries(newEntries);
      return;
    }

    try {
      const res = await fetchAPI(`/cultivation-boards/entries/${id}`, { method: 'DELETE' });
      if (res.success) {
        loadBoardData();
      }
    } catch (error) {
      alert('Lỗi xóa bản ghi');
    }
  };

  const exportToExcel = () => {
    const customCols = board?.customColumns || [];
    const headers = [
      'STT', 
      'Ngày', 
      'Giai đoạn', 
      'Hoạt động', 
      'Người thực hiện', 
      'Chi phí (VNĐ)', 
      'Ghi chú',
      ...customCols
    ];
    const csvRows = [headers.join(',')];

    entries.forEach((e, idx) => {
      const formattedDate = format(new Date(e.date), 'dd/MM/yyyy');
      const row = [
        idx + 1,
        formattedDate,
        `"${(e.stage || '—').replace(/"/g, '""')}"`,
        `"${(e.activityName || '—').replace(/"/g, '""')}"`,
        `"${(e.performer || '—').replace(/"/g, '""')}"`,
        e.cost || 0,
        `"${(e.notes || '—').replace(/"/g, '""')}"`,
        ...customCols.map((col: string) => `"${(e.customValues?.[col] || '—').replace(/"/g, '""')}"`)
      ];
      csvRows.push(row.join(','));
    });

    // UTF-8 BOM to display Vietnamese characters correctly in Excel
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${board?.name || 'nhat_ky'}_canh_tac.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    window.print();
  };

  if (loading) return <div style={{ padding: '2rem' }}>Đang tải dữ liệu bảng canh tác...</div>;
  if (!board) return <div style={{ padding: '2rem' }}>Không tìm thấy bảng canh tác</div>;

  const customCols = board.customColumns || [];

  return (
    <div className={styles.container}>
      {/* Header back link and status */}
      <div className={styles.actionHeader}>
        <Link href="/diary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--color-text-muted)' }}>
          <ArrowLeft size={16} /> Danh sách bảng
        </Link>
        <div className={styles.actionButtons}>
          <button className={styles.spreadsheetBtn} onClick={handleAddColumn}>
            + Thêm cột
          </button>
          <button className={styles.spreadsheetBtn} onClick={exportToPDF}>
            <Printer size={16} /> PDF
          </button>
          <button className={styles.spreadsheetBtn} onClick={exportToExcel}>
            <Download size={16} /> Excel
          </button>
          {board.status === 'ACTIVE' && (
            <button className={styles.spreadsheetBtn} style={{ backgroundColor: '#10b981', color: 'white', borderColor: '#10b981' }} onClick={() => setShowHarvestModal(true)}>
              Đánh dấu Thu hoạch
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className={styles.title}><FileText size={24} color="#16a34a" /> {board.name}</h1>
          <p className={styles.subtitle}>
            Cây trồng: <strong>{board.cropType}</strong> | 
            Diện tích: <strong>{board.areaSqm} m²</strong> | 
            Khu vực: <strong>{board.areaText || '—'}</strong> | 
            Ngày bắt đầu: {format(new Date(board.startDate), 'dd/MM/yyyy')} |
            Gói hiện tại: <strong>{profile?.plan || 'BASIC'}</strong>
          </p>
        </div>
        <div style={{ fontSize: '0.875rem', fontWeight: 700, padding: '0.5rem 1rem', borderRadius: '9999px', backgroundColor: board.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', color: board.status === 'ACTIVE' ? '#15803d' : '#b91c1c' }}>
          {board.status === 'ACTIVE' ? 'Đang canh tác' : board.status === 'HARVESTED' ? 'Đã thu hoạch' : 'Đã hủy'}
        </div>
      </div>

      {board.status === 'HARVESTED' && (
        <div className={styles.harvestBadge}>
          🎉 Nông trại đã thu hoạch luống này vào ngày {format(new Date(board.harvestDate), 'dd/MM/yyyy')} với sản lượng: <strong>{board.harvestYield} kg</strong>!
        </div>
      )}

      {/* Spreadsheet List */}
      <div className={styles.list}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '50px' }}>#</th>
              <th>Ngày</th>
              <th>Giai đoạn</th>
              <th>Hoạt động</th>
              <th>Người thực hiện</th>
              <th>Chi phí (VNĐ)</th>
              <th>Ghi chú</th>
              {/* Dynamic columns inserted here */}
              {customCols.map((col: string) => (
                <th key={col}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span>{col}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => handleEditColumn(col)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary-600)', fontSize: '14px' }} title="Sửa tên cột">✎</button>
                      <button onClick={() => handleDeleteColumn(col)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', fontSize: '14px' }} title="Xóa cột">✕</button>
                    </div>
                  </div>
                </th>
              ))}
              {/* Attachment column always at the end */}
              <th>Hình ảnh</th>
              <th className={styles.actionColumnHeader} style={{ width: '80px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={9 + customCols.length} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
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
                  <td>
                    <AutoResizeTextarea 
                      style={inlineInputStyle}
                      value={entry.stage || ''}
                      onChange={(e: any) => updateLocalEntry(index, 'stage', e.target.value)}
                      onBlur={() => handleBlurSave(index)}
                      placeholder="—"
                      className={styles.inlineInputHover}
                    />
                  </td>
                  <td style={{ color: 'var(--color-primary-700)', fontWeight: 600 }}>
                    <AutoResizeTextarea 
                      style={inlineInputStyle}
                      value={entry.activityName || ''}
                      onChange={(e: any) => updateLocalEntry(index, 'activityName', e.target.value)}
                      onBlur={() => handleBlurSave(index)}
                      placeholder="Tên hoạt động..."
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
                  
                  {/* Dynamic custom columns data values */}
                  {customCols.map((col: string) => (
                    <td key={col}>
                      <AutoResizeTextarea 
                        style={inlineInputStyle}
                        value={entry.customValues?.[col] || ''}
                        onChange={(e: any) => updateLocalEntry(index, col, e.target.value, true)}
                        onBlur={() => handleBlurSave(index)}
                        placeholder="—"
                        className={styles.inlineInputHover}
                      />
                    </td>
                  ))}
                  
                  {/* Image attachment column is always at the end */}
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

      {/* Inline styles for hover */}
      <style dangerouslySetInnerHTML={{__html: `
        .${styles.inlineInputHover}:hover, .${styles.inlineInputHover}:focus {
          border: 1px solid #d1d5db !important;
          background-color: #fff !important;
          outline: none;
        }
      `}} />

      {/* Harvest Modal */}
      {showHarvestModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Xác nhận Thu hoạch</h2>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowHarvestModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleHarvestSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Ngày thu hoạch thực tế</label>
                <input type="date" name="harvestDate" className={styles.input} required value={harvestData.harvestDate} onChange={handleHarvestChange} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Tổng sản lượng thu hoạch (kg) *</label>
                <input type="number" name="harvestYield" className={styles.input} required value={harvestData.harvestYield} onChange={handleHarvestChange} placeholder="VD: 1500" />
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowHarvestModal(false)}>Hủy</button>
                <button type="submit" className={styles.btnSubmit} style={{ backgroundColor: '#10b981' }}>Xác nhận Thu hoạch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
