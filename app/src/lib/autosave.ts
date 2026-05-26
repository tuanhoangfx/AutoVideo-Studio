'use client';

/**
 * Auto-save project draft to localStorage.
 *
 * Limitations: Files (images, BGM) are not persisted in localStorage because
 * File objects are dynamic and base64 can exceed quota. Save metadata only.
 */
import { useEffect, useRef, useState } from 'react';
import type { ScriptLine } from '@/components/studio';
import type { SubtitleStyle, TTSProvider } from './api';

export const DRAFT_KEY = 'p0021:studio:draft:v1';

export type DraftState = {
  topic: string;
  lines: ScriptLine[];
  voice: string;
  rate: string;
  ttsProvider?: TTSProvider;
  aspect: '9:16' | '16:9' | '1:1';
  fps: number;
  resolution?: '720p' | '1080p' | '2k' | '4k';
  videoQuality?: 'auto' | 'low' | 'medium' | 'high';
  outputFormat?: 'mp4' | 'mov';
  autoDownload?: boolean;
  downloadDirectoryName?: string;
  bgmVolume: number;
  subtitleStyle: SubtitleStyle;
  imagesCount: number;
  savedAt: string;
};

/** Save state to localStorage debounced. Returns last-save timestamp. */
export function useAutoSave(state: DraftState, debounceMs = 2000): number | null {
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const skipFirst = useRef(true);

  useEffect(() => {
    // Skip the very first effect (might be initial empty state)
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    const id = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
        setSavedAt(Date.now());
      } catch (e) {
        // Quota exceeded → silently skip
        console.warn('[autosave] failed:', e);
      }
    }, debounceMs);
    return () => clearTimeout(id);
  }, [state, debounceMs]);

  return savedAt;
}

/** Read draft from localStorage. Returns null if missing/corrupt/stale. */
export function loadDraft(): DraftState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftState;
    // Basic shape validation
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.lines)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

/** Relative time formatter ("just now", "5s ago", "2 minutes ago") */
export function timeAgo(ms: number | null): string {
  if (ms == null) return '—';
  const diff = Date.now() - ms;
  if (diff < 1500) return 'just now';
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}
