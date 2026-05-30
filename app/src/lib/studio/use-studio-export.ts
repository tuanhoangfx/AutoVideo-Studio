'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as api from '@/lib/api';
import type { Job, SubtitleStyle, TTSProvider } from '@/lib/api';
import { formatDuration } from '@/lib/format-duration';
import { isRunningJob } from '@/lib/job-running';
import {
  JOB_DOWNLOAD_COMPLETE_EVENT,
  JOB_DOWNLOAD_FAILED_EVENT,
  JOB_EXPORT_READY_EVENT,
  markForceDownloadJob,
  performJobAutoDownload,
  type JobDownloadCompleteDetail,
} from '@/lib/job-auto-download';
import { JOB_POLLED_EVENT, JOB_TERMINAL_EVENT } from '@/lib/job-events';
import { buildVideoFilename } from '@/lib/video-filename';
import {
  bindJobToSlot,
  getJobTabLabelIso,
  getSlotExportCount,
  recordSlotExport,
  resolveJobSlotId,
} from '@/lib/job-project-slot';
import {
  readStudioExportSettings,
  type StudioExportSettings,
  type VideoNameTemplate,
} from '@/lib/studio-export-settings';
import {
  DEFAULT_EXPORT_TIME_MODEL,
  estimateExportDurationMs,
  estimateExportRemainingMs,
  formatEstimateLabel,
  learnExportTimeModel,
  loadExportTimeModel,
  mergeExportTimeModel,
  saveExportTimeModel,
  type ExportTimeModel,
} from '@/lib/export-time-estimate';
import type { EditorSnapshot, StudioDownloadState } from '@/lib/studio-editor-snapshot';
import type { ScriptLine } from '@/types/studio';
import type { LibraryImage } from '@/components/studio/ImageLibrary';
import type { StudioAspect } from './studio-types';
import { formatJobErrorForUi } from './format-job-error';
import { findLatestDoneJob, revealStudioOutputFile } from '@/lib/studio-output-reveal';

export type UseStudioExportParams = {
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  activeJobId: string | null;
  setActiveJobId: (id: string | null) => void;
  setNewJobId: (id: string | null) => void;
  activeJobIdRef: React.MutableRefObject<string | null>;
  currentJob: Job | null;
  anyExportRunning: boolean;
  hydrated: boolean;
  showToast: (text: string, actionLabel?: string, action?: () => void) => void;
  editorCacheRef: React.MutableRefObject<Map<string, EditorSnapshot>>;
  captureEditorSnapshot: () => EditorSnapshot;
  setPreviewMode: (m: 'static' | 'sequence') => void;
  topic: string;
  renderLines: ScriptLine[];
  images: LibraryImage[];
  sceneDurationsSec: number[];
  imageDurationSec: number;
  narrationScript: string;
  totalVideoSec: number;
  totalExportTextChars: number;
  aspect: StudioAspect;
  voice: string;
  fps: number;
  rate: string;
  resolution: StudioExportSettings['resolution'];
  videoQuality: StudioExportSettings['videoQuality'];
  outputFormat: StudioExportSettings['outputFormat'];
  ttsProvider: TTSProvider;
  subtitleStyle: SubtitleStyle;
  bgmVolume: number;
  bgm: File | null;
  videoNameTemplate: VideoNameTemplate;
  setDownloadBadgeVersion: React.Dispatch<React.SetStateAction<number>>;
  downloadState: StudioDownloadState;
  setDownloadState: React.Dispatch<React.SetStateAction<StudioDownloadState>>;
  downloadMessage: string;
  setDownloadMessage: React.Dispatch<React.SetStateAction<string>>;
};

