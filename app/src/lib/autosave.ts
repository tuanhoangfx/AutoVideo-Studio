'use client';

/**
 * Auto-save project draft to localStorage.
 *
 * Limitations: Files (images, BGM) KHÔNG persist được vì File object dynamic
 * và base64 thường vượt 5MB limit của localStorage. → Save metadata-only,
 * khi restore user phải re-upload (UI banner báo).
 */
import { useEffect, useRef, useState } from 'react';
import type { ScriptLine } from '@/components/studio';
import type { SubtitleStyle, ExportPreset } from './api';

export const DRAFT_KEY = 'p0021:studio:draft:v1';

export type DraftState = {
  topic: string;
  lines: ScriptLine[];
  voice: string;
  rate: string;
  aspect: '9:16' | '16:9' | '1:1';
  fps: number;
  bgmVolume: number;
  subtitleStyle: SubtitleStyle;
  presetId: ExportPreset['id'] | null;
  imagesCount: number;   // số ảnh khi save — dùng để hint "cần X ảnh"
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

/** Relative time formatter ("vừa xong", "5s trước", "2 phút trước") */
export function timeAgo(ms: number | null): string {
  if (ms == null) return '—';
  const diff = Date.now() - ms;
  if (diff < 1500) return 'vừa xong';
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s trước`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút trước`;
  return `${Math.floor(diff / 3_600_000)}h trước`;
}
