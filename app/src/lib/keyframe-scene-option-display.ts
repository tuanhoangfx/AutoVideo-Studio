import type { FilterOption } from '@/lib/hub-ui';
import { hubNoneFilterOption } from '@/lib/hub-ui';
import { EFFECT_OPTIONS, TRANSITION_OPTIONS, type Effect, type Transition } from '@/components/studio/ScriptPanel';
import { coerceTransition } from '@/lib/pipeline-constants';

/** Color emoji in filter + table (Segoe color tiles — not monochrome sticker). */
export const KEYFRAME_OPTION_EMOJI_COLOR = true;

export function keyframeCatalogFilterOption(opt: {
  id: string;
  label: string;
  icon: string;
}): FilterOption {
  if (opt.id === 'none') {
    return hubNoneFilterOption(opt.id, { emojiColor: KEYFRAME_OPTION_EMOJI_COLOR });
  }
  return {
    value: opt.id,
    label: opt.label,
    emoji: opt.icon,
    emojiColor: KEYFRAME_OPTION_EMOJI_COLOR,
  };
}

export function keyframeTransitionFilterOptions(): FilterOption[] {
  return TRANSITION_OPTIONS.map(keyframeCatalogFilterOption);
}

export function keyframeEffectFilterOptions(): FilterOption[] {
  return EFFECT_OPTIONS.map(keyframeCatalogFilterOption);
}

export function keyframeExportBoundaryFilterOptions(): FilterOption[] {
  return [
    { value: 'included', label: 'Included', emoji: '✅', emojiColor: KEYFRAME_OPTION_EMOJI_COLOR },
    { value: 'partial', label: 'Partial export', emoji: '✂️', emojiColor: KEYFRAME_OPTION_EMOJI_COLOR },
    { value: 'skipped', label: 'Skipped in export', emoji: '⏭️', emojiColor: KEYFRAME_OPTION_EMOJI_COLOR },
  ];
}

export function resolveKeyframeTransitionOption(value: string | undefined): { emoji: string; label: string } {
  const id = coerceTransition(value);
  const opt = TRANSITION_OPTIONS.find((item) => item.id === id);
  return { emoji: opt?.icon ?? '↔️', label: opt?.label ?? id };
}

export function resolveKeyframeEffectOption(value: Effect | undefined): { emoji: string; label: string } {
  const id = (value ?? 'none') as Effect;
  const opt = EFFECT_OPTIONS.find((item) => item.id === id);
  return { emoji: opt?.icon ?? '✨', label: opt?.label ?? id };
}

export type { Transition };
