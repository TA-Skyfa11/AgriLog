/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import styles from '@/css/diaryDetail.module.css';
import modalStyles from '@/css/diary.module.css';
import { Trash2, Plus, FlaskConical, Download, Printer, ArrowLeft, X, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import CustomSelect from '@/components/ui/CustomSelect';


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
        resize: 'none',
        overflow: 'hidden'
      }}
    />
  );
};

export default function FertilizerDiaryDetailPage() {
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
        fetchAPI(`/fertilizer-boards/${params.boardId}`),
        fetchAPI(`/fertilizer-boards/${params.boardId}/entries`),
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
            quantity: '',
            unit: '',
            appliedArea: '',
            performer: '',
            weather: '',
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

  const handleMaterialChange = async (index: number, selectedMaterialId: string) => {
    const availableMaterials = materials.filter((m: any) => m.type === 'FERTILIZER');
    const selectedMaterial = availableMaterials.find((m: any) => m._id === selectedMaterialId);
    const newEntries = [...entries];
    if (selectedMaterial) {
      newEntries[index].materialName = selectedMaterial.name;
      newEntries[index].material = selectedMaterial._id;
      newEntries[index].unit = selectedMaterial.unit;
      if (selectedMaterial.manufacturer) {
        newEntries[index].manufacturer = selectedMaterial.manufacturer;
      }
    } else {
      newEntries[index].materialName = '';
      newEntries[index].material = undefined;
    }
    setEntries(newEntries);
    setTimeout(() => handleBlurSave(index), 100);
  };

  const handleBlurSave = async (index: number) => {
    const entry = entries[index];
    if (!entry.materialName || entry.materialName.trim() === '') return;
    
    setSavingId(entry._id || `new-${index}`);
    try {
      if (entry._id && !entry._id.startsWith('temp-')) {
        await fetchAPI(`/fertilizer-boards/entries/${entry._id}`, {
          method: 'PUT',
          body: JSON.stringify(entry),
        });
      } else {
        const payload = { ...entry };
        delete payload._id;

        const res = await fetchAPI(`/fertilizer-boards/${params.boardId}/entries`, {
          method: 'POST',
          body: JSON.stringify({
            ...payload,
            date: payload.date ? new Date(payload.date).toISOString() : new Date().toISOString(),
            quantity: payload.quantity || '',
            appliedArea: Number(payload.appliedArea) || 0,
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
        credentials: 'include',
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

  const handleDeleteBoard = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa bảng này không? Toàn bộ dữ liệu sẽ bị mất vĩnh viễn.')) {
      try {
        const res = await fetchAPI(`/fertilizer-boards/${params.boardId}`, { method: 'DELETE' });
        if (res.success) {
          router.push('/diary/fertilizer');
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
      const res = await fetchAPI(`/fertilizer-boards/${params.boardId}`, {
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

  const fetchWeather = async () => {
    try {
      const res = await fetchAPI('/weather');
      if (res.success && res.data) {
        return `${res.data.temp}°C, ${res.data.desc}`;
      }
    } catch (e) {
      console.error(e);
    }
    return '';
  };

  const handleAddNewRow = async () => {
    const weather = await fetchWeather();
    setEntries([
      ...entries,
      {
        date: new Date().toISOString().split('T')[0],
        materialName: '',
        manufacturer: '',
        quantity: '',
        appliedArea: '',
        performer: '',
        weather: weather,
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
    if (userPlan === 'BASIC') {
      alert('Gói cước Basic không hỗ trợ xuất file Excel. Vui lòng nâng cấp gói cước.');
      return;
    }
    
    import('xlsx').then((XLSX) => {
      const customCols = board?.customColumns || [];
      const data = entries.map((e, idx) => {
        const rowData: any = {
          'STT': idx + 1,
          'Ngày sử dụng': e.date ? format(new Date(e.date), 'dd/MM/yyyy') : '',
          'Tên phân bón': e.materialName || '—',
          'Nhà sản xuất': e.manufacturer || '—',
          'Liều lượng': e.quantity || '—',
          'Diện tích áp dụng (m²)': e.appliedArea || 0,
          'Người thực hiện': e.performer || '—',
          'Thời tiết': e.weather || '—',
          'Ghi chú': e.notes || '—'
        };
        customCols.forEach((col: string) => {
          rowData[col] = e.customValues?.[col] || '—';
        });
        return rowData;
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Phân bón');
      XLSX.writeFile(wb, `${board?.name || 'nhat_ky'}_phan_bon.xlsx`);
    });
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
    doc.setTextColor(59, 130, 246); // Blue 500
    doc.text(`NHAT KY PHAN BON: ${board?.name || ''}`, 14, 20);
    
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

    const headers = [
      'STT', 
      'Ngay su dung', 
      'Ten phan bon', 
      'Nha san xuat', 
      'Lieu luong', 
      'Dien tich (m2)', 
      'Nguoi thuc hien', 
      'Thoi tiet',
      'Ghi chu'
    ];
    
    const data = entries.map((e, idx) => [
      idx + 1,
      e.date ? format(new Date(e.date), 'dd/MM/yyyy') : '',
      (e.materialName || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      (e.manufacturer || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      (e.quantity || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      e.appliedArea || 0,
      (e.performer || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      (e.weather || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      (e.notes || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    ]);

    autoTable(doc as any, {
      startY: 42,
      head: [headers],
      body: data,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.1 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(`${board?.name || 'nhat_ky'}_phan_bon.pdf`);
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
          <button className={styles.spreadsheetBtn} onClick={() => setShowEditModal(true)}>
            ✎ Sửa bảng
          </button>
          <button className={styles.spreadsheetBtn} style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }} onClick={handleDeleteBoard}>
            🗑️ Xóa bảng
          </button>
          <button className={styles.spreadsheetBtn} onClick={() => alert('Thêm cột mới hiện tại là mock')} disabled={userPlan === 'FREE'} style={{ opacity: userPlan === 'FREE' ? 0.5 : 1, cursor: userPlan === 'FREE' ? 'not-allowed' : 'pointer' }} title={userPlan === 'FREE' ? 'Gói Miễn phí không hỗ trợ thêm cột mới' : ''}>
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
                <label className={modalStyles.label}>Tên bảng phân bón *</label>
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
              <th>Thời tiết</th>
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
                    {(() => {
                      const materialOptions = materials.filter((m: any) => m.type === 'FERTILIZER').map((m: any) => {
                        const isOutOfStock = m.quantity <= 0;
                        const isLowStock = m.quantity > 0 && m.quantity <= (m.minQuantityAlert || 50);
                        const isSelected = entry.material === m._id;
                        const labelSuffix = (isOutOfStock && !isSelected) ? ' (Hết hàng)' : (isLowStock && !isSelected) ? ' (Sắp hết)' : '';
                        return { label: m.name, value: m._id, disabled: isOutOfStock && entry.material !== m._id, suffix: labelSuffix };
                      });
                      return (
                        <CustomSelect
                          value={entry.material || ''}
                          onChange={(val) => handleMaterialChange(index, val)}
                          options={materialOptions}
                          placeholder="-- Chọn phân bón --"
                        />
                      );
                    })()}
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
                    <AutoResizeTextarea 
                      style={inlineInputStyle}
                      value={entry.weather || ''}
                      onChange={(e: any) => updateLocalEntry(index, 'weather', e.target.value)}
                      onBlur={() => handleBlurSave(index)}
                      placeholder="—"
                      className={styles.inlineInputHover}
                      maxLength={50}
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
