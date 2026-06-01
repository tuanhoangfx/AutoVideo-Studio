'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowRightLeft,
  Captions,
  Check,
  Clock,
  Copy,
  Film,
  GripVertical,
  Hash,
  ImageIcon,
  Layers3,
  ListChecks,
  Timer,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import type { ExportDurationMode } from '@/lib/studio-export-settings';
import {
  narrationTextForSceneWindow,
  sceneNarrationCoverage,
  sceneNarrationLabel,
} from '@/lib/narration-timeline';
import type { LibraryImage } from './ImageLibrary';
import { HubFilterDropdown } from './HubFilterDropdown';
import { studioControlClass } from './StudioControl';
import { StudioToolbarButton } from './StudioToolbar';
import { coerceTransition, EFFECTS_CYCLE } from '@/lib/pipeline-constants';
import {
  EFFECT_OPTIONS,
  TRANSITION_OPTIONS,
  type Effect,
  type ScriptLine,
  type Transition,
} from './ScriptPanel';

const EFFECT_FILTER_OPTIONS = EFFECT_OPTIONS.map((opt) => ({
  value: opt.id,
  label: opt.label,
  icon: opt.icon,
}));

const TRANSITION_FILTER_OPTIONS = TRANSITION_OPTIONS.map((opt) => ({
  value: opt.id,
  label: opt.label,
  icon: opt.icon,
}));

