'use client';
import { useMemo, useRef, useState } from 'react';
import {
  Captions,
  Film,
  ImageIcon,
  Layers3,
} from 'lucide-react';
import type { ExportDurationMode } from '@/lib/studio-export-settings';
import {
  narrationTextForSceneWindow,
  sceneNarrationCoverage,
  sceneNarrationLabel,
} from '@/lib/narration-timeline';
import { EFFECTS_CYCLE } from '@/lib/pipeline-constants';
import { buildSceneExportStatusChecker, partialSceneExportedSec } from '@/lib/keyframe-scene-export-skip';
import {
  keyframePlayheadOffsetPx,
  keyframeTimeOffsetPx,
  scaleKeyframeSceneWidthsPx,
} from '@/lib/keyframe-timeline-layout';
import { hubSegmentIconSize } from '@/lib/hub-ui';
import type { SceneOrderMode } from '@/lib/keyframe-scene-table-meta';
import type { LibraryImage } from './ImageLibrary';
import { MiniWaveform, pseudoWaveform, silentWaveform } from './MiniWaveform';
import { KeyframeSceneTable } from './KeyframeSceneTable';
import { KeyframeSceneDetailModal } from './KeyframeSceneDetailModal';
import { KeyframeSceneBulkDetailModal, type KeyframeSceneBulkDetailPatch } from './KeyframeSceneBulkDetailModal';
import {
  exportDurationModeUsesScript,
  StudioExportDurationToggle,
} from './StudioExportDurationToggle';
import { EFFECT_OPTIONS, type Effect, type ScriptLine, type Transition } from './ScriptPanel';

const TIMELINE_PX_PER_SEC = 22;
const TIMELINE_MIN_WIDTH_PX = 640;
const SCENE_CARD_MIN_WIDTH_PX = 8;
/** Unified playhead — one px axis for diamond + line (ruler + filmstrip). */
const PLAYHEAD_LINE_CLASS =
  'pointer-events-none absolute top-0 bottom-0 z-30 w-0.5 -translate-x-1/2 bg-[var(--accent)] shadow-[0_0_10px_rgba(99,102,241,0.75)]';
const PLAYHEAD_HANDLE_CLASS =
  'pointer-events-none absolute top-0 z-40 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm bg-[var(--accent)] shadow-[0_0_8px_rgba(99,102,241,0.85)]';
/** Fixed thumb in timeline cards — compact density for more scenes per row. */
const SCENE_CARD_THUMB_CLASS = 'relative mx-auto h-5 w-8 shrink-0 overflow-hidden rounded bg-black/40 ring-1 ring-white/10';
const SKIP_EPS_SEC = 0.05;

