import type { Job } from '@/lib/api';

export const RUNNING_JOB_STATUSES: Job['status'][] = ['pending', 'tts', 'audio', 'compose'];

export function isRunningJob(job: Job): boolean {
  return RUNNING_JOB_STATUSES.includes(job.status) && !job.id.startsWith('draft-');
}

export function runningJobIds(jobs: Job[]): string[] {
  return jobs.filter(isRunningJob).map((j) => j.id);
}

export function runningJobIdsKey(jobs: Job[]): string {
  return runningJobIds(jobs).sort().join('|');
}
