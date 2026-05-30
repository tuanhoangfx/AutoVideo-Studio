import type { Job } from '@/lib/api';

/** Reveal exported file in Desktop (Explorer) — same path as job-tab download badge. */
export async function revealStudioOutputFile(filename: string): Promise<void> {
  if (typeof window === 'undefined') return;
  if (window.autovideo?.openOutputFile && filename) {
    const result = await window.autovideo.openOutputFile(filename);
    if (result.ok) return;
  }
  await window.autovideo?.openOutputDirectory?.();
}

export function findLatestDoneJob(jobs: Job[], currentJob: Job | null): Job | null {
  if (currentJob?.status === 'done' && currentJob.output_url) return currentJob;
  return jobs.find((j) => j.status === 'done' && j.output_url) ?? null;
}