export function KeyframeTimeline({
  lines,
  images,
  selectedIndex,
  onSelectScene,
  onChangeEffect,
  onChangeTransition,
  onChangeDuration,
  onChangeTranscript,
  onDuplicateScenes,
  onRemoveScenes,
  onReorderScenes,
  onShuffleScenes,
  sceneOrderMode,
  onSceneOrderModeChange,
  imageDurationSec,
  onImageDurationSec,
  exportDurationSec,
  onExportDurationSec,
  exportDurationMode,
  onExportDurationMode,
  transcriptDurationSec,
  narrationScript = '',
  playheadSec = 0,
  onPlayheadSec,
  waveforms,
  sceneDurationsSec = [],
  holdTailSec = 0,
}: {
  lines: ScriptLine[];
  images: LibraryImage[];
  selectedIndex: number;
  onSelectScene: (i: number) => void;
  onChangeEffect: (i: number, eff: Effect) => void;
  onChangeTransition: (i: number, transition: Transition) => void;
  onChangeDuration: (i: number, durationSec: number) => void;
  onChangeTranscript: (i: number, text: string) => void;
  onDuplicateScenes: (indexes: number[]) => void;
  onRemoveScenes: (indexes: number[]) => void;
  onReorderScenes: (fromIndex: number, toIndex: number) => void;
  onShuffleScenes?: (indexes: number[]) => void;
  sceneOrderMode: SceneOrderMode;
  onSceneOrderModeChange: (mode: SceneOrderMode) => void;
  imageDurationSec: number;
  onImageDurationSec: (durationSec: number) => void;
  exportDurationSec: number;
  onExportDurationSec: (durationSec: number) => void;
  exportDurationMode: ExportDurationMode;
  onExportDurationMode: (mode: ExportDurationMode) => void;
  transcriptDurationSec: number;
  narrationScript?: string;
  playheadSec?: number;
  onPlayheadSec?: (sec: number) => void;
  waveforms?: number[][];
  sceneDurationsSec?: number[];
  holdTailSec?: number;
}) {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [detailSceneIndex, setDetailSceneIndex] = useState<number | null>(null);
  const [bulkDetailIndexes, setBulkDetailIndexes] = useState<number[] | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const hasContent = lines.length > 0;
  // Export duration is defined by Studio settings (Transcript estimate),
  // not by the client-side preview timing.
  const measuredTranscriptSec = transcriptDurationSec;
  const exportDurations = useMemo(
    () => lines.map((line) => line.durationSec ?? imageDurationSec),
    [imageDurationSec, lines]
  );
  const resolvedExportDurations = useMemo(
    () =>
      sceneDurationsSec.length === lines.length
        ? sceneDurationsSec
        : exportDurations,
    [exportDurations, lines.length, sceneDurationsSec]
  );
  /** Keyframe chrome always uses Image-duration layout — export mode affects render only. */
  const useExportTimeline = false;
  const timelineDurations = exportDurations;
  const editorStarts = useMemo(
    () => exportDurations.map((_, i) => exportDurations.slice(0, i).reduce((a, b) => a + b, 0)),
    [exportDurations]
  );
  const starts = editorStarts;
  const imageTimeSec = exportDurations.reduce((a, b) => a + b, 0);
  const transcriptTimeSec = measuredTranscriptSec;
  const imageBasedTotal = imageTimeSec;
  const timelineTotalSec = imageBasedTotal || 1;
  const total = exportDurationSec || imageBasedTotal || 1;
  const displayExportSec = lines.length === 0 ? 0 : total;
  const timelineWidthPx = Math.max(TIMELINE_MIN_WIDTH_PX, Math.ceil(timelineTotalSec * TIMELINE_PX_PER_SEC));
  const sceneWidthsPx = useMemo(
    () => scaleKeyframeSceneWidthsPx(timelineDurations, timelineTotalSec, timelineWidthPx, SCENE_CARD_MIN_WIDTH_PX),
    [timelineDurations, timelineTotalSec, timelineWidthPx],
  );
  const timelineTotalWithHoldSec = timelineTotalSec + holdTailSec;
  const holdStartSec = timelineTotalSec;
  const holdTailPx =
    holdTailSec > 0
      ? Math.max(SCENE_CARD_MIN_WIDTH_PX, (holdTailSec / timelineTotalWithHoldSec) * timelineWidthPx)
      : 0;
  const trackWidthPx = timelineWidthPx + holdTailPx;
  const playheadOffsetPx = keyframePlayheadOffsetPx(
    playheadSec,
    timelineTotalSec,
    timelineWidthPx,
    holdStartSec,
    holdTailSec,
    holdTailPx,
  );
  const sceneExportStatus = useMemo(
    () => buildSceneExportStatusChecker(starts, exportDurations, exportDurationMode, transcriptTimeSec),
    [exportDurationMode, exportDurations, starts, transcriptTimeSec],
  );
  const scriptCutoffActive =
    exportDurationModeUsesScript(exportDurationMode) &&
    transcriptTimeSec > SKIP_EPS_SEC &&
    transcriptTimeSec < timelineTotalSec - SKIP_EPS_SEC;
  const scriptCutoffOffsetPx = scriptCutoffActive
    ? keyframeTimeOffsetPx(transcriptTimeSec, timelineTotalSec, timelineWidthPx)
    : 0;
  const narrationCoverage = useMemo(
    () => sceneNarrationCoverage(exportDurations, transcriptTimeSec),
    [exportDurations, transcriptTimeSec]
  );

  const effectOf = (i: number): Effect => {
    const effect = lines[i]?.effect;
    if (effect === 'random' || effect === 'none') return effect;
    if (!effect || effect === 'auto') return EFFECTS_CYCLE[i % EFFECTS_CYCLE.length] as Effect;
    return effect;
  };

  const applyBulkDetailPatch = (patch: KeyframeSceneBulkDetailPatch) => {
    const targets = bulkDetailIndexes ?? selectedRows;
    if (targets.length === 0) return;
    targets.forEach((row) => {
      if (patch.durationSec != null) onChangeDuration(row, patch.durationSec);
      if (patch.transition != null) onChangeTransition(row, patch.transition);
      if (patch.effect != null) onChangeEffect(row, patch.effect);
    });
  };

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--panel)] shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
      <header className="studio-panel-head studio-panel-head--keyframe gap-1">
        <div className="studio-panel-label shrink-0">
          <span className="studio-panel-label-icon"><Layers3 size={13} /></span>
          Keyframe
          <span className="studio-panel-count">{lines.length}</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-nowrap items-center justify-center gap-1 overflow-x-auto">
            <TimelineStat shortLabel="Img" icon={ImageIcon} label="Images" value={fmtTime(imageTimeSec)} tone="cyan" />
            <TimelineStat shortLabel="TTS" icon={Captions} label="Transcript" value={fmtTime(transcriptTimeSec)} tone="amber" />
            <TimelineStat shortLabel="Export" icon={Film} label="Video Export" value={fmtTime(displayExportSec)} tone="violet" active />
          </div>
        <div className="flex shrink-0 flex-nowrap items-center gap-1 overflow-x-auto">
          <StudioExportDurationToggle
            value={exportDurationMode}
            onChange={onExportDurationMode}
            className="shrink-0"
          />
        </div>
      </header>

      <div className="space-y-2 p-3">
        {!hasContent ? (
          <div className="h-24 rounded-lg border border-dashed border-white/10 bg-black/25" />
        ) : (
            <div ref={timelineScrollRef} className="studio-timeline-scroll relative overflow-x-auto pb-1">
              <div className="relative" style={{ width: trackWidthPx }}>
                <div style={{ width: timelineWidthPx }}>
                  <TimeRuler
                    total={timelineTotalSec}
                    onPlayheadSec={onPlayheadSec}
                    scriptCutoffSec={scriptCutoffActive ? transcriptTimeSec : undefined}
                  />
                </div>

                <div className="relative mt-1 flex" style={{ width: trackWidthPx }}>
                  {scriptCutoffActive ? (
                    <div
                      className="pointer-events-none absolute inset-y-0 z-20 w-0.5 -translate-x-1/2 bg-amber-400/85 shadow-[0_0_8px_rgba(251,191,36,0.55)]"
                      style={{ left: scriptCutoffOffsetPx }}
                      title={`Script ends · ${fmtTime(transcriptTimeSec)}`}
                      aria-hidden
                    />
                  ) : null}
                  {lines.map((line, i) => {
                    const image = images[line.image_index];
                    const effect = effectOf(i);
                    const active = i === selectedIndex;
                    const exportStatus = sceneExportStatus(i);
                    const skipped = exportStatus === 'skipped';
                    const partial = exportStatus === 'partial';
                    const editorDur = exportDurations[i];
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
                      (sliceText ? pseudoWaveform(sliceText, 32) : silentWaveform(32));
                    const partialClipRatio =
                      partial && editorDur > 0
                        ? partialSceneExportedSec(i, starts, exportDurations, transcriptTimeSec) / editorDur
                        : undefined;
                    const cardPlayheadRatio =
                      coverage && playheadSec != null && coverage.durationSec > 0
                        ? Math.max(
                            0,
                            Math.min(1, (playheadSec - coverage.startSec) / coverage.durationSec),
                          )
                        : undefined;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedRows([i]);
                          onSelectScene(i);
                        }}
                        className={`group relative shrink-0 overflow-hidden rounded-lg border text-left transition ${
                          skipped
                            ? 'border-dashed border-white/15 bg-black/30 opacity-45'
                            : partial
                              ? 'border-amber-300/35 bg-amber-500/[.06] opacity-85'
                              : active
                                ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-[0_0_0_1px_rgba(99,102,241,0.35)]'
                                : 'border-white/10 bg-[var(--panel-2)] hover:border-[var(--accent)]/50'
                        }`}
                        style={{ width: sceneWidthsPx[i] }}
                      >
                      <div className="p-0.5">
                        <div className={SCENE_CARD_THUMB_CLASS}>
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image.url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full place-items-center text-white/25">
                              <ImageIcon size={12} />
                            </div>
                          )}
                          <div className="absolute left-0.5 top-0.5 rounded bg-black/60 px-0.5 py-px font-mono text-[7px] text-white">
                            S{i + 1}
                          </div>
                          {skipped ? (
                            <div className="absolute bottom-0 left-0 right-0 bg-rose-500/80 px-0.5 py-px text-center text-[6px] font-semibold uppercase tracking-wide text-white">
                              Skip
                            </div>
                          ) : partial ? (
                            <div className="absolute bottom-0 left-0 right-0 bg-amber-500/80 px-0.5 py-px text-center text-[6px] font-semibold uppercase tracking-wide text-white">
                              Partial
                            </div>
                          ) : null}
                        </div>
                        <MiniWaveform
                          values={waveform}
                          size="card"
                          variant={partial ? 'partial' : sliceText ? 'speech' : 'silent'}
                          partialClipRatio={partialClipRatio}
                          playheadRatio={cardPlayheadRatio}
                        />
                        <div className="mt-0.5 min-w-0 px-0.5">
                          <div className="truncate text-[8px] text-white">
                            {coverage
                              ? sceneNarrationLabel(coverage, narrationScript, transcriptTimeSec)
                              : line.text || '(empty)'}
                          </div>
                          <div className="mt-px truncate text-[7px] text-[var(--muted)]">
                            #{line.image_index + 1} · {effectLabel(effect)}
                          </div>
                        </div>
                      </div>
                      <div className="relative h-1 bg-black/35">
                        <div
                          className="relative h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]"
                          style={{
                            width: `${Math.max(8, (editorDur / timelineTotalSec) * 100)}%`,
                          }}
                        />
                      </div>
                      {active && <div className="absolute inset-x-0 top-0 h-0.5 bg-[var(--accent-2)]" />}
                    </button>
                  );
                })}
                  {holdTailPx > 0 ? (
                    <div
                      className="relative shrink-0 overflow-hidden rounded-lg border border-dashed border-amber-300/25 bg-black/40 text-left"
                      style={{ width: holdTailPx }}
                      title={`Black hold — narration continues ${fmtTime(holdTailSec)} after last image`}
                    >
                      <div className="p-0.5">
                        <div className={`${SCENE_CARD_THUMB_CLASS} grid place-items-center`}>
                          <span className="rounded bg-amber-500/20 px-1 py-px font-mono text-[7px] font-semibold uppercase tracking-wide text-amber-100/90">
                            Hold
                          </span>
                        </div>
                        <div className="mt-0.5 min-w-0 px-0.5">
                          <div className="truncate text-[8px] text-amber-100/70">Black screen</div>
                          <div className="mt-px truncate text-[7px] text-[var(--muted)]">+{fmtTime(holdTailSec)}</div>
                        </div>
                      </div>
                      <div className="h-1 bg-black/60">
                        <div className="h-full w-full bg-amber-500/50" />
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className={PLAYHEAD_LINE_CLASS} style={{ left: playheadOffsetPx }} aria-hidden />
                <div className={PLAYHEAD_HANDLE_CLASS} style={{ left: playheadOffsetPx }} aria-hidden />
              </div>
            </div>
        )}

            <KeyframeSceneTable
              lines={lines}
              images={images}
              selectedIndex={selectedIndex}
              selectedRows={selectedRows}
              setSelectedRows={setSelectedRows}
              onSelectScene={onSelectScene}
              onOpenSceneDetail={(i) => {
                setDetailSceneIndex(i);
                onSelectScene(i);
              }}
              onOpenBulkDetail={(indexes) => setBulkDetailIndexes(indexes)}
              onDuplicateScenes={onDuplicateScenes}
              onRemoveScenes={onRemoveScenes}
              onReorderScenes={onReorderScenes}
              onShuffleScenes={onShuffleScenes}
              sceneOrderMode={sceneOrderMode}
              onSceneOrderModeChange={onSceneOrderModeChange}
              imageDurationSec={imageDurationSec}
              exportDurations={exportDurations}
              starts={starts}
              narrationCoverage={narrationCoverage}
              narrationScript={narrationScript}
              transcriptTimeSec={transcriptTimeSec}
              sceneExportStatus={sceneExportStatus}
              resolvedExportDurations={resolvedExportDurations}
              useExportTimeline={useExportTimeline}
              exportDurationMode={exportDurationMode}
              waveforms={waveforms}
              playheadSec={playheadSec}
              onPlayheadSec={onPlayheadSec}
              onChangeTransition={onChangeTransition}
              onChangeEffect={onChangeEffect}
            />

            <KeyframeSceneBulkDetailModal
              open={bulkDetailIndexes !== null}
              sceneIndexes={bulkDetailIndexes ?? []}
              onClose={() => setBulkDetailIndexes(null)}
              onApply={applyBulkDetailPatch}
            />

            <KeyframeSceneDetailModal
              open={detailSceneIndex !== null}
              sceneIndex={detailSceneIndex ?? 0}
              line={detailSceneIndex !== null ? lines[detailSceneIndex] ?? null : null}
              image={
                detailSceneIndex !== null
                  ? images[lines[detailSceneIndex]?.image_index ?? -1] ?? null
                  : null
              }
              startSec={detailSceneIndex !== null ? starts[detailSceneIndex] ?? 0 : 0}
              durationSec={
                detailSceneIndex !== null ? exportDurations[detailSceneIndex] ?? imageDurationSec : imageDurationSec
              }
              narrationScript={narrationScript}
              transcriptTimeSec={transcriptTimeSec}
              narrationCoverage={detailSceneIndex !== null ? narrationCoverage[detailSceneIndex] : undefined}
              imageDurationSec={imageDurationSec}
              onClose={() => setDetailSceneIndex(null)}
              onChangeEffect={(eff) => {
                if (detailSceneIndex !== null) onChangeEffect(detailSceneIndex, eff);
              }}
              onChangeTransition={(transition) => {
                if (detailSceneIndex !== null) onChangeTransition(detailSceneIndex, transition);
              }}
              onChangeDuration={(durationSec) => {
                if (detailSceneIndex !== null) onChangeDuration(detailSceneIndex, durationSec);
              }}
              onChangeTranscript={(text) => {
                if (detailSceneIndex !== null) onChangeTranscript(detailSceneIndex, text);
              }}
            />
      </div>
    </section>
  );
}

