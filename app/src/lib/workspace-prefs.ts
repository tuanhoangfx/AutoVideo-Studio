export const SYSTEM_STATS_INTERVAL_KEY = 'autovideo.systemStatsIntervalMs';
export const SYSTEM_STATS_INTERVAL_EVENT = 'autovideo-system-stats-interval';

export const DEFAULT_SYSTEM_STATS_INTERVAL_MS = 2000;
export const SYSTEM_STATS_INTERVAL_OPTIONS = [1000, 2000, 5000] as const;

export function readSystemStatsIntervalMs(): number {
  if (typeof window === 'undefined') return DEFAULT_SYSTEM_STATS_INTERVAL_MS;
  try {
    const raw = window.localStorage.getItem(SYSTEM_STATS_INTERVAL_KEY);
    const n = raw ? Number(raw) : NaN;
    if (!Number.isFinite(n)) return DEFAULT_SYSTEM_STATS_INTERVAL_MS;
    return clampSystemStatsInterval(n);
  } catch {
    return DEFAULT_SYSTEM_STATS_INTERVAL_MS;
  }
}

export function clampSystemStatsInterval(ms: number): number {
  return Math.max(1000, Math.min(5000, Math.round(ms)));
}

export function writeSystemStatsIntervalMs(ms: number) {
  const clamped = clampSystemStatsInterval(ms);
  if (typeof window === 'undefined') return clamped;
  try {
    window.localStorage.setItem(SYSTEM_STATS_INTERVAL_KEY, String(clamped));
  } catch {}
  window.dispatchEvent(new CustomEvent(SYSTEM_STATS_INTERVAL_EVENT, { detail: { ms: clamped } }));
  return clamped;
}

export function resetWorkspacePrefs() {
  writeSystemStatsIntervalMs(DEFAULT_SYSTEM_STATS_INTERVAL_MS);
}
