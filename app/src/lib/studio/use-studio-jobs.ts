'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import * as api from '@/lib/api';
import type { Job } from '@/lib/api';
import { formatDuration } from '@/lib/format-duration';
import { JOB_METRICS_UPDATED_EVENT } from '@/lib/job-metrics';
import { JOB_POLLED_EVENT } from '@/lib/job-events';
import { registerRunningJobs } from '@/lib/job-events';
import {
  countRunningJobs,
  exportSlotsFull,
  fetchWorkerConcurrentLimit,
  WORKER_INFO_EVENT,
  type WorkerInfoDetail,
} from '@/lib/worker-capacity';
import { bindJobToSlot } from '@/lib/job-project-slot';
import { jobDurationMismatchMs } from './studio-scene-utils';
import { mergeDraftJobsWithServerList } from './merge-draft-jobs';

export function useStudioJobs(showToast: (text: string) => void) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [newJobId, setNewJobId] = useState<string | null>(null);
  const [serverOk, setServerOk] = useState<boolean | null>(null);
  const [concurrentLimit, setConcurrentLimit] = useState(1);
  const [probingOutput, setProbingOutput] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await api.initializeDesktopWorkerUrl();
        await api.getRoot();
        setServerOk(true);
        const list = await api.listJobs();
        setJobs((prev) => mergeDraftJobsWithServerList(prev, list));
        for (const job of list) {
          bindJobToSlot(job.id, job.id, { labelAt: job.created_at });
        }
        setActiveJobId((prev) => prev ?? list[0]?.id ?? null);
      } catch {
        setServerOk(false);
      }
    })();
  }, []);

  const currentJob = useMemo(
    () => jobs.find((j) => j.id === activeJobId) || null,
    [jobs, activeJobId]
  );

  const runningExportCount = useMemo(() => countRunningJobs(jobs), [jobs]);
  const slotsFull = useMemo(() => exportSlotsFull(jobs, concurrentLimit), [jobs, concurrentLimit]);
  const durationMismatchMs = useMemo(() => jobDurationMismatchMs(currentJob), [currentJob]);

  useEffect(() => {
    registerRunningJobs(jobs);
  }, [jobs]);

  useEffect(() => {
    const onMetrics = (event: Event) => {
      const updated = (event as CustomEvent<{ job?: Job }>).detail?.job;
      if (!updated?.id) return;
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? { ...j, ...updated } : j)));
    };
    window.addEventListener(JOB_METRICS_UPDATED_EVENT, onMetrics);
    return () => window.removeEventListener(JOB_METRICS_UPDATED_EVENT, onMetrics);
  }, []);

  useEffect(() => {
    void fetchWorkerConcurrentLimit();
    const onInfo = (event: Event) => {
      const limit = (event as CustomEvent<WorkerInfoDetail>).detail?.concurrentLimit;
      if (typeof limit === 'number' && limit >= 1) setConcurrentLimit(limit);
    };
    window.addEventListener(WORKER_INFO_EVENT, onInfo);
    return () => window.removeEventListener(WORKER_INFO_EVENT, onInfo);
  }, []);

  useEffect(() => {
    const activeCount = jobs.filter((j) => j.status !== 'done' && j.status !== 'error').length;
    const doneCount = jobs.filter((j) => j.status === 'done').length;
    const errorCount = jobs.filter((j) => j.status === 'error').length;
    window.dispatchEvent(
      new CustomEvent('studio-job-counters', {
        detail: { active: activeCount, done: doneCount, error: errorCount },
      })
    );
  }, [jobs]);

  useEffect(() => {
    const onPolled = (event: Event) => {
      const updates = (event as CustomEvent<{ jobs?: Job[] }>).detail?.jobs ?? [];
      if (!updates.length) return;
      setJobs((prev) => {
        const map = new Map(updates.map((j) => [j.id, j]));
        return prev.map((j) => map.get(j.id) ?? j);
      });
    };
    window.addEventListener(JOB_POLLED_EVENT, onPolled);
    return () => window.removeEventListener(JOB_POLLED_EVENT, onPolled);
  }, []);

  useEffect(() => {
    if (!newJobId) return;
    const t = setTimeout(() => setNewJobId(null), 6000);
    return () => clearTimeout(t);
  }, [newJobId]);

  const probeCurrentJobOutput = useCallback(async () => {
    if (!currentJob?.id) return;
    setProbingOutput(true);
    try {
      const updated = await api.probeJobOutput(currentJob.id);
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
      const label = updated.output_duration_ms
        ? formatDuration(updated.output_duration_ms / 1000)
        : '—';
      showToast(`Output duration: ${label}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Re-probe failed';
      showToast(message);
    } finally {
      setProbingOutput(false);
    }
  }, [currentJob?.id, showToast]);

  const closeJobTab = useCallback(
    async (
      id: string,
      opts: {
        activeJobId: string | null;
        onAfterClose: (nextJobs: Job[], nextActiveId: string | null) => void;
      }
    ) => {
      const nextJobs = jobs.filter((j) => j.id !== id);
      opts.onAfterClose(nextJobs, opts.activeJobId === id ? nextJobs[0]?.id ?? null : opts.activeJobId);
      if (id.startsWith('draft-')) return;
      try {
        await api.deleteJob(id);
      } catch (e: unknown) {
        try {
          const list = await api.listJobs();
          setJobs((prev) => mergeDraftJobsWithServerList(prev, list));
        } catch {
          /* ignore */
        }
        const message = e instanceof Error ? e.message : 'Delete job failed';
        alert(`Delete job failed: ${message}`);
      }
    },
    [jobs]
  );

  return {
    jobs,
    setJobs,
    activeJobId,
    setActiveJobId,
    newJobId,
    setNewJobId,
    serverOk,
    concurrentLimit,
    probingOutput,
    currentJob,
    runningExportCount,
    slotsFull,
    durationMismatchMs,
    probeCurrentJobOutput,
    closeJobTab,
  };
}
