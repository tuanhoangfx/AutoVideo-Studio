'use client';
import { useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRightLeft, Captions, Clock, Copy, Film, Hash, ImageIcon, Layers3, Trash2, Wand2 } from 'lucide-react';
import type { LibraryImage } from './ImageLibrary';
import {
  EFFECT_OPTIONS,
  TRANSITION_OPTIONS,
  type Effect,
  type ScriptLine,
  type Transition,
} from './ScriptPanel';

const EFFECTS_CYCLE: Effect[] = ['zoom_in', 'pan_right', 'flash', 'sparkle'];

type ViewMode = 'storyboard' | 'dense';

export function KeyframeTimeline({
  lines,
  images,
  selectedIndex,
  onSelectScene,
  onChangeEffect,
  onChangeTransition,
  onChangeDuration,
  onDuplicateScenes,
  onRemoveScenes,
  onReorderScenes,
  imageDurationSec,
  onImageDurationSec,
  exportDurationSec,
  onExportDurationSec,
  transcriptDurationSec,
  playheadSec = 0,
  audioDurations,
  waveforms,
}: {
  lines: ScriptLine[];
  images: LibraryImage[];
  selectedIndex: number;
  onSelectScene: (i: number) => void;
  onChangeEffect: (i: number, eff: Effect) => void;
  onChangeTransition: (i: number, transition: Transition) => void;
  onChangeDuration: (i: number, durationSec: number) => void;
  onDuplicateScenes: (indexes: number[]) => void;
  onRemoveScenes: (indexes: number[]) => void;
  onReorderScenes: (fromIndex: number, toIndex: number) => void;
  imageDurationSec: number;
  onImageDurationSec: (durationSec: number) => void;
  exportDurationSec: number;
  onExportDurationSec: (durationSec: number) => void;
  transcriptDurationSec: number;
  playheadSec?: number;
  audioDurations?: number[];
  waveforms?: number[][];
}) {
  const [view, setView] = useState<ViewMode>('storyboard');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [bulkDuration, setBulkDuration] = useState(imageDurationSec);
  const [bulkEffect, setBulkEffect] = useState<Effect>('none');
  const [bulkTransition, setBulkTransition] = useState<Transition>('slide_left');
  const selectionAnchorRef = useRef<number | null>(null);
  const dragSelectingRef = useRef(false);
  const dragRowRef = useRef<number | null>(null);
  const hasContent = lines.length > 0;
  const measuredTranscriptSec =
    audioDurations && audioDurations.length === lines.length
      ? audioDurations.reduce((a, b) => a + b, 0)
      : transcriptDurationSec;
  const exportDurations = useMemo(
    () => lines.map((line) => line.durationSec ?? imageDurationSec),
    [imageDurationSec, lines]
  );
  const starts = useMemo(
    () => exportDurations.map((_, i) => exportDurations.slice(0, i).reduce((a, b) => a + b, 0)),
    [exportDurations]
  );
  const imageTimeSec = lines.length * imageDurationSec;
  const transcriptTimeSec = measuredTranscriptSec;
  const total = exportDurationSec || exportDurations.reduce((a, b) => a + b, 0) || 1;
  const displayExportSec = lines.length === 0 ? 0 : total;
  const exportInputValue = lines.length === 0 ? '0' : formatNumberInput(total);
  const selected = lines[selectedIndex];
  const selectedSet = new Set(selectedRows.filter((i) => i >= 0 && i < lines.length));
  const activeRows = selectedSet.size > 0 ? [...selectedSet] : selected ? [selectedIndex] : [];

  const effectOf = (i: number): Effect => {
    const effect = lines[i]?.effect;
    if (!effect || effect === 'auto') return EFFECTS_CYCLE[i % EFFECTS_CYCLE.length];
    return effect;
  };

  const selectRow = (i: number, shiftKey = false, additive = false) => {
    if (shiftKey && selectionAnchorRef.current != null) {
      const [from, to] = [selectionAnchorRef.current, i].sort((a, b) => a - b);
      setSelectedRows(rangeRows(from, to));
    } else if (additive) {
      setSelectedRows((prev) => (prev.includes(i) ? prev.filter((idx) => idx !== i) : [...prev, i]));
      selectionAnchorRef.current = i;
    } else {
      setSelectedRows([i]);
      selectionAnchorRef.current = i;
    }
    onSelectScene(i);
  };

  const startDragSelect = (i: number, target: EventTarget, shiftKey: boolean, additive: boolean) => {
    if ((target as HTMLElement).closest('button,input,select,textarea')) return;
    dragSelectingRef.current = true;
    selectRow(i, shiftKey, additive);
  };

  const updateDragSelect = (i: number) => {
    if (!dragSelectingRef.current) return;
    const anchor = selectionAnchorRef.current ?? i;
    const [from, to] = [anchor, i].sort((a, b) => a - b);
    setSelectedRows(rangeRows(from, to));
    onSelectScene(i);
  };

  const applyDuration = () => {
    activeRows.forEach((row) => onChangeDuration(row, bulkDuration));
  };

  const applyEffect = () => {
    activeRows.forEach((row) => onChangeEffect(row, bulkEffect));
  };

  const applyTransition = () => {
    activeRows.forEach((row) => onChangeTransition(row, bulkTransition));
  };

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--panel)] shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
      <header className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[var(--border-subtle)] px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="studio-panel-label">
            <span className="studio-panel-label-icon"><Layers3 size={13} /></span>
            Timeline
            <span className="studio-panel-count">{lines.length}</span>
          </div>
        </div>
        <div className="flex min-w-0 justify-center">
          <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-white/10 bg-black/20 px-1.5 py-1">
            <TimelineStat icon={ImageIcon} label="Images" value={fmtTime(imageTimeSec)} tone="cyan" />
            <TimelineStat icon={Captions} label="Transcript" value={fmtTime(transcriptTimeSec)} tone="amber" />
            <TimelineStat icon={Film} label="Video Export" value={fmtTime(displayExportSec)} tone="violet" active />
          </div>
        </div>
        <div className="hub-filter-chips">
          <label className="hub-filter-chip cursor-default">
            <span>Default</span>
            <input
              type="number"
              min={1}
              value={imageDurationSec}
              onChange={(e) => onImageDurationSec(safeDuration(e.target.value, imageDurationSec))}
              className="h-5 w-12 rounded border border-white/10 bg-black/25 px-1 text-center font-mono text-white outline-none focus:border-[var(--accent)]/60"
            />
            <span>s/image</span>
          </label>
          <label className="hub-filter-chip cursor-default">
            <span>Export</span>
            <input
              type="number"
              min={0}
              step={0.1}
              value={exportInputValue}
              onChange={(e) => onExportDurationSec(safeDuration(e.target.value, total))}
              className="h-5 w-16 rounded border border-white/10 bg-black/25 px-1 text-center font-mono text-white outline-none focus:border-[var(--accent)]/60"
            />
            <span>s</span>
          </label>
          <div className="inline-grid grid-cols-2 rounded-lg border border-white/10 bg-black/25 p-0.5">
            {(['storyboard', 'dense'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setView(m)}
                className={`rounded-md px-2.5 py-1 text-[10px] font-semibold capitalize transition ${
                  view === m ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-white/45 hover:bg-white/[.05] hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="p-3">
        {!hasContent ? (
          <div className="h-24 rounded-lg border border-dashed border-white/10 bg-black/25" />
        ) : (
          <div className="space-y-2">
            <TimeRuler total={total} playheadSec={playheadSec} />

            <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/20 p-1.5">
              <div className="flex min-w-max gap-1.5">
                {lines.map((line, i) => {
                  const image = images[line.image_index];
                  const effect = effectOf(i);
                  const active = i === selectedIndex;
                  const waveform = waveforms?.[i] ?? pseudoWaveform(line.text, view === 'dense' ? 18 : 32);
                  return (
                    <button
                      key={i}
                      onClick={() => onSelectScene(i)}
                      className={`group relative overflow-hidden rounded-xl border text-left transition ${
                        active
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-[0_0_0_1px_rgba(99,102,241,0.35)]'
                          : 'border-white/10 bg-[var(--panel-2)] hover:border-[var(--accent)]/50'
                      }`}
                      style={{ width: view === 'dense' ? 96 : 128 }}
                    >
                      <div className="p-1">
                        <div className="relative h-12 overflow-hidden rounded bg-black/40 ring-1 ring-white/10">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image.url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full place-items-center text-white/25">
                              <ImageIcon size={14} />
                            </div>
                          )}
                          <div className="absolute left-1 top-1 rounded bg-black/60 px-1 py-0.5 font-mono text-[8px] text-white">
                            S{i + 1}
                          </div>
                          <div className="absolute right-1 top-1 rounded bg-black/60 px-1 py-0.5 font-mono text-[8px] text-white/75">
                            {fmtTime(exportDurations[i])}
                          </div>
                        </div>
                        <MiniWaveform values={waveform} />
                        <div className="mt-1 min-w-0">
                          <div className="truncate text-[9px] text-white">{line.text || '(empty)'}</div>
                          <div className="mt-0.5 truncate text-[8px] text-[var(--muted)]">
                            #{line.image_index + 1} · {effectLabel(effect)}
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 bg-black/35">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]"
                          style={{ width: `${Math.max(8, (exportDurations[i] / total) * 100)}%` }}
                        />
                      </div>
                      {active && <div className="absolute inset-x-0 top-0 h-0.5 bg-[var(--accent-2)]" />}
                      {playheadSec >= starts[i] && playheadSec <= starts[i] + exportDurations[i] && (
                        <div
                          className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                          style={{ left: `${((playheadSec - starts[i]) / exportDurations[i]) * 100}%` }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20">
              <div className="border-b border-white/10 bg-[var(--panel)]/80 px-2 py-1.5">
                <div className="flex min-h-7 flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => onDuplicateScenes(activeRows)}
                    disabled={activeRows.length === 0}
                    className="hub-filter-chip h-7 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Copy size={11} /> Duplicate
                  </button>
                  <button
                    onClick={() => {
                      onRemoveScenes(activeRows);
                      setSelectedRows([]);
                    }}
                    disabled={activeRows.length === 0}
                    className="hub-filter-chip danger h-7"
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                  <span className="mx-0.5 h-5 w-px bg-white/10" />
                  <label className="hub-filter-chip h-7 cursor-default">
                    <Clock size={11} />
                    <input
                      type="number"
                      min={1}
                      value={bulkDuration}
                      onChange={(e) => setBulkDuration(safeDuration(e.target.value, bulkDuration))}
                      className="h-5 w-10 rounded border border-white/10 bg-black/25 px-1 text-center font-mono text-[10px] text-white outline-none focus:border-[var(--accent)]/60"
                      title="Bulk duration"
                    />
                    <span>s</span>
                  </label>
                  <button onClick={applyDuration} className="hub-filter-chip h-7">
                    Set Duration
                  </button>
                  <label className="hub-filter-chip h-7 cursor-default">
                    <Wand2 size={11} />
                    <select
                      value={bulkEffect}
                      onChange={(e) => setBulkEffect(e.target.value as Effect)}
                      className="bg-transparent text-[10px] text-white outline-none"
                      title="All Effect"
                    >
                      {EFFECT_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  </label>
                  <button onClick={applyEffect} className="hub-filter-chip h-7">
                    Set Effect
                  </button>
                  <label className="hub-filter-chip h-7 cursor-default">
                    <ArrowRightLeft size={11} />
                    <select
                      value={bulkTransition}
                      onChange={(e) => setBulkTransition(e.target.value as Transition)}
                      className="bg-transparent text-[10px] text-white outline-none"
                      title="All Transition"
                    >
                      {TRANSITION_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  </label>
                  <button onClick={applyTransition} className="hub-filter-chip h-7">
                    Set Transition
                  </button>
                  <span className="hub-filter-meta ml-auto font-mono">{activeRows.length} row</span>
                </div>
              </div>
              <div className="max-h-64 overflow-auto" onMouseUp={() => { dragSelectingRef.current = false; }}>
                <table className="w-full min-w-[760px] border-collapse text-left text-[9px]">
                  <thead className="sticky top-0 z-10 bg-[var(--panel)] text-white/45">
                    <tr className="[&>th]:border-b [&>th]:border-white/10 [&>th]:px-2 [&>th]:py-1">
                      <th><TableHeadLabel icon={<Hash size={10} />} label="Scene" /></th>
                      <th><TableHeadLabel icon={<ImageIcon size={10} />} label="Image" /></th>
                      <th><TableHeadLabel icon={<Clock size={10} />} label="Start" /></th>
                      <th><TableHeadLabel icon={<Clock size={10} />} label="Duration" /></th>
                      <th><TableHeadLabel icon={<ArrowRightLeft size={10} />} label="Transition" /></th>
                      <th><TableHeadLabel icon={<Wand2 size={10} />} label="Effect" /></th>
                      <th><TableHeadLabel icon={<Captions size={10} />} label="Transcript" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, i) => {
                      const image = images[line.image_index];
                      const rowSelected = selectedSet.has(i);
                      const active = i === selectedIndex;
                      return (
                        <tr
                          key={i}
                          draggable
                          onDragStart={(e) => {
                            dragRowRef.current = i;
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const from = dragRowRef.current;
                            if (from != null && from !== i) {
                              onReorderScenes(from, i);
                              setSelectedRows([i]);
                            }
                            dragRowRef.current = null;
                          }}
                          onMouseDown={(e) => startDragSelect(i, e.target, e.shiftKey, e.ctrlKey || e.metaKey)}
                          onMouseEnter={() => updateDragSelect(i)}
                          onClick={(e) => selectRow(i, e.shiftKey, e.ctrlKey || e.metaKey)}
                          className={`cursor-pointer border-b border-white/[.06] transition ${
                            active ? 'bg-[var(--accent)]/15' : rowSelected ? 'bg-white/[.06]' : 'hover:bg-white/[.03]'
                          }`}
                        >
                          <td className="px-2 py-0.5 font-mono text-white">S{i + 1}</td>
                          <td className="px-2 py-0.5">
                            <div className="flex items-center gap-2">
                              <div className="w-10">
                              <div className="h-5 overflow-hidden rounded bg-black/40 ring-1 ring-white/10">
                                {image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={image.url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="grid h-full place-items-center text-white/25"><ImageIcon size={12} /></div>
                                )}
                              </div>
                              <MiniWaveform values={pseudoWaveform(line.text, 12)} />
                              </div>
                              <span className="font-mono text-white/55">#{line.image_index + 1}</span>
                            </div>
                          </td>
                          <td className="px-2 py-0.5 font-mono text-white/55">{fmtTime(starts[i] ?? 0)}</td>
                          <td className="px-2 py-0.5">
                            <input
                              type="number"
                              min={1}
                              value={line.durationSec ?? Math.round(exportDurations[i] ?? imageDurationSec)}
                              onChange={(e) => onChangeDuration(i, safeDuration(e.target.value, imageDurationSec))}
                              onClick={(e) => e.stopPropagation()}
                              className="h-5 w-12 rounded border border-white/10 bg-black/30 px-1 text-center font-mono text-[9px] text-white outline-none focus:border-[var(--accent)]/60"
                            />
                          </td>
                          <td className="px-2 py-0.5">
                            <select
                              value={normalizeTransition(line.transition)}
                              onChange={(e) => onChangeTransition(i, e.target.value as Transition)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-5 rounded border border-white/10 bg-black/30 px-1 text-[9px] text-white/70 outline-none"
                            >
                              {TRANSITION_OPTIONS.map((opt) => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-0.5">
                            <select
                              value={line.effect ?? 'none'}
                              onChange={(e) => onChangeEffect(i, e.target.value as Effect)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-5 rounded border border-white/10 bg-black/30 px-1 text-[9px] text-white/70 outline-none"
                            >
                              {EFFECT_OPTIONS.map((opt) => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="max-w-[18rem] truncate px-2 py-0.5 text-white/70">
                            {line.text || '(empty)'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function TimeRuler({ total, playheadSec }: { total: number; playheadSec: number }) {
  return (
    <div className="relative h-8 rounded-lg border border-white/10 bg-black/25">
      {Array.from({ length: 7 }).map((_, i) => {
        const x = (i / 6) * 100;
        return (
          <div key={i} className="absolute top-0 h-full border-l border-white/10" style={{ left: `${x}%` }}>
            <span className="ml-1 font-mono text-[9px] text-[var(--muted)]">
              {fmtTime((i / 6) * total)}
            </span>
          </div>
        );
      })}
      {playheadSec > 0 && (
        <div className="absolute top-0 h-full w-0.5 bg-white" style={{ left: `${Math.min(100, (playheadSec / total) * 100)}%` }}>
          <div className="absolute -left-1.5 top-0 h-3 w-3 rotate-45 bg-white" />
        </div>
      )}
    </div>
  );
}

function TableHeadLabel({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap font-semibold">
      <span className="text-[var(--accent-2)]/80">{icon}</span>
      {label}
    </span>
  );
}

function TimelineStat({
  icon: Icon,
  label,
  value,
  tone,
  active = false,
}: {
  icon: typeof ImageIcon;
  label: string;
  value: string;
  tone: 'cyan' | 'amber' | 'violet';
  active?: boolean;
}) {
  const toneClass =
    tone === 'cyan'
      ? 'bg-cyan-400/10 text-cyan-200'
      : tone === 'amber'
      ? 'bg-amber-400/10 text-amber-200'
      : 'bg-violet-400/10 text-violet-200';
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] ${
        active ? 'bg-[var(--accent)]/15 text-indigo-100' : 'text-white/55'
      }`}
    >
      <span className={`grid h-4 w-4 place-items-center rounded ${toneClass}`}>
        <Icon size={10} />
      </span>
      <span className="text-white/35">{label}</span>
      <span className="font-mono text-[var(--accent-2)]">{value}</span>
    </span>
  );
}

