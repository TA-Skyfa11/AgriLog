'use client';
/* eslint-disable react-hooks/set-state-in-effect */

const formatCompactWeather = (temp: any, desc?: any) => {
  if (!temp && !desc) return '30°C';
  const cleanTemp = typeof temp === 'string' ? temp.replace('°', '').replace('C', '').replace('Â', '').trim() : temp;
  return cleanTemp ? `${cleanTemp}°C` : (desc || '30°C');
};

const getShortWeatherDisplay = (weather: string | undefined | null) => {
  if (!weather) return '30°C';
  const tempMatch = weather.match(/\d+°C|\d+°/);
  if (tempMatch) {
    return tempMatch[0].includes('C') ? tempMatch[0] : `${tempMatch[0]}C`;
  }
  if (weather.includes(',')) {
    return weather.split(',')[0].trim();
  }
  return weather.trim();
};

const isEntryToday = (dateVal: any) => {
  if (!dateVal) return true;
  const todayStr = new Date().toLocaleDateString('en-CA');
  const dateStr = typeof dateVal === 'string' ? dateVal.split('T')[0] : new Date(dateVal).toLocaleDateString('en-CA');
  return dateStr === todayStr;
};

import { exportUnifiedDiaryExcel, exportUnifiedDiaryPDF } from '@/lib/diaryExport';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchAPI, getApiUrl } from '@/lib/api';
import styles from '@/css/diaryDetail.module.css';
import modalStyles from '@/css/diary.module.css';
import { Trash2, Plus, ShieldAlert, Download, Printer, ArrowLeft, Image as ImageIcon, X, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import CustomSelect from '@/components/ui/CustomSelect';
import DropdownWithOther from '@/components/ui/DropdownWithOther';
import { useCropStandards } from '@/hooks/useCropStandards';
import { toast } from 'react-hot-toast';
import { useDialog } from '@/context/DialogContext';
import { getSafeImageUrl } from '@/lib/image';


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
        minWidth: '120px',
        whiteSpace: 'normal',
        wordBreak: 'normal',
        ...props.style,
        overflow: 'hidden',
        resize: 'none',
      }}
    />
  );
};

