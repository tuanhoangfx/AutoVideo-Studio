import * as api from '@/lib/api';
import type { Job } from '@/lib/api';
import { fetchJobOutputBlob, verifyJobOutputFile } from '@/lib/download-output';
import { readStudioExportSettings } from '@/lib/studio-export-settings';
import { saveBlobToStudioDirectory, triggerBrowserDownload } from '@/lib/studio-download-target';
import { getSlotExportCount, incrementSlotDownloadCount } from '@/lib/job-project-slot';
import { buildVideoFilename } from '@/lib/video-filename';

const AUTO_DOWNLOADED_KEY = 'autovideo:autoDownloadedJobIds';
const AUTO_DOWNLOADED_SESSION_KEY = 'autovideo:autoDownloadedJobIds';

/** Cross-tab dedupe (sessionStorage is per-tab and caused duplicate Save As dialogs). */
const downloadInFlight = new Set<string>();
export const JOB_DOWNLOAD_COMPLETE_EVENT = 'autovideo:job-download-complete';
export const JOB_DOWNLOAD_FAILED_EVENT = 'autovideo:job-download-failed';
export const JOB_EXPORT_READY_EVENT = 'autovideo:job-export-ready';

export type JobDownloadCompleteDetail = {
  jobId: string;
  filename: string;
  size: number;
  target: string;
  savedToFolder: boolean;
};

function readDownloadedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const fromLocal = localStorage.getItem(AUTO_DOWNLOADED_KEY);
    const fromSession = sessionStorage.getItem(AUTO_DOWNLOADED_SESSION_KEY);
    const merge = (raw: string | null) => {
      if (!raw) return [] as string[];
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) ? parsed : [];
    };
    return new Set([...merge(fromLocal), ...merge(fromSession)]);
  } catch {
    return new Set();
  }
}

function writeDownloadedIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  const payload = JSON.stringify([...ids]);
  try {
    localStorage.setItem(AUTO_DOWNLOADED_KEY, payload);
    sessionStorage.setItem(AUTO_DOWNLOADED_SESSION_KEY, payload);
  } catch {}
}

export function wasJobAutoDownloaded(jobId: string): boolean {
  return readDownloadedIds().has(jobId);
}

export function listAutoDownloadedJobIds(): string[] {
  return [...readDownloadedIds()];
}

const DOWNLOAD_FAILED_KEY = 'autovideo:downloadFailedJobIds';

export function markJobDownloadFailed(jobId: string) {
  if (typeof window === 'undefined') return;
  try {
    const ids = new Set(JSON.parse(sessionStorage.getItem(DOWNLOAD_FAILED_KEY) || '[]') as string[]);
    ids.add(jobId);
    sessionStorage.setItem(DOWNLOAD_FAILED_KEY, JSON.stringify([...ids]));
  } catch {}
}

export function clearJobDownloadFailed(jobId: string) {
  if (typeof window === 'undefined') return;
  try {
    const ids = new Set(JSON.parse(sessionStorage.getItem(DOWNLOAD_FAILED_KEY) || '[]') as string[]);
    ids.delete(jobId);
    sessionStorage.setItem(DOWNLOAD_FAILED_KEY, JSON.stringify([...ids]));
  } catch {}
}

export function wasJobDownloadFailed(jobId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const ids = JSON.parse(sessionStorage.getItem(DOWNLOAD_FAILED_KEY) || '[]') as string[];
    return Array.isArray(ids) && ids.includes(jobId);
  } catch {
    return false;
  }
}

export function markJobAutoDownloaded(jobId: string) {
  const ids = readDownloadedIds();
  ids.add(jobId);
  writeDownloadedIds(ids);
}

export function clearJobAutoDownloaded(jobId: string) {
  const ids = readDownloadedIds();
  ids.delete(jobId);
  writeDownloadedIds(ids);
}

const forceDownloadKey = (jobId: string) => `autovideo:forceDownload:${jobId}`;

export function markForceDownloadJob(jobId: string) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(forceDownloadKey(jobId), '1');
  } catch {}
}

function consumeForceDownloadJob(jobId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const key = forceDownloadKey(jobId);
    if (sessionStorage.getItem(key) !== '1') return false;
    sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export type AutoDownloadOptions = {
  force?: boolean;
  topic?: string;
};

export type AutoDownloadResult =
  | { ok: true; filename: string; size: number; savedToFolder: boolean; target: string }
  | { ok: true; skipped: true; reason: 'already' | 'auto-off' }
  | { ok: false; reason: string };

/** Download completed job output (works without Studio page mounted). */
export async function performJobAutoDownload(
  job: Job,
  options: AutoDownloadOptions = {}
): Promise<AutoDownloadResult> {
  if (job.status !== 'done' || !job.output_url) {
    return { ok: false, reason: 'Job output is not ready' };
  }

  if (downloadInFlight.has(job.id)) {
    return { ok: true, skipped: true, reason: 'already' };
  }

  if (wasJobAutoDownloaded(job.id) && !options.force) {
    return { ok: true, skipped: true, reason: 'already' };
  }

  downloadInFlight.add(job.id);

  try {
    const settings = readStudioExportSettings();
    const force = Boolean(options.force) || consumeForceDownloadJob(job.id);
    if (!settings.autoDownload && !force) {
      window.dispatchEvent(new CustomEvent(JOB_EXPORT_READY_EVENT, { detail: { job } }));
      return { ok: true, skipped: true, reason: 'auto-off' };
    }

    clearJobDownloadFailed(job.id);

    const ext = job.config.output_format ?? settings.outputFormat ?? 'mp4';
    const exportIndex = Math.max(1, getSlotExportCount(job.id));
    const filename = `${buildVideoFilename({
      job,
      topic: options.topic ?? '',
      imagesCount: job.scenes_count,
      template: settings.videoNameTemplate,
      exportIndex,
    })}.${ext}`;

    if (wasJobAutoDownloaded(job.id) && !options.force) {
      return { ok: true, skipped: true, reason: 'already' };
    }

    const blob = await fetchJobOutputBlob(job.id);
    let savedToFolder = false;
    let target = settings.downloadDirectoryName ?? 'Browser downloads';

    if (settings.downloadDirectoryName) {
      const saveResult = await saveBlobToStudioDirectory(filename, blob);
      savedToFolder = saveResult.saved;
      if (savedToFolder) {
        target = settings.downloadDirectoryName;
      }
    }

    if (!savedToFolder) {
      const queued = triggerBrowserDownload(filename, blob);
      if (queued === 'deferred') {
        target = 'Browser downloads (when tab is visible)';
      } else {
        target = 'Browser downloads';
      }
    }

    const detail: JobDownloadCompleteDetail = {
      jobId: job.id,
      filename,
      size: blob.size,
      target,
      savedToFolder,
    };
    markJobAutoDownloaded(job.id);
    incrementSlotDownloadCount(job.id);
    window.dispatchEvent(new CustomEvent(JOB_DOWNLOAD_COMPLETE_EVENT, { detail }));

    return { ok: true, filename, size: blob.size, savedToFolder, target };
  } catch (e) {
    clearJobAutoDownloaded(job.id);
    const reason = e instanceof Error ? e.message : 'Download failed';
    markJobDownloadFailed(job.id);
    window.dispatchEvent(
      new CustomEvent(JOB_DOWNLOAD_FAILED_EVENT, { detail: { jobId: job.id, reason } })
    );
    return { ok: false, reason };
  } finally {
    downloadInFlight.delete(job.id);
  }
}

export async function handleCompletedJobExport(job: Job, options: AutoDownloadOptions = {}) {
  return performJobAutoDownload(job, options);
}
