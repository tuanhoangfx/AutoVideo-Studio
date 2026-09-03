import { describe, expect, it } from 'vitest';
import { buildKeyframeSceneFilters } from './keyframe-scene-filters';

describe('keyframe scene filters', () => {
  it('always includes Export filter (not gated on script/export boundary)', () => {
    const filters = buildKeyframeSceneFilters();
    expect(filters.map((item) => item.key)).toEqual(['transition', 'effect', 'exportSkipped']);
  });
});
