'use client';

import { useEffect, useState } from 'react';
import { readSystemStatsIntervalMs } from '@/lib/workspace-prefs';
import type { HostMetrics } from '@/lib/host-header-metrics';

function readBrowserMemory(): Pick<HostMetrics, 'ramUsedBytes' | 'ramTotalBytes' | 'ramPercent'> | null {
  const mem = (performance as Performance & { memory?: { usedJSHeapSize?: number; jsHeapSizeLimit?: number } }).memory;
  if (!mem?.usedJSHeapSize || !mem?.jsHeapSizeLimit) return null;
  const ramUsedBytes = mem.usedJSHeapSize;
  const ramTotalBytes = mem.jsHeapSizeLimit;
  return {
    ramUsedBytes,
    ramTotalBytes,
    ramPercent: ramTotalBytes > 0 ? (ramUsedBytes / ramTotalBytes) * 100 : 0,
  };
}

function emptyMetrics(): HostMetrics {
  return {
    cpuPercent: 0,
    cpuReady: false,
    ramUsedBytes: 0,
    ramTotalBytes: 0,
    ramPercent: 0,
  };
}

/** Live host CPU / RAM — desktop worker IPC when available, browser heap fallback. */
export function useHostMetrics(): HostMetrics | null {
  const [metrics, setMetrics] = useState<HostMetrics | null>(null);
  const [intervalMs, setIntervalMs] = useState(() => readSystemStatsIntervalMs());

  useEffect(() => {
    const onIntervalChange = (event: Event) => {
      const next = (event as CustomEvent<{ ms?: number }>).detail?.ms;
      if (typeof next === 'number' && Number.isFinite(next)) setIntervalMs(next);
      else setIntervalMs(readSystemStatsIntervalMs());
    };
    window.addEventListener('autovideo-system-stats-interval', onIntervalChange);
    return () => window.removeEventListener('autovideo-system-stats-interval', onIntervalChange);
  }, []);

  useEffect(() => {
    const tick = () => {
      const desktopApi = window.autovideo;
      if (desktopApi?.getSystemStats) {
        void desktopApi
          .getSystemStats()
          .then((stats) => {
            const cpuPercent = stats.cpu.percent;
            const cpuReady = typeof cpuPercent === 'number';
            const ramTotalBytes = stats.memory.totalBytes;
            const ramUsedBytes = stats.memory.usedBytes;
            setMetrics({
              cpuPercent: cpuReady ? cpuPercent : 0,
              cpuReady,
              ramUsedBytes,
              ramTotalBytes,
              ramPercent: ramTotalBytes > 0 ? (ramUsedBytes / ramTotalBytes) * 100 : 0,
            });
          })
          .catch(() => {});
        return;
      }

      const browserMem = readBrowserMemory();
      setMetrics({
        cpuPercent: 0,
        cpuReady: (navigator.hardwareConcurrency ?? 0) > 0,
        ramUsedBytes: browserMem?.ramUsedBytes ?? 0,
        ramTotalBytes: browserMem?.ramTotalBytes ?? 0,
        ramPercent: browserMem?.ramPercent ?? 0,
      });
    };

    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return metrics ?? emptyMetrics();
}
