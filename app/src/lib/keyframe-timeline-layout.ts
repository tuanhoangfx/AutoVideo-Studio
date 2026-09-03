/** Scale scene card widths so Σ widths === trackWidthPx (shared axis with TimeRuler). */
export function scaleKeyframeSceneWidthsPx(
  durationsSec: number[],
  totalSec: number,
  trackWidthPx: number,
  minWidthPx = 8,
): number[] {
  if (durationsSec.length === 0 || totalSec <= 0 || trackWidthPx <= 0) return [];
  const weights = durationsSec.map((durationSec) => Math.max(0.1, durationSec));
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  if (weightSum <= 0) return [];
  let widths = weights.map((weight) => Math.max(minWidthPx, (weight / weightSum) * trackWidthPx));
  const sum = widths.reduce((a, b) => a + b, 0);
  if (sum > 0 && Math.abs(sum - trackWidthPx) > 0.5) {
    const scale = trackWidthPx / sum;
    widths = widths.map((width) => width * scale);
  }
  return widths;
}

export function keyframePlayheadOffsetPx(
  playheadSec: number,
  timelineTotalSec: number,
  timelineWidthPx: number,
  holdStartSec: number,
  holdTailSec: number,
  holdTailPx: number,
): number {
  if (timelineTotalSec <= 0 || timelineWidthPx <= 0) return 0;
  if (playheadSec <= holdStartSec) {
    return (playheadSec / timelineTotalSec) * timelineWidthPx;
  }
  if (holdTailSec > 0 && holdTailPx > 0 && playheadSec <= holdStartSec + holdTailSec) {
    return timelineWidthPx + ((playheadSec - holdStartSec) / holdTailSec) * holdTailPx;
  }
  return timelineWidthPx + holdTailPx;
}

export function keyframeTimeOffsetPx(
  timeSec: number,
  timelineTotalSec: number,
  timelineWidthPx: number,
): number {
  if (timelineTotalSec <= 0 || timelineWidthPx <= 0) return 0;
  return Math.min(timelineWidthPx, Math.max(0, (timeSec / timelineTotalSec) * timelineWidthPx));
}
