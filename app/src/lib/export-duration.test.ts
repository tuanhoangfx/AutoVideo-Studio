import { describe, expect, it } from 'vitest';
import type { ScriptLine } from '@/types/studio';
import {
  computeSceneDurationsSec,
  scriptHoldTailSec,
  totalExportDurationSec,
} from './export-duration';

function makeLines(count: number, durationSec = 20): ScriptLine[] {
  return Array.from({ length: count }, (_, index) => ({
    text: `Scene ${index + 1}`,
    image_index: index,
    durationSec,
    transition: 'none' as const,
  }));
}

describe('computeSceneDurationsSec', () => {
  const lines = makeLines(10, 20);
  const transcriptSec = 50;

  it('image mode keeps per-scene editor seconds', () => {
    const durations = computeSceneDurationsSec('image', lines, 20, transcriptSec);
    expect(durations).toHaveLength(10);
    expect(durations.every((value) => value === 20)).toBe(true);
    expect(totalExportDurationSec('image', durations, transcriptSec, lines)).toBe(200);
  });

  it('script mode clips when narration ends before all images', () => {
    const durations = computeSceneDurationsSec('script', lines, 20, transcriptSec);
    expect(durations).toEqual([20, 20, 10, 0, 0, 0, 0, 0, 0, 0]);
    expect(durations.filter((value) => value > 0)).toHaveLength(3);
    expect(totalExportDurationSec('script', durations, transcriptSec, lines)).toBe(50);
    expect(scriptHoldTailSec('script', durations, transcriptSec, lines)).toBe(0);
  });

  it('script-fit scales every scene to fit narration length', () => {
    const durations = computeSceneDurationsSec('script-fit', lines, 20, transcriptSec);
    expect(durations).toHaveLength(10);
    expect(durations.every((value) => value === 5)).toBe(true);
    expect(totalExportDurationSec('script-fit', durations, transcriptSec, lines)).toBe(50);
  });

  it('script mode adds black hold when narration outlasts images', () => {
    const shortLines = makeLines(2, 10);
    const durations = computeSceneDurationsSec('script', shortLines, 10, 50);
    expect(durations).toEqual([10, 10]);
    expect(scriptHoldTailSec('script', durations, 50, shortLines)).toBe(30);
    expect(totalExportDurationSec('script', durations, 50, shortLines)).toBe(50);
  });
});
