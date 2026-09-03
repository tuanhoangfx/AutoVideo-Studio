import { GripVertical, ImageIcon } from 'lucide-react';
import { narrationTextForSceneWindow, sceneNarrationLabel } from '@/lib/narration-timeline';
import type { ExportDurationMode } from '@/lib/studio-export-settings';
import type { SceneExportStatus } from '@/lib/keyframe-scene-export-skip';
import {
  formatKeyframeSceneDurationSec,
  keyframeSceneDurationDisplaySec,
} from '@/lib/keyframe-scene-duration-display';
import {
  DirectoryTableBodyCell,
  hubFilterEmojiToneClass,
  hubFilterOptionEmojiClass,
} from '@/lib/hub-ui';
import type { KeyframeSceneColumnKey } from '@/lib/keyframe-scene-column-meta';
import { KEYFRAME_SCENE_HUB_COLUMN_META } from '@/lib/keyframe-scene-column-meta';
import {
  KEYFRAME_OPTION_EMOJI_COLOR,
  resolveKeyframeEffectOption,
  resolveKeyframeTransitionOption,
} from '@/lib/keyframe-scene-option-display';
import type { LibraryImage } from '@/components/studio/ImageLibrary';
import { MiniWaveform, pseudoWaveform, silentWaveform } from '@/components/studio/MiniWaveform';
import { resampleWaveform } from '@/lib/audio-waveform';
import { partialSceneExportedSec } from '@/lib/keyframe-scene-export-skip';
import { type ScriptLine } from '@/components/studio/ScriptPanel';

export type KeyframeSceneRow = {
  index: number;
  line: ScriptLine;
};

function SceneFilterOptionLabel({ emoji, label }: { emoji: string; label: string }) {
  return (
    <span className="inline-flex max-w-full min-w-0 items-center gap-1">
      <span
        className={hubFilterOptionEmojiClass(hubFilterEmojiToneClass(emoji, KEYFRAME_OPTION_EMOJI_COLOR))}
        aria-hidden
      >
        {emoji}
      </span>
      <span className="hub-users-directory-body-text min-w-0 truncate">{label}</span>
    </span>
  );
}

function columnTitle(key: KeyframeSceneColumnKey): string {
  const meta = KEYFRAME_SCENE_HUB_COLUMN_META[key];
  const label = meta?.label?.trim() || key;
  const emoji = meta?.headerEmoji?.trim();
  return emoji ? `${emoji} ${label}` : label;
}

function fmtTime(sec: number) {
  const safe = Math.max(0, sec);
  const min = Math.floor(safe / 60);
  const remain = safe - min * 60;
  return `${String(min).padStart(2, '0')}:${remain.toFixed(1).padStart(4, '0')}`;
}

