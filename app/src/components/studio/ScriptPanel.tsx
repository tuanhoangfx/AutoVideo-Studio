'use client';
import { useMemo } from 'react';
import { formatInteger } from '@/lib/format-count';
import { formatReadTime, scriptMetrics } from '@/lib/script-metrics';

import type { Effect, ScriptLine, Transition } from '@/types/studio';

export type { Effect, ScriptLine, Transition } from '@/types/studio';

export const EFFECT_OPTIONS: Array<{ id: Effect; label: string; icon: string }> = [
  { id: 'auto', label: 'Auto cycle', icon: '🔄' },
  { id: 'zoom_in', label: 'Zoom in', icon: '🔍+' },
  { id: 'zoom_out', label: 'Zoom out', icon: '🔍−' },
  { id: 'pan_right', label: 'Pan right', icon: '→' },
  { id: 'pan_left', label: 'Pan left', icon: '←' },
  { id: 'flash', label: 'Flash', icon: '⚡' },
  { id: 'sparkle', label: 'Sparkle', icon: '✦' },
  { id: 'random', label: 'Random', icon: '🎲' },
  { id: 'none', label: 'None', icon: '⏸' },
];

export const TRANSITION_OPTIONS: Array<{ id: Transition; label: string; icon: string }> = [
  { id: 'slide_left', label: 'Slide left', icon: '←' },
  { id: 'slide_right', label: 'Slide right', icon: '→' },
  { id: 'fade', label: 'Fade', icon: '◐' },
  { id: 'zoom', label: 'Zoom', icon: '◎' },
  { id: 'random', label: 'Random', icon: '🎲' },
  { id: 'none', label: 'None', icon: '⏸' },
];

export function ScriptPanel({
  onApplyNarration,
  scriptText,
  onScriptText,
  imagesCount,
  voice,
  rate,
}: {
  /** Apply full script as one narration track (not split per image). */
  onApplyNarration: (script: string) => void;
  scriptText: string;
  onScriptText: (value: string) => void;
  imagesCount: number;
  voice: string;
  rate: string;
}) {
  const metrics = useMemo(() => scriptMetrics(scriptText, voice, rate), [rate, scriptText, voice]);
  const canApply = scriptText.trim().length > 0;

  return (
    <section className="flex flex-1 flex-col">
      <div className="p-2">
        <div className="mb-1 flex items-center justify-between gap-2 text-[10px]">
          <span className="font-semibold text-[var(--accent-2)]">Paste Full Script</span>
          <span className="font-mono text-white/40">
            1 narration · {imagesCount} image{imagesCount === 1 ? '' : 's'}
          </span>
        </div>
        <textarea
          value={scriptText}
          onChange={(e) => onScriptText(e.target.value)}
          placeholder="Paste script..."
          rows={3}
          className="max-h-24 w-full resize-y rounded-md border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] leading-snug text-white outline-none placeholder-white/35 focus:border-[var(--accent)]/60"
        />
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px]">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 font-mono text-[9px]">
            <MetricChip label="Chars" value={formatInteger(metrics.chars)} />
            <MetricChip label="Tokens" value={`~${formatInteger(metrics.tokens)}`} />
            <MetricChip label="Read" value={formatReadTime(metrics.readSeconds)} />
          </div>
          <button
            type="button"
            onClick={() => onApplyNarration(scriptText.trim())}
            className={`rounded px-2.5 py-1 font-semibold text-white hover:brightness-110 ${
              canApply ? 'bg-[var(--accent)]' : 'bg-white/[.08] text-white/55'
            }`}
          >
            {canApply ? 'Apply narration' : 'Enter script'}
          </button>
        </div>
      </div>
    </section>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/[.035] px-1.5 py-0.5">
      <span className="text-white/35">{label}</span>
      <span className="text-[var(--accent-2)]">{value}</span>
    </span>
  );
}

