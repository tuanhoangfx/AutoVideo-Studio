import type { TabHeaderStatItem } from '@/lib/hub-ui';

export type HostMetrics = {
  cpuPercent: number;
  cpuReady: boolean;
  ramUsedBytes: number;
  ramTotalBytes: number;
  ramPercent: number;
};

export const HOST_HEADER_WIDE_MQ = '(min-width: 1101px)';

const HOST_HEADER_KEYS = ['cpu', 'ram'] as const;
export type HostHeaderStatKey = (typeof HOST_HEADER_KEYS)[number];

export function formatGib(bytes: number, snapInteger = false): string {
  const gib = bytes / 1024 ** 3;
  if (snapInteger) {
    const nearest = Math.round(gib);
    if (Math.abs(gib - nearest) < 0.15) return String(nearest);
  }
  if (gib >= 10) {
    const one = gib.toFixed(1);
    return one.endsWith('.0') ? one.slice(0, -2) : one;
  }
  return gib.toFixed(1);
}

export function formatHostCpuValue(metrics: HostMetrics | null): string {
  if (!metrics?.cpuReady) return '—';
  return `${Math.round(metrics.cpuPercent)}%`;
}

export function formatHostRamPercent(metrics: HostMetrics | null): string {
  if (!metrics || metrics.ramTotalBytes <= 0) return '—';
  return `${Math.round(metrics.ramPercent)}%`;
}

export function formatHostRamValue(metrics: HostMetrics | null, wide = true): string {
  if (!metrics || metrics.ramTotalBytes <= 0) return '—';
  const pct = formatHostRamPercent(metrics);
  if (wide) {
    return `${formatGib(metrics.ramUsedBytes)} / ${formatGib(metrics.ramTotalBytes, true)} GB · ${pct}`;
  }
  return `${Math.round(metrics.ramUsedBytes / 1024 ** 3)} GB · ${pct}`;
}

export function hostLoadTone(percent: number | null | undefined): string {
  if (percent == null || !Number.isFinite(percent)) return 'text-slate-400';
  if (percent >= 90) return 'text-rose-300';
  if (percent >= 70) return 'text-amber-300';
  return 'text-emerald-300';
}

/** Hub header center rail — device CPU / RAM (P0003 Profiles parity). */
export function buildHostHeaderStats(metrics: HostMetrics | null, options: { wide?: boolean } = {}): TabHeaderStatItem[] {
  const wide = options.wide !== false;
  return [
    {
      key: 'cpu',
      emojiGlyph: '⚡',
      label: 'CPU',
      value: formatHostCpuValue(metrics),
      toneClass: hostLoadTone(metrics?.cpuReady ? metrics.cpuPercent : null),
    },
    {
      key: 'ram',
      emojiGlyph: '💾',
      label: wide ? '' : 'RAM',
      value: formatHostRamValue(metrics, wide),
      toneClass: hostLoadTone(metrics?.ramPercent),
      className: 'stealth-host-ram-stat',
    },
  ];
}
