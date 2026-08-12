'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, Settings } from 'lucide-react';
import { HUB_SIDEBAR_FOOTER_BTN_CLASS } from '@/lib/hub-ui';
import {
  DEFAULT_SYSTEM_STATS_INTERVAL_MS,
  readSystemStatsIntervalMs,
  resetWorkspacePrefs,
  SYSTEM_STATS_INTERVAL_OPTIONS,
  writeSystemStatsIntervalMs,
} from '@/lib/workspace-prefs';

type FooterSettingsProps = {
  scope?: 'global' | 'tab';
};

export function FooterSettings({ scope = 'global' }: FooterSettingsProps) {
  const [open, setOpen] = useState(false);
  const [statsMs, setStatsMs] = useState(DEFAULT_SYSTEM_STATS_INTERVAL_MS);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStatsMs(readSystemStatsIntervalMs());
    const onChange = (event: Event) => {
      const next = (event as CustomEvent<{ ms?: number }>).detail?.ms;
      if (typeof next === 'number' && Number.isFinite(next)) setStatsMs(next);
      else setStatsMs(readSystemStatsIntervalMs());
    };
    window.addEventListener('autovideo-system-stats-interval', onChange);
    return () => window.removeEventListener('autovideo-system-stats-interval', onChange);
  }, []);

  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPanelStyle({
        position: 'fixed',
        left: rect.right + 8,
        bottom: Math.max(8, window.innerHeight - rect.bottom),
        zIndex: 1100,
        maxHeight: 'min(70vh, 28rem)',
        width: '18rem',
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const panel = open ? (
    <div
      ref={panelRef}
      style={panelStyle}
      className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#12141c] shadow-2xl"
    >
      <div className="overflow-y-auto p-3">
        <Section label="Header">
          <p className="mb-2 text-[10px] leading-snug text-[var(--muted)]">
            CPU/RAM refresh interval in the Studio header (Desktop app).
          </p>
          <div className="space-y-0.5">
            {SYSTEM_STATS_INTERVAL_OPTIONS.map((ms) => (
              <IntervalRow
                key={ms}
                label={ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
                active={statsMs === ms}
                onSelect={() => {
                  writeSystemStatsIntervalMs(ms);
                  setStatsMs(ms);
                }}
              />
            ))}
          </div>
        </Section>

        <button
          type="button"
          onClick={() => {
            resetWorkspacePrefs();
            setStatsMs(DEFAULT_SYSTEM_STATS_INTERVAL_MS);
          }}
          className="mt-3 w-full rounded-md border border-white/10 px-2 py-1.5 text-[10px] text-[var(--muted)] hover:bg-white/[.05] hover:text-[var(--text)]"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div ref={ref} className="relative w-full">
      <button type="button" onClick={() => setOpen((o) => !o)} className={HUB_SIDEBAR_FOOTER_BTN_CLASS} title="Workspace settings">
        <span className="hidden" data-scope={scope} aria-hidden />
        <Settings size={15} className="shrink-0 text-amber-300" />
        <span className="flex-1 text-left">Setting</span>
      </button>
      {panel ? createPortal(panel, document.body) : null}
    </div>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/35">{label}</div>
      {children}
    </div>
  );
}

function IntervalRow({ label, active, onSelect }: { label: string; active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] text-white/75 hover:bg-white/[.05]"
    >
      <span
        className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
          active ? 'border-indigo-400/60 bg-indigo-500/40' : 'border-white/15 bg-white/[.03]'
        }`}
      >
        {active ? <Check size={10} className="text-indigo-100" /> : null}
      </span>
      <span>System stats refresh · {label}</span>
    </button>
  );
}