export function renderKeyframeSceneDirectoryBodyCell(
  key: KeyframeSceneColumnKey,
  colClass: string,
  row: KeyframeSceneRow,
  ctx: {
    image: LibraryImage | undefined;
    exportStatus: SceneExportStatus;
    startSec: number;
    durationSec: number;
    exportDur: number;
    useExportTimeline: boolean;
    exportDurationMode: ExportDurationMode;
    narrationScript: string;
    transcriptTimeSec: number;
    coverage: ReturnType<typeof import('@/lib/narration-timeline').sceneNarrationCoverage>[number] | undefined;
    waveforms?: number[][];
    playheadSec?: number;
    onPlayheadSec?: (sec: number) => void;
    sceneStartsSec: readonly number[];
    sceneDurationsSec: readonly number[];
    onGripDragStart: (index: number) => void;
    onGripDragEnd: () => void;
    onRowDrop: (index: number) => void;
  },
) {
  const { index, line } = row;
  const title = columnTitle(key);
  const skipped = ctx.exportStatus === 'skipped';
  const partial = ctx.exportStatus === 'partial';

  switch (key) {
    case 'scene':
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass} typographyClass="hub-users-cell-num">
          <div className="flex items-center gap-1">
            <span
              data-row-grip=""
              draggable
              onDragStart={(e) => {
                ctx.onGripDragStart(index);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnd={ctx.onGripDragEnd}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                ctx.onRowDrop(index);
              }}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex cursor-grab items-center justify-center rounded p-0.5 text-white/25 active:cursor-grabbing hover:bg-white/[.06] hover:text-white/55"
              title="Drag to reorder"
            >
              <GripVertical size={12} />
            </span>
            <span className="font-mono">S{index + 1}</span>
          </div>
        </DirectoryTableBodyCell>
      );
    case 'image':
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          <div className="flex items-center gap-2">
            <div className="w-12 shrink-0">
              <div className="h-8 overflow-hidden rounded bg-black/40 ring-1 ring-white/10">
                {ctx.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ctx.image.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-white/25">
                    <ImageIcon size={12} />
                  </div>
                )}
              </div>
            </div>
            <span className="font-mono text-[11px] tabular-nums text-[var(--muted)]">#{line.image_index + 1}</span>
          </div>
        </DirectoryTableBodyCell>
      );
    case 'start':
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass} typographyClass="hub-users-cell-num">
          <span className="font-mono tabular-nums">{skipped ? '—' : fmtTime(ctx.startSec)}</span>
        </DirectoryTableBodyCell>
      );
    case 'duration': {
      const displaySec = keyframeSceneDurationDisplaySec(
        ctx.exportDurationMode,
        ctx.durationSec,
        ctx.exportDur,
      );
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass} typographyClass="hub-users-cell-num">
          {skipped ? (
            <span className="text-rose-300/80">—</span>
          ) : (
            <div className="text-center">
              <span className="font-mono tabular-nums">{formatKeyframeSceneDurationSec(displaySec)}</span>
              {partial && ctx.durationSec > ctx.exportDur + 0.05 ? (
                <div
                  className="mt-0.5 font-mono text-[10px] text-amber-300/80"
                  title="Only the portion before script end is exported"
                >
                  {formatKeyframeSceneDurationSec(ctx.durationSec)} → {formatKeyframeSceneDurationSec(ctx.exportDur)}
                </div>
              ) : null}
            </div>
          )}
        </DirectoryTableBodyCell>
      );
    }
    case 'transition': {
      const option = resolveKeyframeTransitionOption(line.transition);
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          {skipped ? (
            <span className="hub-users-directory-body-text truncate" title={title}>
              —
            </span>
          ) : (
            <span title={title}>
              <SceneFilterOptionLabel emoji={option.emoji} label={option.label} />
            </span>
          )}
        </DirectoryTableBodyCell>
      );
    }
    case 'effect': {
      const option = resolveKeyframeEffectOption(line.effect);
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          {skipped ? (
            <span className="hub-users-directory-body-text truncate" title={title}>
              —
            </span>
          ) : (
            <span title={title}>
              <SceneFilterOptionLabel emoji={option.emoji} label={option.label} />
            </span>
          )}
        </DirectoryTableBodyCell>
      );
    }
    case 'transcript': {
      const sliceText =
        ctx.narrationScript.trim() && ctx.coverage?.hasVoice
          ? narrationTextForSceneWindow(
              ctx.narrationScript,
              ctx.coverage.startSec,
              ctx.coverage.durationSec,
              ctx.transcriptTimeSec,
            )
          : '';
      const label = skipped
        ? 'Skipped in export'
        : partial
          ? `Partial export · ${
              ctx.coverage
                ? sceneNarrationLabel(ctx.coverage, ctx.narrationScript, ctx.transcriptTimeSec)
                : line.text || '(no narration)'
            }`
          : ctx.coverage
            ? sceneNarrationLabel(ctx.coverage, ctx.narrationScript, ctx.transcriptTimeSec)
            : line.text || '(no narration)';
      const rawPeaks = ctx.waveforms?.[index];
      const waveformValues = rawPeaks?.length
        ? resampleWaveform(rawPeaks, 64)
        : sliceText
          ? pseudoWaveform(sliceText, 64)
          : silentWaveform(64);
      const partialClipRatio =
        partial && ctx.durationSec > 0
          ? partialSceneExportedSec(
              index,
              ctx.sceneStartsSec,
              ctx.sceneDurationsSec,
              ctx.transcriptTimeSec,
            ) / ctx.durationSec
          : undefined;
      const playheadRatio =
        ctx.coverage && ctx.playheadSec != null && ctx.coverage.durationSec > 0
          ? Math.max(
              0,
              Math.min(1, (ctx.playheadSec - ctx.coverage.startSec) / ctx.coverage.durationSec),
            )
          : undefined;
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          <div className="flex min-w-0 w-full flex-col gap-0.5">
            <div
              className={`truncate ${
                skipped ? 'font-semibold text-rose-300/90' : partial ? 'font-semibold text-amber-200/90' : ''
              }`}
              title={label}
            >
              {label}
            </div>
            <MiniWaveform
              size="cell"
              variant={partial ? 'partial' : sliceText ? 'speech' : 'silent'}
              partialClipRatio={partialClipRatio}
              playheadRatio={playheadRatio}
              interactive={Boolean(ctx.onPlayheadSec && ctx.coverage && !skipped)}
              values={waveformValues}
              onSeek={(ratio) => {
                if (!ctx.coverage || !ctx.onPlayheadSec) return;
                ctx.onPlayheadSec(ctx.coverage.startSec + ratio * ctx.coverage.durationSec);
              }}
            />
          </div>
        </DirectoryTableBodyCell>
      );
    }
    default:
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          —
        </DirectoryTableBodyCell>
      );
  }
}
