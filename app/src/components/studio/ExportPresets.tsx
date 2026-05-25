'use client';
import { EXPORT_PRESETS, type ExportPreset } from '@/lib/api';

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
            <span className={`text-base leading-none ${active ? 'text-[var(--accent-2)]' : 'text-[var(--muted)]'}`}>
              {p.icon}
            </span>
            <span className={`text-[9px] leading-tight ${active ? 'text-white' : 'text-[var(--muted)]'}`}>
              {p.label.split(' ')[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
