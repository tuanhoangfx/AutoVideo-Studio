'use client';

import { Loader2 } from 'lucide-react';
import type { StudioDownloadState } from '@/lib/studio-editor-snapshot';

export function PanelHead({
  icon,
  title,
  count,
  rightSlot,
  compact = false,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  rightSlot?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between border-b border-[var(--border-subtle)] ${
        compact ? 'px-2.5 py-1.5' : 'px-3 py-2'
      }`}
    >
      <div className="studio-panel-label">
        <span className="studio-panel-label-icon">{icon}</span>
        {title}
        {typeof count === 'number' && <span className="studio-panel-count">{count}</span>}
      </div>
      {rightSlot}
    </div>
  );
}

export function RightPanelTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition ${
        active
          ? 'bg-[var(--accent)] text-white'
          : 'text-white/45 hover:bg-white/[.04] hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export function PreviewExportStatus({
  state,
  message,
  detail,
  progress,
}: {
  state: StudioDownloadState;
  message: string;
  detail?: string;
  progress: number;
}) {
  const isBusy = state === 'exporting' || state === 'downloading';
  const label =
    state === 'downloading'
      ? 'Saving'
      : state === 'downloaded'
        ? 'Done'
        : state === 'error'
          ? 'Failed'
          : 'Exporting';
  const displayMessage =
    state === 'downloaded'
      ? message.replace(/^(Downloaded|Saved)\s+/i, '').trim() || message
      : message;
  const displayDetail = detail && detail.length > 96 ? `${detail.slice(0, 93)}…` : detail;
  const pct =
    state === 'downloaded' ? 100 : state === 'downloading' ? 100 : Math.max(5, Math.min(100, progress));
  return (
    <div
      className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/10 bg-black/70 p-2 text-white shadow-2xl backdrop-blur"
      title={detail && detail.length > 96 ? detail : undefined}
    >
      <div className="mb-1.5 flex items-center gap-2 text-[11px]">
        {isBusy ? <Loader2 size={13} className="animate-spin text-[var(--accent-2)]" /> : null}
        <span className="font-semibold">{label}</span>
        <span className="min-w-0 flex-1 truncate text-white/55">{displayMessage}</span>
        <span className="font-mono text-[10px] text-white/70">{Math.round(pct)}%</span>
      </div>
      {displayDetail ? (
        <div className="mb-1 truncate font-mono text-[10px] tabular-nums text-white/50">{displayDetail}</div>
      ) : null}
      <div className="h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${
            state === 'error'
              ? 'bg-rose-400'
              : state === 'downloaded'
                ? 'bg-emerald-400'
                : 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
