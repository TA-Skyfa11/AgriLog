export type BoardStatusType =
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'ACTIVE'
  | 'HARVESTING'
  | 'COMPLETED'
  | 'HARVESTED'
  | 'CANCELLED'
  | 'CLOSED';

export interface BoardStatusConfig {
  label: string;
  bg: string;
  color: string;
  border: string;
}

export const getBoardStatusDisplay = (
  status?: string | null,
  boardType: 'cultivation' | 'fertilizer' | 'pesticide' = 'cultivation'
): BoardStatusConfig => {
  const s = (status || '').toUpperCase();

  switch (s) {
    case 'PLANNING':
      return {
        label: 'Lên kế hoạch',
        bg: '#e0f2fe',
        color: '#0369a1',
        border: '#bae6fd',
      };
    case 'IN_PROGRESS':
    case 'ACTIVE':
      return {
        label: boardType === 'cultivation' ? 'Đang canh tác' : 'Đang sử dụng',
        bg: '#dcfce7',
        color: '#15803d',
        border: '#bbf7d0',
      };
    case 'HARVESTING':
      return {
        label: 'Đang thu hoạch',
        bg: '#fef3c7',
        color: '#b45309',
        border: '#fde68a',
      };
    case 'COMPLETED':
    case 'HARVESTED':
      return {
        label: boardType === 'cultivation' ? 'Đã thu hoạch' : 'Đã đóng',
        bg: '#f1f5f9',
        color: '#475569',
        border: '#cbd5e1',
      };
    case 'CLOSED':
      return {
        label: 'Đã đóng',
        bg: '#f1f5f9',
        color: '#475569',
        border: '#cbd5e1',
      };
    case 'CANCELLED':
      return {
        label: 'Đã hủy',
        bg: '#fee2e2',
        color: '#b91c1c',
        border: '#fecaca',
      };
    default:
      return {
        label: boardType === 'cultivation' ? 'Đang canh tác' : 'Đang sử dụng',
        bg: '#dcfce7',
        color: '#15803d',
        border: '#bbf7d0',
      };
  }
};

export const isBoardActive = (status?: string | null): boolean => {
  const s = (status || '').toUpperCase();
  return s === 'ACTIVE' || s === 'IN_PROGRESS' || s === 'PLANNING' || s === 'HARVESTING';
};
