'use client';

import { idbDelete, idbGet, idbSet } from './idb';

const DOWNLOAD_DIR_HANDLE_KEY = 'download:directory-handle';

let downloadDirectoryHandle: any | null = null;

export async function chooseStudioDownloadDirectory(): Promise<string | null> {
  if (typeof window !== 'undefined' && window.autovideo?.chooseOutputDirectory) {
    const result = await window.autovideo.chooseOutputDirectory();
    return result?.name ?? null;
  }
  const picker = (window as any).showDirectoryPicker;
  if (typeof picker !== 'function') return null;
  const handle = await picker({
    id: 'p0021-output-downloads',
    mode: 'readwrite',
    startIn: 'downloads',
  });
  downloadDirectoryHandle = handle;
  await idbSet(DOWNLOAD_DIR_HANDLE_KEY, handle).catch(() => {});
  return handle?.name ?? null;
}

export async function restoreStudioDownloadDirectory(): Promise<string | null> {
  const handle = await idbGet<any>(DOWNLOAD_DIR_HANDLE_KEY);
  if (!handle) return null;
  downloadDirectoryHandle = handle;
  return handle?.name ?? null;
}

export async function clearStudioDownloadDirectory(): Promise<void> {
  downloadDirectoryHandle = null;
  await idbDelete(DOWNLOAD_DIR_HANDLE_KEY).catch(() => {});
}

export function supportsStudioDownloadDirectory(): boolean {
  return typeof window !== 'undefined' && (Boolean(window.autovideo?.chooseOutputDirectory) || typeof (window as any).showDirectoryPicker === 'function');
}

export async function saveBlobToStudioDirectory(filename: string, blob: Blob): Promise<boolean> {
  if (typeof window !== 'undefined' && window.autovideo?.saveOutputFile) {
    const result = await window.autovideo.saveOutputFile(filename, await blob.arrayBuffer());
    return result.ok;
  }
  if (!downloadDirectoryHandle) {
    await restoreStudioDownloadDirectory().catch(() => null);
  }
  if (!downloadDirectoryHandle) return false;
  try {
    const permission = await ensureWritePermission(downloadDirectoryHandle);
    if (!permission) return false;
    const fileHandle = await downloadDirectoryHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  } catch (error) {
    console.warn('[download-folder] save failed, falling back to browser download:', error);
    downloadDirectoryHandle = null;
    await idbDelete(DOWNLOAD_DIR_HANDLE_KEY).catch(() => {});
    return false;
  }
}

export function triggerBrowserDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 15_000);
}

async function ensureWritePermission(handle: any): Promise<boolean> {
  if (typeof handle.queryPermission === 'function') {
    const current = await handle.queryPermission({ mode: 'readwrite' });
    if (current === 'granted') return true;
  }
  if (typeof handle.requestPermission === 'function') {
    return (await handle.requestPermission({ mode: 'readwrite' })) === 'granted';
  }
  return true;
}
