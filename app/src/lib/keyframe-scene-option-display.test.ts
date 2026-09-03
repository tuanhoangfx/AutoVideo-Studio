import { describe, expect, it } from 'vitest';
import { buildKeyframeSceneFilters } from './keyframe-scene-filters';
import {
  KEYFRAME_OPTION_EMOJI_COLOR,
  keyframeEffectFilterOptions,
  resolveKeyframeEffectOption,
  resolveKeyframeTransitionOption,
} from './keyframe-scene-option-display';

describe('keyframe scene option emoji SSOT', () => {
  it('paints filter catalog emojis in color presentation', () => {
    const effect = keyframeEffectFilterOptions();
    expect(effect.every((opt) => opt.emojiColor === KEYFRAME_OPTION_EMOJI_COLOR)).toBe(true);
    expect(effect.some((opt) => opt.emoji === '✨')).toBe(true);

    const filters = buildKeyframeSceneFilters();
    const exportFilter = filters.find((item) => item.key === 'exportSkipped');
    expect(filters).toHaveLength(3);
    expect(exportFilter?.label).toBe('Export');
    expect(exportFilter?.options.every((opt) => opt.emojiColor === true)).toBe(true);
  });

  it('resolves table labels with the same emoji as filters', () => {
    expect(resolveKeyframeTransitionOption('slide_left')).toEqual({ emoji: '⬅️', label: 'Slide left' });
    expect(resolveKeyframeEffectOption('none')).toEqual({ emoji: '🚫', label: 'None' });
    expect(resolveKeyframeEffectOption('pan_right')).toEqual({ emoji: '➡️', label: 'Pan right' });
  });
});
