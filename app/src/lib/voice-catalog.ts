import { DEFAULT_STUDIO_VOICE } from '@/lib/studio-defaults';
import { VOICE_OPTIONS } from '@/lib/voice-options';

/** Retired Microsoft edge voices → live replacements (draft/export migration). */
export const STUDIO_VOICE_ALIASES: Record<string, string> = {
  'en-US-AmberNeural': 'en-US-AvaNeural',
  'en-US-AshleyNeural': 'en-US-EmmaNeural',
  'en-US-BrandonNeural': 'en-US-BrianNeural',
  'en-US-CoraNeural': 'en-US-MichelleNeural',
  'en-US-DavisNeural': 'en-US-AndrewNeural',
  'en-US-JaneNeural': 'en-US-EmmaNeural',
  'en-US-JasonNeural': 'en-US-EricNeural',
  'en-US-NancyNeural': 'en-US-JennyNeural',
  'en-US-SaraNeural': 'en-US-AvaNeural',
  'en-US-TonyNeural': 'en-US-GuyNeural',
  'en-US-ElizabethNeural': 'en-US-EmmaNeural',
  'en-US-JacobNeural': 'en-US-EricNeural',
  'en-US-MonicaNeural': 'en-US-MichelleNeural',
  'en-AU-WilliamNeural': 'en-AU-WilliamMultilingualNeural',
};

const STATIC_VOICE_IDS = new Set(VOICE_OPTIONS.map((voice) => voice.id));
let runtimeVoiceIds: Set<string> | null = null;

export function setRuntimeVoiceIds(ids: readonly string[]) {
  runtimeVoiceIds = new Set(ids);
}

function isKnownVoiceId(voice: string): boolean {
  if (runtimeVoiceIds?.has(voice)) return true;
  return STATIC_VOICE_IDS.has(voice);
}

/** Map retired/unknown voice ids to a live edge voice before preview/export. */
export function resolveStudioVoiceId(voice: string): string {
  let current = voice.trim() || DEFAULT_STUDIO_VOICE;
  const seen = new Set<string>();
  while (STUDIO_VOICE_ALIASES[current] && !seen.has(current)) {
    seen.add(current);
    current = STUDIO_VOICE_ALIASES[current]!;
  }
  if (isKnownVoiceId(current)) return current;
  return DEFAULT_STUDIO_VOICE;
}

export function isKnownStudioVoiceId(voice: string): boolean {
  return isKnownVoiceId(voice);
}
