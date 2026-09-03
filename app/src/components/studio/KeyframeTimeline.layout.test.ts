import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'KeyframeTimeline.tsx'),
  'utf8',
);

describe('KeyframeTimeline filmstrip axis SSOT', () => {
  it('shares one px axis between ruler and scene cards (no flex gap drift)', () => {
    expect(source).toContain('scaleKeyframeSceneWidthsPx');
    expect(source).toContain('trackWidthPx');
    expect(source).toContain('playheadOffsetPx');
    expect(source).toContain('PLAYHEAD_LINE_CLASS');
    expect(source).toContain('PLAYHEAD_HANDLE_CLASS');
    expect(source).not.toContain('SCENE_PLAYHEAD_LINE_CLASS');
    expect(source).not.toMatch(/function TimeRuler[\s\S]*playheadSec=\{/);
    expect((source.match(/<div className=\{PLAYHEAD_HANDLE_CLASS\}/g) ?? []).length).toBe(1);
    expect(source).not.toMatch(/flex gap-1/);
  });

  it('drops duplicate Export seconds input — badge chip is SSOT', () => {
    expect(source).not.toContain('studio-keyframe-export-chip');
    expect(source).toContain('TimelineStat shortLabel="Export"');
  });
});
