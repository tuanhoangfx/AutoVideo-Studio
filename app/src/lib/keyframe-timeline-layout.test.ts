import { describe, expect, it } from 'vitest';
import {
  keyframePlayheadOffsetPx,
  keyframeTimeOffsetPx,
  scaleKeyframeSceneWidthsPx,
} from './keyframe-timeline-layout';

describe('keyframe timeline layout axis', () => {
  it('scales scene widths to exactly fill the track', () => {
    const widths = scaleKeyframeSceneWidthsPx([5, 5, 5, 5, 5, 5, 5, 5, 5, 5], 50, 1100);
    const sum = widths.reduce((a, b) => a + b, 0);
    expect(widths).toHaveLength(10);
    expect(Math.abs(sum - 1100)).toBeLessThan(0.01);
  });

  it('maps playhead time to the same px axis as the ruler', () => {
    const timelineWidthPx = 1100;
    const totalSec = 50;
    expect(keyframePlayheadOffsetPx(15, totalSec, timelineWidthPx, totalSec, 0, 0)).toBeCloseTo(330, 1);
    expect(keyframeTimeOffsetPx(15, totalSec, timelineWidthPx)).toBeCloseTo(330, 1);
  });

  it('extends playhead into hold tail after scene track', () => {
    const timelineWidthPx = 1100;
    const holdTailPx = 88;
    const totalSec = 50;
    const holdTailSec = 4;
    const atHoldMid = keyframePlayheadOffsetPx(52, totalSec, timelineWidthPx, totalSec, holdTailSec, holdTailPx);
    expect(atHoldMid).toBeCloseTo(timelineWidthPx + holdTailPx / 2, 1);
  });
});
