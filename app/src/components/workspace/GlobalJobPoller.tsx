'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '@/lib/api';
import type { Job } from '@/lib/api';
import { JOB_POLLED_EVENT, JOB_TERMINAL_EVENT, REGISTER_RUNNING_JOBS_EVENT } from '@/lib/job-events';
import { performJobAutoDownload } from '@/lib/job-auto-download';
import { isRunningJob, runningJobIds } from '@/lib/job-running';
import { dispatchWorkerInfo, fetchWorkerConcurrentLimit } from '@/lib/worker-capacity';

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

/** Polls worker for all in-progress exports; auto-downloads when done (any route). */
export function GlobalJobPoller() {
  const [runningKey, setRunningKey] = useState('');
  const handledTerminalRef = useRef<Set<string>>(new Set());

  const bootstrap = useCallback(async () => {
    try {
      const limit = await fetchWorkerConcurrentLimit();
      dispatchWorkerInfo({ concurrentLimit: limit });
      const jobs = await api.listJobs();
      const ids = runningJobIds(jobs);
      if (ids.length) setRunningKey((prev) => mergeRunningKeys(prev, ids));
    } catch {
      /* worker offline */
    }
  }, []);

  useEffect(() => {
    void bootstrap();
    const id = window.setInterval(() => void bootstrap(), 12_000);
    return () => window.clearInterval(id);
  }, [bootstrap]);

  useEffect(() => {
    const onRegister = (event: Event) => {
      const ids = (event as CustomEvent<{ ids?: string[] }>).detail?.ids ?? [];
      if (!ids.length) return;
      setRunningKey((prev) => mergeRunningKeys(prev, ids));
    };
    window.addEventListener(REGISTER_RUNNING_JOBS_EVENT, onRegister);
    return () => window.removeEventListener(REGISTER_RUNNING_JOBS_EVENT, onRegister);
  }, []);

  useEffect(() => {
    const ids = runningKey.split('|').filter(Boolean);
    if (!ids.length) return;

    const tick = async () => {
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

      setRunningKey((prev) => applyPollResults(prev, updates));
      window.dispatchEvent(new CustomEvent(JOB_POLLED_EVENT, { detail: { jobs: updates } }));

      for (const job of updates) {
        if (job.status !== 'done' && job.status !== 'error') continue;
        if (handledTerminalRef.current.has(job.id)) continue;
        handledTerminalRef.current.add(job.id);

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
    };

    void tick();
    const interval = window.setInterval(tick, 1500);
    return () => window.clearInterval(interval);
  }, [runningKey]);

  return null;
}

export { registerRunningJobs } from '@/lib/job-events';
