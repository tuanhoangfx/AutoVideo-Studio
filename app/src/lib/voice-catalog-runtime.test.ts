import { describe, expect, it } from 'vitest';
import { mapWorkerVoicesToOptions } from './voice-catalog-runtime';
import { VOICE_OPTIONS } from './voice-options';

describe('mapWorkerVoicesToOptions', () => {
  it('maps all neural worker rows including non-English locales', () => {
    const mapped = mapWorkerVoicesToOptions([
      {
        ShortName: 'en-US-JennyNeural',
        FriendlyName: 'Microsoft Jenny Online (Natural) - English (United States)',
        Gender: 'Female',
        Locale: 'en-US',
      },
      {
        ShortName: 'vi-VN-HoaiMyNeural',
        FriendlyName: 'Microsoft HoaiMy Online (Natural) - Vietnamese (Vietnam)',
        Gender: 'Female',
        Locale: 'vi-VN',
      },
      {
        ShortName: 'fr-FR-DeniseNeural',
        FriendlyName: 'Microsoft Denise Online (Natural) - French (France)',
        Gender: 'Female',
        Locale: 'fr-FR',
      },
    ]);

    expect(mapped.map((v) => v.id)).toEqual([
      'en-US-JennyNeural',
      'vi-VN-HoaiMyNeural',
      'fr-FR-DeniseNeural',
    ]);
    expect(mapped[0]).toMatchObject({
      label: 'Jenny',
      gender: '♀',
      locale: 'en-US',
      recommended: true,
    });
    expect(mapped[1]?.label).toBe('Hoài My');
    expect(mapped[2]?.locale).toBe('fr-FR');
  });

  it('static fallback has the full neural catalog', () => {
    expect(VOICE_OPTIONS.length).toBeGreaterThanOrEqual(300);
  });
});
