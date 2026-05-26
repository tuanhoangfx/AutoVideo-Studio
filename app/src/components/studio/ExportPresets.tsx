'use client';
import { EXPORT_PRESETS, type ExportPreset } from '@/lib/api';
import { PlatformIcon } from './PlatformIcons';

/** Compact export preset picker — 5 icon buttons + tooltip. */
export function ExportPresets({
  activeId,
  onPick,
}: {
  activeId: ExportPreset['id'] | null;
  onPick: (p: ExportPreset) => void;
}) {
  return (
    <div className="flex gap-1">
      {EXPORT_PRESETS.map((p) => {
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            onClick={() => onPick(p)}
            title={`${p.label} · ${p.hint}`}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1.5 transition ${
              active
                ? 'bg-gradient-to-br from-[var(--accent)]/30 to-[var(--accent)]/10 ring-1 ring-[var(--accent)]'
                : 'border border-[var(--border-subtle)] bg-[var(--panel-2)] hover:bg-white/[.06]'
            }`}
          >
            <ExportPresetIcon id={p.id} active={active} fallback={p.icon} />
            <span className={`text-[9px] leading-tight ${active ? 'text-white' : 'text-[var(--muted)]'}`}>
              {p.label.split(' ')[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ExportPresetIcon({
  id,
  active,
  fallback,
}: {
  id: ExportPreset['id'];
  active: boolean;
  fallback: string;
}) {
  if (id === 'youtube' || id === 'shorts') return <PlatformIcon platform="youtube" size={17} />;
  if (id === 'tiktok') return <PlatformIcon platform="tiktok" size={17} />;
  if (id === 'reels') return <PlatformIcon platform="instagram" size={17} />;
  return (
    <span className={`text-base leading-none ${active ? 'text-[var(--accent-2)]' : 'text-[var(--muted)]'}`}>
      {fallback}
    </span>
  );
}
