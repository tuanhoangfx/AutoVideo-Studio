'use client';

import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Download,
  Film,
  FolderOpen,
  Gauge,
  Loader2,
  Mic2,
  Music,
  Timer,
  Zap,
} from 'lucide-react';
import * as api from '@/lib/api';
import type { Job } from '@/lib/api';
import {
  JOB_DOWNLOAD_BADGE_STYLES,
  resolveJobDownloadBadge,
} from '@/lib/job-download-badge';
import {
  dispatchJobMetricsUpdated,
  outputDurationIsEstimated,
  renderDurationIsEstimated,
  resolveOutputDurationMs,
  resolveRenderDurationMs,
} from '@/lib/job-metrics';

function formatMsLabel(ms: number | null | undefined) {
  if (ms == null || ms <= 0) return '—';
  const totalSec = Math.round(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainMinutes = minutes % 60;
    return `${hours}h${String(remainMinutes).padStart(2, '0')}m`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function statusHeader(job: Job) {
  const downloadBadge = resolveJobDownloadBadge(job);
  if (downloadBadge === 'downloaded') {
    return {
      Icon: Download,
      iconClass: JOB_DOWNLOAD_BADGE_STYLES.downloaded.className,
      badge: 'Done',
      badgeClass: 'bg-emerald-500/15 text-emerald-200',
    };
  }
  if (downloadBadge === 'failed' || job.status === 'error') {
    return {
      Icon: Download,
      iconClass: JOB_DOWNLOAD_BADGE_STYLES.failed.className,
      badge: 'Error',
      badgeClass: 'bg-rose-500/15 text-rose-200',
    };
  }
  if (downloadBadge === 'pending') {
    return {
      Icon: Download,
      iconClass: JOB_DOWNLOAD_BADGE_STYLES.pending.className,
      badge: 'Done',
      badgeClass: 'bg-white/10 text-white/50',
    };
  }
  return {
    Icon: Download,
    iconClass: 'text-amber-300',
    badge: job.status,
    badgeClass: 'bg-amber-500/15 text-amber-200',
  };
}

function Row({
  icon: Icon,
  tone = 'text-white/45',
  label,
  value,
  hint,
}: {
  icon: typeof Clock;
  tone?: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-2 text-[11px] leading-snug">
      <Icon size={13} className={`mt-0.5 shrink-0 ${tone}`} />
      <span className="shrink-0 text-white/45">{label}</span>
      <span className="min-w-0 flex-1 text-right">
        <span className="block truncate font-mono tabular-nums text-white/85">{value}</span>
        {hint ? <span className="block text-[9px] text-white/35">{hint}</span> : null}
      </span>
    </div>
  );
}

export function JobTabTooltip({
  job,
  savedFilename,
  anchorEl,
  open,
}: {
  job: Job;
  savedFilename?: string;
  anchorEl: HTMLElement | null;
  open: boolean;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const fetchedForJobIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDetailJob(null);
      setLoading(false);
      fetchedForJobIdRef.current = null;
      return;
    }

    if (fetchedForJobIdRef.current === job.id && detailJob) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        let fresh = await api.getJob(job.id);
        if (
          fresh.status === 'done' &&
          (!fresh.output_duration_ms || fresh.output_duration_ms <= 0)
        ) {
          try {
            fresh = await api.probeJobOutput(job.id);
          } catch {
            /* probe optional */
          }
        }
        if (!cancelled) {
          fetchedForJobIdRef.current = job.id;
          setDetailJob(fresh);
          dispatchJobMetricsUpdated(fresh, job);
        }
      } catch {
        if (!cancelled) setDetailJob(job);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only refetch when tooltip target job changes
  }, [open, job.id]);

  useLayoutEffect(() => {
    if (!open || !anchorEl) {
      setPos(null);
      return;
    }
    const place = () => {
      const rect = anchorEl.getBoundingClientRect();
      if (!rect) return;
      const width = tooltipRef.current?.offsetWidth ?? 280;
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
      setPos({ top: rect.bottom + 6, left });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [anchorEl, open, job.id]);

  if (!open || !pos || typeof document === 'undefined') return null;

  const displayJob =
    detailJob &&
    (detailJob.output_duration_ms || detailJob.render_duration_ms || detailJob.phase_timing_ms)
      ? detailJob
      : job.output_duration_ms || job.render_duration_ms || job.phase_timing_ms
        ? job
        : detailJob ?? job;
  const outputMs = resolveOutputDurationMs(displayJob);
  const renderMs = resolveRenderDurationMs(displayJob);
  const outEstimated = outputDurationIsEstimated(displayJob);
  const renderEstimated = renderDurationIsEstimated(displayJob);
  const rtf =
    renderMs && outputMs && renderMs > 0 ? (outputMs / renderMs).toFixed(2) : null;
  const phase = displayJob.phase_timing_ms;
  const mismatch =
    displayJob.expected_duration_ms != null &&
    displayJob.output_duration_ms != null &&
    displayJob.output_duration_ms > 0 &&
    Math.abs(displayJob.output_duration_ms - displayJob.expected_duration_ms) > 2000;
  const header = statusHeader(displayJob);
  const HeaderIcon = header.Icon;

  return createPortal(
    <div
      ref={tooltipRef}
      role="tooltip"
      className="pointer-events-none fixed z-[250] w-[min(20rem,calc(100vw-1rem))] rounded-xl border border-white/10 bg-[#0d1224]/95 p-2.5 text-white shadow-2xl backdrop-blur"
      style={{ top: pos.top, left: pos.left }}
    >
      <div className="mb-2 flex items-center gap-2 border-b border-white/8 pb-2">
        {loading ? <Loader2 size={14} className="animate-spin text-white/40" /> : null}
        <HeaderIcon size={14} className={header.iconClass} />
        <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-white/70">{displayJob.id}</span>
        <span
          className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${header.badgeClass}`}
        >
          {header.badge}
        </span>
      </div>
      <div className="space-y-1.5">
        <Row
          icon={Film}
          tone="text-indigo-300"
          label="Output"
          value={loading ? '…' : formatMsLabel(outputMs)}
          hint={!loading && outEstimated ? 'Timeline estimate' : undefined}
        />
        <Row
          icon={Timer}
          tone="text-amber-300"
          label="Render"
          value={loading ? '…' : formatMsLabel(renderMs)}
          hint={!loading && renderEstimated ? 'From timestamps / phases' : undefined}
        />
        {rtf ? <Row icon={Zap} tone="text-cyan-300" label="Speed" value={`${rtf}× realtime`} /> : null}
        {phase?.tts_ms != null ? (
          <Row icon={Mic2} tone="text-sky-300" label="TTS" value={formatMsLabel(phase.tts_ms)} />
        ) : null}
        {phase?.audio_ms != null ? (
          <Row icon={Music} tone="text-violet-300" label="Audio" value={formatMsLabel(phase.audio_ms)} />
        ) : null}
        {phase?.compose_ms != null ? (
          <Row icon={Gauge} tone="text-amber-300" label="Compose" value={formatMsLabel(phase.compose_ms)} />
        ) : null}
        {savedFilename ? (
          <Row icon={FolderOpen} tone="text-amber-200" label="File" value={savedFilename} />
        ) : null}
        {mismatch ? (
          <div className="flex items-start gap-2 rounded-lg border border-rose-400/20 bg-rose-500/10 px-2 py-1 text-[10px] text-rose-100">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            <span>Duration mismatch vs expected timeline</span>
          </div>
        ) : null}
        {displayJob.message ? <Row icon={Clock} label="Note" value={displayJob.message} /> : null}
      </div>
    </div>,
    document.body
  );
}
