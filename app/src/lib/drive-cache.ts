'use client';

import type { DriveImageFile } from './google-drive';
import { idbDelete, idbGet, idbKeys, idbSet } from './idb';

type CachedDriveImage = {
  file: File | Blob;
  fingerprint: string;
  name: string;
  mimeType: string;
  cachedAt: number;
};

const DRIVE_IMAGE_KEY = (fileId: string) => `drive-image:${fileId}`;

export async function loadCachedDriveImage(file: DriveImageFile): Promise<File | null> {
  try {
    const cached = await idbGet<CachedDriveImage>(DRIVE_IMAGE_KEY(file.id));
    if (!cached || cached.fingerprint !== driveFileFingerprint(file)) return null;
    if (cached.file instanceof File) return cached.file;
    return new File([cached.file], cached.name || file.name, {
      type: cached.mimeType || cached.file.type || file.mimeType || 'image/jpeg',
    });
  } catch {
    return null;
  }
}

export async function saveCachedDriveImage(file: DriveImageFile, image: File): Promise<void> {
  try {
    await idbSet(DRIVE_IMAGE_KEY(file.id), {
      file: image,
      fingerprint: driveFileFingerprint(file),
      name: image.name || file.name,
      mimeType: image.type || file.mimeType || 'image/jpeg',
      cachedAt: Date.now(),
    } satisfies CachedDriveImage);
  } catch {
    // Cache is an optimization; Drive sync should still work without it.
  }
}

export async function clearCachedDriveImages(): Promise<number> {
  const keys = await idbKeys();
  const driveKeys = keys.filter((key) => key.startsWith('drive-image:'));
  for (const key of driveKeys) {
    await idbDelete(key);
  }
  return driveKeys.length;
}

function driveFileFingerprint(file: DriveImageFile) {
  return [file.id, file.name, file.mimeType, file.size ?? '', file.modifiedTime ?? ''].join(':');
}
