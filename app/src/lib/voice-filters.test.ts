import { describe, expect, it } from 'vitest';
import type { VoiceDirectoryRow } from '@/components/studio/VoiceDirectoryTable';
import { flagsApiUrl } from '@/lib/hub-ui';
import { GENDER_FILTER_ICON_SRC } from '@/lib/gender-filter-icons';
import {
  buildVoiceFilters,
  matchesVoiceDirectoryFilters,
  voiceDirectoryMatchesOption,
  voiceFilterValuesToState,
  voiceGenderFacet,
  voiceLocaleFacet,
  voiceLocaleFilterLabel,
  voiceLocaleMatchesFilter,
  voiceStateToFilterValues,
} from './voice-filters';

const sampleVoice: VoiceDirectoryRow = {
  id: 'vi-VN-HoaiMyNeural',
  label: 'Hoài My',
  gender: '♀',
  locale: 'VI',
  tone: 'warm, natural',
};

describe('voiceLocaleFacet', () => {
  it('keeps the catalog locale code (one option per region, like P0020 country)', () => {
    expect(voiceLocaleFacet(sampleVoice)).toBe('VI');
    expect(voiceLocaleFacet({ ...sampleVoice, locale: 'en-US' })).toBe('en-US');
    expect(voiceLocaleFacet({ ...sampleVoice, locale: 'en-GB' })).toBe('en-GB');
    expect(voiceLocaleFacet({ ...sampleVoice, locale: 'ja-JP' })).toBe('ja-JP');
  });
});

describe('voiceLocaleFilterLabel', () => {
  it('splits English regions instead of one English bucket', () => {
    expect(voiceLocaleFilterLabel('VI')).toBe('Vietnamese');
    expect(voiceLocaleFilterLabel('vi-VN')).toBe('Vietnamese');
    expect(voiceLocaleFilterLabel('en-US')).toBe('English (US)');
    expect(voiceLocaleFilterLabel('en-GB')).toBe('English (GB)');
    expect(voiceLocaleFilterLabel('en-IE')).toBe('English (IE)');
    expect(voiceLocaleFilterLabel('ja-JP')).toMatch(/Japanese/i);
    expect(voiceLocaleFilterLabel('de-DE')).toMatch(/German/i);
  });
});

describe('matchesVoiceDirectoryFilters', () => {
  const favorites = new Set(['vi-VN-HoaiMyNeural']);

  it('matches exact locale and gender facets', () => {
    expect(
      matchesVoiceDirectoryFilters(sampleVoice, '', { locale: ['vi-VN'], gender: ['female'] }, false, favorites),
    ).toBe(true);
    expect(
      matchesVoiceDirectoryFilters(sampleVoice, '', { locale: ['en-US'], gender: ['female'] }, false, favorites),
    ).toBe(false);
    expect(
      matchesVoiceDirectoryFilters(sampleVoice, '', { locale: ['VI'], gender: ['male'] }, false, favorites),
    ).toBe(false);
  });

  it('still honors legacy vi / en / asia buckets', () => {
    expect(voiceLocaleMatchesFilter('VI', 'vi')).toBe(true);
    expect(voiceLocaleMatchesFilter('vi-VN', 'vi')).toBe(true);
    expect(voiceLocaleMatchesFilter('en-GB', 'en')).toBe(true);
    expect(voiceLocaleMatchesFilter('ja-JP', 'asia')).toBe(true);
    expect(voiceLocaleMatchesFilter('en-US', 'asia')).toBe(false);
  });

  it('requires favorite when favoriteOnly is on', () => {
    expect(matchesVoiceDirectoryFilters(sampleVoice, '', {}, true, favorites)).toBe(true);
    expect(
      matchesVoiceDirectoryFilters(
        { ...sampleVoice, id: 'en-US-JennyNeural' },
        '',
        {},
        true,
        favorites,
      ),
    ).toBe(false);
  });

  it('matches search haystack across label, id, locale, tone', () => {
    expect(matchesVoiceDirectoryFilters(sampleVoice, 'hoài', {}, false, favorites)).toBe(true);
    expect(matchesVoiceDirectoryFilters(sampleVoice, 'neural', {}, false, favorites)).toBe(true);
    expect(matchesVoiceDirectoryFilters(sampleVoice, 'warm', {}, false, favorites)).toBe(true);
    expect(matchesVoiceDirectoryFilters(sampleVoice, 'jenny', {}, false, favorites)).toBe(false);
  });
});

describe('voiceDirectoryMatchesOption', () => {
  it('resolves locale and gender option keys', () => {
    expect(voiceDirectoryMatchesOption(sampleVoice, 'locale', 'VI')).toBe(true);
    expect(voiceDirectoryMatchesOption(sampleVoice, 'gender', 'female')).toBe(true);
    expect(voiceDirectoryMatchesOption(sampleVoice, 'gender', 'male')).toBe(false);
  });
});

describe('voice filter value helpers', () => {
  it('round-trips filter state', () => {
    const values = voiceStateToFilterValues(['VI'], ['female']);
    expect(voiceFilterValuesToState(values)).toEqual({
      localeFilters: ['VI'],
      genderFilters: ['female'],
    });
  });

  it('builds locale options with flagsapi iconSrc (P0005/P0020 Filter SSOT)', () => {
    const filters = buildVoiceFilters();
    expect(filters).toHaveLength(2);
    expect(filters[0]?.key).toBe('locale');
    expect(filters[0]?.triggerEmoji).toBe('🌍');
    expect(filters[1]?.key).toBe('gender');
    expect(filters[1]?.triggerEmoji).toBe('🧬');
    const vi = filters[0]?.options.find((option) => option.value === 'vi-VN');
    const us = filters[0]?.options.find((option) => option.value === 'en-US');
    const gb = filters[0]?.options.find((option) => option.value === 'en-GB');
    const ie = filters[0]?.options.find((option) => option.value === 'en-IE');
    const female = filters[1]?.options.find((option) => option.value === 'female');
    expect(vi?.iconSrc).toBe(flagsApiUrl('VN', 'flat', 24));
    expect(vi?.iconShell).toBe('bare');
    expect(vi?.glyph).toBeUndefined();
    expect(vi?.emoji).toBeUndefined();
    expect(us?.iconSrc).toBe(flagsApiUrl('US', 'flat', 24));
    expect(gb?.iconSrc).toBe(flagsApiUrl('GB', 'flat', 24));
    expect(ie?.label).toBe('English (IE)');
    expect(filters[0]?.options.some((option) => option.value === 'en')).toBe(false);
    expect(filters[0]?.options.some((option) => option.value === 'asia')).toBe(false);
    expect(female?.iconSrc).toBe(GENDER_FILTER_ICON_SRC.female);
    expect(female?.iconShell).toBe('bare');
    expect(female?.glyph).toBeUndefined();
    const male = filters[1]?.options.find((option) => option.value === 'male');
    expect(male?.iconSrc).toBe(GENDER_FILTER_ICON_SRC.male);
  });
});
