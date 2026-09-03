import {
  createDirectoryTableColumnPrefs,
  type DirectoryTableColumnItem,
} from '@/lib/hub-ui';
import {
  KEYFRAME_SCENE_COLUMN_KEYS,
  KEYFRAME_SCENE_COLUMN_STICKER,
  type KeyframeSceneColumnKey,
} from '@/lib/keyframe-scene-column-meta';

export const KEYFRAME_SCENE_DIRECTORY_COLUMN_ITEMS: DirectoryTableColumnItem<KeyframeSceneColumnKey>[] = [
  { key: 'scene', label: 'Scene', emoji: KEYFRAME_SCENE_COLUMN_STICKER.scene, required: true },
  { key: 'image', label: 'Image', emoji: KEYFRAME_SCENE_COLUMN_STICKER.image },
  { key: 'start', label: 'Start', emoji: KEYFRAME_SCENE_COLUMN_STICKER.start },
  { key: 'duration', label: 'Duration', emoji: KEYFRAME_SCENE_COLUMN_STICKER.duration },
  { key: 'transition', label: 'Transition', emoji: KEYFRAME_SCENE_COLUMN_STICKER.transition },
  { key: 'effect', label: 'Effect', emoji: KEYFRAME_SCENE_COLUMN_STICKER.effect },
  { key: 'transcript', label: 'Transcript', emoji: KEYFRAME_SCENE_COLUMN_STICKER.transcript, required: true },
];

/** Default — hide FX columns so Transcript gets rail width (Voice rail hides Tone). */
export const DEFAULT_KEYFRAME_SCENE_DIRECTORY_COLUMNS = new Set<KeyframeSceneColumnKey>([
  'scene',
  'image',
  'start',
  'duration',
  'transcript',
]);

export const KEYFRAME_SCENE_DIRECTORY_COLUMNS_CHANGE = 'p0021-keyframe-scene-directory-columns-change';

export const keyframeSceneDirectoryColumnPrefs = createDirectoryTableColumnPrefs({
  storageKey: 'p0021_keyframe_scene_directory_columns',
  items: KEYFRAME_SCENE_DIRECTORY_COLUMN_ITEMS,
  defaultKeys: DEFAULT_KEYFRAME_SCENE_DIRECTORY_COLUMNS,
  changeEvent: KEYFRAME_SCENE_DIRECTORY_COLUMNS_CHANGE,
});

export function readKeyframeSceneDirectoryColumns(): KeyframeSceneColumnKey[] {
  const visible = keyframeSceneDirectoryColumnPrefs.read();
  return KEYFRAME_SCENE_COLUMN_KEYS.filter((key) => visible.has(key));
}

/** Restore column visibility from project draft (Studio autosave). */
export function restoreKeyframeSceneDirectoryColumnsFromDraft(
  keys: readonly string[] | undefined,
): void {
  if (typeof window === 'undefined' || !keys?.length) return;
  const allowed = new Set(KEYFRAME_SCENE_COLUMN_KEYS);
  const next = keys.filter((key): key is KeyframeSceneColumnKey => allowed.has(key as KeyframeSceneColumnKey));
  if (next.length === 0) return;
  keyframeSceneDirectoryColumnPrefs.write(new Set(next));
}

export function readKeyframeSceneDirectoryColumnsForDraft(): KeyframeSceneColumnKey[] {
  return readKeyframeSceneDirectoryColumns();
}
