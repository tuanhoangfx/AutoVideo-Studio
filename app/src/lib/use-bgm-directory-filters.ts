'use client';

import { useCallback, useMemo } from 'react';
import {
  enrichFilterDefs,
  hubDirectoryListResetKey,
  type FilterValues,
} from '@/lib/hub-ui';
import type { BgmOption } from '@/lib/bgm-options';
import {
  bgmDirectoryMatchesOption,
  bgmDirectoryOptionValuesOf,
  bgmFilterValuesToState,
  bgmStateToFilterValues,
  buildBgmFilters,
  matchesBgmDirectoryFilters,
} from '@/lib/bgm-filters';

function sameStringList(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function useBgmDirectoryFilters({
  tracks,
  query,
  moodFilters,
  genreFilters,
  favoriteOnly,
  favoriteIds,
  setMoodFilters,
  setGenreFilters,
  sortKey = 'name',
  sortDir = 'asc',
}: {
  tracks: BgmOption[];
  query: string;
  moodFilters: string[];
  genreFilters: string[];
  favoriteOnly: boolean;
  favoriteIds: Set<string>;
  setMoodFilters: (values: string[]) => void;
  setGenreFilters: (values: string[]) => void;
  sortKey?: string;
  sortDir?: string;
}) {
  const filters = useMemo(() => buildBgmFilters(tracks), [tracks]);
  const filterValues = useMemo(
    () => bgmStateToFilterValues(moodFilters, genreFilters),
    [genreFilters, moodFilters],
  );

  const matches = useCallback(
    (track: BgmOption, filterQuery: string, values: FilterValues) =>
      matchesBgmDirectoryFilters(track, filterQuery, values, favoriteOnly, favoriteIds),
    [favoriteIds, favoriteOnly],
  );

  const enrichedFilters = useMemo(
    () =>
      enrichFilterDefs(
        tracks,
        filters,
        query,
        filterValues,
        matches,
        bgmDirectoryMatchesOption,
        bgmDirectoryOptionValuesOf,
      ),
    [filterValues, filters, matches, query, tracks],
  );

  const filteredTracks = useMemo(
    () => tracks.filter((track) => matches(track, query, filterValues)),
    [filterValues, matches, query, tracks],
  );

  const listResetKey = hubDirectoryListResetKey(
    query,
    filterValues,
    sortKey,
    sortDir,
    favoriteOnly ? 'favorites' : '',
  );

  const handleFilterValuesChange = useCallback(
    (values: FilterValues) => {
      const next = bgmFilterValuesToState(values);
      if (!sameStringList(moodFilters, next.moodFilters)) {
        setMoodFilters(next.moodFilters);
      }
      if (!sameStringList(genreFilters, next.genreFilters)) {
        setGenreFilters(next.genreFilters);
      }
    },
    [genreFilters, moodFilters, setGenreFilters, setMoodFilters],
  );

  return {
    filters: enrichedFilters,
    filterValues,
    filteredTracks,
    listResetKey,
    handleFilterValuesChange,
  };
}
