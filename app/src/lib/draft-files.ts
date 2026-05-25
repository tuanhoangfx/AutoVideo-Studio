'use client';

/**
 * High-level helpers for persisting image + BGM Files via IndexedDB.
 * Pairs with `autosave.ts` (text metadata in localStorage).
 *
 * Keys:
 *   image:000, image:001, ...    — library entries, in order
 *   bgm                          — background music file
 */
import { idbDelete, idbGet, idbKeys, idbSet } from './idb';

const IMAGE_KEY = (i: number) => `image:${String(i).padStart(3, '0')}`;
const BGM_KEY = 'bgm';

/** Replace entire saved image list with the current `files` array order. */
export async function saveImages(files: File[]): Promise<void> {
  // Clean old image entries first
  const keys = await idbKeys();
  for (const k of keys) {
    if (k.startsWith('image:')) await idbDelete(k);
  }
  // Write new
  for (let i = 0; i < files.length; i++) {
    await idbSet(IMAGE_KEY(i), files[i]);
  }
}

/** Load images in saved order. Returns empty array if none. */
export async function loadImages(): Promise<File[]> {
  const keys = await idbKeys();
  const imageKeys = keys
    .filter((k) => k.startsWith('image:'))
    .sort();
  const out: File[] = [];
  for (const k of imageKeys) {
    const v = await idbGet<File | Blob>(k);
    if (v) {
      // Some browsers return Blob even when File was stored; coerce.
      if (v instanceof File) out.push(v);
      else out.push(new File([v], k, { type: (v as Blob).type || 'image/jpeg' }));
    }
  }
  return out;
}

export async function saveBgm(file: File | null): Promise<void> {
  if (file) await idbSet(BGM_KEY, file);
  else await idbDelete(BGM_KEY);
}

export async function loadBgm(): Promise<File | null> {
  const v = await idbGet<File | Blob>(BGM_KEY);
  if (!v) return null;
  if (v instanceof File) return v;
  return new File([v], 'bgm.mp3', { type: (v as Blob).type || 'audio/mpeg' });
}

export async function clearAllFiles(): Promise<void> {
  // Don't blow away the whole DB in case other features add stores later;
  // just delete keys we own.
  const keys = await idbKeys();
  for (const k of keys) {
    if (k.startsWith('image:') || k === BGM_KEY) {
      await idbDelete(k);
    }
  }
}

/** Light snapshot for UI (sizes without loading full blobs). */
export async function summarizeFiles(): Promise<{ images: number; bgm: boolean }> {
  const keys = await idbKeys();
  return {
    images: keys.filter((k) => k.startsWith('image:')).length,
    bgm: keys.includes(BGM_KEY),
  };
}
