import type { ReactNode } from 'react';

/**
 * R4 Studio Hero — outer shell with warm gradient mesh background.
 * Holds top bar (title + status + export CTA) and child grid.
 */
export function StudioShell({
  title,
  statusLabel,
  children,
}: {
  title: string;
  statusLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10">
      {/* Warm gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0d1f] via-[#1c1419] to-[#0f0a13]" />
      <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />

      <div className="relative p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Studio</div>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-white">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            {statusLabel && (
              <div className="flex h-9 items-center gap-3 rounded-full border border-white/15 bg-white/[.06] px-4 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-pink-400 animate-pulse" />
                <span className="text-[11px] text-white/80">{statusLabel}</span>
              </div>
            )}
            <button className="h-9 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-6 text-[12px] font-semibold text-white shadow-lg shadow-pink-500/30 transition hover:from-pink-400 hover:to-orange-400">
              Export ↗
            </button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
