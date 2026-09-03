'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Gauge } from 'lucide-react';
import * as api from '@/lib/api';
import type { Job } from '@/lib/api';
import {
  learnExportTimeModel,
  loadExportTimeModel,
  mergeExportTimeModel,
  saveExportTimeModel,
  type ExportTimeModel,
} from '@/lib/export-time-estimate';

function formatSec(totalSec: number) {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : `${r}s`;
}

type BenchmarkRow = {
  job: Job;
  renderSec: number;
  outputSec: number;
  rtf: number;
  perSceneTts: number;
  perSceneCompose: number;
};

function rowFromJob(job: Job): BenchmarkRow | null {
  const renderMs = job.render_duration_ms ?? 0;
  const outputMs = job.output_duration_ms ?? 0;
  const scenes = job.scenes_count || 1;
  const pt = job.phase_timing_ms;
  if (job.status !== 'done' || renderMs <= 0 || !pt) return null;
  return {
    job,
    renderSec: renderMs / 1000,
    outputSec: outputMs / 1000,
    rtf: outputMs / Math.max(1, renderMs),
    perSceneTts: (pt.tts_ms ?? 0) / scenes,
    perSceneCompose: (pt.compose_ms ?? 0) / scenes,
  };
}

export function ExportBenchmarkPanel() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [model, setModel] = useState<ExportTimeModel>(() => loadExportTimeModel());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const list = await api.listJobs();
      setJobs(list);
      const learned = learnExportTimeModel(list);
      const merged = mergeExportTimeModel(loadExportTimeModel(), learned);
      setModel(merged);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const benchmark = useMemo(() => {
    const rows = jobs
      .map(rowFromJob)
      .filter((r): r is BenchmarkRow => r != null)
      .sort((a, b) => Date.parse(b.job.completed_at ?? '') - Date.parse(a.job.completed_at ?? ''));
    return rows[0] ?? null;
  }, [jobs]);

  const calibrate = () => {
    const learned = learnExportTimeModel(jobs);
    if (learned.sampleCount <= 0) {
      setMessage('Run at least one full export in Studio, then calibrate again.');
      return;
    }
    const merged = mergeExportTimeModel(loadExportTimeModel(), learned);
    saveExportTimeModel(merged);
    setModel(merged);
    setMessage(`Calibrated from ${learned.sampleCount} job(s). Estimates will match this PC more closely.`);
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-[var(--panel)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-white">
            <Gauge size={17} className="text-violet-300" />
            Export benchmark (this machine)
          </div>
          <p className="mt-1 max-w-xl text-xs text-[var(--muted)]">
            One completed export calibrates ETA. For speed without quality loss: 1080p, subtitles off, Desktop app
            with NVENC/QSV when available.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={calibrate}
            className="rounded-xl border border-indigo-300/35 bg-indigo-500/20 px-3 py-2 text-xs font-semibold text-indigo-100 hover:bg-indigo-500/30"
          >
            Calibrate estimates
          </button>
        </div>
      </div>

      {message ? <p className="mt-3 text-xs text-emerald-200/90">{message}</p> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Learned model</div>
          <dl className="mt-2 space-y-1 font-mono text-[11px] text-white/75">
            <div className="flex justify-between gap-2">
              <dt>Samples</dt>
              <dd>{model.sampleCount}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>TTS / scene</dt>
              <dd>{formatSec(model.perSceneTtsMs / 1000)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Compose / scene</dt>
              <dd>{formatSec(model.perSceneComposeMs / 1000)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Audio base</dt>
              <dd>{formatSec(model.audioBaseMs / 1000)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Last completed export</div>
          {benchmark ? (
            <dl className="mt-2 space-y-1 font-mono text-[11px] text-white/75">
              <div className="flex justify-between gap-2">
                <dt>Scenes</dt>
                <dd>{benchmark.job.scenes_count}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Render</dt>
                <dd>{formatSec(benchmark.renderSec)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Output</dt>
                <dd>{formatSec(benchmark.outputSec)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>RTF</dt>
                <dd>{benchmark.rtf.toFixed(2)}×</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>TTS / scene</dt>
                <dd>{formatSec(benchmark.perSceneTts / 1000)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Compose / scene</dt>
                <dd>{formatSec(benchmark.perSceneCompose / 1000)}</dd>
              </div>
              {benchmark.job.config.resolution ? (
                <div className="flex justify-between gap-2">
                  <dt>Resolution</dt>
                  <dd>{benchmark.job.config.resolution}</dd>
                </div>
              ) : null}
              {benchmark.job.config.subtitle_style ? (
                <div className="flex justify-between gap-2">
                  <dt>Subtitles</dt>
                  <dd>{benchmark.job.config.subtitle_style}</dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <p className="mt-2 text-xs text-[var(--muted)]">
              No timed export yet. Export one video in Studio (same settings you normally use), then return here.
            </p>
          )}
        </div>
      </div>

      {jobs.filter((j) => j.status === 'done' && j.phase_timing_ms).length > 1 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-[10px] text-white/60">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="py-1.5 pr-2">Job</th>
                <th className="py-1.5 pr-2">Scenes</th>
                <th className="py-1.5 pr-2">Render</th>
                <th className="py-1.5 pr-2">RTF</th>
                <th className="py-1.5">Compose/scene</th>
              </tr>
            </thead>
            <tbody>
              {jobs
                .map(rowFromJob)
                .filter((r): r is BenchmarkRow => r != null)
                .slice(0, 5)
                .map((row) => (
                  <tr key={row.job.id} className="border-b border-white/5 font-mono">
                    <td className="py-1.5 pr-2 truncate max-w-[120px]">{row.job.id.slice(0, 8)}</td>
                    <td className="py-1.5 pr-2">{row.job.scenes_count}</td>
                    <td className="py-1.5 pr-2">{formatSec(row.renderSec)}</td>
                    <td className="py-1.5 pr-2">{row.rtf.toFixed(2)}×</td>
                    <td className="py-1.5">{formatSec(row.perSceneCompose / 1000)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
