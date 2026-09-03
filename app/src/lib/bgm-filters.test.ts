import { describe, expect, it } from 'vitest';
import { BGM_OPTIONS } from '@/lib/bgm-options';
import {
  buildBgmFilters,
  matchesBgmDirectoryFilters,
  bgmDirectoryMatchesOption,
} from '@/lib/bgm-filters';

describe('buildBgmFilters', () => {
  it('builds mood and genre facets with trigger emojis', () => {
    const filters = buildBgmFilters();
    expect(filters).toHaveLength(2);
    expect(filters[0]?.key).toBe('mood');
    expect(filters[0]?.triggerEmoji).toBe('🎵');
    expect(filters[1]?.key).toBe('genre');
    expect(filters[1]?.triggerEmoji).toBe('🎸');
  });
});

describe('matchesBgmDirectoryFilters', () => {
  const track = BGM_OPTIONS[0]!;

  it('matches mood and genre facets', () => {
    expect(matchesBgmDirectoryFilters(track, '', { mood: ['calm'], genre: ['ambient'] }, false, new Set())).toBe(
      true,
    );
    expect(matchesBgmDirectoryFilters(track, '', { mood: ['upbeat'] }, false, new Set())).toBe(false);
  });

  it('matches search haystack', () => {
    expect(matchesBgmDirectoryFilters(track, 'serene', {}, false, new Set())).toBe(true);
    expect(matchesBgmDirectoryFilters(track, 'missing', {}, false, new Set())).toBe(false);
  });

  it('requires favorite when favoriteOnly is on', () => {
    const favorites = new Set([track.id]);
    expect(matchesBgmDirectoryFilters(track, '', {}, true, favorites)).toBe(true);
    expect(matchesBgmDirectoryFilters(track, '', {}, true, new Set())).toBe(false);
  });
});

describe('bgmDirectoryMatchesOption', () => {
  const track = BGM_OPTIONS[0]!;

  it('resolves mood and genre option keys', () => {
    expect(bgmDirectoryMatchesOption(track, 'mood', 'calm')).toBe(true);
    expect(bgmDirectoryMatchesOption(track, 'genre', 'ambient')).toBe(true);
    expect(bgmDirectoryMatchesOption(track, 'genre', 'electronic')).toBe(false);
  });
});