/** Compact bulk/row control columns — Duration aligned with Transition/Effect. */
const SCENE_DURATION_COL = 'w-[2.67rem]';
const SCENE_TRANSITION_COL = 'w-[2.67rem]';
const SCENE_EFFECT_COL = 'w-[2.33rem]';
const SCENE_BULK_CONTROL_CELL = 'align-middle px-1.5 py-1';
const SCENE_ROW_CONTROL_CELL = 'px-1.5 py-0';

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
  exportDurationMode,
  onExportDurationMode,
  transcriptDurationSec,
  narrationScript = '',
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
  exportDurationMode: ExportDurationMode;
  onExportDurationMode: (mode: ExportDurationMode) => void;
  transcriptDurationSec: number;
  narrationScript?: string;
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
  const dragSelectRef = useRef<{ active: boolean; anchor: number | null }>({ active: false, anchor: null });
  const dragRowRef = useRef<number | null>(null);
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const hasContent = lines.length > 0;
  // Export duration is defined by Studio settings (Transcript estimate),
  // not by the client-side preview timing.
  const measuredTranscriptSec = transcriptDurationSec;
  const exportDurations = useMemo(
    () => lines.map((line) => line.durationSec ?? imageDurationSec),
    [imageDurationSec, lines]
  );
  const starts = useMemo(
    () => exportDurations.map((_, i) => exportDurations.slice(0, i).reduce((a, b) => a + b, 0)),
    [exportDurations]
  );
  const imageTimeSec = exportDurations.reduce((a, b) => a + b, 0);
  const transcriptTimeSec = measuredTranscriptSec;
  const imageBasedTotal = exportDurations.reduce((a, b) => a + b, 0);
  const total = exportDurationSec || imageBasedTotal || 1;
  const displayExportSec = lines.length === 0 ? 0 : total;
  const exportInputValue = lines.length === 0 ? '0' : formatNumberInput(total);
  const narrationCoverage = useMemo(
    () => sceneNarrationCoverage(exportDurations, transcriptTimeSec),
    [exportDurations, transcriptTimeSec]
  );
  const allRowsSelected = lines.length > 0 && selectedRows.length === lines.length;
  const selected = lines[selectedIndex];
  const selectedSet = new Set(selectedRows.filter((i) => i >= 0 && i < lines.length));
  const activeRows = selectedSet.size > 0 ? [...selectedSet] : selected ? [selectedIndex] : [];

  const effectOf = (i: number): Effect => {
    const effect = lines[i]?.effect;
    if (effect === 'random' || effect === 'none') return effect;
    if (!effect || effect === 'auto') return EFFECTS_CYCLE[i % EFFECTS_CYCLE.length] as Effect;
    return effect;
  };

  const isInteractiveTarget = (target: EventTarget) =>
    Boolean(
      (target as HTMLElement).closest(
        'button,input,select,textarea,[data-cell-picker],[data-row-grip],[data-filter-menu],[contenteditable="true"]'
      )
    );

  const rowIndexAtClientY = (clientY: number) => {
    const body = tableBodyRef.current;
    if (!body) return null;
    const rows = body.querySelectorAll<HTMLTableRowElement>('tr[data-scene-row]');
    for (let r = 0; r < rows.length; r += 1) {
      const rect = rows[r].getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) return r;
    }
    return null;
  };

  const applyDragRange = (anchor: number, i: number) => {
    const [from, to] = [anchor, i].sort((a, b) => a - b);
    setSelectedRows(rangeRows(from, to));
    onSelectScene(i);
  };

  const startDragSelect = (i: number, shiftKey: boolean, additive: boolean) => {
    if (additive && !shiftKey) {
      dragSelectRef.current = { active: true, anchor: i };
      setSelectedRows((prev) => (prev.includes(i) ? prev.filter((idx) => idx !== i) : [...prev, i].sort((a, b) => a - b)));
      selectionAnchorRef.current = i;
      onSelectScene(i);
      return;
    }
    const anchor =
      shiftKey && selectionAnchorRef.current != null ? selectionAnchorRef.current : i;
    dragSelectRef.current = { active: true, anchor };
    if (!shiftKey) selectionAnchorRef.current = i;
    applyDragRange(anchor, i);
  };

  const updateDragSelect = (i: number) => {
    if (!dragSelectRef.current.active) return;
    const anchor = dragSelectRef.current.anchor ?? selectionAnchorRef.current ?? i;
    applyDragRange(anchor, i);
  };

  const endDragSelect = () => {
    dragSelectRef.current = { active: false, anchor: null };
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

  const applyBulkAll = () => {
    if (activeRows.length === 0) return;
    applyDuration();
    applyEffect();
    applyTransition();
  };

  const hasPendingBulkChanges =
    activeRows.length > 0 &&
    (bulkDuration !== imageDurationSec || bulkEffect !== 'none' || bulkTransition !== 'slide_left');

  const toggleSelectAllRows = () => {
    if (allRowsSelected) {
      setSelectedRows([]);
      return;
    }
    setSelectedRows(rangeRows(0, lines.length - 1));
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragSelectRef.current.active) return;
      const idx = rowIndexAtClientY(e.clientY);
      if (idx != null) updateDragSelect(idx);
    };
    const onMouseUp = () => endDragSelect();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  });

  return (
    <section className="overflow-visible rounded-xl border border-[var(--border-subtle)] bg-[var(--panel)] shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
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
          <div className="inline-grid grid-cols-2 rounded-lg border border-white/10 bg-black/25 p-0.5">
            {(['image', 'script'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onExportDurationMode(mode)}
                className={`rounded-md px-2 py-1 text-[9px] font-semibold capitalize transition ${
                  exportDurationMode === mode ? 'bg-[var(--accent)] text-white' : 'text-white/45 hover:text-white'
                }`}
                title={
                  mode === 'image'
                    ? 'Length from images — shorter voice: silence, longer: trim'
                    : 'Length from script — shorter images: stop, longer: trim'
                }
              >
                {mode}
              </button>
            ))}
          </div>
          <label className="hub-filter-chip cursor-default">
            <span>Export</span>
            <input
              type="number"
              min={0}
              step={0.1}
              value={exportInputValue}
              onChange={(e) => onExportDurationSec(safeDuration(e.target.value, total))}
              disabled={exportDurationMode === 'script'}
              className="h-5 w-16 rounded border border-white/10 bg-black/25 px-1 text-center font-mono text-white outline-none focus:border-[var(--accent)]/60 disabled:opacity-45"
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
                  const coverage = narrationCoverage[i];
                  const sliceText =
                    narrationScript.trim() && coverage?.hasVoice
                      ? narrationTextForSceneWindow(
                          narrationScript,
                          coverage.startSec,
                          coverage.durationSec,
                          transcriptTimeSec
                        )
                      : '';
                  const waveform =
                    waveforms?.[i] ??
                    (sliceText
                      ? pseudoWaveform(sliceText, view === 'dense' ? 18 : 32)
                      : silentWaveform(view === 'dense' ? 18 : 32));
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedRows([i]);
                        onSelectScene(i);
                      }}
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
                        </div>
                        <MiniWaveform values={waveform} />
                        <div className="mt-1 min-w-0">
                          <div className="truncate text-[9px] text-white">
                            {coverage
                              ? sceneNarrationLabel(coverage, narrationScript, transcriptTimeSec)
                              : line.text || '(empty)'}
                          </div>
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
              <div className="max-h-56 overflow-auto select-none">
                <table className="w-full table-fixed border-collapse text-left text-[8px]">
                  <colgroup>
                    <col className="w-5" />
                    <col className="w-10" />
                    <col className="w-[4.5rem]" />
                    <col className="w-[4.25rem]" />
                    <col className={SCENE_DURATION_COL} />
                    <col className={SCENE_TRANSITION_COL} />
                    <col className={SCENE_EFFECT_COL} />
                    <col style={{ width: '40%' }} />
                  </colgroup>
                  <thead className="sticky top-0 z-10 bg-[var(--panel)] text-white/45">
                    <tr className="border-b border-white/10 [&>th]:px-1.5 [&>th]:py-1 [&>th:first-child]:pl-1">
                      <th colSpan={4} className="text-left">
                        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Scene selection actions">
                          <StudioToolbarButton
                            tone="sky"
                            active={allRowsSelected}
                            icon={ListChecks}
                            grow={false}
                            onClick={toggleSelectAllRows}
                            title={allRowsSelected ? 'Deselect all rows' : 'Select all rows'}
                          >
                            {allRowsSelected ? 'Deselect' : 'Select all'}
                          </StudioToolbarButton>
                          <StudioToolbarButton
                            tone="violet"
                            icon={Copy}
                            grow={false}
                            onClick={() => onDuplicateScenes(activeRows)}
                            disabled={activeRows.length === 0}
                            title="Duplicate selected scenes"
                          >
                            Duplicate
                          </StudioToolbarButton>
                          <StudioToolbarButton
                            tone="rose"
                            icon={Trash2}
                            grow={false}
                            onClick={() => {
                              onRemoveScenes(activeRows);
                              setSelectedRows([]);
                            }}
                            disabled={activeRows.length === 0}
                            title="Delete selected scenes"
                          >
                            Delete
                          </StudioToolbarButton>
                          <StudioToolbarButton
                            tone={hasPendingBulkChanges ? 'amber' : 'indigo'}
                            active={hasPendingBulkChanges}
                            icon={Check}
                            grow={false}
                            onClick={applyBulkAll}
                            disabled={activeRows.length === 0}
                            title="Apply duration + effect + transition to selection"
                          >
                            Apply to {activeRows.length}
                          </StudioToolbarButton>
                        </div>
                      </th>
                      <th className={SCENE_BULK_CONTROL_CELL}>
                        <span className={`${studioControlClass('amber')} !cursor-default inline-flex w-full !justify-start !px-1`}>
                          <Timer size={11} className="shrink-0 text-amber-200/80" />
                          <input
                            type="number"
                            min={1}
                            value={bulkDuration}
                            onChange={(e) => setBulkDuration(safeDuration(e.target.value, bulkDuration))}
                            className="min-w-0 flex-1 bg-transparent text-center font-mono text-[10px] text-amber-100 outline-none"
                            title="Bulk duration (seconds)"
                          />
                          <span className="shrink-0 text-white/35">s</span>
                        </span>
                      </th>
                      <th className={SCENE_BULK_CONTROL_CELL}>
                        <HubFilterDropdown
                          icon={<ArrowRightLeft size={11} />}
                          label="Transition"
                          selected={[bulkTransition]}
                          options={TRANSITION_FILTER_OPTIONS}
                          onChange={(values) => setBulkTransition((values[0] as Transition) ?? 'slide_left')}
                          singleSelect
                          compact
                          buttonVariant="command"
                          className="w-full"
                        />
                      </th>
                      <th className={SCENE_BULK_CONTROL_CELL}>
                        <HubFilterDropdown
                          icon={<Sparkles size={11} />}
                          label="Effect"
                          selected={[bulkEffect]}
                          options={EFFECT_FILTER_OPTIONS}
                          onChange={(values) => setBulkEffect((values[0] as Effect) ?? 'none')}
                          singleSelect
                          compact
                          buttonVariant="command"
                          className="w-full"
                        />
                      </th>
                      <th aria-hidden className="p-0" />
                    </tr>
                    <tr className="[&>th]:border-b [&>th]:border-white/10 [&>th]:px-1.5 [&>th]:py-0.5">
                      <th className="w-5" aria-label="Reorder" />
                      <th><TableHeadLabel icon={<Hash size={10} />} label="Scene" /></th>
                      <th><TableHeadLabel icon={<ImageIcon size={10} />} label="Image" /></th>
                      <th><TableHeadLabel icon={<Clock size={10} />} label="Start" /></th>
                      <th><TableHeadLabel icon={<Clock size={10} />} label="Duration" /></th>
                      <th><TableHeadLabel icon={<ArrowRightLeft size={10} />} label="Transition" /></th>
                      <th><TableHeadLabel icon={<Wand2 size={10} />} label="Effect" /></th>
                      <th><TableHeadLabel icon={<Captions size={10} />} label="Transcript" /></th>
                    </tr>
                  </thead>
                  <tbody ref={tableBodyRef}>
                    {lines.map((line, i) => {
                      const image = images[line.image_index];
                      const rowSelected = selectedSet.has(i);
                      const active = i === selectedIndex;
                      const rowHighlighted = rowSelected || active;
                      const coverage = narrationCoverage[i];
                      const sliceText =
                        narrationScript.trim() && coverage?.hasVoice
                          ? narrationTextForSceneWindow(
                              narrationScript,
                              coverage.startSec,
                              coverage.durationSec,
                              transcriptTimeSec
                            )
                          : '';
                      return (
                        <tr
                          key={i}
                          data-scene-row={i}
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
                          onMouseDown={(e) => {
                            if (e.button !== 0) return;
                            if (isInteractiveTarget(e.target)) return;
                            e.preventDefault();
                            startDragSelect(i, e.shiftKey, e.ctrlKey || e.metaKey);
                          }}
                          className={`cursor-default border-b border-white/[.06] transition ${
                            rowHighlighted
                              ? 'bg-sky-500/[.1] shadow-[inset_3px_0_0_0_rgba(56,189,248,0.9)]'
                              : 'hover:bg-white/[.03]'
                          } ${active ? 'ring-1 ring-inset ring-[var(--accent)]/30' : ''}`}
                        >
                          <td className="w-5 px-0 py-0 text-center" onMouseDown={(e) => e.stopPropagation()}>
                            <span
                              data-row-grip=""
                              draggable
                              onDragStart={(e) => {
                                dragRowRef.current = i;
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragEnd={() => {
                                dragRowRef.current = null;
                              }}
                              className="inline-flex cursor-grab items-center justify-center rounded px-0.5 text-white/25 active:cursor-grabbing hover:bg-white/[.06] hover:text-white/55"
                              title="Drag to reorder"
                            >
                              <GripVertical size={10} />
                            </span>
                          </td>
                          <td className="px-1.5 py-0 font-mono text-white/90">S{i + 1}</td>
                          <td className="px-1.5 py-0">
                            <div className="flex items-center gap-1.5">
                              <div className="w-9">
                                <div className="h-4 overflow-hidden rounded bg-black/40 ring-1 ring-white/10">
                                  {image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={image.url} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="grid h-full place-items-center text-white/25"><ImageIcon size={10} /></div>
                                  )}
                                </div>
                                <MiniWaveform
                                  values={
                                    sliceText ? pseudoWaveform(sliceText, 8) : silentWaveform(8)
                                  }
                                />
                              </div>
                              <span className="font-mono text-white/55">#{line.image_index + 1}</span>
                            </div>
                          </td>
                          <td className="px-1.5 py-0 font-mono text-white/55">{fmtTime(starts[i] ?? 0)}</td>
                          <td className={SCENE_ROW_CONTROL_CELL}>
                            <input
                              type="number"
                              min={1}
                              value={line.durationSec ?? Math.round(exportDurations[i] ?? imageDurationSec)}
                              onChange={(e) => onChangeDuration(i, safeDuration(e.target.value, imageDurationSec))}
                              onClick={(e) => e.stopPropagation()}
                              className="h-[18px] w-full min-w-0 rounded border border-white/10 bg-black/30 px-0.5 text-center font-mono text-[8px] text-white outline-none focus:border-[var(--accent)]/60"
                            />
                          </td>
                          <td className={SCENE_ROW_CONTROL_CELL}>
                            <HubFilterDropdown
                              icon={<ArrowRightLeft size={10} />}
                              label="Transition"
                              selected={[coerceTransition(line.transition)]}
                              options={TRANSITION_FILTER_OPTIONS}
                              onChange={(values) => onChangeTransition(i, (values[0] as Transition) ?? 'slide_left')}
                              singleSelect
                              variant="inline"
                              className="w-full"
                            />
                          </td>
                          <td className={SCENE_ROW_CONTROL_CELL}>
                            <HubFilterDropdown
                              icon={<Wand2 size={10} />}
                              label="Effect"
                              selected={[line.effect ?? 'none']}
                              options={EFFECT_FILTER_OPTIONS}
                              onChange={(values) => onChangeEffect(i, (values[0] as Effect) ?? 'none')}
                              singleSelect
                              variant="inline"
                              className="w-full"
                            />
                          </td>
                          <td className="px-1.5 py-0 text-white/70">
                            <div className="truncate" title={coverage ? sceneNarrationLabel(coverage, narrationScript, transcriptTimeSec) : line.text || '(empty)'}>
                              {coverage
                                ? sceneNarrationLabel(coverage, narrationScript, transcriptTimeSec)
                                : line.text || '(empty)'}
                            </div>
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

function silentWaveform(samples: number) {
  return Array.from({ length: samples }, () => 0.1);
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
