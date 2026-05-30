/** Shared render pipeline constants (keep in sync with worker/pipeline/pipeline_constants.py). */

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