function estimateDuration(text: string) {
  return Math.max(2, Math.min(12, text.trim().length * 0.055 + 1.2));
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function pseudoWaveform(text: string, samples: number) {
  const seed = text.length || 1;
  return Array.from({ length: samples }, (_, i) => {
    const value = Math.abs(
      Math.sin((i + seed) * 0.42) * 0.62 +
      Math.sin((i + seed) * 1.71) * 0.34
    );
    return Math.max(0.12, Math.min(1, value));
  });
}

function MiniWaveform({ values }: { values: number[] }) {
  return (
    <div className="mt-0.5 flex h-3 items-end gap-px rounded bg-black/25 px-1 py-0.5">
      {values.slice(0, 28).map((value, idx) => (
        <span
          key={idx}
          className="flex-1 rounded-t bg-teal-300/75"
          style={{ height: `${Math.max(10, value * 100)}%` }}
        />
      ))}
    </div>
  );
}

function effectLabel(effect: Effect) {
  return EFFECT_OPTIONS.find((o) => o.id === effect)?.label ?? effect;
}

function normalizeTransition(value: ScriptLine['transition']): Transition {
  if (value === 'slide_left' || value === 'slide_right' || value === 'fade' || value === 'zoom' || value === 'random') {
    return value;
  }
  return 'slide_left';
}

function rangeRows(from: number, to: number) {
  return Array.from({ length: to - from + 1 }, (_, offset) => from + offset);
}

function safeDuration(value: string, fallback: number) {
  return Math.max(1, Number(value) || fallback || 5);
}

function formatNumberInput(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function fmtTime(sec: number) {
  const safe = Math.max(0, sec);
  const min = Math.floor(safe / 60);
  const remain = safe - min * 60;
  return `${String(min).padStart(2, '0')}:${remain.toFixed(1).padStart(4, '0')}`;
}