export default function PesticideDiaryDetailPage() {
  const standards = useCropStandards();
  const params = useParams();
  const router = useRouter();
  const dialog = useDialog();
  const [board, setBoard] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const lastSavedEntries = useRef<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const entriesRef = useRef<any[]>(entries);
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState('BASIC');
  const [allowExport, setAllowExport] = useState<boolean>(true);

  const inlineInputStyle: React.CSSProperties = {
    width: '100%',
    minWidth: '120px',
    whiteSpace: 'normal',
    wordBreak: 'normal',
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
      const [boardRes, entriesRes, materialsRes, profileRes, weatherRes] = await Promise.all([
        fetchAPI(`/pesticide-boards/${params.boardId}`),
        fetchAPI(`/pesticide-boards/${params.boardId}/entries`),
        fetchAPI('/materials'),
        fetchAPI('/farm/profile'),
        fetchAPI('/weather').catch(() => null),
      ]);

      const currentWeatherData = weatherRes?.success && weatherRes?.data
        ? formatCompactWeather(weatherRes.data.temp, weatherRes.data.desc)
        : '30°C, Quang đãng';
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
        const mapped = (entriesRes.data || []).map((entry: any) => ({
          weather: (isEntryToday(entry.date) || !entry.activityName || !entry.weather) ? currentWeatherData : (entry.weather.includes('Bầu trời quang đãng') ? entry.weather.replace('Bầu trời quang đãng', 'Quang đãng') : entry.weather),
          ...entry,
          phiDays: (entry.phiDays === '-1' || !entry.phiDays) ? '7' : entry.phiDays,
        }));
        setEntries(mapped);
        // Auto-register any custom performers in existing entries
        mapped.forEach((e: any) => {
          if (e.performer && e.performer !== 'Chủ hộ' && e.performer !== '—') {
            standards.addCustomPerformer?.(e.performer);
          }
        });
        lastSavedEntries.current = JSON.parse(JSON.stringify(mapped));
      }
      if (materialsRes.success) setMaterials(materialsRes.data);
      if (profileRes.success) {
        setUserPlan(profileRes.data.plan || 'BASIC');
        setAllowExport(profileRes.data.allowExport !== false);
      }
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

  const updateLocalEntry = (index: number, field: string, value: any, isCustom: boolean = false) => {
    const newEntries = [...(entriesRef.current || entries)];
    if (isCustom) {
      newEntries[index].customValues = { ...newEntries[index].customValues, [field]: value };
    } else {
      newEntries[index][field] = value;
    }
    if (entriesRef.current) entriesRef.current = newEntries;
    setEntries(newEntries);
  };

  const handleMaterialChange = async (index: number, selectedMaterialId: string) => {
    const availableMaterials = materials.filter((m: any) => m.type === 'PESTICIDE');
    const selectedMaterial = availableMaterials.find((m: any) => m._id === selectedMaterialId);
    const newEntries = [...entries];
    if (selectedMaterial) {
      newEntries[index].materialName = selectedMaterial.name;
      newEntries[index].material = selectedMaterial._id;
      newEntries[index].unit = selectedMaterial.unit;
      newEntries[index].manufacturer = selectedMaterial.manufacturer || '';
      // Tự động điền hoạt chất từ kho vật tư
      newEntries[index].activeIngredient = selectedMaterial.activeIngredient || '';
      if (!newEntries[index].phiDays || newEntries[index].phiDays === '-1') {
        newEntries[index].phiDays = '7';
      }
    } else {
      newEntries[index].materialName = '';
      newEntries[index].material = undefined;
      newEntries[index].activeIngredient = '';
    }
    setEntries(newEntries);
    setTimeout(() => handleBlurSave(index), 100);
  };

  const handleBlurSave = async (index: number) => {
    const entry = (entriesRef.current || entries)[index];
    if (!entry) return;
    
    // For unsaved temp rows, only save if something has been typed
    if (entry._id?.startsWith('temp-') && !entry.materialName && !entry.notes && !entry.quantity && !entry.targetPest && !entry.performer) return;
    
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
            date: payload.date || format(new Date(), 'yyyy-MM-dd'),
            quantity: payload.quantity || '',
            phiDays: Number(payload.phiDays) || 0,
            cost: Number(payload.cost) || 0,
          }),
        });
        if (res.success) {
          const newEntries = [...entries];
          newEntries[index] = res.data;
          setEntries(newEntries);
          lastSavedEntries.current[index] = { ...res.data };
          toast.success('Đã lưu thành công');
        }
      }
      if (entry._id && !entry._id.startsWith('temp-')) {
          lastSavedEntries.current[index] = { ...entry };
        }
      } catch (error: any) {
        toast.error(error.message || 'Lỗi lưu', { id: 'save-error' });
        // Khôi phục giá trị đã lưu trước đó nếu lưu thất bại
        if (lastSavedEntries.current && lastSavedEntries.current[index]) {
          setEntries((prev) => {
            const next = [...prev];
            next[index] = { ...lastSavedEntries.current[index] };
            return next;
          });
        }
      } finally {
      setSavingId(null);
    }
  };

    const handleRemoveImage = async (index: number, imageIndex: number) => {
    if (await dialog.confirm('Bạn có chắc chắn muốn xóa ảnh này?', 'Xác nhận xóa ảnh')) {
      const newEntries = [...entries];
      if (newEntries[index].imageUrls && newEntries[index].imageUrls.length > imageIndex) {
        newEntries[index].imageUrls.splice(imageIndex, 1);
        setEntries(newEntries);
        handleBlurSave(index);
        toast.success('Đã xóa ảnh');
      }
    }
  };

  const handleReplaceImage = async (index: number, imageIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      toast.loading('Đang thay thế ảnh...', { id: 'replace-img' });
      const apiUrl = getApiUrl();
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
      toast.dismiss('replace-img');
      if (data.success) {
        const newEntries = [...entries];
        if (!newEntries[index].imageUrls) {
          newEntries[index].imageUrls = [];
        }
        let finalUrl = data.imageUrl;
        if (/^https?:\/\/(localhost|127\.0\.0\.1):5000/i.test(finalUrl)) {
          finalUrl = finalUrl.replace(/^https?:\/\/(localhost|127\.0\.0\.1):5000/i, '');
        }
        newEntries[index].imageUrls[imageIndex] = finalUrl;
        setEntries(newEntries);
        handleBlurSave(index);
        toast.success('Đã thay ảnh mới thành công!');
      } else {
        toast.error(data.message || 'Lỗi tải ảnh');
      }
    } catch (error) {
      toast.dismiss('replace-img');
      toast.error('Có lỗi xảy ra khi thay ảnh');
    }
  };

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const apiUrl = getApiUrl();
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
        let finalUrl = data.imageUrl;
        if (/^https?:\/\/(localhost|127\.0\.0\.1):5000/i.test(finalUrl)) {
          finalUrl = finalUrl.replace(/^https?:\/\/(localhost|127\.0\.0\.1):5000/i, '');
        }
        newEntries[index].imageUrls.push(finalUrl);
        setEntries(newEntries);
        handleBlurSave(index);
      } else {
        toast.error(data.message || 'Lỗi tải ảnh lên');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tải ảnh');
    }
  };

  const handleAddColumn = async () => {
    const colName = await dialog.prompt('Nhập tên cột mới cần thêm (Ví dụ: Thiết bị phun, Tỷ lệ pha...):', '', 'Thêm cột mới');
    if (!colName || !colName.trim()) return;
    
    const trimmedColName = colName.trim();
    if (board.customColumns?.includes(trimmedColName)) {
      toast.error('Cột này đã tồn tại!');
      return;
    }

    const plan = userPlan || 'BASIC';
    const limits: Record<string, number> = {
      FREE: 0,
      BASIC: 10,
      STANDARD: 15,
      PREMIUM: 25
    };
    const maxColumns = limits[plan] !== undefined ? limits[plan] : 10;
    const currentCustomColumns = board.customColumns?.length || 0;

    if (currentCustomColumns >= maxColumns) {
      toast.error(`Gói dịch vụ ${plan} của bạn chỉ cho phép thêm tối đa ${maxColumns} cột tùy chỉnh. Vui lòng nâng cấp gói dịch vụ để thêm!`);
      return;
    }

    try {
      const updatedColumns = [...(board.customColumns || []), trimmedColName];
      const res = await fetchAPI(`/pesticide-boards/${params.boardId}`, {
        method: 'PUT',
        body: JSON.stringify({ customColumns: updatedColumns })
      });
      if (res.success) {
        toast.success(`Đã thêm thành công cột "${trimmedColName}"!`);
        loadData();
      }
    } catch (e) {
      toast.error('Có lỗi xảy ra khi thêm cột');
    }
  };

  const handleEditColumn = async (oldName: string) => {
    const newName = await dialog.prompt('Nhập tên mới cho cột:', oldName, 'Đổi tên cột');
    if (!newName || !newName.trim() || newName.trim() === oldName) return;
    const trimmedName = newName.trim();
    if (board.customColumns?.includes(trimmedName)) {
      toast.error('Tên cột đã tồn tại!');
      return;
    }
    
    if (!(await dialog.confirm('Đổi tên cột sẽ mất một chút thời gian để cập nhật dữ liệu cũ. Bạn có tiếp tục?', 'Xác nhận đổi tên'))) return;

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

      toast.success('Đổi tên cột thành công!');
      loadData();
    } catch (e) {
      toast.error('Lỗi khi đổi tên cột');
    }
  };

  const handleDeleteColumn = async (colName: string) => {
    if (!(await dialog.confirm(`Bạn có chắc chắn muốn xóa cột "${colName}" không? Dữ liệu của cột này sẽ không còn được hiển thị.`, 'Xác nhận xóa cột'))) return;
    
    try {
      const updatedColumns = board.customColumns?.filter((col: string) => col !== colName) || [];
      const res = await fetchAPI(`/pesticide-boards/${params.boardId}`, {
        method: 'PUT',
        body: JSON.stringify({ customColumns: updatedColumns })
      });
      if (res.success) {
        toast.success(`Đã xóa cột "${colName}" thành công!`);
        loadData();
      }
    } catch (e) {
      toast.error('Có lỗi xảy ra khi xóa cột');
    }
  };

  const handleDeleteBoard = async () => {
    if (await dialog.confirm('Bạn có chắc chắn muốn xóa bảng này không? Toàn bộ dữ liệu sẽ bị mất vĩnh viễn.', 'Xác nhận xóa bảng')) {
      try {
        const res = await fetchAPI(`/pesticide-boards/${params.boardId}`, { method: 'DELETE' });
        if (res.success) {
          toast.success('Xóa bảng thành công');
          router.push('/diary/pesticide');
        } else {
          toast.error('Lỗi khi xóa bảng');
        }
      } catch (e) {
        toast.error('Lỗi kết nối khi xóa bảng');
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
        toast.success('Cập nhật thông tin bảng thành công');
      } else {
        toast.error('Lỗi khi cập nhật bảng');
      }
    } catch (e) {
      toast.error('Lỗi kết nối khi cập nhật bảng');
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
    const today = format(new Date(), 'yyyy-MM-dd');
    try {
      const res = await fetchAPI(`/pesticide-boards/${params.boardId}/entries`, {
        method: 'POST',
        body: JSON.stringify({
          date: today,
          weather: weather,
          materialName: '',
          activeIngredient: '',
          targetPest: '',
          quantity: '',
          phiDays: 7,
          performer: '',
          cost: 0,
          notes: '',
          customValues: {},
        }),
      });
      if (res.success) {
        setEntries((prev) => [...prev, res.data]);
        lastSavedEntries.current.push({ ...res.data });
        toast.success('Đã thêm hàng mới');
      } else {
        toast.error(res.message || 'Lỗi khi thêm hàng');
      }
    } catch (e: any) {
      toast.error('Lỗi khi thêm hàng');
    }
  };
  
  const handleDeleteEntry = async (id: string, index: number) => {
    if (!(await dialog.confirm('Bạn có chắc muốn xóa hàng này? ', 'Xác nhận xóa hàng'))) return;
    if (!id || id.startsWith('temp-')) {
      const newEntries = [...entries];
      newEntries.splice(index, 1);
      setEntries(newEntries);
      lastSavedEntries.current.splice(index, 1);
      return;
    }
    try {
      const res = await fetchAPI(`/pesticide-boards/entries/${id}`, { method: 'DELETE' });
      if (res.success) {
        toast.success('Đã xóa hàng và đồng bộ sang các bảng liên quan');
        setEntries((prev) => prev.filter((e: any) => e._id !== id));
      } else {
        toast.error(res.message || 'Lỗi xóa hàng');
      }
    } catch (error) {
      toast.error('Lỗi xóa hàng');
    }
  };

  const exportToExcel = () => {
    exportUnifiedDiaryExcel(params.boardId as string, board?.name, allowExport);
  };

  const exportToPDF = () => {
    exportUnifiedDiaryPDF(params.boardId as string, board?.name, userPlan);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.actionHeader}>
          <Link href="/diary/pesticide" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--color-text-muted)' }}>
            <ArrowLeft size={16} /> Danh sách bảng thuốc BVTV
          </Link>
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ width: '260px', height: '28px', backgroundColor: '#e2e8f0', borderRadius: '6px', marginBottom: '8px' }}></div>
          <div style={{ width: '380px', height: '18px', backgroundColor: '#e2e8f0', borderRadius: '6px' }}></div>
        </div>
        <div className={styles.list}>
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: '#64748b' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '4px solid #16a34a', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
            <div>Đang tải dữ liệu bảng thuốc BVTV...</div>
          </div>
        </div>
      </div>
    );
  }
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
          <button className={styles.spreadsheetBtn} onClick={handleAddColumn} disabled={userPlan === 'FREE'} style={{ opacity: userPlan === 'FREE' ? 0.5 : 1, cursor: userPlan === 'FREE' ? 'not-allowed' : 'pointer' }} title={userPlan === 'FREE' ? 'Gói Miễn phí không hỗ trợ thêm cột mới' : ''}>
            + Thêm cột
          </button>
          <button className={styles.spreadsheetBtn} onClick={exportToPDF} disabled={userPlan === 'BASIC'} style={{ opacity: userPlan === 'BASIC' ? 0.5 : 1, cursor: userPlan === 'BASIC' ? 'not-allowed' : 'pointer' }} title={userPlan === 'BASIC' ? 'Nâng cấp gói cước để sử dụng tính năng này' : ''}>
            <Printer size={16} /> PDF
          </button>
          <button className={styles.spreadsheetBtn} onClick={exportToExcel} disabled={!allowExport} style={{ opacity: !allowExport ? 0.5 : 1, cursor: !allowExport ? 'not-allowed' : 'pointer' }} title={!allowExport ? 'Nâng cấp gói cước để sử dụng tính năng này' : 'In / Xuất dữ liệu tổng hợp 3 bảng'}>
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
              <th style={{ width: '45px', minWidth: '45px', textAlign: 'center' }}>#</th>
              <th style={{ width: '140px', minWidth: '140px' }}>Ngày sử dụng</th>
              <th style={{ width: '180px', minWidth: '180px' }}>Tên thuốc</th>
              <th style={{ width: '160px', minWidth: '160px' }}>Hoạt chất</th>
              <th style={{ width: '180px', minWidth: '180px' }}>Mục tiêu phòng trừ</th>
              <th style={{ width: '140px', minWidth: '140px' }}>Liều lượng</th>
              <th style={{ width: '140px', minWidth: '140px' }}>Thời gian cách ly</th>
              <th style={{ width: '150px', minWidth: '150px' }}>Người thực hiện</th>
              <th style={{ width: '80px', minWidth: '80px', whiteSpace: 'nowrap', textAlign: 'center' }}>Thời tiết</th>
              <th style={{ width: '180px', minWidth: '180px' }}>Ghi chú</th>
              {board.customColumns?.map((col: string, idx: number) => (
                <th key={idx} style={{ width: '160px', minWidth: '160px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span>{col}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => handleEditColumn(col)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ea580c', fontSize: '14px' }} title="Sửa tên cột">✎</button>
                      <button onClick={() => handleDeleteColumn(col)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red', fontSize: '14px' }} title="Xóa cột">✕</button>
                    </div>
                  </div>
                </th>
              ))}
              <th style={{ width: '90px', minWidth: '90px', whiteSpace: 'nowrap', textAlign: 'center' }}>Hình ảnh</th>
              <th className={styles.actionColumnHeader} style={{ width: '80px', minWidth: '80px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={12 + (board?.customColumns?.length || 0)} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
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
                    {(() => {
                      const materialOptions = materials.filter((m: any) => m.type === 'PESTICIDE').map((m: any) => {
                        const isExpired = Boolean(m.expiryDate && new Date(m.expiryDate).setHours(23, 59, 59, 999) < Date.now());
                        const isOutOfStock = m.quantity <= 0;
                        const isLowStock = m.quantity > 0 && m.quantity <= (m.minQuantityAlert || 5);
                        const isSelected = entry.material === m._id;
                        let labelSuffix = '';
                        if (isExpired) labelSuffix = ' (Hết hạn)';
                        else if (isOutOfStock && !isSelected) labelSuffix = ' (Hết hàng)';
                        else if (isLowStock && !isSelected) labelSuffix = ' (Sắp hết)';
                        return { 
                          label: m.name, 
                          value: m._id, 
                          disabled: (isExpired && !isSelected) || (isOutOfStock && !isSelected), 
                          suffix: labelSuffix 
                        };
                      });
                      return (
                        <CustomSelect
                          value={entry.material || ''}
                          onChange={(val) => { handleMaterialChange(index, val); handleBlurSave(index); }}
                          options={materialOptions}
                          placeholder="-- Chọn thuốc --"
                        />
                      );
                    })()}
                  </td>
                  <td>
                    {entry.material || entry.materialName ? (
                      <div 
                        style={{ ...inlineInputStyle, background: '#fef2f2', color: '#991b1b', fontWeight: 500 }}
                        title={entry.activeIngredient || 'Chưa có thông tin hoạt chất trong kho'}
                      >
                        {entry.activeIngredient || '—'}
                      </div>
                    ) : (
                      <div style={{ ...inlineInputStyle, color: '#9ca3af', background: '#f3f4f6', cursor: 'not-allowed' }}>
                        — (Chọn thuốc)
                      </div>
                    )}
                  </td>
                  <td>
                    <DropdownWithOther 
                      style={inlineInputStyle}
                      options={standards.pests}
                      value={entry.targetPest || ''}
                      onChange={(val: string) => updateLocalEntry(index, 'targetPest', val)}
                      onBlur={() => handleBlurSave(index)}
                      placeholder="-- Đối tượng phòng trừ --"
                      maxLength={100}
                    />
                  </td>
                  <td>
                    <DropdownWithOther 
                      style={inlineInputStyle}
                      options={standards.pesticideDosages}
                      value={entry.quantity || ''}
                      onChange={(val: string) => updateLocalEntry(index, 'quantity', val)}
                      onBlur={() => handleBlurSave(index)}
                      placeholder="-- Chọn liều lượng phun --"
                      maxLength={50}
                    />
                  </td>
                  <td>
                    <DropdownWithOther 
                      style={inlineInputStyle}
                      options={standards.phiOptions}
                      value={entry.phiDays ? `${entry.phiDays} ngày` : '7 ngày'}
                      onChange={(val: string) => {
                        const numeric = val.match(/\d+/)?.[0] || val;
                        updateLocalEntry(index, 'phiDays', numeric);
                      }}
                      onBlur={() => handleBlurSave(index)}
                      placeholder="-- Cách ly (PHI) --"
                      maxLength={20}
                    />
                  </td>
                  <td>
                    <DropdownWithOther 
                      style={inlineInputStyle}
                      options={standards.performers}
                      value={entry.performer || ''}
                      onChange={(val: string) => updateLocalEntry(index, 'performer', val)}
                      onBlur={() => handleBlurSave(index)}
                      onAddCustomOption={(val: string) => standards.addCustomPerformer?.(val)}
                      onDeleteCustomOption={(val: string) => standards.removeCustomPerformer?.(val)}
                      placeholder="-- Người phun --"
                      maxLength={50}
                    />
                  </td>
                                    <td style={{ verticalAlign: 'middle', textAlign: 'center', width: '80px' }}>
                    <div 
                      style={{
                        background: '#f0fdf4',
                        color: '#15803d',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        cursor: 'default',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid #bbf7d0',
                        lineHeight: '1.4',
                      }}
                      title={entry.weather ? `${entry.weather} (Tự động cập nhật theo Dashboard)` : '30°C (Tự động cập nhật theo Dashboard)'}
                    >
                      <span style={{ fontSize: '11px' }}>🌤️</span>
                      <span>{getShortWeatherDisplay(entry.weather)}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-text-muted)' }}>
                    <DropdownWithOther 
                      style={inlineInputStyle}
                      options={[
                        'Phun phòng định kỳ',
                        'Phun dập dịch khi chớm bệnh',
                        'Phun sáng sớm lúc tạnh sương',
                        'Phun chiều mát tránh bốc hơi',
                        'Phun nhắc lại sau 5 - 7 ngày',
                        'Tuân thủ thời gian cách ly trước thu hoạch'
                      ]}
                      value={entry.notes || ''}
                      onChange={(val: string) => updateLocalEntry(index, 'notes', val)}
                      onBlur={() => handleBlurSave(index)}
                      placeholder="-- Ghi chú / Khuyến cáo --"
                    />
                  </td>
                  {board.customColumns?.map((col: string, cIdx: number) => (
                    <td key={cIdx}>
                      <AutoResizeTextarea 
                        style={inlineInputStyle}
                        value={entry.customValues?.[col] || ''}
                        onChange={(e: any) => updateLocalEntry(index, col, e.target.value, true)}
                        onBlur={() => handleBlurSave(index)}
                        placeholder="—"
                        className={styles.inlineInputHover}
                        maxLength={100}
                      />
                    </td>
                  ))}
                                    <td style={{ verticalAlign: 'middle', textAlign: 'center', width: '90px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
                      {entry.imageUrls && entry.imageUrls.length > 0 ? (
                        entry.imageUrls.map((url: string, i: number) => (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <div onClick={() => setPreviewImage(getSafeImageUrl(url))} style={{ cursor: 'pointer' }} title="Click để xem ảnh lớn">
                                <img 
                                  src={getSafeImageUrl(url)} 
                                  alt="Ảnh đính kèm" 
                                  style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #d1d5db', display: 'block' }} 
                                />
                              </div>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRemoveImage(index, i); }}
                                style={{
                                  position: 'absolute',
                                  top: '-5px',
                                  right: '-5px',
                                  background: '#ef4444',
                                  color: 'white',
                                  borderRadius: '50%',
                                  width: '18px',
                                  height: '18px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1.5px solid white',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  padding: 0,
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                }}
                                title="Xóa ảnh này"
                              >
                                ✕
                              </button>
                            </div>
                            <label
                              style={{
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '11px',
                                color: '#2563eb',
                                padding: '1px 5px',
                                background: '#eff6ff',
                                borderRadius: '3px',
                                border: '1px solid #bfdbfe',
                                whiteSpace: 'nowrap'
                              }}
                              title="Chọn ảnh khác thay thế"
                            >
                              <RefreshCw size={10} /> Đổi ảnh
                              <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleReplaceImage(index, i, e)} />
                            </label>
                          </div>
                        ))
                      ) : (
                        <label 
                          className={styles.uploadBtn} 
                          style={{ 
                            cursor: 'pointer', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px', 
                            padding: '4px 8px', 
                            fontSize: '12px',
                            background: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            color: '#374151',
                            whiteSpace: 'nowrap'
                          }}
                          title="Tải ảnh minh chứng"
                        >
                          <ImageIcon size={13} /> Tải ảnh
                          <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleImageUpload(index, e)} />
                        </label>
                      )}
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