'use client';

const JOB_SLOTS_KEY = 'p0021:studio:job-slots:v1';
const SLOT_LABELS_KEY = 'p0021:studio:slot-tab-labels:v1';
const SLOT_DOWNLOADS_KEY = 'p0021:studio:slot-download-counts:v1';
const SLOT_EXPORTS_KEY = 'p0021:studio:slot-export-counts:v1';

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

function readJobSlots(): Record<string, string> {
  return readJson(JOB_SLOTS_KEY, {});
}

function readSlotLabels(): Record<string, string> {
  return readJson(SLOT_LABELS_KEY, {});
}

function readSlotDownloadCounts(): Record<string, number> {
  return readJson(SLOT_DOWNLOADS_KEY, {});
}

function readSlotExportCounts(): Record<string, number> {
  return readJson(SLOT_EXPORTS_KEY, {});
}

/** Stable project slot for a tab (survives re-export with new worker job id). */
export function resolveJobSlotId(jobId: string): string {
  return readJobSlots()[jobId] ?? jobId;
}

export function getJobTabLabelIso(jobId: string): string | null {
  const slotId = resolveJobSlotId(jobId);
  return readSlotLabels()[slotId] ?? null;
}

export function getSlotDownloadCount(jobId: string): number {
  const slotId = resolveJobSlotId(jobId);
  return readSlotDownloadCounts()[slotId] ?? 0;
}

export function getSlotExportCount(jobId: string): number {
  const slotId = resolveJobSlotId(jobId);
  return readSlotExportCounts()[slotId] ?? 0;
}

export function bindJobToSlot(jobId: string, slotId: string, options?: { labelAt?: string }) {
  if (typeof window === 'undefined') return;
  const slots = readJobSlots();
  slots[jobId] = slotId;
  writeJson(JOB_SLOTS_KEY, slots);

  const labels = readSlotLabels();
  if (!labels[slotId]) {
    labels[slotId] = options?.labelAt ?? new Date().toISOString();
    writeJson(SLOT_LABELS_KEY, labels);
  }
}

/** New export on this tab; returns 1-based export index for filenames. */
export function recordSlotExport(jobId: string): number {
  const slotId = resolveJobSlotId(jobId);
  const counts = readSlotExportCounts();
  const next = (counts[slotId] ?? 0) + 1;
  counts[slotId] = next;
  writeJson(SLOT_EXPORTS_KEY, counts);
  return next;
}

export function incrementSlotDownloadCount(jobId: string): number {
  const slotId = resolveJobSlotId(jobId);
  const counts = readSlotDownloadCounts();
  const next = (counts[slotId] ?? 0) + 1;
  counts[slotId] = next;
  writeJson(SLOT_DOWNLOADS_KEY, counts);
  return next;
}

export function removeJobSlot(jobId: string) {
  if (typeof window === 'undefined') return;
  const slots = readJobSlots();
  const slotId = slots[jobId];
  delete slots[jobId];
  writeJson(JOB_SLOTS_KEY, slots);
  if (!slotId) return;
  const stillUsed = Object.values(slots).includes(slotId);
  if (stillUsed) return;
  const labels = readSlotLabels();
  const downloads = readSlotDownloadCounts();
  const exports = readSlotExportCounts();
  delete labels[slotId];
  delete downloads[slotId];
  delete exports[slotId];
  writeJson(SLOT_LABELS_KEY, labels);
  writeJson(SLOT_DOWNLOADS_KEY, downloads);
  writeJson(SLOT_EXPORTS_KEY, exports);
}
