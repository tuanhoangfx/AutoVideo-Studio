'use client';

import type { FilterDef, FilterOption, FilterValues } from '@/lib/hub-ui';
import { colHint, hubLocaleFlagFilterOption, withFilterLabelHints } from '@/lib/hub-ui';
import { GENDER_FILTER_ICON_SRC, GENDER_FILTER_TRIGGER_ICON_SRC } from '@/lib/gender-filter-icons';
import type { VoiceDirectoryRow } from '@/components/studio/VoiceDirectoryTable';
import { VOICE_OPTIONS } from '@/lib/voice-options';

export type VoiceGenderFacet = 'female' | 'male';

export function voiceLocaleFacet(voice: VoiceDirectoryRow): string {
  return voice.locale.trim();
}

export function voiceGenderFacet(voice: VoiceDirectoryRow): VoiceGenderFacet {
  return voice.gender === '♀' ? 'female' : 'male';
}

export function voiceLocaleFilterLabel(locale: string): string {
  if (locale === 'VI') return 'Vietnamese';
  if (locale.startsWith('EN-')) return `English (${locale.slice(3)})`;
  const names: Record<string, string> = {
    JA: 'Japanese',
    KO: 'Korean',
    ZH: 'Chinese',
    TH: 'Thai',
    ID: 'Indonesian',
  };
  return names[locale] ?? locale;
}

/** Legacy vi / en / asia buckets from the previous 3-facet UI. */
export function voiceLocaleMatchesFilter(voiceLocale: string, optionValue: string): boolean {
  if (voiceLocale === optionValue) return true;
  if (optionValue === 'vi') return voiceLocale === 'VI';
  if (optionValue === 'en') return voiceLocale.startsWith('EN');
  if (optionValue === 'asia') return voiceLocale !== 'VI' && !voiceLocale.startsWith('EN');
  return false;
}

export function buildVoiceLocaleFilterOptions(
  voices: readonly { locale: string }[] = VOICE_OPTIONS,
): FilterOption[] {
  const seen = new Set<string>();
  const options: FilterOption[] = [];
  for (const voice of voices) {
    const locale = voice.locale.trim();
    if (!locale || seen.has(locale)) continue;
    seen.add(locale);
    options.push(hubLocaleFlagFilterOption(locale, voiceLocaleFilterLabel(locale)));
  }
  return options.sort((a, b) => a.label.localeCompare(b.label));
}

export function buildVoiceFilters(
  voices: readonly { locale: string }[] = VOICE_OPTIONS,
): FilterDef[] {
  return withFilterLabelHints(
    [
      {
        key: 'locale',
        label: 'Locale',
        showAllLabel: false,
        triggerEmoji: '🌍',
        options: buildVoiceLocaleFilterOptions(voices),
      },
      {
        key: 'gender',
        label: 'Gender',
        showAllLabel: false,
        allRowIconSrc: GENDER_FILTER_TRIGGER_ICON_SRC,
        allRowIconShell: 'bare',
        options: [
          {
            value: 'female',
            label: 'Female',
            iconSrc: GENDER_FILTER_ICON_SRC.female,
            iconShell: 'bare',
          },
          {
            value: 'male',
            label: 'Male',
            iconSrc: GENDER_FILTER_ICON_SRC.male,
            iconShell: 'bare',
          },
        ],
      },
    ],
    (_key, label) => colHint(label, `${label} filter for the voice directory.`),
  );
}

export function voiceFilterValuesToState(values: FilterValues) {
  return {
    localeFilters: values.locale ?? [],
    genderFilters: values.gender ?? [],
  };
}

export function voiceStateToFilterValues(localeFilters: string[], genderFilters: string[]) {
  return {
    locale: localeFilters,
    gender: genderFilters,
  };
}

export function matchesVoiceDirectoryFilters(
  voice: VoiceDirectoryRow,
  query: string,
  values: FilterValues,
  favoriteOnly: boolean,
  favoriteIds: Set<string>,
): boolean {
  if (favoriteOnly && !favoriteIds.has(voice.id)) return false;

  const localeFilters = values.locale ?? [];
  if (
    localeFilters.length > 0 &&
    !localeFilters.some((value) => voiceLocaleMatchesFilter(voiceLocaleFacet(voice), value))
  ) {
    return false;
  }

  const genderFilters = values.gender ?? [];
  if (genderFilters.length > 0 && !genderFilters.includes(voiceGenderFacet(voice))) {
    return false;
  }

  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = `${voice.label} ${voice.id} ${voice.locale} ${voice.tone}`.toLowerCase();
  return haystack.includes(q);
}

export function voiceDirectoryMatchesOption(
  voice: VoiceDirectoryRow,
  filterKey: string,
  optionValue: string,
): boolean {
  if (filterKey === 'locale') return voiceLocaleMatchesFilter(voiceLocaleFacet(voice), optionValue);
  if (filterKey === 'gender') return voiceGenderFacet(voice) === optionValue;
  return false;
}

export function voiceDirectoryOptionValuesOf(voice: VoiceDirectoryRow, filterKey: string) {
  if (filterKey === 'locale') return [voiceLocaleFacet(voice)];
  if (filterKey === 'gender') return [voiceGenderFacet(voice)];
  return null;
}
