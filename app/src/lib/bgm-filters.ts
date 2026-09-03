'use client';

import type { FilterDef, FilterOption, FilterValues } from '@/lib/hub-ui';
import { colHint, withFilterLabelHints } from '@/lib/hub-ui';
import type { BgmGenre, BgmMood, BgmOption } from '@/lib/bgm-options';
import { BGM_OPTIONS } from '@/lib/bgm-options';

const MOOD_LABELS: Record<BgmMood, string> = {
  calm: 'Calm',
  upbeat: 'Upbeat',
  cinematic: 'Cinematic',
  lofi: 'Lo-fi',
};

const GENRE_LABELS: Record<BgmGenre, string> = {
  ambient: 'Ambient',
  electronic: 'Electronic',
  acoustic: 'Acoustic',
  corporate: 'Corporate',
};

const MOOD_EMOJI: Record<BgmMood, string> = {
  calm: '🌊',
  upbeat: '⚡',
  cinematic: '🎬',
  lofi: '☕',
};

function uniqueMoods(tracks: readonly BgmOption[]): BgmMood[] {
  const seen = new Set<BgmMood>();
  for (const track of tracks) seen.add(track.mood);
  return [...seen].sort((a, b) => MOOD_LABELS[a].localeCompare(MOOD_LABELS[b]));
}

function uniqueGenres(tracks: readonly BgmOption[]): BgmGenre[] {
  const seen = new Set<BgmGenre>();
  for (const track of tracks) seen.add(track.genre);
  return [...seen].sort((a, b) => GENRE_LABELS[a].localeCompare(GENRE_LABELS[b]));
}

export function buildBgmMoodFilterOptions(tracks: readonly BgmOption[] = BGM_OPTIONS): FilterOption[] {
  return uniqueMoods(tracks).map((mood) => ({
    value: mood,
    label: MOOD_LABELS[mood],
    emoji: MOOD_EMOJI[mood],
  }));
}

export function buildBgmGenreFilterOptions(tracks: readonly BgmOption[] = BGM_OPTIONS): FilterOption[] {
  return uniqueGenres(tracks).map((genre) => ({
    value: genre,
    label: GENRE_LABELS[genre],
  }));
}

export function buildBgmFilters(tracks: readonly BgmOption[] = BGM_OPTIONS): FilterDef[] {
  return withFilterLabelHints(
    [
      {
        key: 'mood',
        label: 'Mood',
        showAllLabel: false,
        triggerEmoji: '🎵',
        options: buildBgmMoodFilterOptions(tracks),
      },
      {
        key: 'genre',
        label: 'Genre',
        showAllLabel: false,
        triggerEmoji: '🎸',
        options: buildBgmGenreFilterOptions(tracks),
      },
    ],
    (_key, label) => colHint(label, `${label} filter for the BGM directory.`),
  );
}

export function matchesBgmDirectoryFilters(
  track: BgmOption,
  query: string,
  values: FilterValues,
  favoriteOnly: boolean,
  favoriteIds: Set<string>,
): boolean {
  if (favoriteOnly && !favoriteIds.has(track.id)) return false;

  const moodFilters = values.mood ?? [];
  if (moodFilters.length > 0 && !moodFilters.includes(track.mood)) return false;

  const genreFilters = values.genre ?? [];
  if (genreFilters.length > 0 && !genreFilters.includes(track.genre)) return false;

  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = `${track.label} ${track.id} ${track.mood} ${track.genre}`.toLowerCase();
  return haystack.includes(q);
}

export function bgmDirectoryMatchesOption(track: BgmOption, filterKey: string, optionValue: string): boolean {
  if (filterKey === 'mood') return track.mood === optionValue;
  if (filterKey === 'genre') return track.genre === optionValue;
  return false;
}

export function bgmDirectoryOptionValuesOf(track: BgmOption, filterKey: string) {
  if (filterKey === 'mood') return [track.mood];
  if (filterKey === 'genre') return [track.genre];
  return null;
}

export function bgmFilterValuesToState(values: FilterValues) {
  return {
    moodFilters: values.mood ?? [],
    genreFilters: values.genre ?? [],
  };
}

export function bgmStateToFilterValues(moodFilters: string[], genreFilters: string[]) {
  return {
    mood: moodFilters,
    genre: genreFilters,
  };
}
