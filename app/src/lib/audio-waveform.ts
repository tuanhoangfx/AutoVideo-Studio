/** Peak extraction + resample/slice — shared by SequencePreview and MiniWaveform cells. */

export function bufferToWaveform(buffer: AudioBuffer, samples: number): number[] {
  const data = buffer.getChannelData(0);
  if (data.length === 0) return Array.from({ length: samples }, () => 0.15);
  const block = Math.max(1, Math.floor(data.length / samples));
  return Array.from({ length: samples }, (_, i) => {
    const start = i * block;
    const end = Math.min(data.length, start + block);
    let sum = 0;
    for (let j = start; j < end; j += 1) sum += Math.abs(data[j]!);
    return Math.max(0.08, Math.min(1, (sum / Math.max(1, end - start)) * 4));
  });
}

export function resampleWaveform(values: readonly number[], outSamples: number): number[] {
  if (values.length === 0) return Array.from({ length: outSamples }, () => 0.12);
  if (values.length === outSamples) return [...values];
  return Array.from({ length: outSamples }, (_, i) => {
    const t = (i / Math.max(1, outSamples - 1)) * (values.length - 1);
    const lo = Math.floor(t);
    const hi = Math.min(values.length - 1, lo + 1);
    const frac = t - lo;
    return values[lo]! * (1 - frac) + values[hi]! * frac;
  });
}

/** Slice peaks from a longer narration buffer by absolute timeline window (seconds). */
export function sliceWaveformWindow(
  fullPeaks: readonly number[],
  sourceDurationSec: number,
  windowStartSec: number,
  windowEndSec: number,
  outSamples: number,
): number[] {
  if (sourceDurationSec <= 0 || fullPeaks.length === 0) {
    return Array.from({ length: outSamples }, () => 0.12);
  }
  const startRatio = Math.max(0, windowStartSec / sourceDurationSec);
  const endRatio = Math.min(1, windowEndSec / sourceDurationSec);
  if (endRatio <= startRatio + 1e-6) {
    return Array.from({ length: outSamples }, () => 0.12);
  }
  const startIdx = Math.floor(startRatio * (fullPeaks.length - 1));
  const endIdx = Math.max(startIdx + 1, Math.ceil(endRatio * (fullPeaks.length - 1)));
  return resampleWaveform(fullPeaks.slice(startIdx, endIdx + 1), outSamples);
}
