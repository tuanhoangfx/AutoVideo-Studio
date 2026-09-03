import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.resolve(here, 'KeyframeSceneFilterPane.tsx'), 'utf8');
const vendorFilterBar = readFileSync(
  path.resolve(here, '../../../vendor/hub-ui/src/shell/FilterBar.tsx'),
  'utf8',
);

describe('keyframe scene filter pane searchbar SSOT', () => {
  it('puts Display on the search row, not the bulk row', () => {
    expect(source).toContain('searchTrailing={<KeyframeSceneColumnSettings />}');
    const row2 = source.slice(source.indexOf('row2Actions='));
    expect(row2).not.toContain('KeyframeSceneColumnSettings');
  });

  it('keeps Transition/Effect on row 2 left (P0005 Orders SSOT)', () => {
    expect(source).not.toContain('filtersOnSearchRow');
    expect(source).toContain('row2Actions={bulkActions}');
    expect(vendorFilterBar).not.toContain('filtersOnSearchRow');
    expect(vendorFilterBar).toContain('hub-filter-bar__row-filters');
  });
});


describe('keyframe scene filter pane searchbar SSOT', () => {
  it('puts Display on the search row, not the bulk row', () => {
    expect(source).toContain('searchTrailing={<KeyframeSceneColumnSettings />}');
    const row2 = source.slice(source.indexOf('row2Actions='));
    expect(row2).not.toContain('KeyframeSceneColumnSettings');
  });

  it('keeps Transition/Effect on row 2 left (P0005 Orders SSOT)', () => {
    expect(source).not.toContain('filtersOnSearchRow');
    expect(source).toContain('row2Actions={bulkActions}');
  });
});
