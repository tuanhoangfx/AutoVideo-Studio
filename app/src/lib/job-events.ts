import type { Job } from '@/lib/api';
import { runningJobIds } from '@/lib/job-running';

export const JOB_POLLED_EVENT = 'autovideo:jobs-polled';
export const JOB_TERMINAL_EVENT = 'autovideo:job-terminal';
export const REGISTER_RUNNING_JOBS_EVENT = 'autovideo:register-running-jobs';

export function registerRunningJobs(jobs: Job[]) {
  if (typeof window === 'undefined') return;
  const ids = runningJobIds(jobs);
  window.dispatchEvent(new CustomEvent(REGISTER_RUNNING_JOBS_EVENT, { detail: { ids } }));
}
