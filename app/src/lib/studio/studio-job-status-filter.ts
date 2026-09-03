import type { Job } from '@/lib/api';

export type StudioJobStatusFilterKey = 'active' | 'done' | 'error';

export function isStudioJobActive(job: Job): boolean {
  return job.status !== 'done' && job.status !== 'error';
}

export function studioJobStatusBucket(job: Job): StudioJobStatusFilterKey {
  if (job.status === 'done') return 'done';
  if (job.status === 'error') return 'error';
  return 'active';
}

export function jobMatchesStudioStatusFilter(
  job: Job,
  filter: StudioJobStatusFilterKey | null,
): boolean {
  if (!filter) return true;
  return studioJobStatusBucket(job) === filter;
}

export function filterJobsByStudioStatus(
  jobs: Job[],
  filter: StudioJobStatusFilterKey | null,
): Job[] {
  if (!filter) return jobs;
  return jobs.filter((job) => jobMatchesStudioStatusFilter(job, filter));
}

/** P0004 Live/Trash toggle parity — tap active chip again clears filter (show all). */
export function toggleStudioJobStatusFilter(
  current: StudioJobStatusFilterKey | null,
  next: StudioJobStatusFilterKey,
): StudioJobStatusFilterKey | null {
  return current === next ? null : next;
}
