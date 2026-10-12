'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/lib/api';
import {
  SHORT_TERM_STAGES as FALLBACK_STAGES,
  SHORT_TERM_ACTIVITIES as FALLBACK_ACTIVITIES,
  STAGE_TO_DEFAULT_ACTIVITY as FALLBACK_MAP,
  SHORT_TERM_TARGET_PESTS as FALLBACK_PESTS,
  FERTILIZER_DOSAGE_OPTIONS as FALLBACK_FERT_DOSAGES,
  FERTILIZER_NOTES_OPTIONS as FALLBACK_FERT_PURPOSES,
  PESTICIDE_DOSAGE_OPTIONS as FALLBACK_PEST_DOSAGES,
  PHI_OPTIONS as FALLBACK_PHI,
  PERFORMER_OPTIONS as FALLBACK_PERFORMERS,
  WEATHER_OPTIONS as FALLBACK_WEATHER,
} from '@/lib/cropConstants';

export interface CropStandardsData {
  stages: string[];
  activities: string[];
  pests: string[];
  fertilizerDosages: string[];
  fertilizerPurposes: string[];
  pesticideDosages: string[];
  phiOptions: string[];
  performers: string[];
  weatherOptions: string[];
  stageToActivities: Record<string, string[]>;
  stageToDefaultActivity: Record<string, string>;
  loading: boolean;
  addCustomPerformer?: (name: string) => void;
  removeCustomPerformer?: (name: string) => void;
}

const getPerformerStorageKey = () => {
  if (typeof window === 'undefined') return 'farm_performers_default';
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      const uid = u._id || u.id || u.email;
      if (uid) return `farm_performers_${uid}`;
    }
  } catch {}
  return 'farm_performers_default';
};

const getLocalCustomPerformers = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getPerformerStorageKey());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalCustomPerformers = (list: string[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getPerformerStorageKey(), JSON.stringify(list));
  } catch {}
};

// In-memory cache across component mounts
let cachedStandards: any = null;
let pendingPromise: Promise<any> | null = null;

