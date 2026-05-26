export type ScriptMetrics = {
  chars: number;
  words: number;
  tokens: number;
  readSeconds: number;
};

export function scriptMetrics(value: string, voice: string, rate: string): ScriptMetrics {
  const chars = Array.from(value).filter((char) => !/\s/.test(char)).length;
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const tokens = Math.max(0, Math.ceil(chars / 3.8));
  const baseWpm = readingWpmForVoice(voice);
  const speedFactor = Math.max(0.5, 1 + rateToPercent(rate) / 100);
  const readSeconds = words === 0 ? 0 : Math.ceil((words / (baseWpm * speedFactor)) * 60);
  return { chars, words, tokens, readSeconds };
}

export function formatReadTime(totalSeconds: number) {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

function readingWpmForVoice(voice: string) {
  if (voice.startsWith('vi-')) return 145;
  if (voice.startsWith('en-')) return 165;
  if (/^(ja|ko|zh|th|id)-/i.test(voice)) return 135;
  return 155;
}

function rateToPercent(rate: string) {
  const parsed = Number.parseInt(rate.replace('%', ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}
