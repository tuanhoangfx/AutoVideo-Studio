'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import {
  DEFAULT_SYSTEM_STATS_INTERVAL_MS,
  readSystemStatsIntervalMs,
  resetWorkspacePrefs,
  SYSTEM_STATS_INTERVAL_OPTIONS,
  writeSystemStatsIntervalMs,
} from '@/lib/workspace-prefs';

/** Settings → Display extras — CPU/RAM header refresh interval (Desktop). */
export function SystemStatsIntervalSection() {
  const [statsMs, setStatsMs] = useState(DEFAULT_SYSTEM_STATS_INTERVAL_MS);

  useEffect(() => {
    setStatsMs(readSystemStatsIntervalMs());
    const onChange = (event: Event) => {
      const next = (event as CustomEvent<{ ms?: number }>).detail?.ms;
      if (typeof next === 'number' && Number.isFinite(next)) setStatsMs(next);
      else setStatsMs(readSystemStatsIntervalMs());
    };
    window.addEventListener('autovideo-system-stats-interval', onChange);
    return () => window.removeEventListener('autovideo-system-stats-interval', onChange);
  }, []);

  return (
    <div className="space-y-2">
      <p className="text-[11px] leading-snug text-[var(--muted)]">
        CPU/RAM refresh interval in the Studio header (Desktop app).
      </p>
      <div className="space-y-0.5">
        {SYSTEM_STATS_INTERVAL_OPTIONS.map((ms) => (
          <IntervalRow
            key={ms}
            label={ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
            active={statsMs === ms}
            onSelect={() => {
              writeSystemStatsIntervalMs(ms);
              setStatsMs(ms);
            }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          resetWorkspacePrefs();
          setStatsMs(DEFAULT_SYSTEM_STATS_INTERVAL_MS);
        }}
        className="w-full rounded-md border border-white/10 px-2 py-1.5 text-[10px] text-[var(--muted)] hover:bg-white/[.05] hover:text-[var(--text)]"
      >
        Reset to defaults
      </button>
    </div>
  );
}

function IntervalRow({
  label,
  active,
  onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] text-white/75 hover:bg-white/[.05]"
    >
      <span
        className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
          active ? 'border-indigo-400/60 bg-indigo-500/40' : 'border-white/15 bg-white/[.03]'
        }`}
      >
        {active ? <Check size={10} className="text-indigo-100" /> : null}
      </span>
      <span>System stats refresh · {label}</span>
    </button>
  );
}
