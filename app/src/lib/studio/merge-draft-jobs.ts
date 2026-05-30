import type { Job } from '@/lib/api';

/** Preserve local draft tabs when refreshing the server job list. */
export function mergeDraftJobsWithServerList(prev: Job[], list: Job[]): Job[] {
  const drafts = prev.filter((j) => j.id.startsWith('draft-'));
  const merged = [...drafts];
  for (const job of list) {
    if (!merged.some((j) => j.id === job.id)) merged.push(job);
  }
  return merged;
}
