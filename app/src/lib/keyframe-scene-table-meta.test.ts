import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildDirectoryColumns } from './hub-ui';
import {
  KEYFRAME_SCENE_COLUMN_KEYS,
  KEYFRAME_SCENE_HUB_COLUMN_META,
  buildKeyframeSceneHubColumns,
} from './keyframe-scene-column-meta';
import {
  KEYFRAME_SCENE_COLUMNS,
  KEYFRAME_SCENE_COLUMN_STICKER,
  KEYFRAME_SCENE_GLOBALS_CSS_FILE,
  KEYFRAME_SCENE_META_FILE,
  KEYFRAME_SCENE_TABLE_COLUMN_COUNT,
  KEYFRAME_SCENE_TABLE_FILE,
  KEYFRAME_SCENE_TIMELINE_FILE,
  KEYFRAME_SCENE_TOOLBAR_WIDE_ROW_CLASS,
  SCENE_ORDER_MODE_KEY,
  assertKeyframeSceneToolbarBreakpointSync,
  readSceneOrderMode,
  writeSceneOrderMode,
} from './keyframe-scene-table-meta';
import { DRAFT_KEY, loadDraft, type DraftState } from './autosave';
import { DEFAULT_STUDIO_SUBTITLE_STYLE } from './studio-defaults';

describe('keyframe scene order mode', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubLocalStorage(initial: Record<string, string> = {}) {
    const store = new Map(Object.entries(initial));
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
      clear: () => void store.clear(),
      key: () => null,
      length: store.size,
    });
    vi.stubGlobal('window', {});
    return store;
  }

  it('defaults to sequential when key is missing or invalid', () => {
    stubLocalStorage();
    expect(readSceneOrderMode()).toBe('sequential');

    stubLocalStorage({ [SCENE_ORDER_MODE_KEY]: 'bogus' });
    expect(readSceneOrderMode()).toBe('sequential');
  });

  it('reads shuffle when persisted', () => {
    stubLocalStorage({ [SCENE_ORDER_MODE_KEY]: 'shuffle' });
    expect(readSceneOrderMode()).toBe('shuffle');
  });

  it('writeSceneOrderMode persists shuffle and sequential', () => {
    const store = stubLocalStorage();
    writeSceneOrderMode('shuffle');
    expect(store.get(SCENE_ORDER_MODE_KEY)).toBe('shuffle');
    writeSceneOrderMode('sequential');
    expect(store.get(SCENE_ORDER_MODE_KEY)).toBe('sequential');
  });

  it('readSceneOrderMode is safe without window (SSR)', () => {
    vi.stubGlobal('window', undefined);
    expect(readSceneOrderMode()).toBe('sequential');
  });
});

describe('draft sceneOrderMode restore', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubDraftStorage(draft: DraftState) {
    const store = new Map<string, string>([[DRAFT_KEY, JSON.stringify(draft)]]);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
      clear: () => void store.clear(),
      key: () => null,
      length: store.size,
    });
    vi.stubGlobal('window', {});
  }

  it('loadDraft returns sceneOrderMode when present', () => {
    stubDraftStorage({
      topic: 't',
      lines: [],
      voice: 'en-US-JennyNeural',
      rate: '+0%',
      aspect: '9:16',
      fps: 30,
      bgmVolume: 0.18,
      subtitleStyle: DEFAULT_STUDIO_SUBTITLE_STYLE,
      imagesCount: 0,
      savedAt: new Date().toISOString(),
      sceneOrderMode: 'shuffle',
    });
    expect(loadDraft()?.sceneOrderMode).toBe('shuffle');
  });

  it('loadDraft tolerates legacy drafts without sceneOrderMode', () => {
    stubDraftStorage({
      topic: 't',
      lines: [],
      voice: 'en-US-JennyNeural',
      rate: '+0%',
      aspect: '9:16',
      fps: 30,
      bgmVolume: 0.18,
      subtitleStyle: DEFAULT_STUDIO_SUBTITLE_STYLE,
      imagesCount: 0,
      savedAt: new Date().toISOString(),
    });
    expect(loadDraft()?.sceneOrderMode).toBeUndefined();
  });

  it('loadDraft returns keyframeDirectoryColumns when present', () => {
    stubDraftStorage({
      topic: 't',
      lines: [],
      voice: 'en-US-JennyNeural',
      rate: '+0%',
      aspect: '9:16',
      fps: 30,
      bgmVolume: 0.18,
      subtitleStyle: DEFAULT_STUDIO_SUBTITLE_STYLE,
      imagesCount: 0,
      savedAt: new Date().toISOString(),
      keyframeDirectoryColumns: ['scene', 'transcript'],
    });
    expect(loadDraft()?.keyframeDirectoryColumns).toEqual(['scene', 'transcript']);
  });
});

describe('keyframe scene column SSOT', () => {
  it('maps seven data columns with emoji stickers (detail via bulk bar)', () => {
    expect(KEYFRAME_SCENE_COLUMNS).toHaveLength(7);
    expect(KEYFRAME_SCENE_TABLE_COLUMN_COUNT).toBe(7);
    expect(KEYFRAME_SCENE_COLUMNS.map((col) => col.emoji)).toEqual([
      KEYFRAME_SCENE_COLUMN_STICKER.scene,
      KEYFRAME_SCENE_COLUMN_STICKER.image,
      KEYFRAME_SCENE_COLUMN_STICKER.start,
      KEYFRAME_SCENE_COLUMN_STICKER.duration,
      KEYFRAME_SCENE_COLUMN_STICKER.transition,
      KEYFRAME_SCENE_COLUMN_STICKER.effect,
      KEYFRAME_SCENE_COLUMN_STICKER.transcript,
    ]);
  });

  it('toolbar bulk actions class is always flex for filter row2Actions', () => {
    expect(KEYFRAME_SCENE_TOOLBAR_WIDE_ROW_CLASS).toContain('flex');
    expect(KEYFRAME_SCENE_TOOLBAR_WIDE_ROW_CLASS).not.toContain('hidden');
  });

  it('path constants resolve to existing app files', () => {
    const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
    for (const rel of [
      KEYFRAME_SCENE_TABLE_FILE,
      KEYFRAME_SCENE_META_FILE,
      KEYFRAME_SCENE_TIMELINE_FILE,
      KEYFRAME_SCENE_GLOBALS_CSS_FILE,
    ]) {
      expect(fs.existsSync(path.join(appRoot, rel)), `missing app/${rel}`).toBe(true);
    }
    expect(KEYFRAME_SCENE_TABLE_FILE).toMatch(/KeyframeSceneTable\.tsx$/);
  });

  it('directory column widths are rem/px (hub-ui DEV throws on %)', () => {
    for (const def of Object.values(KEYFRAME_SCENE_HUB_COLUMN_META)) {
      expect(def.width, `${def.label} width`).toMatch(/^\d+(\.\d+)?(px|rem)$/);
    }
    expect(() =>
      buildDirectoryColumns([...KEYFRAME_SCENE_COLUMN_KEYS], buildKeyframeSceneHubColumns()),
    ).not.toThrow();
  });

  it('transcript CSS track is rem, not auto/%', () => {
    const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
    const css = fs.readFileSync(
      path.join(appRoot, 'src/styles/p0021-directory-fixed-cols.generated.css'),
      'utf8',
    );
    expect(css).toMatch(/studio-keyframe-col--transcript[\s\S]*width:\s*18rem/);
    expect(css).not.toMatch(/studio-keyframe-col--transcript[\s\S]*width:\s*auto/);
  });
});
