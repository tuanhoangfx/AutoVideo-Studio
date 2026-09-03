import type { ScriptLine } from '@/types/studio';
import type { ExportDurationMode } from '@/lib/studio-export-settings';
import { TRANSITION_S, normalizeTransitionForWorker } from '@/lib/pipeline-constants';

/** Non-cut transitions overlap in ffmpeg xfade — only when worker reports xfade available. */
export function transitionOverlapSec(lines: ScriptLine[], xfadeAvailable = false): number {
  if (!xfadeAvailable || lines.length <= 1) return 0;
  let count = 0;
  for (let i = 0; i < lines.length - 1; i++) {
    if (normalizeTransitionForWorker(lines[i]?.transition) !== 'cut') count++;
  }
  return count * TRANSITION_S;
}

function sceneOverlapBeforeIndex(
  lines: ScriptLine[],
  index: number,
  xfadeAvailable: boolean
): number {
  if (!xfadeAvailable || index <= 0) return 0;
  if (normalizeTransitionForWorker(lines[index - 1]?.transition) === 'cut') return 0;
  return TRANSITION_S;
}

function effectiveSceneSumSec(
  sceneDurationsSec: number[],
  lines: ScriptLine[],
  xfadeAvailable: boolean
): number {
  let sum = 0;
  let overlap = 0;
  let prevActive = false;
  for (let i = 0; i < sceneDurationsSec.length; i++) {
    const dur = sceneDurationsSec[i];
    if (dur <= 0) continue;
    if (prevActive) overlap += sceneOverlapBeforeIndex(lines, i, xfadeAvailable);
    sum += dur;
    prevActive = true;
  }
  return Math.max(0.1, sum - overlap);
}

/** Keep per-image seconds; clip timeline when narration ends before all images. */
function clipSceneDurationsToScriptBudget(
  imageDurs: number[],
  lines: ScriptLine[],
  scriptTotalSec: number,
  xfadeAvailable: boolean
): number[] {
  const result: number[] = [];
  let effectiveUsed = 0;

  for (let i = 0; i < imageDurs.length; i++) {
    const fullDur = imageDurs[i];
    const overlap = sceneOverlapBeforeIndex(lines, i, xfadeAvailable);
    const incrementalIfFull = fullDur - overlap;

    if (effectiveUsed >= scriptTotalSec - 0.001) {
      result.push(0);
      continue;
    }

    const room = scriptTotalSec - effectiveUsed;
    if (incrementalIfFull <= room + 0.001) {
      result.push(fullDur);
      effectiveUsed += incrementalIfFull;
      continue;
    }

    const partialDur = Math.max(0.1, room + overlap);
    result.push(partialDur);
    for (let j = i + 1; j < imageDurs.length; j++) result.push(0);
    break;
  }

  return result;
}

/** Scale every scene so the full image timeline matches script length (all images stay visible). */
function scaleSceneDurationsToScriptBudget(
  imageDurs: number[],
  lines: ScriptLine[],
  scriptTotalSec: number,
  xfadeAvailable: boolean
): number[] {
  const imageTotal = imageDurs.reduce((sum, value) => sum + value, 0);
  const overlap = transitionOverlapSec(lines, xfadeAvailable);
  const targetSum = xfadeAvailable ? scriptTotalSec + overlap : scriptTotalSec;
  const scale = targetSum / Math.max(0.1, imageTotal);
  return imageDurs.map((duration) => Math.max(0.1, duration * scale));
}

/** Per-scene export length (seconds) from Image vs Script mode rules. */
export function computeSceneDurationsSec(
  mode: ExportDurationMode,
  lines: ScriptLine[],
  imageDurationSec: number,
  transcriptDurationSec: number,
  xfadeAvailable = false
): number[] {
  if (lines.length === 0) return [];

  const imageDurs = lines.map((line) => Math.max(0.1, line.durationSec ?? imageDurationSec));
  const imageTotal = imageDurs.reduce((sum, value) => sum + value, 0);

  if (mode === 'image') {
    return imageDurs;
  }

  const scriptTotal = Math.max(0.1, transcriptDurationSec);

  if (mode === 'script-fit') {
    return scaleSceneDurationsToScriptBudget(imageDurs, lines, scriptTotal, xfadeAvailable);
  }

  const overlap = transitionOverlapSec(lines, xfadeAvailable);
  const effectiveImageTotal = Math.max(0.1, imageTotal - overlap);

  // Script longer than images: keep per-image seconds; black tail fills the gap.
  if (scriptTotal >= effectiveImageTotal) {
    return imageDurs;
  }

  // Script shorter than images: keep per-image seconds; stop after the last visible scene.
  return clipSceneDurationsToScriptBudget(imageDurs, lines, scriptTotal, xfadeAvailable);
}

/** Black-screen tail after the last image when script mode outlasts the image timeline. */
export function scriptHoldTailSec(
  mode: ExportDurationMode,
  sceneDurationsSec: number[],
  transcriptDurationSec: number,
  lines: ScriptLine[] = [],
  xfadeAvailable = false
): number {
  if (mode !== 'script' || sceneDurationsSec.length === 0) return 0;
  const effectiveImageTotal = effectiveSceneSumSec(sceneDurationsSec, lines, xfadeAvailable);
  const scriptTotal = Math.max(0.1, transcriptDurationSec);
  return Math.max(0, scriptTotal - effectiveImageTotal);
}

export function totalExportDurationSec(
  mode: ExportDurationMode,
  sceneDurationsSec: number[],
  transcriptDurationSec: number,
  lines: ScriptLine[] = [],
  xfadeAvailable = false
): number {
  const effectiveImageTotal = effectiveSceneSumSec(sceneDurationsSec, lines, xfadeAvailable);
  const scriptTotal = Math.max(0.1, transcriptDurationSec);
  if (mode === 'image') return effectiveImageTotal;
  if (mode === 'script-fit') return scriptTotal;
  return Math.max(scriptTotal, effectiveImageTotal);
}
