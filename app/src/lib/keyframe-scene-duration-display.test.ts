import { describe, expect, it } from 'vitest';
import {
  formatKeyframeSceneDurationSec,
  keyframeSceneDurationDisplaySec,
} from './keyframe-scene-duration-display';

describe('keyframe scene duration display', () => {
  it('uses export timeline seconds for Script and Fit modes', () => {
    expect(keyframeSceneDurationDisplaySec('script-fit', 5, 2.7)).toBe(2.7);
    expect(keyframeSceneDurationDisplaySec('script', 5, 3.2)).toBe(3.2);
    expect(keyframeSceneDurationDisplaySec('image', 5, 2.7)).toBe(5);
  });

  it('formats fractional fit durations with one decimal', () => {
    expect(formatKeyframeSceneDurationSec(2.666)).toBe('2.7s');
    expect(formatKeyframeSceneDurationSec(5)).toBe('5s');
  });
});
