export type BgmMood = 'calm' | 'upbeat' | 'cinematic' | 'lofi';
export type BgmGenre = 'ambient' | 'electronic' | 'acoustic' | 'corporate';

export type BgmOption = {
  id: string;
  label: string;
  mood: BgmMood;
  genre: BgmGenre;
  durationSec: number;
  /** Filename under `/bgm/` — dev: Vite proxy · prod: `public/bgm/` mirror via sync script. */
  file: string;
  recommended?: boolean;
};

/**
 * Curated SoundHelix royalty-free demos — one import source for the BGM rail.
 * Dev: Vite proxies `/bgm/*` → soundhelix.com. Prod: run `scripts/sync-bgm-catalog.mjs`.
 */
export const BGM_CATALOG_SOURCE = 'SoundHelix';

/** Same-origin preview URL — Vite proxies in dev; ship `public/bgm/` for static prod. */
export function bgmPreviewUrl(file: string): string {
  return `/bgm/${file}`;
}

export const BGM_OPTIONS: BgmOption[] = [
  {
    id: 'calm-focus',
    label: 'Serene Flow',
    mood: 'calm',
    genre: 'ambient',
    durationSec: 92,
    file: 'SoundHelix-Song-1.mp3',
    recommended: true,
  },
  {
    id: 'upbeat-drive',
    label: 'Tech Pulse',
    mood: 'upbeat',
    genre: 'electronic',
    durationSec: 88,
    file: 'SoundHelix-Song-2.mp3',
  },
  {
    id: 'cinematic-soft',
    label: 'Warm Layers',
    mood: 'cinematic',
    genre: 'acoustic',
    durationSec: 96,
    file: 'SoundHelix-Song-3.mp3',
  },
  {
    id: 'lofi-study',
    label: 'Lo-Fi Walk',
    mood: 'lofi',
    genre: 'corporate',
    durationSec: 74,
    file: 'SoundHelix-Song-4.mp3',
  },
  {
    id: 'soft-piano',
    label: 'Soft Piano',
    mood: 'calm',
    genre: 'acoustic',
    durationSec: 84,
    file: 'SoundHelix-Song-5.mp3',
  },
  {
    id: 'dreamscape',
    label: 'Dreamscape',
    mood: 'cinematic',
    genre: 'ambient',
    durationSec: 90,
    file: 'SoundHelix-Song-6.mp3',
  },
];

export function bgmOptionPreviewSrc(track: BgmOption): string {
  return bgmPreviewUrl(track.file);
}

export function bgmOptionById(id: string): BgmOption | undefined {
  return BGM_OPTIONS.find((track) => track.id === id);
}

export function formatBgmDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Resolve active catalog row from persisted File (name `{id}.mp3`). */
export function bgmTrackIdFromFile(file: File | null): string | null {
  if (!file) return null;
  const base = file.name.replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '');
  return bgmOptionById(base)?.id ?? null;
}

export async function bgmOptionToFile(track: BgmOption): Promise<File> {
  const resp = await fetch(bgmPreviewUrl(track.file));
  if (!resp.ok) throw new Error(`BGM download failed (${resp.status})`);
  const blob = await resp.blob();
  return new File([blob], `${track.id}.mp3`, { type: blob.type || 'audio/mpeg' });
}
