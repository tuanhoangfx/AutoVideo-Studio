'use client';

import { useEffect, useState } from 'react';
import type { KpiTileData } from '@tool-workspace/hub-ui/shell/KpiStrip';
import {
  buildStudioJobKpiItems,
  type StudioJobKpiNumbers,
} from '@/lib/studio/studio-job-kpi-items';

const EMPTY: StudioJobKpiNumbers = { active: 0, done: 0, error: 0 };

export function useStudioJobKpis(): KpiTileData[] {
  const [numbers, setNumbers] = useState<StudioJobKpiNumbers>(EMPTY);

  useEffect(() => {
    const onCounters = (event: Event) => {
      const detail = (event as CustomEvent<Partial<StudioJobKpiNumbers>>).detail;
      if (!detail) return;
      setNumbers({
        active: detail.active ?? 0,
        done: detail.done ?? 0,
        error: detail.error ?? 0,
      });
    };
    window.addEventListener('studio-job-counters', onCounters);
    return () => window.removeEventListener('studio-job-counters', onCounters);
  }, []);

  return buildStudioJobKpiItems(numbers);
}
