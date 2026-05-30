/** Display order: en-US → other English → Vietnamese → other locales. */

export type VoiceSortable = {
  id: string;
  locale: string;
  recommended?: boolean;
};

export function voiceLocaleTier(v: VoiceSortable): number {
  if (v.locale === 'EN-US' || v.id.startsWith('en-US-')) return 0;
  if (v.locale.startsWith('EN') || v.id.startsWith('en-')) return 1;
  if (v.locale === 'VI' || v.id.startsWith('vi-')) return 2;
  return 3;
}

export function compareVoiceOptions(a: VoiceSortable, b: VoiceSortable): number {
  const tierDiff = voiceLocaleTier(a) - voiceLocaleTier(b);
  if (tierDiff !== 0) return tierDiff;
  if (a.recommended && !b.recommended) return -1;
  if (!a.recommended && b.recommended) return 1;
  return a.id.localeCompare(b.id);
}
