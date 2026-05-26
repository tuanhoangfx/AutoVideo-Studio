import Link from 'next/link';
import { Database, LayoutDashboard, Palette, Settings2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { DeploymentCheck } from '@/components/system/DeploymentCheck';

type SystemTab = 'overview' | 'template';

export default function SystemPage({
  searchParams,
}: {
  searchParams?: { stab?: string };
}) {
  const tab: SystemTab = searchParams?.stab === 'template' ? 'template' : 'overview';

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-[var(--panel)] px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-violet-200">
              <Settings2 size={17} /> System
            </div>
            <div className="mt-1 text-xs text-[var(--muted)]">Build v0.3 · Workspace shell cloned from P0020</div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <SystemTabLink href="/system" active={tab === 'overview'} icon={<LayoutDashboard size={15} />}>
          Overview
        </SystemTabLink>
        <SystemTabLink href="/system?stab=template" active={tab === 'template'} icon={<Palette size={15} />}>
          Design Template
        </SystemTabLink>
      </div>

      {tab === 'template' ? <DesignTemplateEmpty /> : <SystemOverview />}
    </div>
  );
}

function SystemTabLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'border-indigo-300/35 bg-indigo-500/20 text-indigo-100'
          : 'border-white/10 bg-white/[.03] text-white/55 hover:bg-white/[.06] hover:text-white'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

function SystemOverview() {
  return (
    <div className="space-y-4">
      <DeploymentCheck />
      <section className="rounded-2xl border border-white/10 bg-[var(--panel)] p-6">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500/20 text-indigo-100">
            <Database size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">Overview</h2>
            <p className="mt-2 max-w-3xl text-base leading-7 text-[var(--muted)]">
              System currently tracks production layout, design templates, deployment health, and output storage readiness.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function DesignTemplateEmpty() {
  return (
    <section className="flex min-h-[42vh] items-center justify-center rounded-2xl border border-white/10 bg-[var(--panel)] p-6 text-center">
      <div>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-100">
          <Palette size={24} />
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-white">No active designs</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
          The workspace shell has been promoted to production. New design templates will appear here when a design review is requested.
        </p>
      </div>
    </section>
  );
}
