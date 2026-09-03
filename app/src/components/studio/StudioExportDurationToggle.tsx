'use client';

import { Captions, ImageIcon, LayoutGrid } from 'lucide-react';
import { hubSegmentActiveToneClass, hubSegmentIconSize } from '@/lib/hub-ui';
import type { ExportDurationMode } from '@/lib/studio-export-settings';

export function exportDurationModeUsesScript(mode: ExportDurationMode): boolean {
  return mode === 'script' || mode === 'script-fit';
}

export const EXPORT_DURATION_MODE_TITLES: Record<ExportDurationMode, string> = {
  image: 'Length from images — shorter voice: silence, longer: trim',
  script: 'Length from script — keep s/image until script ends, then stop; longer: black hold',
  'script-fit': 'Split script time across all selected images so every image fits the narration',
};

const MODE_OPTIONS: {
  value: ExportDurationMode;
  label: string;
  activeTone: 'sky' | 'amber' | 'emerald';
  icon: typeof ImageIcon;
}[] = [
  { value: 'image', label: 'Image', activeTone: 'sky', icon: ImageIcon },
  { value: 'script', label: 'Script', activeTone: 'amber', icon: Captions },
  { value: 'script-fit', label: 'Fit', activeTone: 'emerald', icon: LayoutGrid },
];

type Props = {
  value: ExportDurationMode;
  onChange: (mode: ExportDurationMode) => void;
  className?: string;
};

/** Image / Script / Fit — Hub segment SSOT with full tooltips (P0004 Live·Waiting·Trash pattern). */
export function StudioExportDurationToggle({ value, onChange, className }: Props) {
  const iconPx = hubSegmentIconSize();
  return (
    <div
      className={`hub-segment-toggle inline-flex h-[var(--hub-control-h)] items-center rounded-lg border border-white/10 bg-[var(--panel)] p-0.5 ${className ?? ''}`.trim()}
      role="group"
      aria-label="Video export length mode"
    >
      {MODE_OPTIONS.map((opt) => {
        const active = value === opt.value;
        const activeClass = hubSegmentActiveToneClass(opt.activeTone);
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            title={EXPORT_DURATION_MODE_TITLES[opt.value]}
            aria-label={EXPORT_DURATION_MODE_TITLES[opt.value]}
            aria-pressed={active}
            className={`flex h-full items-center gap-1.5 rounded-md px-2.5 text-xs transition-colors ${
              active ? activeClass : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
            data-active-tone={active ? opt.activeTone : undefined}
          >
            <Icon size={iconPx} aria-hidden />
            <span className="hub-segment-toggle__label">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
