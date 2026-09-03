'use client';
import { useMemo, type ReactNode } from 'react';
import { Clock3, FileText, Hash, Type } from 'lucide-react';
import { formatInteger } from '@/lib/format-count';
import { durationSecondsEqual, formatDuration } from '@/lib/format-duration';
import { formatReadTime, scriptMetrics } from '@/lib/script-metrics';
import { HubAdmNoteEditorField, hubFilterEmojiToneClass, hubFilterOptionEmojiClass } from '@/lib/hub-ui';
import { KEYFRAME_SCENE_COLUMN_STICKER } from '@/lib/keyframe-scene-column-meta';

import type { Effect, ScriptLine, Transition } from '@/types/studio';
import { PanelHead } from './StudioPageParts';

export type { Effect, ScriptLine, Transition } from '@/types/studio';

export const EFFECT_OPTIONS: Array<{ id: Effect; label: string; icon: string }> = [
  { id: 'auto', label: 'Auto cycle', icon: '🔄' },
  { id: 'zoom_in', label: 'Zoom in', icon: '🔍' },
  { id: 'zoom_out', label: 'Zoom out', icon: '🔎' },
  { id: 'pan_right', label: 'Pan right', icon: '➡️' },
  { id: 'pan_left', label: 'Pan left', icon: '⬅️' },
  { id: 'flash', label: 'Flash', icon: '⚡' },
  { id: 'sparkle', label: 'Sparkle', icon: '✨' },
  { id: 'random', label: 'Random', icon: '🎲' },
  { id: 'none', label: 'None', icon: '🚫' },
];

export const TRANSITION_OPTIONS: Array<{ id: Transition; label: string; icon: string }> = [
  { id: 'slide_left', label: 'Slide left', icon: '⬅️' },
  { id: 'slide_right', label: 'Slide right', icon: '➡️' },
  { id: 'fade', label: 'Fade', icon: '🌫️' },
  { id: 'zoom', label: 'Zoom', icon: '🔎' },
  { id: 'random', label: 'Random', icon: '🎲' },
  { id: 'none', label: 'None', icon: '🚫' },
];

export function useScriptPanelMetrics(scriptText: string, voice: string, rate: string) {
  return useMemo(() => scriptMetrics(scriptText, voice, rate), [rate, scriptText, voice]);
}

export function ScriptMetricsChips({
  scriptText,
  voice,
  rate,
  sceneCount,
}: {
  scriptText: string;
  voice: string;
  rate: string;
  sceneCount?: number;
  durationLabel?: string;
  compact?: boolean;
}) {
  const metrics = useScriptPanelMetrics(scriptText, voice, rate);
  return (
    <div className="flex min-w-0 flex-nowrap items-center justify-center gap-1 overflow-hidden">
      {typeof sceneCount === 'number' ? (
        <MetricChip
          icon={
            <span className={hubFilterOptionEmojiClass(hubFilterEmojiToneClass(KEYFRAME_SCENE_COLUMN_STICKER.scene, true))}>
              {KEYFRAME_SCENE_COLUMN_STICKER.scene}
            </span>
          }
          label="Scenes"
          value={formatInteger(sceneCount)}
          tone="violet"
        />
      ) : null}
      <MetricChip
        icon={<Type size={10} />}
        label="Chars"
        value={formatInteger(metrics.chars)}
        tone="sky"
      />
      <MetricChip
        icon={<Hash size={10} />}
        label="Words"
        value={formatInteger(metrics.words)}
        tone="amber"
      />
      <MetricChip
        icon={<Clock3 size={10} />}
        label="Read"
        value={formatReadTime(metrics.readSeconds)}
        tone="emerald"
      />
    </div>
  );
}

export function ScriptPanelHead({
  sceneCount,
  scriptText,
  voice,
  rate,
  exportDurationSec,
}: {
  sceneCount: number;
  scriptText: string;
  voice: string;
  rate: string;
  /** @deprecated Use exportDurationSec */
  durationLabel?: string;
  exportDurationSec: number;
}) {
  const metrics = useScriptPanelMetrics(scriptText, voice, rate);
  const hideExportChip = durationSecondsEqual(exportDurationSec, metrics.readSeconds);
  return (
    <PanelHead
      icon={<FileText size={13} />}
      title="Script"
      centerSlot={
        <ScriptMetricsChips
          scriptText={scriptText}
          voice={voice}
          rate={rate}
          sceneCount={sceneCount}
        />
      }
      rightSlot={
        hideExportChip ? undefined : (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded border border-indigo-400/35 bg-indigo-500/15 px-1.5 py-px text-[9px] text-indigo-100"
            title={`Export: ${formatDuration(exportDurationSec)}`}
            suppressHydrationWarning
          >
            <span className="font-semibold opacity-80">Export</span>
            <span className="font-mono">{formatDuration(exportDurationSec)}</span>
          </span>
        )
      }
    />
  );
}

export function ScriptPanel({
  scriptText,
  onScriptText,
}: {
  scriptText: string;
  onScriptText: (value: string) => void;
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="studio-script-note flex min-h-0 flex-1 flex-col p-2">
        <HubAdmNoteEditorField
          name="studio-script"
          value={scriptText}
          onChange={onScriptText}
          placeholder="Paste script..."
          fillHeight
        />
      </div>
    </section>
  );
}

const METRIC_TONE_CLASS = {
  violet: 'border-violet-400/40 bg-violet-500/15 text-violet-100',
  sky: 'border-sky-400/40 bg-sky-500/15 text-sky-100',
  amber: 'border-amber-400/40 bg-amber-500/15 text-amber-100',
  emerald: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100',
} as const;

function MetricChip({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: keyof typeof METRIC_TONE_CLASS;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-px text-[9px] ${METRIC_TONE_CLASS[tone]}`}
      title={`${label}: ${value}`}
    >
      <span aria-hidden>{icon}</span>
      <span className="font-semibold opacity-80">{label}</span>
      <span className="font-mono">{value}</span>
    </span>
  );
}