export function useStudioExport(p: UseStudioExportParams) {
  const [downloadHistory, setDownloadHistory] = useState<
    Array<{ id: string; filename: string; url: string; target: string; size: number; at: number }>
  >([]);
  const [exportTimeModel, setExportTimeModel] = useState<ExportTimeModel>(DEFAULT_EXPORT_TIME_MODEL);
  const [savedOutputFilenames, setSavedOutputFilenames] = useState<Record<string, string>>({});
  const forceExportDownloadRef = useRef(false);
  const renderStartedAtMsRef = useRef<number | null>(null);
  const [renderNowMs, setRenderNowMs] = useState(0);

  const renderExpectedMs = Math.max(1, Math.round(p.totalVideoSec * 1000));

  useEffect(() => {
    if (!p.hydrated) return;
    const learned = learnExportTimeModel(p.jobs);
    const merged = mergeExportTimeModel(loadExportTimeModel(), learned);
    setExportTimeModel(merged);
    saveExportTimeModel(merged);
  }, [p.jobs, p.hydrated]);

  const exportEstimateMs = useMemo(
    () =>
      estimateExportDurationMs(
        {
          scenesCount: p.renderLines.length,
          expectedVideoMs: renderExpectedMs,
          totalTextChars: p.totalExportTextChars,
          resolution: p.resolution,
          hasBgm: Boolean(p.bgm),
          subtitleStyle: p.subtitleStyle,
        },
        exportTimeModel
      ),
    [
      p.bgm,
      exportTimeModel,
      renderExpectedMs,
      p.renderLines.length,
      p.resolution,
      p.subtitleStyle,
      p.totalExportTextChars,
    ]
  );

  const exportEstimateLabel = p.hydrated
    ? formatEstimateLabel(exportEstimateMs, formatDuration)
    : '…';

  const applyDownloadComplete = useCallback(
    (detail: JobDownloadCompleteDetail) => {
      const outputUrl = api.resolveWorkerAssetUrl(api.outputUrl(detail.jobId));
      setSavedOutputFilenames((prev) => ({ ...prev, [detail.jobId]: detail.filename }));
      setDownloadHistory((prev) => [
        {
          id: detail.jobId,
          filename: detail.filename,
          url: outputUrl,
          target: detail.target,
          size: detail.size,
          at: Date.now(),
        },
        ...prev.filter((item) => item.id !== detail.jobId),
      ].slice(0, 4));
      if (detail.jobId !== p.activeJobId) return;
      p.setDownloadState('downloaded');
      p.setDownloadMessage(detail.filename);
      const label = detail.savedToFolder ? `Saved ${detail.filename}` : `Downloaded ${detail.filename}`;
      p.showToast(
        label,
        detail.savedToFolder && window.autovideo ? 'Open file' : undefined,
        detail.savedToFolder && window.autovideo
          ? () => {
              void revealStudioOutputFile(detail.filename);
            }
          : undefined
      );
      forceExportDownloadRef.current = false;
      p.setDownloadBadgeVersion((v) => v + 1);
    },
    [p]
  );

  const downloadJobOutput = useCallback(
    async (job: Job) => {
      if (job.status !== 'done' || !job.output_url) return;
      if (job.id === p.activeJobId) {
        const settings = readStudioExportSettings();
        p.setDownloadState('downloading');
        p.setDownloadMessage(settings.downloadDirectoryName ? 'Saving…' : 'Downloading…');
      }
      const result = await performJobAutoDownload(job, { force: true, topic: p.topic });
      if (result.ok && 'skipped' in result) {
        if (result.reason === 'auto-off' && job.id === p.activeJobId) {
          p.setDownloadState('downloaded');
          p.setDownloadMessage('Export ready (auto-download off)');
        }
        return;
      }
      if (result.ok && !('skipped' in result)) {
        applyDownloadComplete({
          jobId: job.id,
          filename: result.filename,
          size: result.size,
          target: result.target,
          savedToFolder: result.savedToFolder,
        });
        return;
      }
      if (!result.ok) {
        p.setDownloadBadgeVersion((v) => v + 1);
        if (job.id === p.activeJobId) {
          p.setDownloadState('error');
          p.setDownloadMessage(result.reason);
          forceExportDownloadRef.current = false;
        }
      }
    },
    [applyDownloadComplete, p]
  );

  const resolveJobOutputFilename = useCallback(
    (job: Job) => {
      const existing = savedOutputFilenames[job.id];
      if (existing) return existing;
      const settings = readStudioExportSettings();
      const ext = job.config.output_format ?? p.outputFormat ?? 'mp4';
      return `${buildVideoFilename({
        job,
        topic: p.topic,
        imagesCount: job.scenes_count,
        template: settings.videoNameTemplate ?? p.videoNameTemplate,
        exportIndex: Math.max(1, getSlotExportCount(job.id)),
      })}.${ext}`;
    },
    [p.outputFormat, p.topic, p.videoNameTemplate, savedOutputFilenames]
  );

  useEffect(() => {
    if (!p.currentJob || p.currentJob.status !== 'done') return;
    setSavedOutputFilenames((prev) => {
      if (prev[p.currentJob!.id]) return prev;
      return { ...prev, [p.currentJob!.id]: resolveJobOutputFilename(p.currentJob!) };
    });
  }, [p.currentJob, resolveJobOutputFilename]);

  const openJobOutput = useCallback(
    (job: Job, filename?: string) => {
      const name = filename ?? savedOutputFilenames[job.id] ?? resolveJobOutputFilename(job);
      if (typeof window !== 'undefined' && window.autovideo?.openOutputFile && name) {
        void revealStudioOutputFile(name);
        return;
      }
      if (typeof window !== 'undefined' && window.autovideo?.openOutputDirectory) {
        void window.autovideo.openOutputDirectory();
        return;
      }
      window.dispatchEvent(new Event('studio-output-settings-open'));
    },
    [resolveJobOutputFilename, savedOutputFilenames]
  );

  const openLatestJobOutput = useCallback(() => {
    const job = findLatestDoneJob(p.jobs, p.currentJob);
    if (!job) {
      p.showToast('No exported video yet.');
      return;
    }
    openJobOutput(job, savedOutputFilenames[job.id]);
  }, [openJobOutput, p, savedOutputFilenames]);

  const handleJobTerminal = useCallback(
    (updated: Job, activeId: string | null) => {
      if (updated.status === 'error') {
        p.setDownloadBadgeVersion((v) => v + 1);
        if (updated.id === activeId) {
          p.setDownloadState('error');
          p.setDownloadMessage(formatJobErrorForUi(updated.error));
        }
      }
      if (updated.status === 'done' && updated.id === activeId) {
        p.setDownloadState('downloading');
        p.setDownloadMessage('Preparing download…');
      }
    },
    [p]
  );

  useEffect(() => {
    const onPolled = (event: Event) => {
      const updates = (event as CustomEvent<{ jobs?: Job[] }>).detail?.jobs ?? [];
      if (!updates.length) return;
      p.setJobs((prev) => {
        const map = new Map(updates.map((j) => [j.id, j]));
        return prev.map((j) => map.get(j.id) ?? j);
      });
    };
    window.addEventListener(JOB_POLLED_EVENT, onPolled);
    return () => window.removeEventListener(JOB_POLLED_EVENT, onPolled);
  }, [p]);

  useEffect(() => {
    const onTerminal = (event: Event) => {
      const job = (event as CustomEvent<{ job?: Job }>).detail?.job;
      if (!job) return;
      handleJobTerminal(job, p.activeJobId);
    };
    window.addEventListener(JOB_TERMINAL_EVENT, onTerminal);
    return () => window.removeEventListener(JOB_TERMINAL_EVENT, onTerminal);
  }, [p.activeJobId, handleJobTerminal]);

  useEffect(() => {
    const onComplete = (event: Event) => {
      const detail = (event as CustomEvent<JobDownloadCompleteDetail>).detail;
      if (!detail?.jobId) return;
      applyDownloadComplete(detail);
    };
    const onFailed = (event: Event) => {
      const { jobId, reason } = (event as CustomEvent<{ jobId?: string; reason?: string }>).detail ?? {};
      if (jobId !== p.activeJobId) return;
      p.setDownloadState('error');
      p.setDownloadMessage(reason || 'Download failed.');
      forceExportDownloadRef.current = false;
    };
    const onReady = (event: Event) => {
      const job = (event as CustomEvent<{ job?: Job }>).detail?.job;
      if (!job || job.id !== p.activeJobId) return;
      p.setDownloadState('downloaded');
      p.setDownloadMessage('Export ready (auto-download off)');
    };
    const bump = () => p.setDownloadBadgeVersion((v) => v + 1);
    const onCompleteBadge = (event: Event) => {
      onComplete(event);
      bump();
    };
    const onFailedBadge = (event: Event) => {
      onFailed(event);
      bump();
    };
    window.addEventListener(JOB_DOWNLOAD_COMPLETE_EVENT, onCompleteBadge);
    window.addEventListener(JOB_DOWNLOAD_FAILED_EVENT, onFailedBadge);
    window.addEventListener(JOB_EXPORT_READY_EVENT, onReady);
    return () => {
      window.removeEventListener(JOB_DOWNLOAD_COMPLETE_EVENT, onCompleteBadge);
      window.removeEventListener(JOB_DOWNLOAD_FAILED_EVENT, onFailedBadge);
      window.removeEventListener(JOB_EXPORT_READY_EVENT, onReady);
    };
  }, [p.activeJobId, applyDownloadComplete, p]);

  const startRender = useCallback(async () => {
    if (p.renderLines.length === 0) return;
    renderStartedAtMsRef.current = Date.now();
    p.setDownloadState('exporting');
    p.setDownloadMessage(`Exporting ${formatDuration(p.totalVideoSec)} · est ${exportEstimateLabel}`);
    try {
      const priorId = p.activeJobIdRef.current;
      const priorJob = priorId ? p.jobs.find((j) => j.id === priorId) : null;
      const slotId = priorId
        ? priorId.startsWith('draft-')
          ? priorId
          : resolveJobSlotId(priorId)
        : `slot-${Date.now()}`;

      const job = await api.createJob({
        scenes: p.renderLines.map((l, order) => ({
          text: '',
          image_index: order,
          duration_ms: Math.round(Math.max(1, p.sceneDurationsSec[order] ?? p.imageDurationSec) * 1000),
          transition: l.transition ?? 'slide_left',
          effect: !l.effect || l.effect === 'auto' ? null : l.effect,
        })),
        config: {
          aspect: p.aspect,
          voice: p.voice,
          fps: p.fps,
          rate: p.rate,
          resolution: p.resolution,
          video_quality: p.videoQuality,
          output_format: p.outputFormat,
          tts_provider: p.ttsProvider,
          subtitle_style: p.subtitleStyle,
          bgm_volume: p.bgmVolume,
          narration_script: p.narrationScript,
        },
        files: p.renderLines.map((line) => p.images[line.image_index].file),
        bgm: p.bgm,
      });

      bindJobToSlot(job.id, slotId, {
        labelAt:
          priorId && getJobTabLabelIso(priorId) ? undefined : (priorJob?.created_at ?? new Date().toISOString()),
      });
      recordSlotExport(job.id);

      const snap = p.captureEditorSnapshot();
      p.editorCacheRef.current.set(job.id, snap);
      if (priorId && priorId !== job.id) {
        p.editorCacheRef.current.delete(priorId);
      }
      p.setJobs((prev) => {
        if (!priorId) return [job, ...prev];
        const idx = prev.findIndex((j) => j.id === priorId);
        if (idx >= 0) {
          const next = prev.slice();
          next[idx] = job;
          return next;
        }
        return [job, ...prev];
      });
      p.setActiveJobId(job.id);
      p.setNewJobId(job.id);
      p.setDownloadBadgeVersion((v) => v + 1);
      if (forceExportDownloadRef.current) markForceDownloadJob(job.id);
      p.setPreviewMode('static');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Export failed.';
      alert(`Export failed: ${message}`);
      p.setDownloadState('error');
      p.setDownloadMessage(message);
    }
  }, [exportEstimateLabel, p]);

  useEffect(() => {
    if (!p.anyExportRunning) return;
    setRenderNowMs(Date.now());
    const id = window.setInterval(() => setRenderNowMs(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [p.anyExportRunning]);

  const currentJobRunning = Boolean(p.currentJob && isRunningJob(p.currentJob));

  const renderElapsedMs = (() => {
    if (!currentJobRunning || !p.currentJob) return 0;
    const startedAt = p.currentJob.started_at
      ? Date.parse(p.currentJob.started_at)
      : renderStartedAtMsRef.current ?? 0;
    if (!startedAt || Number.isNaN(startedAt)) return 0;
    return Math.max(0, renderNowMs - startedAt);
  })();

  const exportRemainingMs =
    currentJobRunning && p.currentJob
      ? estimateExportRemainingMs(p.currentJob, exportEstimateMs, renderElapsedMs, exportTimeModel)
      : null;

  const renderSpeedLabel = (() => {
    const job = p.currentJob;
    if (job?.render_duration_ms && (job.status === 'done' || p.downloadState === 'downloaded' || p.downloadState === 'downloading')) {
      const outMs = job.output_duration_ms ?? renderExpectedMs;
      const rtf = outMs / Math.max(1, job.render_duration_ms);
      const parts = [`${formatDuration(job.render_duration_ms / 1000)} render`, `${rtf.toFixed(2)}× RTF`];
      const pt = job.phase_timing_ms;
      if (pt?.tts_ms) parts.push(`TTS ${formatDuration(pt.tts_ms / 1000)}`);
      if (pt?.compose_ms) parts.push(`Compose ${formatDuration(pt.compose_ms / 1000)}`);
      return parts.join(' · ');
    }
    if (currentJobRunning && renderElapsedMs > 0) {
      const etaSec = (exportRemainingMs ?? Math.max(0, exportEstimateMs - renderElapsedMs)) / 1000;
      const phase =
        p.currentJob?.status === 'tts'
          ? 'TTS'
          : p.currentJob?.status === 'audio'
            ? 'Audio'
            : p.currentJob?.status === 'compose'
              ? 'Compose'
              : 'Starting';
      return `${phase} · ${formatDuration(renderElapsedMs / 1000)} · ETA ~${formatDuration(etaSec)}`;
    }
    return '';
  })();

  const triggerExportAndDownload = useCallback(() => {
    forceExportDownloadRef.current = true;
    void startRender();
  }, [startRender]);

  const displayJobError = formatJobErrorForUi(p.currentJob?.error);

  return {
    downloadHistory,
    savedOutputFilenames,
    exportTimeModel,
    exportEstimateMs,
    exportEstimateLabel,
    applyDownloadComplete,
    downloadJobOutput,
    resolveJobOutputFilename,
    openJobOutput,
    openLatestJobOutput,
    startRender,
    triggerExportAndDownload,
    renderSpeedLabel,
    currentJobRunning,
    displayJobError,
  };
}
