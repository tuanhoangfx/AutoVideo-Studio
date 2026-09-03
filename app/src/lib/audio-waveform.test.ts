import { describe, expect, it } from 'vitest';
import { bufferToWaveform, resampleWaveform, sliceWaveformWindow } from './audio-waveform';

describe('audio-waveform', () => {
  it('resamples peaks to target length', () => {
    const out = resampleWaveform([0.2, 0.8, 0.4], 5);
    expect(out).toHaveLength(5);
    expect(out[0]).toBeCloseTo(0.2, 2);
    expect(out[4]).toBeCloseTo(0.4, 2);
  });

  it('slices a window from full narration peaks', () => {
    const full = Array.from({ length: 100 }, (_, i) => 0.1 + (i / 100) * 0.8);
    const slice = sliceWaveformWindow(full, 10, 2, 5, 8);
    expect(slice).toHaveLength(8);
    expect(Math.min(...slice)).toBeGreaterThan(0.08);
  });

  it('extracts peaks from an AudioBuffer', () => {
    const data = new Float32Array(800);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.sin(i * 0.1);
    const buffer = {
      getChannelData: () => data,
    } as unknown as AudioBuffer;
    const peaks = bufferToWaveform(buffer, 16);
    expect(peaks).toHaveLength(16);
    expect(Math.max(...peaks)).toBeGreaterThan(0.2);
  });
});
