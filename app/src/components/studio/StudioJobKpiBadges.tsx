'use client';

import type { KpiTileData } from '@tool-workspace/hub-ui/shell/KpiStrip';
import { hubSegmentActiveToneClass } from '@/lib/hub-ui';
import type { StudioJobStatusFilterKey } from '@/lib/studio/studio-job-status-filter';

const TONE_MAP: Record<string, 'amber' | 'emerald' | 'rose'> = {
  active: 'amber',
  done: 'emerald',
  error: 'rose',
};

/** Project tab rail — Active / Done / Error toggle filters (P0004 Live/Trash segment SSOT). */
export function StudioJobKpiBadges({
  items,
  activeFilter,
  onToggleFilter,
}: {
  items: KpiTileData[];
  activeFilter: StudioJobStatusFilterKey | null;
  onToggleFilter: (key: StudioJobStatusFilterKey) => void;
}) {
  if (!items.length) return null;

  return (
    <div
      className="studio-tab-kpis studio-job-status-toggle hub-segment-toggle ml-auto inline-flex h-[var(--hub-control-h)] shrink-0 items-center rounded-lg border border-white/10 bg-[var(--panel)] p-0.5 pl-2"
      role="group"
      aria-label="Filter project tabs by status"
    >
      {items.map((item) => {
        const key = item.prefKey as StudioJobStatusFilterKey | undefined;
        if (!key || !(key in TONE_MAP)) return null;
        const tone = TONE_MAP[key];
        const active = activeFilter === key;
        const activeClass = hubSegmentActiveToneClass(tone);
        return (
          <button
            key={key}
            type="button"
            title={
              active
                ? `Showing ${item.label} only — click to show all projects`
                : `Show ${item.label} projects only`
            }
            aria-label={`${item.label} ${item.value}`}
            aria-pressed={active}
            onClick={() => onToggleFilter(key)}
            className={`flex h-full items-center gap-1.5 rounded-md px-2.5 text-xs transition-colors ${
              active ? activeClass : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
            data-active-tone={active ? tone : undefined}
          >
            <span className="text-[13px] leading-none" aria-hidden>
              {item.emojiGlyph ?? '•'}
            </span>
            <span className="hub-segment-toggle__label">{item.label}</span>
            <span className="tabular-nums font-semibold text-[var(--text)]/90">{item.value}</span>
          </button>
        );
      })}
    </div>
  );
}
