// Worker API client — wraps fetch calls to FastAPI on port 8021.
// Override base via NEXT_PUBLIC_WORKER_URL when deploying.

export const WORKER_URL =
  process.env.NEXT_PUBLIC_WORKER_URL || 'http://127.0.0.1:8021';

export function resolveWorkerAssetUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${WORKER_URL}${url}`;
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
};

export type Job = {
  id: string;
  status: JobStatus;
  progress: number;
  message: string;
  config: JobConfig;
  scenes_count: number;
  created_at: string;
  output_url: string | null;
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
    storage?: {
      backend: string;
      ready: boolean;
      bucket?: string;
      prefix?: string;
      missing?: string[];
    };
  }>(
    await fetch(`${WORKER_URL}/`)
  );
}

export async function listVoices() {
  return handle<{ ShortName: string; Gender: string; FriendlyName: string; Locale: string }[]>(
    await fetch(`${WORKER_URL}/voices`)
  );
}

export async function listJobs() {
  return handle<Job[]>(await fetch(`${WORKER_URL}/jobs`));
}

export async function getJob(id: string) {
  return handle<Job>(await fetch(`${WORKER_URL}/jobs/${id}`));
}

export async function createJob(payload: CreateJobPayload): Promise<Job> {
  const fd = new FormData();
  fd.append('scenes', JSON.stringify(payload.scenes));
  fd.append('config', JSON.stringify(payload.config));
  for (const f of payload.files) fd.append('files', f, f.name);
  if (payload.bgm) fd.append('bgm', payload.bgm, payload.bgm.name);
  return handle<Job>(
    await fetch(`${WORKER_URL}/jobs`, { method: 'POST', body: fd })
  );
}

// ──────────────────── Export presets (frontend-only, sets aspect+fps) ────
export type ExportPreset = {
  id: 'tiktok' | 'reels' | 'shorts' | 'youtube' | 'square';
  label: string;
  icon: string;
  aspect: '9:16' | '16:9' | '1:1';
  fps: number;
  hint: string;
};

export const EXPORT_PRESETS: ExportPreset[] = [
  { id: 'tiktok', label: 'TikTok', icon: '◤', aspect: '9:16', fps: 30, hint: '9:16 · 30fps · 1080p' },
  { id: 'reels', label: 'Instagram Reels', icon: '◆', aspect: '9:16', fps: 30, hint: '9:16 · 30fps' },
  { id: 'shorts', label: 'YouTube Shorts', icon: '▶', aspect: '9:16', fps: 30, hint: '9:16 · 30fps' },
  { id: 'youtube', label: 'YouTube', icon: '◢', aspect: '16:9', fps: 60, hint: '16:9 · 60fps · 1080p' },
  { id: 'square', label: 'Square', icon: '■', aspect: '1:1', fps: 30, hint: '1:1 · 30fps' },
];

export async function cancelJob(id: string) {
  return handle<{ ok: true }>(
    await fetch(`${WORKER_URL}/jobs/${id}/cancel`, { method: 'POST' })
  );
}

export function outputUrl(id: string): string {
  return `${WORKER_URL}/jobs/${id}/output`;
}

export function voicePreviewUrl(text: string, voice: string, rate = '+0%'): string {
  const params = new URLSearchParams({ text, voice, rate });
  return `${WORKER_URL}/voices/preview?${params.toString()}`;
}
