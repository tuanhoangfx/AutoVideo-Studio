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
  it('bulk select uses NBSP spacing; filter gap owned by hub-ui toolbarChrome', () => {
    expect(globalsCss).toContain('.studio-keyframe-scene-directory-frame .hub-filter-bar .hub-bulk-action-btn__label::before');
    expect(globalsCss).not.toMatch(/\.hub-filter-trigger[\s\S]*gap:\s*0\s*!important/);
  });
});

describe('keyframe directory header glyph spacing', () => {
  it('inherits hub-ui NBSP-only emoji header SSOT (no P0021 globals override)', () => {
    const hubDirectoryTableCss = readFileSync(
      path.resolve(here, '../../../../../packages/hub-ui/src/styles/hub-directory-table.css'),
      'utf8',
    );
    expect(hubDirectoryTableCss).toContain('table.hub-users-table.hub-users-table--directory');
    expect(hubDirectoryTableCss).toMatch(/gap:\s*0;/);
    expect(hubDirectoryTableCss).toContain('padding-left: 0');
    expect(globalsCss).not.toContain(
      'studio-keyframe-scene-table[data-hub-directory-select] thead th:has(.hub-users-th-emoji)',
    );
  });
});
