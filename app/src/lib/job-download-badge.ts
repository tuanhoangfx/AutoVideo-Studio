import type { Job } from '@/lib/api';
import { wasJobAutoDownloaded, wasJobDownloadFailed } from '@/lib/job-auto-download';
import { getSlotDownloadCount } from '@/lib/job-project-slot';

export type JobDownloadBadgeState = 'pending' | 'downloaded' | 'failed';

export function resolveJobDownloadBadge(job: Job): JobDownloadBadgeState | null {
  if (job.status === 'error') return 'failed';
  if (job.status !== 'done') return null;
  if (wasJobDownloadFailed(job.id)) return 'failed';
  if (wasJobAutoDownloaded(job.id)) return 'downloaded';
  if (getSlotDownloadCount(job.id) > 0) return 'downloaded';
  return 'pending';
}

export const JOB_DOWNLOAD_BADGE_STYLES: Record<
  JobDownloadBadgeState,
  { className: string; hoverClass: string; title: string }
> = {
  pending: {
    className: 'text-white/35',
    hoverClass: 'hover:bg-white/10 hover:text-white/55',
    title: 'Export done — download pending',
  },
  downloaded: {
    className: 'text-emerald-400',
    hoverClass: 'hover:bg-emerald-500/15 hover:text-emerald-300',
    title: 'Downloaded — open output',
  },
  failed: {
    className: 'text-rose-400',
    hoverClass: 'hover:bg-rose-500/15 hover:text-rose-300',
    title: 'Export or download failed',
  },
};
