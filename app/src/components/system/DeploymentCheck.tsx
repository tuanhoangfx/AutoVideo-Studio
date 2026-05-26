'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Cloud, Database, RefreshCw, Server } from 'lucide-react';
import * as api from '@/lib/api';

type WorkerInfo = Awaited<ReturnType<typeof api.getRoot>>;

export function DeploymentCheck() {
  const [info, setInfo] = useState<WorkerInfo | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setInfo(await api.getRoot());
    } catch (nextError) {
      setInfo(null);
      setError(nextError instanceof Error ? nextError.message : 'Worker check failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const workerOk = Boolean(info && !error);
  const storage = info?.storage;
  const storageOk = Boolean(storage?.ready);

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

      <div className="mt-4 grid gap-2 md:grid-cols-3">
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
          value={api.WORKER_URL}
          ok={workerOk}
          detail={workerOk ? `${info?.jobs ?? 0} jobs · ${info?.concurrent_limit ?? 0} concurrent renders` : error || 'Offline'}
        />
        <CheckCard
          icon={<Database size={16} />}
          title="Output Storage"
          value={storage?.backend ?? 'unknown'}
          ok={storageOk}
          detail={storageOk ? storageDetail(storage) : missingDetail(storage)}
        />
      </div>
    </section>
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
