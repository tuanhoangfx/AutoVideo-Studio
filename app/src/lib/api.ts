// Worker API client — wraps fetch calls to FastAPI on port 8021.
// Override base via NEXT_PUBLIC_WORKER_URL / VITE_WORKER_URL when deploying.

const meta = import.meta.env;

function envString(...keys: string[]): string {
  for (const key of keys) {
    const raw = meta[key];
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
  }
  return '';
}

const CONFIGURED_WORKER_URL = envString('NEXT_PUBLIC_WORKER_URL', 'VITE_WORKER_URL');
const QUERY_WORKER_URL = readWorkerUrlFromQuery();
const DESKTOP_WORKER_URL = readDesktopWorkerUrl();

let runtimeWorkerUrl =
  DESKTOP_WORKER_URL ||
  QUERY_WORKER_URL ||
  CONFIGURED_WORKER_URL ||
  (meta.PROD ? '' : 'http://127.0.0.1:8021');

export const WORKER_URL = runtimeWorkerUrl;

export function getWorkerUrl() {
  return runtimeWorkerUrl;
}

export async function initializeDesktopWorkerUrl() {
  if (typeof window === 'undefined' || !window.autovideo) return runtimeWorkerUrl;
  const next = await window.autovideo.getWorkerUrl().catch(() => '');
  if (next) runtimeWorkerUrl = next;
  await syncDesktopDownloadFolderFromRuntime().catch(() => {});
  return runtimeWorkerUrl;
}

/** Keep renderer settings aligned with Electron outputDirectory (avoids Save As fallback). */
export async function syncDesktopDownloadFolderFromRuntime(): Promise<void> {
  if (typeof window === 'undefined' || !window.autovideo?.getRuntimeProfile) return;
  const { readStudioExportSettings, writeStudioExportSettings } = await import('@/lib/studio-export-settings');
  const profile = await window.autovideo.getRuntimeProfile();
  const outputPath = profile.outputDirectory?.trim();
  if (!outputPath) return;
  const name = outputPath.split(/[/\\]/).filter(Boolean).pop() ?? outputPath;
  const settings = readStudioExportSettings();
  if (settings.downloadDirectoryName === name) return;
  writeStudioExportSettings({ ...settings, downloadDirectoryName: name, autoDownload: settings.autoDownload });
}

export function resolveWorkerAssetUrl(url: string): string {
  const baseUrl = getWorkerUrl();
  if (!baseUrl) return url;
  return /^https?:\/\//i.test(url) ? url : `${baseUrl}${url}`;
}

export type JobStatus =
  | 'pending'
  | 'tts'
  | 'audio'
  | 'compose'
  | 'done'
  | 'error';

export type SubtitleStyle = 'off' | 'line' | 'word_capcut';
export type TTSProvider = 'edge' | 'elevenlabs' | 'omnivoice-local';

export type JobConfig = {
  aspect: '9:16' | '16:9' | '1:1';
  voice: string;
  fps: number;
  resolution?: '720p' | '1080p' | '2k' | '4k';
  video_quality?: 'auto' | 'low' | 'medium' | 'high';
  output_format?: 'mp4' | 'mov';
  rate: string;
  tts_provider?: TTSProvider;
  subtitle_style?: SubtitleStyle;
  bgm_volume?: number;
  /** Full script read once; not split per scene/image. */
  narration_script?: string;
  /** Target export length (ms) — may exceed image timeline in script mode. */
  export_duration_ms?: number;
  /** Black-screen tail after last image when narration outlasts scenes (ms). */
  hold_tail_ms?: number;
};

export type Job = {
  id: string;
  status: JobStatus;
  progress: number;
  message: string;
  config: JobConfig;
  scenes_count: number;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  render_duration_ms?: number | null;
  phase_timing_ms?: Record<string, number> | null;
  output_url: string | null;
  expected_duration_ms?: number | null;
  output_duration_ms?: number | null;
  error: string | null;
};

export type SceneInput = {
  text: string;
  image_index: number;
  duration_ms?: number;
  effect?: string | null;
  transition?: string | null;
};

export type CreateJobPayload = {
  scenes: SceneInput[];
  config: JobConfig;
  files: File[];
  bgm?: File | null;
};

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export async function getRoot() {
  return handle<{
    name: string;
    version: string;
    jobs: number;
    concurrent_limit: number;
    compose?: {
      xfade_available: boolean;
      transition_s: number;
    };
    storage?: {
      backend: string;
      ready: boolean;
      bucket?: string;
      prefix?: string;
      missing?: string[];
    };
  }>(
    await fetch(workerUrl('/'))
  );
}

export async function listJobs() {
  return handle<Job[]>(await fetch(workerUrl('/jobs')));
}

export async function getJob(id: string) {
  return handle<Job>(await fetch(workerUrl(`/jobs/${id}`)));
}

export async function deleteJob(id: string) {
  return handle<{ ok: true }>(
    await fetch(workerUrl(`/jobs/${id}`), { method: 'DELETE' })
  );
}

export async function probeJobOutput(id: string) {
  return handle<Job>(
    await fetch(workerUrl(`/jobs/${id}/probe`), { method: 'POST' })
  );
}

export async function cancelJob(id: string) {
  return handle<Job>(
    await fetch(workerUrl(`/jobs/${id}/cancel`), { method: 'POST' })
  );
}

export async function createJob(payload: CreateJobPayload): Promise<Job> {
  const fd = new FormData();
  fd.append('scenes', JSON.stringify(payload.scenes));
  fd.append('config', JSON.stringify(payload.config));
  for (const f of payload.files) fd.append('files', f, f.name);
  if (payload.bgm) fd.append('bgm', payload.bgm, payload.bgm.name);
  return handle<Job>(
    await fetch(workerUrl('/jobs'), { method: 'POST', body: fd })
  );
}

export function outputUrl(id: string): string {
  if (!WORKER_URL) return '';
  return workerUrl(`/jobs/${id}/output`);
}

import { resolveStudioVoiceId } from '@/lib/voice-catalog';

export function voicePreviewUrl(text: string, voice: string, rate = '+0%'): string {
  const base = getWorkerUrl();
  if (!base) return '';
  const trimmed = text.trim();
  const safeText =
    trimmed.length > 800 ? trimmed.slice(0, 800) : trimmed || 'Hello, this is a voice preview.';
  const resolvedVoice = resolveStudioVoiceId(voice);
  const params = new URLSearchParams({ text: safeText, voice: resolvedVoice, rate });
  return `${base.replace(/\/$/, '')}/voices/preview?${params.toString()}`;
}

function workerUrl(path: string) {
  const baseUrl = getWorkerUrl();
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_WORKER_URL is not configured for this deployment.');
  }
  return `${baseUrl}${path}`;
}

function readWorkerUrlFromQuery() {
  if (typeof window === 'undefined') return '';
  try {
    return new URLSearchParams(window.location.search).get('workerUrl')?.trim() ?? '';
  } catch {
    return '';
  }
}

function readDesktopWorkerUrl() {
  if (typeof window === 'undefined') return '';
  return window.autovideo?.workerUrl?.trim() ?? '';
}
