'use client';

import { useCallback, useMemo } from 'react';
import {
  enrichFilterDefs,
  hubDirectoryListResetKey,
  type FilterValues,
} from '@/lib/hub-ui';
import {
  buildVoiceFilters,
  matchesVoiceDirectoryFilters,
  voiceDirectoryMatchesOption,
  voiceDirectoryOptionValuesOf,
  voiceFilterValuesToState,
  voiceStateToFilterValues,
} from '@/lib/voice-filters';
import type { VoiceDirectoryRow } from '@/components/studio/VoiceDirectoryTable';

function sameStringList(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function useVoiceDirectoryFilters({
  voices,
  query,
  localeFilters,
  genderFilters,
  favoriteOnly,
  favoriteIds,
  setLocaleFilters,
  setGenderFilters,
  sortKey = 'name',
  sortDir = 'asc',
}: {
  voices: VoiceDirectoryRow[];
  query: string;
  localeFilters: string[];
  genderFilters: string[];
  favoriteOnly: boolean;
  favoriteIds: Set<string>;
  setLocaleFilters: (values: string[]) => void;
  setGenderFilters: (values: string[]) => void;
  sortKey?: string;
  sortDir?: string;
}) {
  const filters = useMemo(() => buildVoiceFilters(), []);
  const filterValues = useMemo(
    () => voiceStateToFilterValues(localeFilters, genderFilters),
    [genderFilters, localeFilters],
  );

  const matches = useCallback(
    (voice: VoiceDirectoryRow, filterQuery: string, values: FilterValues) =>
      matchesVoiceDirectoryFilters(voice, filterQuery, values, favoriteOnly, favoriteIds),
    [favoriteIds, favoriteOnly],
  );

  const enrichedFilters = useMemo(
    () =>
      enrichFilterDefs(
        voices,
        filters,
        query,
        filterValues,
        matches,
        voiceDirectoryMatchesOption,
        voiceDirectoryOptionValuesOf,
      ),
    [filterValues, filters, matches, query, voices],
  );

  const filteredVoices = useMemo(
    () => voices.filter((voice) => matches(voice, query, filterValues)),
    [filterValues, matches, query, voices],
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
      const next = voiceFilterValuesToState(values);
      if (!sameStringList(localeFilters, next.localeFilters)) {
        setLocaleFilters(next.localeFilters);
      }
      if (!sameStringList(genderFilters, next.genderFilters)) {
        setGenderFilters(next.genderFilters);
      }
    },
    [genderFilters, localeFilters, setGenderFilters, setLocaleFilters],
  );

  return {
    filters: enrichedFilters,
    filterValues,
    filteredVoices,
    listResetKey,
    handleFilterValuesChange,
  };
}
