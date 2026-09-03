import type { Job } from '@/lib/api';

export type ExportTimeModel = {
  sampleCount: number;
  perSceneTtsMs: number;
  perSceneComposeMs: number;
  audioBaseMs: number;
  bgmExtraMs: number;
  subtitleExtraMs: number;
  resolutionScale: Record<string, number>;
};

export type ExportEstimateInput = {
  scenesCount: number;
  expectedVideoMs: number;
  totalTextChars: number;
  resolution: string;
  hasBgm: boolean;
  subtitleStyle: string;
};

export const DEFAULT_EXPORT_TIME_MODEL: ExportTimeModel = {
  sampleCount: 0,
  perSceneTtsMs: 4500,
  perSceneComposeMs: 55_000,
  audioBaseMs: 2500,
  bgmExtraMs: 3500,
  subtitleExtraMs: 800,
  resolutionScale: { '720p': 0.72, '1080p': 1, '2k': 1.45, '4k': 2.2 },
};

const STORAGE_KEY = 'autovideo.exportTimeModel';

function resolutionMultiplier(model: ExportTimeModel, resolution: string) {
  return model.resolutionScale[resolution] ?? model.resolutionScale['1080p'] ?? 1;
}

function avg(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function learnExportTimeModel(jobs: Job[]): ExportTimeModel {
  const done = jobs.filter(
    (j) =>
      j.status === 'done' &&
      j.scenes_count > 0 &&
      ((j.render_duration_ms ?? 0) > 0 || (j.phase_timing_ms?.total_ms ?? 0) > 0)
  );
  if (done.length === 0) return { ...DEFAULT_EXPORT_TIME_MODEL };

  const perSceneTts = done.map((j) => (j.phase_timing_ms?.tts_ms ?? 0) / j.scenes_count);
  const perSceneCompose = done.map((j) => {
    const compose = j.phase_timing_ms?.compose_ms;
    if (compose != null && compose > 0) return compose / j.scenes_count;
    const render = j.render_duration_ms ?? j.phase_timing_ms?.total_ms ?? 0;
    const tts = j.phase_timing_ms?.tts_ms ?? 0;
    const audio = j.phase_timing_ms?.audio_ms ?? 0;
    const estCompose = Math.max(0, render - tts - audio);
    return estCompose / j.scenes_count;
  });
  const audioBase = done.map((j) => j.phase_timing_ms?.audio_ms ?? 0);
  const subtitleExtra = done.map((j) => j.phase_timing_ms?.subtitle_ms ?? 0);

  return {
    sampleCount: done.length,
    perSceneTtsMs: Math.round(avg(perSceneTts) || DEFAULT_EXPORT_TIME_MODEL.perSceneTtsMs),
    perSceneComposeMs: Math.round(avg(perSceneCompose) || DEFAULT_EXPORT_TIME_MODEL.perSceneComposeMs),
    audioBaseMs: Math.round(avg(audioBase) || DEFAULT_EXPORT_TIME_MODEL.audioBaseMs),
    bgmExtraMs: DEFAULT_EXPORT_TIME_MODEL.bgmExtraMs,
    subtitleExtraMs: Math.round(avg(subtitleExtra) || DEFAULT_EXPORT_TIME_MODEL.subtitleExtraMs),
    resolutionScale: { ...DEFAULT_EXPORT_TIME_MODEL.resolutionScale },
  };
}

export function loadExportTimeModel(): ExportTimeModel {
  if (typeof window === 'undefined') return { ...DEFAULT_EXPORT_TIME_MODEL };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_EXPORT_TIME_MODEL };
    const parsed = JSON.parse(raw) as Partial<ExportTimeModel>;
    return { ...DEFAULT_EXPORT_TIME_MODEL, ...parsed, resolutionScale: { ...DEFAULT_EXPORT_TIME_MODEL.resolutionScale, ...parsed.resolutionScale } };
  } catch {
    return { ...DEFAULT_EXPORT_TIME_MODEL };
  }
}

export function saveExportTimeModel(model: ExportTimeModel) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
  } catch {}
}

/** Blend previous learned model with fresh samples (stable on PC). */
export function mergeExportTimeModel(prev: ExportTimeModel, next: ExportTimeModel): ExportTimeModel {
  if (next.sampleCount <= 0) return prev;
  if (prev.sampleCount <= 0) return next;
  const w = 0.35;
  const blend = (a: number, b: number) => Math.round(a * (1 - w) + b * w);
  return {
    sampleCount: Math.max(prev.sampleCount, next.sampleCount),
    perSceneTtsMs: blend(prev.perSceneTtsMs, next.perSceneTtsMs),
    perSceneComposeMs: blend(prev.perSceneComposeMs, next.perSceneComposeMs),
    audioBaseMs: blend(prev.audioBaseMs, next.audioBaseMs),
    bgmExtraMs: blend(prev.bgmExtraMs, next.bgmExtraMs),
    subtitleExtraMs: blend(prev.subtitleExtraMs, next.subtitleExtraMs),
    resolutionScale: { ...prev.resolutionScale },
  };
}

