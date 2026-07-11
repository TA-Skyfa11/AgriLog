/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/diaryDetail.module.css';
import modalStyles from '@/css/diary.module.css';
import { Trash2, Plus, ShieldAlert, Download, Printer, ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';


const AutoResizeTextarea = (props: any) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.// eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
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
  const router = useRouter();
  const [board, setBoard] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState('BASIC');

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

  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    cropType: '',
    areaSqm: '',
    areaText: '',
    startDate: '',
    description: ''
  });

  const loadData = async () => {
    try {
      const [boardRes, entriesRes, materialsRes, profileRes] = await Promise.all([
        fetchAPI(`/pesticide-boards/${params.boardId}`),
        fetchAPI(`/pesticide-boards/${params.boardId}/entries`),
        fetchAPI('/materials'),
        fetchAPI('/farm/profile')
      ]);
      if (boardRes.success) {
        setBoard(boardRes.data);
        setEditFormData({
          name: boardRes.data.name || '',
          cropType: boardRes.data.cropType || '',
          areaSqm: boardRes.data.areaSqm || '',
          areaText: boardRes.data.areaText || '',
          startDate: boardRes.data.startDate ? new Date(boardRes.data.startDate).toISOString().split('T')[0] : '',
          description: boardRes.data.description || ''
        });
      }
      if (entriesRes.success) {
        if (entriesRes.data.length === 0) {
          const initialRows = Array(3).fill(null).map((_, idx) => ({
            _id: `temp-${idx}`,
            date: new Date().toISOString().split('T')[0],
            materialName: '',
            activeIngredient: '',
            targetPest: '',
            quantity: '',
            unit: '',
            phiDays: '',
            performer: '',
            cost: '',
            notes: '',
            customValues: {}
          }));
          setEntries(initialRows);
        } else {
          setEntries(entriesRes.data);
        }
      }
      if (materialsRes.success) setMaterials(materialsRes.data);
      if (profileRes.success) setUserPlan(profileRes.data.plan || 'BASIC');
    } catch (error: any) {
      if (error.message !== 'Board not found') {
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const plan = localStorage.getItem('userPlan') || 'BASIC';
    setUserPlan(plan);
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
      if (entry._id && !entry._id.startsWith('temp-')) {
        await fetchAPI(`/pesticide-boards/entries/${entry._id}`, {
          method: 'PUT',
          body: JSON.stringify(entry),
        });
      } else {
        const payload = { ...entry };
        delete payload._id;

        const res = await fetchAPI(`/pesticide-boards/${params.boardId}/entries`, {
          method: 'POST',
          body: JSON.stringify({
            ...payload,
            date: payload.date ? new Date(payload.date).toISOString() : new Date().toISOString(),
            quantity: payload.quantity || '',
            phiDays: Number(payload.phiDays) || 0,
            cost: Number(payload.cost) || 0,
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
    
    const plan = profile?.plan || 'BASIC';
    const limits: Record<string, number> = {
      FREE: 0,
      BASIC: 10,
      STANDARD: 15,
      PREMIUM: 25
    };
    const maxColumns = limits[plan] !== undefined ? limits[plan] : 10;
    const currentCustomColumns = board.customColumns?.length || 0;

    if (currentCustomColumns >= maxColumns) {
      alert(`Gói dịch vụ ${plan} của bạn chỉ cho phép thêm tối đa ${maxColumns} cột tùy chỉnh. Vui lòng nâng cấp gói dịch vụ để thêm!`);
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

  const handleDeleteBoard = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa bảng này không? Toàn bộ dữ liệu sẽ bị mất vĩnh viễn.')) {
      try {
        const res = await fetchAPI(`/pesticide-boards/${params.boardId}`, { method: 'DELETE' });
        if (res.success) {
          router.push('/diary/pesticide');
        } else {
          alert('Lỗi khi xóa bảng');
        }
      } catch (e) {
        alert('Lỗi kết nối khi xóa bảng');
      }
    }
  };

  const handleEditBoardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchAPI(`/pesticide-boards/${params.boardId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...editFormData,
          areaSqm: Number(editFormData.areaSqm) || 0
        })
      });
      if (res.success) {
        setBoard(res.data);
        setShowEditModal(false);
        alert('Cập nhật thông tin bảng thành công');
      } else {
        alert('Lỗi khi cập nhật bảng');
      }
    } catch (e) {
      alert('Lỗi kết nối khi cập nhật bảng');
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
    if (userPlan === 'BASIC') {
      alert('Gói cước Basic không hỗ trợ xuất file Excel. Vui lòng nâng cấp gói cước.');
      return;
    }
    const headers = ['STT', 'Ngày sử dụng', 'Tên thuốc', 'Hoạt chất', 'Mục tiêu phòng trừ', 'Liều lượng', 'Thời gian cách ly', 'Người thực hiện', 'Ghi chú'];
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

  const exportToPDF = async () => {
    if (userPlan === 'BASIC') {
      alert('Gói cước Basic không hỗ trợ xuất file PDF. Vui lòng nâng cấp gói cước.');
      return;
    }
    
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF('landscape');
    
    // Add title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(234, 88, 12); // Orange 600
    doc.text(`NHAT KY THUOC BVTV: ${board?.name || ''}`, 14, 20);
    
    // Add info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105); // Slate 600
    doc.text(`Cay trong: ${board?.cropType || ''}`, 14, 30);
    doc.text(`Dien tich: ${board?.areaSqm || 0} m2`, 80, 30);
    doc.text(`Ngay bat dau: ${board?.startDate ? format(new Date(board.startDate), 'dd/MM/yyyy') : ''}`, 150, 30);

    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 35, 280, 35);

    const customCols = board?.customColumns || [];
    const headers = [
      'STT', 
      'Ngay su dung', 
      'Ten thuoc', 
      'Hoat chat', 
      'Muc tieu', 
      'Lieu luong', 
      'Cach ly (ngay)', 
      'Nguoi thuc hien', 
      'Ghi chu',
      ...customCols.map((c: string) => c.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    ];
    
    const data = entries.map((e, idx) => [
      idx + 1,
      e.date ? format(new Date(e.date), 'dd/MM/yyyy') : '',
      (e.materialName || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      (e.activeIngredient || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      (e.targetPest || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      (e.quantity || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      e.phiDays || 0,
      (e.performer || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      (e.notes || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      ...customCols.map((col: string) => (e.customValues?.[col] || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    ]);

    autoTable(doc as any, {
      startY: 42,
      head: [headers],
      body: data,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.1 },
      headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold', halign: 'center' }, // #ea580c orange
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(`${board?.name || 'nhat_ky'}_thuoc_bvtv.pdf`);
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
          <button className={styles.spreadsheetBtn} onClick={() => setShowEditModal(true)}>
            ✎ Sửa bảng
          </button>
          <button className={styles.spreadsheetBtn} style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }} onClick={handleDeleteBoard}>
            🗑️ Xóa bảng
          </button>
          <button className={styles.spreadsheetBtn} onClick={handleAddNewColumn} disabled={userPlan === 'FREE'} style={{ opacity: userPlan === 'FREE' ? 0.5 : 1, cursor: userPlan === 'FREE' ? 'not-allowed' : 'pointer' }} title={userPlan === 'FREE' ? 'Gói Miễn phí không hỗ trợ thêm cột mới' : ''}>
            + Thêm cột
          </button>
          <button className={styles.spreadsheetBtn} onClick={exportToPDF} disabled={userPlan === 'BASIC'} style={{ opacity: userPlan === 'BASIC' ? 0.5 : 1, cursor: userPlan === 'BASIC' ? 'not-allowed' : 'pointer' }} title={userPlan === 'BASIC' ? 'Nâng cấp gói cước để sử dụng tính năng này' : ''}>
            <Printer size={16} /> PDF
          </button>
          <button className={styles.spreadsheetBtn} onClick={exportToExcel} disabled={userPlan === 'BASIC'} style={{ opacity: userPlan === 'BASIC' ? 0.5 : 1, cursor: userPlan === 'BASIC' ? 'not-allowed' : 'pointer' }} title={userPlan === 'BASIC' ? 'Nâng cấp gói cước để sử dụng tính năng này' : ''}>
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

      {showEditModal && (
        <div className={modalStyles.modalOverlay}>
          <div className={modalStyles.modal}>
            <div className={modalStyles.modalHeader}>
              <h2 className={modalStyles.modalTitle}>Sửa thông tin bảng</h2>
              <button className={modalStyles.closeBtn} onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditBoardSubmit}>
              <div className={modalStyles.formGroup}>
                <label className={modalStyles.label}>Tên bảng thuốc BVTV *</label>
                <input 
                  type="text" 
                  className={modalStyles.input} 
                  value={editFormData.name} 
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} 
                  required
                />
              </div>
              <div className={modalStyles.formGroup}>
                <label className={modalStyles.label}>Loại cây trồng *</label>
                <input 
                  type="text" 
                  className={modalStyles.input} 
                  value={editFormData.cropType} 
                  onChange={(e) => setEditFormData({...editFormData, cropType: e.target.value})} 
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                <div className={modalStyles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                  <label className={modalStyles.label}>Khu vực</label>
                  <input 
                    type="text" 
                    className={modalStyles.input} 
                    value={editFormData.areaText} 
                    onChange={(e) => setEditFormData({...editFormData, areaText: e.target.value})} 
                  />
                </div>
                <div className={modalStyles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                  <label className={modalStyles.label}>Diện tích (m²)</label>
                  <input 
                    type="number" 
                    className={modalStyles.input} 
                    value={editFormData.areaSqm} 
                    onChange={(e) => setEditFormData({...editFormData, areaSqm: e.target.value})} 
                  />
                </div>
              </div>
              <div className={modalStyles.formGroup}>
                <label className={modalStyles.label}>Ngày bắt đầu</label>
                <input 
                  type="date" 
                  className={modalStyles.input} 
                  value={editFormData.startDate} 
                  onChange={(e) => setEditFormData({...editFormData, startDate: e.target.value})} 
                />
              </div>
              <div className={modalStyles.formGroup}>
                <label className={modalStyles.label}>Mô tả</label>
                <textarea 
                  className={modalStyles.textarea} 
                  rows={3} 
                  value={editFormData.description} 
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} 
                ></textarea>
              </div>
              <div className={modalStyles.modalActions}>
                <button type="button" className={modalStyles.btnCancel} onClick={() => setShowEditModal(false)}>Hủy</button>
                <button type="submit" className={modalStyles.btnSubmit}>Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
