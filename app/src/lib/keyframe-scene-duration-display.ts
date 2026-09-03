import type { ExportDurationMode } from '@/lib/studio-export-settings';

/** Table Duration column — Image shows editor hold; Script/Fit show export timeline seconds. */
export function keyframeSceneDurationDisplaySec(
  mode: ExportDurationMode,
  editorDurationSec: number,
  exportDurationSec: number,
): number {
  if (mode === 'image') return editorDurationSec;
  return exportDurationSec;
}

export function formatKeyframeSceneDurationSec(sec: number): string {
  const safe = Math.max(0, sec);
  const rounded = Math.round(safe * 10) / 10;
  if (Math.abs(rounded - Math.round(rounded)) < 0.05) return `${Math.round(rounded)}s`;
  return `${rounded.toFixed(1)}s`;
}
