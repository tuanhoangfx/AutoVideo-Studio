import {
  applyStandardDirectoryColumnHints,
  createDirectoryColumnMetaHelpers,
  type HubDirectoryTableStaticColumn,
} from '@/lib/hub-ui';
import { STUDIO_DIRECTORY_RAIL_PAGE_SIZE } from './studio-directory-rail-meta';

const { col, toHubDirectoryColumnMeta } = createDirectoryColumnMetaHelpers();

export const KEYFRAME_SCENE_COLUMN_KEYS = [
  'scene',
  'image',
  'start',
  'duration',
  'transition',
  'effect',
  'transcript',
] as const;

export type KeyframeSceneColumnKey = (typeof KEYFRAME_SCENE_COLUMN_KEYS)[number];

export const KEYFRAME_SCENE_COLUMN_STICKER = {
  scene: '🎬',
  image: '🖼️',
  start: '▶️',
  duration: '⏱️',
  transition: '↔️',
  effect: '✨',
  transcript: '💬',
} as const;

export const KEYFRAME_SCENE_HUB_COLUMN_META = {
  scene: col('Scene', 'studio-keyframe-col--scene', 'name', 'col.directory.name', '5rem', {
    headerEmoji: KEYFRAME_SCENE_COLUMN_STICKER.scene,
    columnKind: 'code',
  }),
  image: col('Image', 'studio-keyframe-col--image', 'role', 'col.directory.category', '9rem', {
    headerEmoji: KEYFRAME_SCENE_COLUMN_STICKER.image,
  }),
  start: col('Start', 'studio-keyframe-col--start', 'created', 'col.directory.created', '6.5rem', {
    headerEmoji: KEYFRAME_SCENE_COLUMN_STICKER.start,
    columnKind: 'date',
    headerAlign: 'center',
  }),
  duration: col('Duration', 'studio-keyframe-col--duration', 'created', 'col.directory.updated', '6rem', {
    headerEmoji: KEYFRAME_SCENE_COLUMN_STICKER.duration,
    columnKind: 'compact',
    headerAlign: 'center',
  }),
  transition: col('Transition', 'studio-keyframe-col--transition', 'role', 'col.directory.category', '10rem', {
    headerEmoji: KEYFRAME_SCENE_COLUMN_STICKER.transition,
    columnKind: 'compact',
  }),
  effect: col('Effect', 'studio-keyframe-col--effect', 'role', 'col.directory.category', '9rem', {
    headerEmoji: KEYFRAME_SCENE_COLUMN_STICKER.effect,
    columnKind: 'compact',
  }),
  transcript: col('Transcript', 'studio-keyframe-col--transcript', 'email', 'col.directory.email', '18rem', {
    headerEmoji: KEYFRAME_SCENE_COLUMN_STICKER.transcript,
  }),
} satisfies Record<KeyframeSceneColumnKey, ReturnType<typeof col>>;

export function buildKeyframeSceneHubColumns() {
  return toHubDirectoryColumnMeta(
    applyStandardDirectoryColumnHints(KEYFRAME_SCENE_HUB_COLUMN_META, {
      scene: 'Scene — timeline order in the export.',
      image: 'Image — library still assigned to this scene.',
      start: 'Start — scene begin time on the timeline.',
      duration: 'Duration — hold time for this scene.',
      transition: 'Transition — cut between this scene and the next.',
      effect: 'Effect — Ken Burns / flash motion on the still.',
      transcript: 'Transcript — narration spoken during this scene.',
    }),
  );
}

export const KEYFRAME_SCENE_STATIC_COLUMNS: HubDirectoryTableStaticColumn[] = [];

/** Scene list page size — fixed-rows rail (parity with voice rail). */
export const KEYFRAME_SCENE_PAGE_SIZE = STUDIO_DIRECTORY_RAIL_PAGE_SIZE;
