import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const cellsSource = readFileSync(path.resolve(here, 'keyframe-scene-directory-cells.tsx'), 'utf8');
const timelineSource = readFileSync(
  path.resolve(here, '../components/studio/KeyframeTimeline.tsx'),
  'utf8',
);
const globalsCss = readFileSync(path.resolve(here, '../app/globals.css'), 'utf8');

describe('keyframe scene directory cells SSOT', () => {
  it('shows Fit/Script durations from export timeline seconds', () => {
    expect(cellsSource).toContain('keyframeSceneDurationDisplaySec');
    expect(cellsSource).toContain('formatKeyframeSceneDurationSec');
    expect(cellsSource).not.toContain('useExportTimeline &&');
  });
});

describe('keyframe header chrome', () => {
  it('drops duplicate Export seconds input — badge chip is SSOT', () => {
    expect(timelineSource).not.toContain('studio-keyframe-export-chip');
    expect(timelineSource).toContain('TimelineStat shortLabel="Export"');
  });
});

describe('keyframe directory filter trigger spacing', () => {
  it('matches P0005 Orders NBSP-only filter/bulk spacing', () => {
    expect(globalsCss).toContain('.studio-keyframe-scene-directory-frame .hub-filter-bar .hub-filter-trigger');
    expect(globalsCss).toContain('.studio-keyframe-scene-directory-frame .hub-filter-bar .hub-bulk-action-btn__label::before');
    expect(globalsCss).toMatch(/\.hub-filter-bar \.hub-filter-trigger[\s\S]*gap:\s*0/);
  });
});

describe('keyframe directory header glyph spacing', () => {
  it('matches P0005 Orders NBSP-only header spacing', () => {
    expect(globalsCss).toContain('.studio-keyframe-scene-directory-frame table.studio-keyframe-scene-table[data-hub-directory-select]');
    expect(globalsCss).toMatch(/gap:\s*0;/);
    expect(globalsCss).toContain('padding-left: 0');
  });
});
