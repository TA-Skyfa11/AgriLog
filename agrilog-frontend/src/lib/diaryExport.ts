import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { getApiUrl } from '@/lib/api';

/**
 * Xuất file Excel gộp cả 3 bảng nhật ký thành 3 sheet riêng biệt
 */
export const exportUnifiedDiaryExcel = async (
  boardId: string,
  boardName?: string,
  allowExport: boolean = true
) => {
  if (!allowExport) {
    toast.error('Gói cước hiện tại không hỗ trợ xuất file Excel. Vui lòng nâng cấp gói cước.');
    return;
  }

  const toastId = toast.loading('Đang chuẩn bị file Excel tổng hợp 3 bảng...');
  try {
    const apiUrl = getApiUrl();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await fetch(`${apiUrl}/export/data/unified/${boardId}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi khi tải dữ liệu xuất Excel');
    }

    const resData = await res.json();
    const { mainBoard, cultivation, fertilizer, pesticide } = resData;

    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    // 1. SHEET 1: NHẬT KÝ CANH TÁC & CHĂM SÓC
    const cultCols = cultivation?.board?.customColumns || [];
    const cultRows = (cultivation?.entries || []).map((e: any, idx: number) => {
      const row: any = {
        'STT': idx + 1,
        'Ngày': e.date ? format(new Date(e.date), 'dd/MM/yyyy') : '',
        'Giai đoạn': e.stage || '—',
        'Hoạt động canh tác': e.activityName || '—',
        'Người thực hiện': e.performer || '—',
        'Thời tiết': e.weather || '—',
        'Ghi chú': e.notes || '—',
      };
      cultCols.forEach((col: string) => {
        row[col] = e.customValues?.[col] || '—';
      });
      return row;
    });

    const ws1 = XLSX.utils.json_to_sheet(
      cultRows.length > 0 ? cultRows : [{ 'Thông báo': 'Chưa có dữ liệu nhật ký canh tác' }]
    );
    if (cultRows.length > 0) {
      ws1['!cols'] = Object.keys(cultRows[0]).map((key) => {
        let maxLen = key.length;
        cultRows.forEach((r: any) => {
          const l = r[key]?.toString().length || 0;
          if (l > maxLen) maxLen = l;
        });
        return { wch: Math.min(Math.max(maxLen, 10), 50) + 2 };
      });
    }
    XLSX.utils.book_append_sheet(wb, ws1, '1. Nhật ký Canh tác');

    // 2. SHEET 2: NHẬT KÝ SỬ DỤNG PHÂN BÓN
    const fertCols = fertilizer?.board?.customColumns || [];
    const fertRows = (fertilizer?.entries || []).map((e: any, idx: number) => {
      const row: any = {
        'STT': idx + 1,
        'Ngày bón': e.date ? format(new Date(e.date), 'dd/MM/yyyy') : '',
        'Tên phân bón': e.materialName || '—',
        'Nhà sản xuất': e.manufacturer || '—',
        'Liều lượng': e.quantity || '—',
        'Diện tích áp dụng (m²)': e.appliedArea || 0,
        'Người thực hiện': e.performer || '—',
        'Thời tiết': e.weather || '—',
        'Ghi chú': e.notes || '—',
      };
      fertCols.forEach((col: string) => {
        row[col] = e.customValues?.[col] || '—';
      });
      return row;
    });

    const ws2 = XLSX.utils.json_to_sheet(
      fertRows.length > 0 ? fertRows : [{ 'Thông báo': 'Chưa có dữ liệu nhật ký bón phân' }]
    );
    if (fertRows.length > 0) {
      ws2['!cols'] = Object.keys(fertRows[0]).map((key) => {
        let maxLen = key.length;
        fertRows.forEach((r: any) => {
          const l = r[key]?.toString().length || 0;
          if (l > maxLen) maxLen = l;
        });
        return { wch: Math.min(Math.max(maxLen, 10), 50) + 2 };
      });
    }
    XLSX.utils.book_append_sheet(wb, ws2, '2. Nhật ký Bón phân');

    // 3. SHEET 3: NHẬT KÝ SỬ DỤNG THUỐC BVTV
    const pestCols = pesticide?.board?.customColumns || [];
    const pestRows = (pesticide?.entries || []).map((e: any, idx: number) => {
      const row: any = {
        'STT': idx + 1,
        'Ngày phun': e.date ? format(new Date(e.date), 'dd/MM/yyyy') : '',
        'Tên thuốc BVTV': e.materialName || '—',
        'Hoạt chất': e.activeIngredient || '—',
        'Mục tiêu phòng trừ': e.targetPest || '—',
        'Liều lượng': e.quantity || '—',
        'Thời gian cách ly (ngày)': e.phiDays || 0,
        'Người thực hiện': e.performer || '—',
        'Thời tiết': e.weather || '—',
        'Ghi chú': e.notes || '—',
      };
      pestCols.forEach((col: string) => {
        row[col] = e.customValues?.[col] || '—';
      });
      return row;
    });

    const ws3 = XLSX.utils.json_to_sheet(
      pestRows.length > 0 ? pestRows : [{ 'Thông báo': 'Chưa có dữ liệu nhật ký thuốc BVTV' }]
    );
    if (pestRows.length > 0) {
      ws3['!cols'] = Object.keys(pestRows[0]).map((key) => {
        let maxLen = key.length;
        pestRows.forEach((r: any) => {
          const l = r[key]?.toString().length || 0;
          if (l > maxLen) maxLen = l;
        });
        return { wch: Math.min(Math.max(maxLen, 10), 50) + 2 };
      });
    }
    XLSX.utils.book_append_sheet(wb, ws3, '3. Nhật ký Thuốc BVTV');

    const rawName = mainBoard?.name || boardName || 'nhat_ky';
    const cleanFileName = `${rawName.replace(/[^\p{L}\p{N}_-]+/gu, '_')}_tong_hop.xlsx`;
    XLSX.writeFile(wb, cleanFileName);

    toast.success('Xuất file Excel tổng hợp 3 bảng thành công!', { id: toastId });
  } catch (error: any) {
    console.error('Lỗi khi xuất file Excel:', error);
    toast.error(error.message || 'Không thể xuất file Excel', { id: toastId });
  }
};

/**
 * Xuất file PDF gộp cả 3 bảng nhật ký thành 3 phần rõ ràng
 */
export const exportUnifiedDiaryPDF = async (
  boardId: string,
  boardName?: string,
  userPlan: string = 'BASIC'
) => {
  if (userPlan === 'BASIC') {
    toast.error('Gói cước Basic không hỗ trợ xuất file PDF. Vui lòng nâng cấp gói cước.');
    return;
  }

  const toastId = toast.loading('Đang khởi tạo file PDF tổng hợp 3 bảng...');
  try {
    const apiUrl = getApiUrl();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await fetch(`${apiUrl}/export/pdf/unified/${boardId}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi khi xuất file PDF');
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    const rawName = boardName || 'nhat_ky';
    a.download = `${rawName.replace(/[^\p{L}\p{N}_-]+/gu, '_')}_tong_hop.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);

    toast.success('Xuất file PDF tổng hợp 3 bảng thành công!', { id: toastId });
  } catch (error: any) {
    console.error('Lỗi khi xuất file PDF:', error);
    toast.error(error.message || 'Không thể xuất file PDF', { id: toastId });
  }
};
