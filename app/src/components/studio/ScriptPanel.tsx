'use client';
import { useEffect, useMemo } from 'react';
import { formatReadTime, scriptMetrics } from '@/lib/script-metrics';

export type Effect = 'auto' | 'zoom_in' | 'zoom_out' | 'pan_right' | 'pan_left' | 'flash' | 'sparkle' | 'none';
export type Transition = 'slide_left' | 'slide_right' | 'fade' | 'zoom' | 'random';

export const EFFECT_OPTIONS: Array<{ id: Effect; label: string; icon: string }> = [
  { id: 'auto', label: 'Auto cycle', icon: '🔄' },
  { id: 'zoom_in', label: 'Zoom in', icon: '🔍+' },
  { id: 'zoom_out', label: 'Zoom out', icon: '🔍−' },
  { id: 'pan_right', label: 'Pan right', icon: '→' },
  { id: 'pan_left', label: 'Pan left', icon: '←' },
  { id: 'flash', label: 'Flash', icon: '⚡' },
  { id: 'sparkle', label: 'Sparkle', icon: '✦' },
  { id: 'none', label: 'Static', icon: '⏸' },
];

export const TRANSITION_OPTIONS: Array<{ id: Transition; label: string; icon: string }> = [
  { id: 'slide_left', label: 'Slide left', icon: '←' },
  { id: 'slide_right', label: 'Slide right', icon: '→' },
  { id: 'fade', label: 'Fade', icon: '◐' },
  { id: 'zoom', label: 'Zoom', icon: '◎' },
  { id: 'random', label: 'Random', icon: '✦' },
];

export type ScriptLine = {
  text: string;
  image_index: number;
  durationSec?: number;
  effect?: Effect; // undefined = auto cycle
  transition?: Transition;
};

export function ScriptPanel({
  onBulkScript,
  scriptText,
  onScriptText,
  onScriptLines,
  imagesCount,
  voice,
  rate,
}: {
  onBulkScript: (lines: string[]) => void;
  scriptText: string;
  onScriptText: (value: string) => void;
  onScriptLines: (lines: string[]) => void;
  imagesCount: number;
  voice: string;
  rate: string;
}) {
  const bulkLines = useMemo(() => parseBulkScript(scriptText, imagesCount), [imagesCount, scriptText]);
  const metrics = useMemo(() => scriptMetrics(scriptText, voice, rate), [rate, scriptText, voice]);
  const canApplyBulk = bulkLines.length > 0;

  useEffect(() => {
    onScriptLines(bulkLines);
  }, [bulkLines, onScriptLines]);

  const applyBulkScript = () => {
    onBulkScript(bulkLines);
  };

  return (
    <section className="flex flex-1 flex-col">
      <div className="p-2">
        <div className="mb-1 flex items-center justify-between gap-2 text-[10px]">
          <span className="font-semibold text-[var(--accent-2)]">Paste Full Script</span>
          <span className="font-mono text-white/40">
            {bulkLines.length} lines / {imagesCount} selected images
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
            <MetricChip label="Chars" value={metrics.chars.toLocaleString()} />
            <MetricChip label="Tokens" value={`~${metrics.tokens.toLocaleString()}`} />
            <MetricChip label="Read" value={formatReadTime(metrics.readSeconds)} />
          </div>
          <button
            onClick={applyBulkScript}
            className={`rounded px-2.5 py-1 font-semibold text-white hover:brightness-110 ${
              canApplyBulk ? 'bg-[var(--accent)]' : 'bg-white/[.08] text-white/55'
            }`}
          >
            {canApplyBulk ? 'Apply Script' : 'Import Empty'}
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

function parseBulkScript(value: string, sceneCount: number) {
  const lines = value
    .split(/\r?\n+/)
    .map((line) =>
      line
        .replace(/^\s*(?:scene|cảnh)\s*\d+\s*[:.)-]\s*/i, '')
        .replace(/^\s*(?:\d+[\).:-]|[-*•])\s*/, '')
        .trim()
    )
    .filter(Boolean);
  if (sceneCount <= 0 || lines.length === sceneCount) return lines;
  if (lines.length > sceneCount) return chunkItems(lines, sceneCount).map((chunk) => chunk.join(' '));

  const sentences = splitSentences(lines.join(' '));
  if (sentences.length >= sceneCount) {
    return chunkItems(sentences, sceneCount).map((chunk) => chunk.join(' '));
  }
  return chunkWords(lines.join(' '), sceneCount);
}

function splitSentences(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?。！？])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function chunkItems(items: string[], count: number) {
  return Array.from({ length: count }, (_, index) => {
    const start = Math.floor((index * items.length) / count);
    const end = Math.floor(((index + 1) * items.length) / count);
    return items.slice(start, Math.max(start + 1, end));
  });
}

function chunkWords(value: string, count: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return Array.from({ length: count }, (_, index) => {
    const start = Math.floor((index * words.length) / count);
    const end = Math.floor(((index + 1) * words.length) / count);
    return words.slice(start, Math.max(start + 1, end)).join(' ');
  }).filter(Boolean);
}

