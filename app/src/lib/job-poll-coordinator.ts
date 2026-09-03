'use client';

import * as api from '@/lib/api';
import type { Job } from '@/lib/api';
import { JOB_POLLED_EVENT, JOB_TERMINAL_EVENT } from '@/lib/job-events';
import { REGISTER_RUNNING_JOBS_EVENT } from '@/lib/job-events';
import { performJobAutoDownload } from '@/lib/job-auto-download';
import { isRunningJob, runningJobIds } from '@/lib/job-running';
import { dispatchWorkerInfo, fetchWorkerConcurrentLimit } from '@/lib/worker-capacity';

type CoordinatorState = {
  runningKey: string;
  handledTerminal: Set<string>;
  pollIntervalId: number | null;
  bootstrapIntervalId: number | null;
  started: boolean;
};

const TERMINAL_HANDLED_MAX = 200;

const state: CoordinatorState = {
  runningKey: '',
  handledTerminal: new Set(),
  pollIntervalId: null,
  bootstrapIntervalId: null,
  started: false,
};

let pollInFlight = false;

function rememberTerminalJob(id: string) {
  state.handledTerminal.add(id);
  while (state.handledTerminal.size > TERMINAL_HANDLED_MAX) {
    const oldest = state.handledTerminal.values().next().value;
    if (!oldest) break;
    state.handledTerminal.delete(oldest);
  }
}

function mergeRunningKeys(prev: string, ids: string[]): string {
  const set = new Set(prev.split('|').filter(Boolean));
  for (const id of ids) set.add(id);
  return [...set].sort().join('|');
}

function applyPollResults(prev: string, updates: Job[]): string {
  const set = new Set(prev.split('|').filter(Boolean));
  for (const job of updates) {
    if (isRunningJob(job)) set.add(job.id);
    else set.delete(job.id);
  }
  return [...set].sort().join('|');
}

async function bootstrapOnce() {
  try {
    const limit = await fetchWorkerConcurrentLimit();
    dispatchWorkerInfo({ concurrentLimit: limit });
    const jobs = await api.listJobs();
    const ids = runningJobIds(jobs);
    if (ids.length) state.runningKey = mergeRunningKeys(state.runningKey, ids);
  } catch {
    /* worker offline */
  }
}

async function pollOnce() {
  if (pollInFlight) return;
  pollInFlight = true;
  try {
  const ids = state.runningKey.split('|').filter(Boolean);
  if (!ids.length) return;

  const updates: Job[] = [];
  await Promise.all(
    ids.map(async (id) => {
      try {
        updates.push(await api.getJob(id));
      } catch {
        /* ignore transient worker errors */
      }
    })
  );
  if (!updates.length) return;

  state.runningKey = applyPollResults(state.runningKey, updates);
  window.dispatchEvent(new CustomEvent(JOB_POLLED_EVENT, { detail: { jobs: updates } }));

  for (const job of updates) {
    if (job.status !== 'done' && job.status !== 'error') continue;
    if (state.handledTerminal.has(job.id)) continue;
    rememberTerminalJob(job.id);

    window.dispatchEvent(new CustomEvent(JOB_TERMINAL_EVENT, { detail: { job } }));

    if (job.status === 'done') {
      void (async () => {
        let enriched = job;
        if (!job.output_duration_ms || job.output_duration_ms <= 0) {
          try {
            enriched = await api.probeJobOutput(job.id);
            window.dispatchEvent(new CustomEvent(JOB_POLLED_EVENT, { detail: { jobs: [enriched] } }));
          } catch {
            /* probe optional */
          }
        }
        await performJobAutoDownload(enriched);
      })();
    }
  }
  } finally {
    pollInFlight = false;
  }
}

/**
 * Single global owner for job polling + terminal events + auto-download.
 * Safe to call multiple times; it will only start once per tab.
 */
export function ensureJobPollCoordinatorStarted() {
  if (typeof window === 'undefined') return;
  if (state.started) return;
  state.started = true;

  void bootstrapOnce();
  state.bootstrapIntervalId = window.setInterval(() => void bootstrapOnce(), 12_000);

  const onRegister = (event: Event) => {
    const ids = (event as CustomEvent<{ ids?: string[] }>).detail?.ids ?? [];
    if (!ids.length) return;
    state.runningKey = mergeRunningKeys(state.runningKey, ids);
    void pollOnce();
  };
  window.addEventListener(REGISTER_RUNNING_JOBS_EVENT, onRegister);

  void pollOnce();
  state.pollIntervalId = window.setInterval(() => void pollOnce(), 1500);
}

