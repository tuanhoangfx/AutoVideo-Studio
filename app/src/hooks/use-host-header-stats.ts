'use client';

import { useEffect, useMemo, useState } from 'react';
import type { TabHeaderStatItem } from '@/lib/hub-ui';
import { buildHostHeaderStats, HOST_HEADER_WIDE_MQ } from '@/lib/host-header-metrics';
import { useHostMetrics } from './use-host-metrics';

function useHeaderWide(): boolean {
  const [wide, setWide] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(HOST_HEADER_WIDE_MQ).matches : true,
  );

  useEffect(() => {
    const mq = window.matchMedia(HOST_HEADER_WIDE_MQ);
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return wide;
}

/** CPU / RAM center header chips — P0003 Profiles SSOT. */
export function useHostHeaderStats(): TabHeaderStatItem[] {
  const metrics = useHostMetrics();
  const wide = useHeaderWide();
  return useMemo(() => buildHostHeaderStats(metrics, { wide }), [metrics, wide]);
}
