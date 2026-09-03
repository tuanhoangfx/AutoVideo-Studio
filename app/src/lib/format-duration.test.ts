import { describe, expect, it } from 'vitest';
import { durationSecondsEqual, formatDuration } from './format-duration';

describe('durationSecondsEqual', () => {
  it('matches whole-second Read vs Export', () => {
    expect(durationSecondsEqual(48, 48.2)).toBe(true);
    expect(durationSecondsEqual(48, 47)).toBe(false);
    expect(durationSecondsEqual(0, 0.4)).toBe(true);
  });

  it('formatDuration stays m:ss under one hour', () => {
    expect(formatDuration(48)).toBe('0:48');
    expect(formatDuration(65)).toBe('1:05');
  });
});
