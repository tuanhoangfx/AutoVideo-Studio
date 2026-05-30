import type { ScriptLine } from '@/components/studio';
import type { ExportDurationMode } from '@/lib/studio-export-settings';

/** Per-scene export length (seconds) from Image vs Script mode rules. */
export function computeSceneDurationsSec(
  mode: ExportDurationMode,
  lines: ScriptLine[],
  imageDurationSec: number,
  transcriptDurationSec: number
): number[] {
  if (lines.length === 0) return [];

  const imageDurs = lines.map((line) => Math.max(0.1, line.durationSec ?? imageDurationSec));
  const imageTotal = imageDurs.reduce((sum, value) => sum + value, 0);
  const scriptTotal = Math.max(0.1, transcriptDurationSec);

  if (mode === 'image') {
    return imageDurs;
  }

  // Script mode: images shorter → stop at image total; longer → scale down to script total
  if (imageTotal <= scriptTotal) {
    return imageDurs;
  }

  const scale = scriptTotal / imageTotal;
  return imageDurs.map((duration) => Math.max(0.1, duration * scale));
}

export function totalExportDurationSec(
  mode: ExportDurationMode,
  sceneDurationsSec: number[],
  transcriptDurationSec: number
): number {
  const imageTotal = sceneDurationsSec.reduce((sum, value) => sum + value, 0);
  const scriptTotal = Math.max(0.1, transcriptDurationSec);
  if (mode === 'image') return imageTotal;
  return Math.min(scriptTotal, imageTotal);
}
