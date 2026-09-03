import * as api from '@/lib/api';
import { isRunningJob, runningJobIds } from '@/lib/job-running';
import type { Job } from '@/lib/api';

export const WORKER_INFO_EVENT = 'autovideo:worker-info';

export type WorkerComposeInfo = {
  xfadeAvailable: boolean;
  transitionS: number;
};

export type WorkerInfoDetail = {
  concurrentLimit: number;
  jobs?: number;
  compose?: WorkerComposeInfo;
};

const DEFAULT_COMPOSE_INFO: WorkerComposeInfo = {
  xfadeAvailable: false,
  transitionS: 0.4,
};

let workerComposeInfo: WorkerComposeInfo = { ...DEFAULT_COMPOSE_INFO };

export function getWorkerComposeInfo(): WorkerComposeInfo {
  return workerComposeInfo;
}

const DEFAULT_CONCURRENT_LIMIT = 1;

export function dispatchWorkerInfo(detail: WorkerInfoDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(WORKER_INFO_EVENT, { detail }));
}

export async function fetchWorkerConcurrentLimit(): Promise<number> {
  try {
    const root = await api.getRoot();
    const limit = Math.max(1, root.concurrent_limit ?? DEFAULT_CONCURRENT_LIMIT);
    const compose = root.compose;
    workerComposeInfo = {
      xfadeAvailable: Boolean(compose?.xfade_available),
      transitionS:
        typeof compose?.transition_s === 'number' && compose.transition_s > 0
          ? compose.transition_s
          : DEFAULT_COMPOSE_INFO.transitionS,
    };
    dispatchWorkerInfo({ concurrentLimit: limit, jobs: root.jobs, compose: workerComposeInfo });
    return limit;
  } catch {
    return DEFAULT_CONCURRENT_LIMIT;
  }
}

export function countRunningJobs(jobs: Job[]): number {
  return jobs.filter(isRunningJob).length;
}

export function exportSlotsFull(jobs: Job[], concurrentLimit: number): boolean {
  return countRunningJobs(jobs) >= Math.max(1, concurrentLimit);
}

export function canStartAnotherExport(jobs: Job[], concurrentLimit: number): boolean {
  return !exportSlotsFull(jobs, concurrentLimit);
}

export { runningJobIds };
