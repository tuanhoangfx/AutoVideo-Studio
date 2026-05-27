'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Cloud, Database, FolderOpen, RefreshCw, RotateCcw, Server, Terminal } from 'lucide-react';
import * as api from '@/lib/api';
import { detectRuntimeProfile } from '@/lib/runtime-mode';

type WorkerInfo = Awaited<ReturnType<typeof api.getRoot>>;
type DesktopRuntimeProfile = Awaited<ReturnType<NonNullable<Window['autovideo']>['getRuntimeProfile']>>;

export function DeploymentCheck() {
  const [info, setInfo] = useState<WorkerInfo | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [productionLocalWorker, setProductionLocalWorker] = useState(false);
  const [productionMissingWorker, setProductionMissingWorker] = useState(false);
  const [workerUrl, setWorkerUrl] = useState(() => api.getWorkerUrl());
  const [desktopProfile, setDesktopProfile] = useState<DesktopRuntimeProfile | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const nextWorkerUrl = await api.initializeDesktopWorkerUrl();
      setWorkerUrl(nextWorkerUrl);
      if (window.autovideo) {
        setDesktopProfile(await window.autovideo.getRuntimeProfile());
      }
      setInfo(await api.getRoot());
    } catch (nextError) {
      setInfo(null);
      setError(nextError instanceof Error ? nextError.message : 'Worker check failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const host = window.location.hostname;
    const productionHost = host !== 'localhost' && host !== '127.0.0.1';
    setProductionLocalWorker(productionHost && isLocalWorkerUrl(workerUrl));
    setProductionMissingWorker(productionHost && !workerUrl);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const workerOk = Boolean(info && !error);
  const storage = info?.storage;
  const storageOk = Boolean(storage?.ready);
  const runtime = detectRuntimeProfile(workerUrl);
  const restartDesktopWorker = async () => {
    if (!window.autovideo) return;
    setLoading(true);
    setError('');
    try {
      await window.autovideo.restartWorker();
      const nextWorkerUrl = await api.initializeDesktopWorkerUrl();
      setWorkerUrl(nextWorkerUrl);
      setDesktopProfile(await window.autovideo.getRuntimeProfile());
      setInfo(await api.getRoot());
    } catch (nextError) {
      setInfo(null);
      setError(nextError instanceof Error ? nextError.message : 'Worker restart failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-[var(--panel)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-100">
            <Server size={16} /> Deployment Check
          </div>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Verifies the Vercel frontend, worker API, and output storage path used by production exports.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 text-xs font-semibold text-white/60 hover:bg-white/[.06] hover:text-white"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-4">
        <CheckCard
          icon={<Cloud size={16} />}
          title="Frontend"
          value="Vercel / Browser"
          ok
          detail="UI stores drafts locally and sends render jobs to the worker."
        />
        <CheckCard
          icon={<Server size={16} />}
          title="Worker API"
          value={workerUrl || 'Not configured'}
          ok={workerOk}
          detail={workerOk ? `${info?.jobs ?? 0} jobs · ${info?.concurrent_limit ?? 0} concurrent renders` : error || 'Offline'}
        />
        <CheckCard
          icon={<Server size={16} />}
          title="Worker Mode"
          value={runtime.label}
          ok={workerOk}
          detail={runtime.detail}
        />
        <CheckCard
          icon={<Database size={16} />}
          title="Output Storage"
          value={storage?.backend ?? 'unknown'}
          ok={storageOk}
          detail={storageOk ? storageDetail(storage) : missingDetail(storage)}
        />
      </div>

      {productionLocalWorker ? (
        <div className="mt-3 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-3 py-2 text-[11px] leading-5 text-rose-100/85">
          Production is pointing to <span className="font-mono">127.0.0.1</span>. Set{' '}
          <span className="font-mono">NEXT_PUBLIC_WORKER_URL</span> in Vercel to your public worker domain,
          then redeploy the frontend.
        </div>
      ) : null}
      {productionMissingWorker ? (
        <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-500/10 px-3 py-2 text-[11px] leading-5 text-amber-100/85">
          Production worker URL is missing. Set <span className="font-mono">NEXT_PUBLIC_WORKER_URL</span>{' '}
          in Vercel to the public FastAPI worker domain before using Export & Download.
        </div>
      ) : null}
      {desktopProfile ? (
        <DesktopHealthPanel
          profile={desktopProfile}
          loading={loading}
          workerOk={workerOk}
          onRestart={restartDesktopWorker}
        />
      ) : null}
    </section>
  );
}

function DesktopHealthPanel({
  profile,
  loading,
  workerOk,
  onRestart,
}: {
  profile: DesktopRuntimeProfile;
  loading: boolean;
  workerOk: boolean;
  onRestart: () => void;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-400/5 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-100">
            <Terminal size={14} />
            Desktop Health
          </div>
          <div className="mt-1 text-[11px] leading-5 text-white/45">
            Native bridge is controlling the local render worker and output folder.
          </div>
        </div>
        <button
          type="button"
          onClick={onRestart}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/15 bg-cyan-300/10 px-3 py-2 text-[11px] font-semibold text-cyan-50 hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <RotateCcw size={12} className={loading ? 'animate-spin' : ''} />
          Restart Worker
        </button>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <MiniStatus label="Worker" value={workerOk ? 'Running' : 'Check'} detail={profile.workerUrl} />
        <MiniStatus label="Port" value={String(profile.workerPort)} detail="Auto-selected if the default port is busy." />
        <MiniStatus
          label="Runtime"
          value={profile.workerExecutable?.endsWith('.exe') ? 'Bundled exe' : 'Python'}
          detail={profile.workerExecutable || 'Worker launcher unavailable.'}
        />
      </div>
      <div className="mt-2">
        <MiniStatus
          label="Output"
          value={profile.outputDirectory ? 'Native folder' : 'Not selected'}
          detail={profile.outputDirectory || 'Choose a folder in Output Settings.'}
        />
      </div>
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        <LogPath icon={<Terminal size={12} />} label="Worker log" value={profile.logs?.workerLog ?? 'n/a'} />
        <LogPath icon={<FolderOpen size={12} />} label="Error log" value={profile.logs?.workerErrorLog ?? 'n/a'} />
      </div>
    </div>
  );
}

function MiniStatus({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-[9px] uppercase tracking-[0.16em] text-white/35">{label}</div>
      <div className="mt-1 truncate text-xs font-semibold text-white">{value}</div>
      <div className="mt-0.5 truncate font-mono text-[10px] text-white/40">{detail}</div>
    </div>
  );
}

function LogPath({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <span className="text-white/35">{icon}</span>
      <span className="shrink-0 text-[10px] font-semibold text-white/50">{label}</span>
      <span className="min-w-0 truncate font-mono text-[10px] text-white/35">{value}</span>
    </div>
  );
}

function CheckCard({
  icon,
  title,
  value,
  ok,
  detail,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/[.04] text-white/70">{icon}</span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
          ok ? 'bg-emerald-400/10 text-emerald-200' : 'bg-amber-400/10 text-amber-200'
        }`}>
          {ok ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
          {ok ? 'Ready' : 'Check'}
        </span>
      </div>
      <div className="mt-3 text-[10px] uppercase tracking-[0.16em] text-white/35">{title}</div>
      <div className="mt-1 truncate font-mono text-xs font-semibold text-white">{value}</div>
      <div className="mt-1 line-clamp-2 text-[11px] leading-5 text-[var(--muted)]">{detail}</div>
    </div>
  );
}

function storageDetail(storage: WorkerInfo['storage']) {
  if (!storage) return 'Worker did not report storage metadata.';
  if (storage.backend === 'supabase') {
    return `${storage.bucket || 'bucket'} / ${storage.prefix || 'root'}`;
  }
  return 'Local worker disk. Configure Supabase Storage for persistent cloud output.';
}

function missingDetail(storage: WorkerInfo['storage']) {
  const missing = storage?.missing ?? [];
  if (missing.length > 0) return `Missing env: ${missing.join(', ')}`;
  return 'Worker offline or storage not configured.';
}

function isLocalWorkerUrl(url: string) {
  return /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/i.test(url);
}

