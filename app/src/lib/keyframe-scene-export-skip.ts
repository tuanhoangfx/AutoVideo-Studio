import type { ExportDurationMode } from '@/lib/studio-export-settings';

const SKIP_EPS_SEC = 0.05;

export type SceneExportStatus = 'included' | 'partial' | 'skipped';

/**
 * Script-mode export stops when narration ends.
 * - skipped: scene starts at/after transcript end
 * - partial: scene starts before end but extends past transcript end
 * Image / script-fit modes: every scene is included.
 */
export function sceneExportStatusAtIndex(
  index: number,
  sceneStartsSec: readonly number[],
  sceneDurationsSec: readonly number[],
  exportDurationMode: ExportDurationMode,
  transcriptDurationSec: number,
): SceneExportStatus {
  if (exportDurationMode !== 'script') return 'included';
  if (transcriptDurationSec <= SKIP_EPS_SEC) return 'included';

  const start = sceneStartsSec[index];
  const duration = sceneDurationsSec[index];
  if (start == null || duration == null) return 'included';

  if (start >= transcriptDurationSec - SKIP_EPS_SEC) return 'skipped';

  const end = start + duration;
  if (end > transcriptDurationSec + SKIP_EPS_SEC) return 'partial';

  return 'included';
}

/** @deprecated Use sceneExportStatusAtIndex — true when fully skipped. */
export function isSceneSkippedInExportIndex(
  index: number,
  sceneStartsSec: readonly number[],
  exportDurationMode: ExportDurationMode,
  transcriptDurationSec: number,
  sceneDurationsSec: readonly number[] = [],
): boolean {
  return (
    sceneExportStatusAtIndex(
      index,
      sceneStartsSec,
      sceneDurationsSec,
      exportDurationMode,
      transcriptDurationSec,
    ) === 'skipped'
  );
}

export function buildSceneExportStatusChecker(
  sceneStartsSec: readonly number[],
  sceneDurationsSec: readonly number[],
  exportDurationMode: ExportDurationMode,
  transcriptDurationSec: number,
): (index: number) => SceneExportStatus {
  return (index) =>
    sceneExportStatusAtIndex(
      index,
      sceneStartsSec,
      sceneDurationsSec,
      exportDurationMode,
      transcriptDurationSec,
    );
}

export function buildSceneSkippedInExportChecker(
  sceneStartsSec: readonly number[],
  sceneDurationsSec: readonly number[],
  exportDurationMode: ExportDurationMode,
  transcriptDurationSec: number,
): (index: number) => boolean {
  const statusAt = buildSceneExportStatusChecker(
    sceneStartsSec,
    sceneDurationsSec,
    exportDurationMode,
    transcriptDurationSec,
  );
  return (index) => statusAt(index) === 'skipped';
}

export function anySceneSkippedInExport(
  sceneCount: number,
  sceneStartsSec: readonly number[],
  sceneDurationsSec: readonly number[],
  exportDurationMode: ExportDurationMode,
  transcriptDurationSec: number,
): boolean {
  for (let index = 0; index < sceneCount; index += 1) {
    if (
      sceneExportStatusAtIndex(
        index,
        sceneStartsSec,
        sceneDurationsSec,
        exportDurationMode,
        transcriptDurationSec,
      ) === 'skipped'
    ) {
      return true;
    }
  }
  return false;
}

export function partialSceneExportedSec(
  index: number,
  sceneStartsSec: readonly number[],
  sceneDurationsSec: readonly number[],
  transcriptDurationSec: number,
): number {
  const start = sceneStartsSec[index];
  const full = sceneDurationsSec[index];
  if (start == null || full == null) return 0;
  return Math.max(0, Math.min(full, transcriptDurationSec - start));
}

export function anyScenePartialExport(
  sceneCount: number,
  sceneStartsSec: readonly number[],
  sceneDurationsSec: readonly number[],
  exportDurationMode: ExportDurationMode,
  transcriptDurationSec: number,
): boolean {
  for (let index = 0; index < sceneCount; index += 1) {
    if (
      sceneExportStatusAtIndex(
        index,
        sceneStartsSec,
        sceneDurationsSec,
        exportDurationMode,
        transcriptDurationSec,
      ) === 'partial'
    ) {
      return true;
    }
  }
  return false;
}
