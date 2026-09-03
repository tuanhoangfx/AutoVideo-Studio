'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, OctagonMinus, Plus } from 'lucide-react';
import type { Job } from '@/lib/api';
import {
  JOB_DOWNLOAD_BADGE_STYLES,
  resolveJobDownloadBadge,
  type JobDownloadBadgeState,
} from '@/lib/job-download-badge';
import { formatJobDateTimeLabel, formatJobTabCompactLabel } from '@/lib/job-datetime-label';
import { getJobTabLabelIso, getSlotDownloadCount } from '@/lib/job-project-slot';
import { JobTabTooltip } from './JobTabTooltip';
import { StudioJobKpiBadges } from './StudioJobKpiBadges';
import type { KpiTileData } from '@tool-workspace/hub-ui/shell/KpiStrip';
import type { StudioJobStatusFilterKey } from '@/lib/studio/studio-job-status-filter';
import { filterJobsByStudioStatus } from '@/lib/studio/studio-job-status-filter';

type JobStatus = Job['status'];

/** relatedTarget may be Window/document — not valid for Node.contains. */
function pointerStillInside(current: EventTarget | null, related: EventTarget | null): boolean {
  if (!current || !related || !(related instanceof Node)) return false;
  if (!(current instanceof Node)) return false;
  return current.contains(related);
}

const STATUS_META: Record<JobStatus, { dot: string; track: string }> = {
  pending: {
    dot: 'bg-slate-300/80',
    track: 'from-slate-300/80 to-slate-400/80',
  },
  tts: {
    dot: 'bg-sky-400',
    track: 'from-sky-400/85 to-sky-500/85',
  },
  audio: {
    dot: 'bg-sky-400',
    track: 'from-sky-400/85 to-sky-500/85',
  },
  compose: {
    dot: 'bg-amber-400',
    track: 'from-amber-300/90 to-amber-400/90',
  },
  done: {
    dot: 'bg-emerald-400',
    track: 'from-emerald-300/90 to-emerald-400/90',
  },
  error: {
    dot: 'bg-rose-400',
    track: 'from-rose-300/90 to-rose-400/90',
  },
};