function TimeRuler({
  total,
  onPlayheadSec,
  scriptCutoffSec,
}: {
  total: number;
  onPlayheadSec?: (sec: number) => void;
  scriptCutoffSec?: number;
}) {
  const rulerRef = useRef<HTMLDivElement>(null);

  const seekAtClientX = (clientX: number) => {
    if (!onPlayheadSec || !rulerRef.current || total <= 0) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onPlayheadSec(ratio * total);
  };

  const cutoffPct =
    scriptCutoffSec != null && total > 0
      ? Math.min(100, Math.max(0, (scriptCutoffSec / total) * 100))
      : null;

  return (
    <div
      ref={rulerRef}
      className="relative h-8 cursor-pointer rounded-lg border border-white/10 bg-black/25"
      onMouseDown={(e) => {
        seekAtClientX(e.clientX);
        const onMove = (moveEvent: MouseEvent) => seekAtClientX(moveEvent.clientX);
        const onUp = () => {
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      }}
    >
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
      {cutoffPct != null ? (
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-px bg-amber-400/90 shadow-[0_0_6px_rgba(251,191,36,0.55)]"
          style={{ left: `${cutoffPct}%` }}
          title={`TTS end · ${fmtTime(scriptCutoffSec!)}`}
        >
          <span className="absolute -top-px left-1 whitespace-nowrap rounded bg-amber-500/25 px-1 py-px font-mono text-[8px] font-semibold text-amber-100/95">
            TTS end
          </span>
        </div>
      ) : null}
    </div>
  );
}

function TimelineStat({
  icon: Icon,
  shortLabel,
  label,
  value,
  tone,
  active = false,
}: {
  icon: typeof ImageIcon;
  shortLabel: string;
  label: string;
  value: string;
  tone: 'cyan' | 'amber' | 'violet' | 'zinc';
  active?: boolean;
}) {
  const iconPx = hubSegmentIconSize();
  const toneClass =
    tone === 'cyan'
      ? 'bg-cyan-400/10 text-cyan-200'
      : tone === 'amber'
        ? 'bg-amber-400/10 text-amber-200'
        : tone === 'zinc'
          ? 'bg-zinc-400/10 text-zinc-200'
          : 'bg-violet-400/10 text-violet-200';
  return (
    <span
      className={`studio-keyframe-head-chip ${active ? 'studio-keyframe-head-chip--active' : ''}`}
      title={`${label}: ${value}`}
    >
      <span className={`studio-keyframe-head-chip__icon ${toneClass}`}>
        <Icon size={iconPx} aria-hidden />
      </span>
      <span className="studio-keyframe-head-chip__label hub-segment-toggle__label">{shortLabel}</span>
      <span className="studio-keyframe-head-chip__value font-mono tabular-nums">{value}</span>
    </span>
  );
}

function effectLabel(effect: Effect) {
  return EFFECT_OPTIONS.find((o) => o.id === effect)?.label ?? effect;
}

function fmtTime(sec: number) {
  const safe = Math.max(0, sec);
  const min = Math.floor(safe / 60);
  const remain = safe - min * 60;
  return `${String(min).padStart(2, '0')}:${remain.toFixed(1).padStart(4, '0')}`;
}
