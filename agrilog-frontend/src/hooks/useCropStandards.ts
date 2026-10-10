'use client';

import { useState, useEffect } from 'react';
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
}

// In-memory cache across component mounts
let cachedStandards: any = null;
let pendingPromise: Promise<any> | null = null;

export function useCropStandards(cropGroup: string = 'SHORT_TERM'): CropStandardsData {
  const [data, setData] = useState<CropStandardsData>({
    stages: cachedStandards?.stages || FALLBACK_STAGES,
    activities: cachedStandards?.activities || FALLBACK_ACTIVITIES,
    pests: cachedStandards?.pests || FALLBACK_PESTS,
    fertilizerDosages: cachedStandards?.fertilizerDosages || FALLBACK_FERT_DOSAGES,
    fertilizerPurposes: cachedStandards?.fertilizerPurposes || FALLBACK_FERT_PURPOSES,
    pesticideDosages: cachedStandards?.pesticideDosages || FALLBACK_PEST_DOSAGES,
    phiOptions: cachedStandards?.phiOptions || FALLBACK_PHI,
    performers: cachedStandards?.performers || FALLBACK_PERFORMERS,
    weatherOptions: cachedStandards?.weatherOptions || FALLBACK_WEATHER,
    stageToActivities: cachedStandards?.stageToActivities || {},
    stageToDefaultActivity: cachedStandards?.stageToDefaultActivity || FALLBACK_MAP,
    loading: !cachedStandards,
  });

  useEffect(() => {
    if (cachedStandards) {
      setData({
        ...cachedStandards,
        loading: false,
      });
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
            setData({
              ...cachedStandards,
              loading: false,
            });
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
  }, [cropGroup]);

  return data;
}
