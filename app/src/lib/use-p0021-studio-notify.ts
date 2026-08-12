'use client';

import { useEffect, useMemo, useState } from 'react';
import type { HubNotifyPanelProps } from '@/lib/hub-ui';
import * as api from '@/lib/api';
import { JOB_DOWNLOAD_FAILED_EVENT } from '@/lib/job-auto-download';
import { buildStudioNotifyPanelProps } from '@/lib/p0021-studio-notify';

const WORKER_PROBE_MS = 30_000;

/** Live Notify feed — worker health, job counters, download failures, desktop updates. */
export function useP0021StudioNotify(): HubNotifyPanelProps {
  const [workerOk, setWorkerOk] = useState<boolean | null>(null);
  const [workerError, setWorkerError] = useState('');
  const [jobErrorCount, setJobErrorCount] = useState(0);
  const [downloadFailedReason, setDownloadFailedReason] = useState<string | null>(null);
  const [updateAvailableVersion, setUpdateAvailableVersion] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const probe = async () => {
      try {
        await api.initializeDesktopWorkerUrl();
        await api.getRoot();
        if (!cancelled) {
          setWorkerOk(true);
          setWorkerError('');
        }
      } catch (error) {
        if (!cancelled) {
          setWorkerOk(false);
          setWorkerError(error instanceof Error ? error.message : 'Worker check failed.');
        }
      }
    };
    void probe();
    const id = window.setInterval(() => void probe(), WORKER_PROBE_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const onCounters = (event: Event) => {
      const detail = (event as CustomEvent<{ active: number; done: number; error: number }>).detail;
      if (!detail) return;
      setJobErrorCount(detail.error);
    };
    window.addEventListener('studio-job-counters', onCounters);
    return () => window.removeEventListener('studio-job-counters', onCounters);
  }, []);

  useEffect(() => {
    const onDownloadFailed = (event: Event) => {
      const reason = (event as CustomEvent<{ reason?: string }>).detail?.reason;
      setDownloadFailedReason(reason?.trim() || 'Export download failed.');
    };
    window.addEventListener(JOB_DOWNLOAD_FAILED_EVENT, onDownloadFailed);
    return () => window.removeEventListener(JOB_DOWNLOAD_FAILED_EVENT, onDownloadFailed);
  }, []);

  useEffect(() => {
    const desktopApi = window.autovideo;
    if (!desktopApi?.getUpdateStatus) return;

    const apply = (status: { state?: string; updateVersion?: string | null }) => {
      if (status?.state === 'available' && status.updateVersion) {
        setUpdateAvailableVersion(status.updateVersion);
        return;
      }
      setUpdateAvailableVersion(null);
    };

    desktopApi.getUpdateStatus().then(apply).catch(() => {});
    return desktopApi.onUpdateStatus?.(apply);
  }, []);

  return useMemo(
    () =>
      buildStudioNotifyPanelProps({
        workerOk,
        workerError,
        jobErrorCount,
        downloadFailedReason,
        updateAvailableVersion,
      }),
    [workerOk, workerError, jobErrorCount, downloadFailedReason, updateAvailableVersion],
  );
}
