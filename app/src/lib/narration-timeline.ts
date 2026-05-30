/** Map one continuous narration track onto image/scene time slots. */

export type SceneNarrationCoverage = {
  sceneIndex: number;
  startSec: number;
  durationSec: number;
  /** Seconds of this slot that have voice (0 … durationSec). */
  voiceSec: number;
  hasVoice: boolean;
  /** Narration fully covers this slot. */
  fullVoice: boolean;
};

export function sceneNarrationCoverage(
  sceneDurationsSec: number[],
  narrationDurationSec: number
): SceneNarrationCoverage[] {
  let startSec = 0;
  const narrEnd = Math.max(0, narrationDurationSec);
  return sceneDurationsSec.map((durationSec, sceneIndex) => {
    const slotStart = startSec;
    const slotEnd = startSec + durationSec;
    const voiceEnd = Math.min(slotEnd, narrEnd);
    const voiceSec = Math.max(0, voiceEnd - Math.max(slotStart, 0));
    const hasVoice = voiceSec > 0.05;
    const fullVoice = hasVoice && voiceEnd >= slotEnd - 0.05;
    startSec = slotEnd;
    return {
      sceneIndex,
      startSec: slotStart,
      durationSec,
      voiceSec,
      hasVoice,
      fullVoice,
    };
  });
}

/** Text slice for the portion of narration that falls inside a scene time window. */
export function narrationTextForSceneWindow(
  fullScript: string,
  sceneStartSec: number,
  sceneDurationSec: number,
  narrationDurationSec: number
): string {
  const script = fullScript.trim();
  if (!script || narrationDurationSec <= 0) return '';
  const windowEnd = sceneStartSec + sceneDurationSec;
  if (narrationDurationSec <= sceneStartSec || windowEnd <= sceneStartSec) return '';

  const voiceEnd = Math.min(windowEnd, narrationDurationSec);
  const startRatio = Math.max(0, sceneStartSec) / narrationDurationSec;
  const endRatio = voiceEnd / narrationDurationSec;
  let startChar = Math.floor(startRatio * script.length);
  let endChar = Math.ceil(endRatio * script.length);
  if (endChar <= startChar) endChar = Math.min(script.length, startChar + 1);

  let snippet = script.slice(startChar, endChar).trim();
  if (startChar > 0 && snippet) {
    const lead = script.slice(startChar).trimStart();
    snippet = lead.slice(0, Math.min(lead.length, endChar - startChar + 40)).trim();
  }
  return snippet;
}

export function sceneNarrationLabel(
  coverage: SceneNarrationCoverage,
  narrationScript: string,
  narrationDurationSec: number
): string {
  if (!narrationScript.trim()) return '(no narration)';
  if (!coverage.hasVoice) {
    return coverage.startSec >= narrationDurationSec
      ? 'Silent · after narration'
      : 'Silent · before narration';
  }
  const preview = narrationTextForSceneWindow(
    narrationScript,
    coverage.startSec,
    coverage.durationSec,
    narrationDurationSec
  );
  if (preview) {
    const short = preview.length > 72 ? `${preview.slice(0, 72)}…` : preview;
    if (coverage.fullVoice) return short;
    return `${short} (${formatSec(coverage.voiceSec)} voice)`;
  }
  return `Narration · ${formatSec(coverage.voiceSec)}`;
}

function formatSec(sec: number) {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : `${r}s`;
}
