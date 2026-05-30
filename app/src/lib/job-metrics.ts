import type { Job } from '@/lib/api';

export const JOB_METRICS_UPDATED_EVENT = 'autovideo:job-metrics-updated';

function metricsSignature(job: Job): string {
  return [
    job.output_duration_ms ?? 0,
    job.render_duration_ms ?? 0,
    job.expected_duration_ms ?? 0,
    job.phase_timing_ms?.total_ms ?? 0,
    job.phase_timing_ms?.compose_ms ?? 0,
  ].join('|');
}

/** Update Studio job list only when timing fields actually changed. */
export function dispatchJobMetricsUpdated(job: Job, previous?: Job | null) {
  if (typeof window === 'undefined') return;
  if (previous && metricsSignature(previous) === metricsSignature(job)) return;
  window.dispatchEvent(new CustomEvent(JOB_METRICS_UPDATED_EVENT, { detail: { job } }));
}

export function resolveOutputDurationMs(job: Job): number | null {
  if (job.output_duration_ms != null && job.output_duration_ms > 0) return job.output_duration_ms;
  if (job.expected_duration_ms != null && job.expected_duration_ms > 0) return job.expected_duration_ms;
  return null;
}

export function resolveRenderDurationMs(job: Job): number | null {
  if (job.render_duration_ms != null && job.render_duration_ms > 0) return job.render_duration_ms;
  if (job.phase_timing_ms?.total_ms != null && job.phase_timing_ms.total_ms > 0) {
    return job.phase_timing_ms.total_ms;
  }
  if (job.started_at && job.completed_at) {
    const start = Date.parse(job.started_at);
    const end = Date.parse(job.completed_at);
    if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) return end - start;
  }
  return null;
}

export function outputDurationIsEstimated(job: Job): boolean {
  return (job.output_duration_ms == null || job.output_duration_ms <= 0) && (job.expected_duration_ms ?? 0) > 0;
}

export function renderDurationIsEstimated(job: Job): boolean {
  return (job.render_duration_ms == null || job.render_duration_ms <= 0) && resolveRenderDurationMs(job) != null;
}
