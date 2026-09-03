import type { HubBulkDetailFieldDef } from '@/lib/hub-ui';
import { KEYFRAME_SCENE_COLUMN_STICKER } from '@/lib/keyframe-scene-column-meta';
import {
  keyframeEffectFilterOptions,
  keyframeTransitionFilterOptions,
} from '@/lib/keyframe-scene-option-display';

const durationHeader = {
  label: 'Duration',
  colClass: 'studio-keyframe-col--duration',
  role: 'created' as const,
  headerAlign: 'center' as const,
  headerEmoji: KEYFRAME_SCENE_COLUMN_STICKER.duration,
};

const transitionHeader = {
  label: 'Transition',
  colClass: 'studio-keyframe-col--transition',
  role: 'role' as const,
  headerAlign: 'start' as const,
  headerEmoji: KEYFRAME_SCENE_COLUMN_STICKER.transition,
};

const effectHeader = {
  label: 'Effect',
  colClass: 'studio-keyframe-col--effect',
  role: 'role' as const,
  headerAlign: 'start' as const,
  headerEmoji: KEYFRAME_SCENE_COLUMN_STICKER.effect,
};

export const KEYFRAME_SCENE_BULK_DETAIL_FIELDS: HubBulkDetailFieldDef[] = [
  {
    key: 'durationSec',
    control: 'edit',
    header: durationHeader,
    fieldLabel: 'Duration (s)',
    placeholder: 'Leave unchanged',
    inputMode: 'numeric',
  },
  {
    key: 'transition',
    control: 'filter',
    header: transitionHeader,
    fieldLabel: 'Transition',
    filterKey: 'bulk-scene-transition',
    options: keyframeTransitionFilterOptions(),
    allowClear: true,
    clearLabel: 'Leave unchanged',
  },
  {
    key: 'effect',
    control: 'filter',
    header: effectHeader,
    fieldLabel: 'Effect',
    filterKey: 'bulk-scene-effect',
    options: keyframeEffectFilterOptions(),
    allowClear: true,
    clearLabel: 'Leave unchanged',
  },
];
