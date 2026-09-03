import { describe, expect, it } from 'vitest';
import { voiceListPreviewText } from './voice-preview-text';

describe('voiceListPreviewText', () => {
  it('includes voice name so Amber, Ashley, and Brandon previews differ', () => {
    const amber = voiceListPreviewText('en-US-AmberNeural', 'Amber');
    const ashley = voiceListPreviewText('en-US-AshleyNeural', 'Ashley');
    const brandon = voiceListPreviewText('en-US-BrandonNeural', 'Brandon');
    expect(amber).toContain('Amber');
    expect(ashley).toContain('Ashley');
    expect(brandon).toContain('Brandon');
    expect(new Set([amber, ashley, brandon]).size).toBe(3);
  });
});
