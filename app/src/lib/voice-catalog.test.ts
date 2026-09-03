import { describe, expect, it } from 'vitest';
import { resolveStudioVoiceId } from './voice-catalog';

describe('resolveStudioVoiceId', () => {
  it('maps retired Amber/Ashley/Brandon/Cora to live edge voices', () => {
    expect(resolveStudioVoiceId('en-US-AmberNeural')).toBe('en-US-AvaNeural');
    expect(resolveStudioVoiceId('en-US-AshleyNeural')).toBe('en-US-EmmaNeural');
    expect(resolveStudioVoiceId('en-US-BrandonNeural')).toBe('en-US-BrianNeural');
    expect(resolveStudioVoiceId('en-US-CoraNeural')).toBe('en-US-MichelleNeural');
  });
});
