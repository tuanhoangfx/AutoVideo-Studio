import type { HubNotifyPanelProps } from '@/lib/hub-ui';

export type StudioNotifyInput = {
  workerOk: boolean | null;
  workerError?: string;
  jobErrorCount: number;
  downloadFailedReason?: string | null;
  updateAvailableVersion?: string | null;
};

/** System Notify for AutoVideo Studio — worker / jobs / desktop update only (warn+bad). */
export function buildStudioNotifyPanelProps(input: StudioNotifyInput): HubNotifyPanelProps {
  const alerts: HubNotifyPanelProps['alerts'] = [];

  if (input.workerOk === false) {
    alerts.push({
      id: 'worker-offline',
      severity: 'bad',
      label: 'Worker offline',
      detail: input.workerError?.trim() || 'Render worker API is unreachable.',
    });
  }

  if (input.jobErrorCount > 0) {
    alerts.push({
      id: 'jobs-error',
      severity: 'bad',
      label: 'Failed jobs',
      detail: `${input.jobErrorCount} job(s) ended with errors.`,
    });
  }

  if (input.downloadFailedReason?.trim()) {
    alerts.push({
      id: 'download-failed',
      severity: 'warn',
      label: 'Download failed',
      detail: input.downloadFailedReason.trim(),
    });
  }

  if (input.updateAvailableVersion?.trim()) {
    alerts.push({
      id: 'update-available',
      severity: 'warn',
      label: 'Update available',
      detail: `AutoVideo Studio ${input.updateAvailableVersion.trim()} is ready to download.`,
    });
  }

  return {
    scopeKey: 'p0021-studio-notify',
    title: 'Notify',
    subtitle: 'System alerts for AutoVideo Studio',
    emptyMessage: 'No system alerts.',
    trackUnread: true,
    alerts,
  };
}