export function ProjectTabs({
  jobs,
  activeId,
  newJobId,
  savedOutputFilenames,
  downloadBadgeVersion = 0,
  onSelect,
  onNew,
  onClose,
  onOpenOutput,
  kpiItems = [],
  statusFilter = null,
  onToggleStatusFilter,
}: {
  jobs: Job[];
  activeId: string | null;
  newJobId?: string | null;
  savedOutputFilenames?: Record<string, string>;
  downloadBadgeVersion?: number;
  onSelect: (id: string) => void;
  onNew: () => void;
  onClose?: (id: string) => void;
  onOpenOutput?: (job: Job, filename?: string) => void;
  kpiItems?: KpiTileData[];
  statusFilter?: StudioJobStatusFilterKey | null;
  onToggleStatusFilter?: (key: StudioJobStatusFilterKey) => void;
}) {
  const [tooltipJobId, setTooltipJobId] = useState<string | null>(null);
  const [tooltipAnchor, setTooltipAnchor] = useState<HTMLElement | null>(null);
  const [clientReady, setClientReady] = useState(false);
  const hideTooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setClientReady(true);
  }, []);

  useEffect(() => {
    void downloadBadgeVersion;
  }, [downloadBadgeVersion]);

  const clearHideTooltipTimer = useCallback(() => {
    if (hideTooltipTimerRef.current) {
      clearTimeout(hideTooltipTimerRef.current);
      hideTooltipTimerRef.current = null;
    }
  }, []);

  const showTooltip = useCallback(
    (jobId: string, anchor: HTMLElement) => {
      clearHideTooltipTimer();
      setTooltipJobId(jobId);
      setTooltipAnchor(anchor);
    },
    [clearHideTooltipTimer]
  );

  const scheduleHideTooltip = useCallback(
    (jobId: string) => {
      clearHideTooltipTimer();
      hideTooltipTimerRef.current = setTimeout(() => {
        setTooltipJobId((current) => (current === jobId ? null : current));
        setTooltipAnchor(null);
      }, 160);
    },
    [clearHideTooltipTimer]
  );

  useEffect(() => () => clearHideTooltipTimer(), [clearHideTooltipTimer]);

  const tooltipJob = tooltipJobId ? jobs.find((j) => j.id === tooltipJobId) : null;
  const visibleJobs = filterJobsByStudioStatus(jobs, statusFilter);
  const filterLabel =
    statusFilter === 'active'
      ? 'active'
      : statusFilter === 'done'
        ? 'done'
        : statusFilter === 'error'
          ? 'error'
          : null;

  return (
    <div className="flex items-center gap-1 border-b border-white/10 bg-black/25 px-2 py-1.5">
      <button
        type="button"
        onClick={onNew}
        className="relative z-20 mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-rose-300/80 bg-rose-500 text-white shadow-sm transition hover:bg-rose-400 active:translate-y-[1px]"
        title="New project"
      >
        <Plus size={14} />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto studio-timeline-scroll">
        {jobs.length === 0 && (
          <div className="px-3 py-1.5 text-[11px] italic text-white/40">
            No projects yet. Click + to create one.
          </div>
        )}
        {jobs.length > 0 && visibleJobs.length === 0 && filterLabel ? (
          <div className="px-3 py-1.5 text-[11px] italic text-white/45">
            No {filterLabel} projects — click the badge again to show all.
          </div>
        ) : null}
        {visibleJobs.map((job) => {
        const active = job.id === activeId;
        const meta = STATUS_META[job.status] ?? STATUS_META.pending;
        const pct = Math.round(Math.max(0, Math.min(100, job.progress ?? 0)));
        const isNew = Boolean(newJobId && job.id === newJobId);
        const savedFilename = savedOutputFilenames?.[job.id];
        const createdLabel = clientReady
          ? formatJobTabCompactLabel(getJobTabLabelIso(job.id) ?? job.created_at)
          : '';
        const createdTitle = clientReady
          ? formatJobDateTimeLabel(getJobTabLabelIso(job.id) ?? job.created_at)
          : '';
        const downloadCount = clientReady ? getSlotDownloadCount(job.id) : 0;
        const downloadBadge: JobDownloadBadgeState | null = clientReady
          ? resolveJobDownloadBadge(job)
          : null;
        const badgeStyle = downloadBadge ? JOB_DOWNLOAD_BADGE_STYLES[downloadBadge] : null;

        return (
          <div
            key={job.id}
            role="tab"
            tabIndex={0}
            aria-selected={active}
            onClick={() => onSelect(job.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(job.id);
              }
            }}
            className={`group relative flex max-w-[11.5rem] min-w-[8.25rem] cursor-pointer items-center gap-1.5 rounded-t-lg border border-transparent px-2 py-1 text-[10px] ${
              active
                ? 'border-white/10 bg-[var(--panel)] text-white'
                : 'bg-white/[.02] text-white/60 hover:bg-white/[.04]'
            }`}
            title={createdTitle || undefined}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot} ${job.status !== 'done' && job.status !== 'error' ? 'animate-pulse' : ''}`} />
            {isNew ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300 animate-pulse" /> : null}
            <span className="min-w-0 flex-1 truncate text-white/70" suppressHydrationWarning>
              {createdLabel || '—:—'}
            </span>
            {badgeStyle ? (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenOutput?.(job, savedFilename);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenOutput?.(job, savedFilename);
                  }
                }}
                onPointerEnter={(e) => {
                  showTooltip(job.id, e.currentTarget);
                }}
                onPointerLeave={(e) => {
                  if (pointerStillInside(e.currentTarget, e.relatedTarget)) return;
                  scheduleHideTooltip(job.id);
                }}
                onFocus={(e) => {
                  showTooltip(job.id, e.currentTarget);
                }}
                onBlur={() => {
                  scheduleHideTooltip(job.id);
                }}
                className={`relative grid h-5 min-w-[1.25rem] shrink-0 place-items-center rounded-md px-0.5 ${badgeStyle.className} ${badgeStyle.hoverClass}`}
                title={
                  downloadCount > 0
                    ? `${badgeStyle.title} · ${downloadCount} video(s) saved`
                    : badgeStyle.title
                }
                aria-label={
                  downloadCount > 0
                    ? `${badgeStyle.title}, ${downloadCount} downloads`
                    : badgeStyle.title
                }
              >
                <Download size={12} strokeWidth={2.25} className="pointer-events-none" />
                {downloadCount > 0 ? (
                  <span className="pointer-events-none absolute -right-1 -top-1 min-w-[0.7rem] rounded-full bg-emerald-500 px-0.5 text-center text-[8px] font-bold leading-[0.65rem] text-black">
                    {downloadCount > 9 ? '9+' : downloadCount}
                  </span>
                ) : null}
              </span>
            ) : null}
            {job.status !== 'done' && job.status !== 'error' ? (
              <span className="shrink-0 text-[10px] text-white/35">{pct}%</span>
            ) : null}
            {onClose ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(job.id);
                }}
                className="ml-0.5 grid h-5 w-5 shrink-0 place-items-center rounded text-white/40 hover:bg-white/[.08] hover:text-white"
                title="Close project"
                aria-label={`Close ${job.id}`}
              >
                <OctagonMinus size={12} />
              </button>
            ) : null}
            <div
              className={`pointer-events-none absolute inset-x-0 bottom-0 h-0.5 ${
                active ? 'bg-indigo-400' : 'bg-transparent'
              }`}
            />
            {job.status !== 'done' && job.status !== 'error' ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-white/8">
                <div
                  className={`h-full bg-gradient-to-r ${meta.track}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            ) : null}
          </div>
        );
      })}
      </div>
      <StudioJobKpiBadges
        items={kpiItems}
        activeFilter={statusFilter}
        onToggleFilter={onToggleStatusFilter ?? (() => undefined)}
      />
      {tooltipJob ? (
        <JobTabTooltip
          job={tooltipJob}
          savedFilename={savedOutputFilenames?.[tooltipJob.id]}
          anchorEl={tooltipAnchor}
          open
        />
      ) : null}
    </div>
  );
}
