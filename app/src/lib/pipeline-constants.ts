/** Shared render pipeline constants (keep in sync with worker/pipeline/pipeline_constants.py). */

import type { Transition } from '@/types/studio';

export const EFFECTS_CYCLE = ['zoom_in', 'pan_right', 'flash', 'sparkle'] as const;

export const RANDOM_EFFECTS = [
  'zoom_in',
  'zoom_out',
  'pan_right',
  'pan_left',
  'flash',
  'sparkle',
] as const;

export type AutoCycleEffect = (typeof EFFECTS_CYCLE)[number];

const TRANSITION_UI_VALUES: Transition[] = [
  'slide_left',
  'slide_right',
  'fade',
  'zoom',
  'random',
  'none',
];

const PREVIEW_RANDOM_TRANSITIONS = ['slide_left', 'slide_right', 'fade', 'zoom'] as const;

export type PreviewTransition = (typeof PREVIEW_RANDOM_TRANSITIONS)[number] | 'cut';

/** Crossfade duration between scenes — matches ffmpeg render (compose.py). */
export const TRANSITION_S = 0.4;

export function resolveAutoEffect(
  effect: string | undefined,
  index: number
): string {
  if (effect === 'random') {
    return RANDOM_EFFECTS[index % RANDOM_EFFECTS.length];
  }
  if (effect && effect !== 'auto') return effect;
  return EFFECTS_CYCLE[index % EFFECTS_CYCLE.length];
}

/** Coerce stored value to a valid UI transition (keeps `none` for timeline). */
export function coerceTransition(value: string | undefined | null): Transition {
  if (TRANSITION_UI_VALUES.includes(value as Transition)) return value as Transition;
  if (value === 'slide') return 'slide_left';
  if (value === 'cut') return 'none';
  return 'slide_left';
}

/** Worker/export normalization — mirrors pipeline_constants.normalize_transition. */
export function normalizeTransitionForWorker(value: string | undefined | null): string {
  const v = coerceTransition(value);
  if (v === 'none') return 'cut';
  return v;
}

/** Default transition for new scenes / export payload when unset. */
export function defaultSceneTransition(value: string | undefined | null): Transition {
  return coerceTransition(value ?? 'slide_left');
}

/** Canvas preview transition (random resolved per scene index). */
export function resolvePreviewTransition(
  value: string | undefined | null,
  index: number
): PreviewTransition {
  const coerced = coerceTransition(value);
  if (coerced === 'none') return 'cut';
  if (coerced === 'random') {
    return PREVIEW_RANDOM_TRANSITIONS[index % PREVIEW_RANDOM_TRANSITIONS.length];
  }
  return coerced;
}
