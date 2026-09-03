import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { KEYFRAME_SCENE_PAGE_SIZE } from './keyframe-scene-column-meta';
import {
  STUDIO_DIRECTORY_RAIL_CSS_ROW_HEIGHT_VAR,
  STUDIO_DIRECTORY_RAIL_CSS_ROWS_VAR,
  STUDIO_DIRECTORY_RAIL_PAGE_SIZE,
} from './studio-directory-rail-meta';
import { VOICE_RAIL_PAGE_SIZE } from './voice-directory-meta';

const globalsCss = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'app', 'globals.css'),
  'utf8',
);

describe('studio directory rail density SSOT', () => {
  it('voice panel pager uses 20 rows; keyframe rail keeps fixed 10', () => {
    expect(VOICE_RAIL_PAGE_SIZE).toBe(20);
    expect(KEYFRAME_SCENE_PAGE_SIZE).toBe(STUDIO_DIRECTORY_RAIL_PAGE_SIZE);
    expect(STUDIO_DIRECTORY_RAIL_PAGE_SIZE).toBe(10);
  });

  it('globals.css exposes shared fixed-row CSS tokens for keyframe rail', () => {
    expect(globalsCss).toContain(`${STUDIO_DIRECTORY_RAIL_CSS_ROWS_VAR}: 10`);
    expect(globalsCss).toContain(`${STUDIO_DIRECTORY_RAIL_CSS_ROW_HEIGHT_VAR}: 1.5rem`);
    expect(globalsCss).toContain(STUDIO_DIRECTORY_RAIL_CSS_ROW_HEIGHT_VAR);
    expect(globalsCss).toContain('.studio-directory-rail-frame.hub-split-directory-pane--fixed-rows');
  });
});
