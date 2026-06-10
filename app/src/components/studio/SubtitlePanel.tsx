'use client';
import type { SubtitleStyle } from '@/lib/api';

const OPTIONS: Array<{ id: SubtitleStyle; label: string; icon: string; hint: string }> = [
  { id: 'off', label: 'Off', icon: '∅', hint: 'Disable subtitles' },
  { id: 'line', label: 'Line', icon: '▦', hint: 'One full sentence per line' },
  { id: 'word_capcut', label: 'CapCut', icon: 'Aa', hint: 'Word-by-word pop-in' },
];

/** Compact segmented control: 3 options in one row. */
export function SubtitlePanel({
  value,
  onChange,
}: {
  value: SubtitleStyle;
  onChange: (s: SubtitleStyle) => void;
}) {
  return (
    <div>
      <div className="flex gap-0.5 rounded-md bg-[var(--panel-2)] p-0.5">
        {OPTIONS.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              onClick={() => onChange(o.id)}
              title={o.hint}
              className={`flex flex-1 items-center justify-center gap-1 rounded px-2 py-1.5 text-[11px] font-medium transition ${
                active
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'text-[var(--muted)] hover:text-white hover:bg-white/[.04]'
              }`}
            >
              <span>{o.icon}</span>
              <span>{o.label}</span>
              {o.id === 'word_capcut' && active && (
                <span className="ml-0.5 rounded bg-white/30 px-1 text-[8px] uppercase">hot</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
