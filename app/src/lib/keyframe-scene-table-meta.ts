/** Keyframe scene table — P0010 Input/Output directory emoji + column SSOT. */

/** App-relative paths (from P0021 `app/`) — SSOT for audit · card · clone tools. */
export const KEYFRAME_SCENE_TABLE_FILE = 'src/components/studio/KeyframeSceneTable.tsx';
export const KEYFRAME_SCENE_META_FILE = 'src/lib/keyframe-scene-table-meta.ts';
export const KEYFRAME_SCENE_TIMELINE_FILE = 'src/components/studio/KeyframeTimeline.tsx';
export const KEYFRAME_SCENE_GLOBALS_CSS_FILE = 'src/app/globals.css';

export type SceneOrderMode = 'sequential' | 'shuffle';

export const SCENE_ORDER_MODE_KEY = 'p0021:studio:scene-order-mode:v1';

/** Toolbar inline vs More menu — sync literal classes below when changing. */
export const KEYFRAME_SCENE_TOOLBAR_BREAKPOINT_PX = 900;

/** Bulk actions inside HubSplitDirectoryFilterBar row2Actions (always flex — parent is filter row right slot). */
export const KEYFRAME_SCENE_TOOLBAR_WIDE_ROW_CLASS =
  'flex max-w-full shrink-0 flex-wrap items-center justify-end gap-1';

/** Narrow overflow — hidden when bulk row uses hub-filter-bar__actions (wrap handles narrow). */
export const KEYFRAME_SCENE_TOOLBAR_NARROW_MORE_CLASS = 'hidden';

export const KEYFRAME_SCENE_DIRECTORY_FRAME_CLASS =
  'studio-keyframe-scene-directory-frame studio-directory-rail-frame hub-directory-frame';

/** @deprecated HubSplitDirectoryPane owns chrome — use KEYFRAME_SCENE_DIRECTORY_FRAME_CLASS */
export const KEYFRAME_SCENE_CHROME_CLASS =
  'keyframe-scene-chrome flex flex-col gap-1 border-b border-white/10 bg-[var(--panel-2)] px-2 py-1';

export const KEYFRAME_SCENE_SEARCH_ROW_CLASS = 'keyframe-scene-search-row shrink-0';

export const KEYFRAME_SCENE_FILTER_ROW_CLASS = 'keyframe-scene-filter-row shrink-0';

export const KEYFRAME_SCENE_BULK_ROW_CLASS = 'keyframe-scene-bulk-row shrink-0';

/** @deprecated Use KEYFRAME_SCENE_CHROME_CLASS + search/bulk rows */
export const KEYFRAME_SCENE_TOOLBAR_SHELL_CLASS = KEYFRAME_SCENE_CHROME_CLASS;

export function assertKeyframeSceneToolbarBreakpointSync() {
  if (!KEYFRAME_SCENE_TOOLBAR_WIDE_ROW_CLASS.includes('flex')) {
    throw new Error('KEYFRAME_SCENE_TOOLBAR_WIDE_ROW_CLASS must include flex for row2Actions');
  }
}

export const KEYFRAME_SCENE_COLUMN_STICKER = {
  scene: '🎬',
  image: '🖼️',
  start: '▶️',
  duration: '⏱️',
  transition: '↔️',
  effect: '✨',
  transcript: '💬',
} as const;

export const KEYFRAME_SCENE_COLUMNS = [
  { key: 'scene', label: 'Scene', emoji: KEYFRAME_SCENE_COLUMN_STICKER.scene, colClass: 'studio-keyframe-col--scene' },
  { key: 'image', label: 'Image', emoji: KEYFRAME_SCENE_COLUMN_STICKER.image, colClass: 'studio-keyframe-col--image' },
  { key: 'start', label: 'Start', emoji: KEYFRAME_SCENE_COLUMN_STICKER.start, colClass: 'studio-keyframe-col--start' },
  {
    key: 'duration',
    label: 'Duration',
    emoji: KEYFRAME_SCENE_COLUMN_STICKER.duration,
    colClass: 'studio-keyframe-col--duration',
  },
  {
    key: 'transition',
    label: 'Transition',
    emoji: KEYFRAME_SCENE_COLUMN_STICKER.transition,
    colClass: 'studio-keyframe-col--transition',
  },
  { key: 'effect', label: 'Effect', emoji: KEYFRAME_SCENE_COLUMN_STICKER.effect, colClass: 'studio-keyframe-col--effect' },
  {
    key: 'transcript',
    label: 'Transcript',
    emoji: KEYFRAME_SCENE_COLUMN_STICKER.transcript,
    colClass: 'studio-keyframe-col--transcript',
  },
] as const;

/** Data columns passed to hubDirectoryFrameTableClass (excludes grip). */
export const KEYFRAME_SCENE_TABLE_COLUMN_COUNT = KEYFRAME_SCENE_COLUMNS.length;

export function readSceneOrderMode(): SceneOrderMode {
  if (typeof window === 'undefined') return 'sequential';
  try {
    const raw = localStorage.getItem(SCENE_ORDER_MODE_KEY);
    return raw === 'shuffle' ? 'shuffle' : 'sequential';
  } catch {
    return 'sequential';
  }
}

export function writeSceneOrderMode(mode: SceneOrderMode) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SCENE_ORDER_MODE_KEY, mode);
  } catch {
    /* ignore */
  }
}