export function exportTimeModelsEqual(a: ExportTimeModel, b: ExportTimeModel): boolean {
  return (
    a.sampleCount === b.sampleCount &&
    a.perSceneTtsMs === b.perSceneTtsMs &&
    a.perSceneComposeMs === b.perSceneComposeMs &&
    a.audioBaseMs === b.audioBaseMs &&
    a.bgmExtraMs === b.bgmExtraMs &&
    a.subtitleExtraMs === b.subtitleExtraMs
  );
}

function learnedRealtimeFactor(model: ExportTimeModel): number {
  if (model.sampleCount <= 0) return 2.6;
  const composePerScene = model.perSceneComposeMs * 0.001;
  const ttsPerScene = model.perSceneTtsMs * 0.001;
  return Math.max(1.8, Math.min(4.5, 1.2 + composePerScene + ttsPerScene * 0.35));
}

/** ~13.5 chars/s — matches worker duration_text trim budget. */
function effectiveTtsChars(totalTextChars: number, expectedVideoMs: number, scenesCount: number) {
  const scenes = Math.max(1, scenesCount);
  const perSceneMs = expectedVideoMs / scenes;
  const perSceneCharCap = Math.max(40, Math.floor((perSceneMs / 1000) * 13.5));
  const cap = perSceneCharCap * scenes;
  return Math.min(totalTextChars, cap);
}

export function estimateExportDurationMs(input: ExportEstimateInput, model: ExportTimeModel): number {
  const scenes = Math.max(1, input.scenesCount);
  const resScale = resolutionMultiplier(model, input.resolution);
  const ttsChars = effectiveTtsChars(input.totalTextChars, input.expectedVideoMs, scenes);
  const videoMs = Math.max(15_000, input.expectedVideoMs);

  const ttsMs = Math.max(8000, Math.round((ttsChars / 13.5) * 1000));
  let composeMs = Math.round(scenes * model.perSceneComposeMs * resScale);
  if (scenes === 1 && videoMs <= 90_000) {
    composeMs = Math.max(10_000, Math.round(videoMs * 0.45 + 8000));
  }

  let ms = ttsMs + composeMs + model.audioBaseMs;

  if (input.hasBgm) ms += model.bgmExtraMs;
  if (input.subtitleStyle && input.subtitleStyle !== 'off') {
    ms += model.subtitleExtraMs + scenes * 180;
  }

  if (scenes >= 12) ms = Math.round(ms * 1.08);
  if (scenes >= 24) ms = Math.round(ms * 1.12);

  const rtfFloor = Math.round(videoMs * learnedRealtimeFactor(model));
  return Math.max(20_000, ms, rtfFloor);
}

/** Remaining export time — blends live progress rate with phase budgets. */
export function estimateExportRemainingMs(
  job: Job,
  totalEstimateMs: number,
  elapsedMs: number,
  _model: ExportTimeModel
): number {
  const p = Math.max(0, Math.min(100, job.progress ?? 0));
  const status = job.status;

  let linearRemaining = 0;
  if (p >= 12 && elapsedMs >= 8000) {
    linearRemaining = (elapsedMs / (p / 100)) - elapsedMs;
  }

  const hasSubtitle = (job.config.subtitle_style ?? 'off') !== 'off';
  const ttsShare = 0.38;
  const audioShare = 0.08;
  const subtitleShare = hasSubtitle ? 0.07 : 0;
  const composeShare = Math.max(0.15, 1 - ttsShare - audioShare - subtitleShare);

  const phaseBudget = {
    tts: totalEstimateMs * ttsShare,
    audio: totalEstimateMs * audioShare,
    subtitle: totalEstimateMs * subtitleShare,
    compose: totalEstimateMs * composeShare,
  };

  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  let phaseRemaining = 0;

  if (status === 'pending') {
    phaseRemaining = totalEstimateMs;
  } else if (status === 'tts') {
    const frac = clamp01((p - 5) / 35);
    phaseRemaining = phaseBudget.tts * (1 - frac) + phaseBudget.audio + phaseBudget.subtitle + phaseBudget.compose;
  } else if (status === 'audio') {
    const frac = clamp01((p - 45) / 5);
    phaseRemaining = phaseBudget.audio * (1 - frac) + phaseBudget.subtitle + phaseBudget.compose;
  } else if (status === 'compose') {
    const start = hasSubtitle ? 55 : 60;
    const span = Math.max(1, 100 - start);
    const frac = clamp01((p - start) / span);
    phaseRemaining = phaseBudget.compose * (1 - frac);
  } else if (status === 'done') {
    phaseRemaining = 0;
  } else {
    phaseRemaining = Math.max(0, totalEstimateMs * (1 - p / 100));
  }

  if (linearRemaining > 0) {
    return Math.max(0, Math.round(Math.max(linearRemaining, phaseRemaining)));
  }
  return Math.max(0, Math.round(phaseRemaining));
}

export function formatEstimateLabel(ms: number, formatDuration: (sec: number) => string): string {
  const sec = ms / 1000;
  if (sec < 90) return `~${Math.max(15, Math.round(sec))}s`;
  const low = sec * 0.85;
  const high = sec * 1.2;
  if (high - low < 45) return `~${formatDuration(sec)}`;
  return `~${formatDuration(low)}–${formatDuration(high)}`;
}