export function useCropStandards(cropGroup: string = 'SHORT_TERM'): CropStandardsData {
  const [customPerformers, setCustomPerformers] = useState<string[]>([]);

  // Filter out any legacy hardcoded performers
  const sanitizePerformers = useCallback((rawList: string[], customList: string[]) => {
    const excluded = new Set(['Kỹ thuật viên', 'Công nhân', 'Tổ BVTV']);
    const cleanedBase = (rawList || []).filter((p) => !excluded.has(p));
    const merged = ['Chủ hộ', ...cleanedBase, ...customList];
    return Array.from(new Set(merged)).filter(Boolean);
  }, []);

  const [data, setData] = useState<CropStandardsData>(() => {
    const initialCustom = getLocalCustomPerformers();
    return {
      stages: cachedStandards?.stages || FALLBACK_STAGES,
      activities: cachedStandards?.activities || FALLBACK_ACTIVITIES,
      pests: cachedStandards?.pests || FALLBACK_PESTS,
      fertilizerDosages: cachedStandards?.fertilizerDosages || FALLBACK_FERT_DOSAGES,
      fertilizerPurposes: cachedStandards?.fertilizerPurposes || FALLBACK_FERT_PURPOSES,
      pesticideDosages: cachedStandards?.pesticideDosages || FALLBACK_PEST_DOSAGES,
      phiOptions: cachedStandards?.phiOptions || FALLBACK_PHI,
      performers: sanitizePerformers(cachedStandards?.performers || FALLBACK_PERFORMERS, initialCustom),
      weatherOptions: cachedStandards?.weatherOptions || FALLBACK_WEATHER,
      stageToActivities: cachedStandards?.stageToActivities || {},
      stageToDefaultActivity: cachedStandards?.stageToDefaultActivity || FALLBACK_MAP,
      loading: !cachedStandards,
    };
  });

  // Sync custom performers from backend for this farm account
  useEffect(() => {
    let isMounted = true;
    const local = getLocalCustomPerformers();
    setCustomPerformers(local);

    const fetchFarmPerformers = async () => {
      try {
        const res = await fetchAPI('/farm/performers');
        if (res && res.success && Array.isArray(res.performers) && isMounted) {
          const combined = Array.from(new Set([...local, ...res.performers]));
          setCustomPerformers(combined);
          saveLocalCustomPerformers(combined);
          setData((prev) => ({
            ...prev,
            performers: sanitizePerformers(prev.performers, combined),
          }));
        }
      } catch {
        // Fallback to local storage if API call fails
      }
    };

    fetchFarmPerformers();

    return () => {
      isMounted = false;
    };
  }, [sanitizePerformers]);

  useEffect(() => {
    if (cachedStandards) {
      setData((prev) => ({
        ...prev,
        ...cachedStandards,
        performers: sanitizePerformers(cachedStandards.performers, customPerformers),
        loading: false,
      }));
      return;
    }

    let isMounted = true;

    const fetchStandards = async () => {
      try {
        if (!pendingPromise) {
          pendingPromise = fetchAPI(`/crop-standards?cropGroup=${cropGroup}`);
        }
        const res = await pendingPromise;
        pendingPromise = null;

        if (res && res.success && res.data) {
          cachedStandards = {
            stages: res.data.stages?.length ? res.data.stages : FALLBACK_STAGES,
            activities: res.data.activities?.length ? res.data.activities : FALLBACK_ACTIVITIES,
            pests: res.data.pests?.length ? res.data.pests : FALLBACK_PESTS,
            fertilizerDosages: res.data.fertilizerDosages?.length ? res.data.fertilizerDosages : FALLBACK_FERT_DOSAGES,
            fertilizerPurposes: res.data.fertilizerPurposes?.length ? res.data.fertilizerPurposes : FALLBACK_FERT_PURPOSES,
            pesticideDosages: res.data.pesticideDosages?.length ? res.data.pesticideDosages : FALLBACK_PEST_DOSAGES,
            phiOptions: res.data.phiOptions?.length ? res.data.phiOptions : FALLBACK_PHI,
            performers: res.data.performers?.length ? res.data.performers : FALLBACK_PERFORMERS,
            weatherOptions: res.data.weatherOptions?.length ? res.data.weatherOptions : FALLBACK_WEATHER,
            stageToActivities: res.data.stageToActivities || {},
            stageToDefaultActivity: res.data.stageToDefaultActivity || FALLBACK_MAP,
          };

          if (isMounted) {
            setData((prev) => ({
              ...prev,
              ...cachedStandards,
              performers: sanitizePerformers(cachedStandards.performers, customPerformers),
              loading: false,
            }));
          }
        }
      } catch (err) {
        console.warn('Lỗi lấy danh mục tiêu chuẩn từ database, sử dụng dữ liệu cục bộ:', err);
        pendingPromise = null;
        if (isMounted) {
          setData((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    fetchStandards();

    return () => {
      isMounted = false;
    };
  }, [cropGroup, customPerformers, sanitizePerformers]);

  const addCustomPerformer = useCallback(
    (name: string) => {
      if (!name) return;
      const trimmed = name.trim();
      if (!trimmed || trimmed === 'Chủ hộ' || trimmed === '—') return;

      setCustomPerformers((prev) => {
        if (prev.includes(trimmed)) return prev;
        const next = [...prev, trimmed];
        saveLocalCustomPerformers(next);
        return next;
      });

      setData((prev) => {
        if (prev.performers.includes(trimmed)) return prev;
        return {
          ...prev,
          performers: [...prev.performers, trimmed],
        };
      });

      // Background persist to backend
      fetchAPI('/farm/performers', {
        method: 'POST',
        body: JSON.stringify({ name: trimmed }),
      }).catch((e) => console.warn('Lỗi lưu người thực hiện:', e));
    },
    []
  );

  const removeCustomPerformer = useCallback(
    (name: string) => {
      if (!name) return;
      const trimmed = name.trim();
      if (trimmed === 'Chủ hộ') return;

      setCustomPerformers((prev) => {
        const next = prev.filter((p) => p !== trimmed);
        saveLocalCustomPerformers(next);
        return next;
      });

      setData((prev) => ({
        ...prev,
        performers: prev.performers.filter((p) => p !== trimmed),
      }));

      // Background delete from backend
      fetchAPI(`/farm/performers/${encodeURIComponent(trimmed)}`, {
        method: 'DELETE',
      }).catch((e) => console.warn('Lỗi xóa người thực hiện:', e));
    },
    []
  );

  return {
    ...data,
    addCustomPerformer,
    removeCustomPerformer,
  };
}
