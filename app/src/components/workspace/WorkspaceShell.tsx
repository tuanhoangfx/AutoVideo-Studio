'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Activity, Boxes, Code2, Cpu, Film, GitBranch, HardDrive, RefreshCcw, Settings2 } from 'lucide-react';
import { hubSessionLabels, isWorkspaceAnonymousAllowed } from '@tool-workspace/hub-identity';
import {
  HubAuthBootPanel,
  HubAuthBrandIcon,
  HubWorkspaceUserShell,
  HubSidebarFooterButton,
  type NavIconTone,
} from '@tool-workspace/hub-ui';
import {
  HubAppLogProvider,
  HubLogButton,
  HubSidebarBrandIcon,
  HubSidebarNavScreenButton,
  HubSidebarShell,
} from '@/lib/hub-ui';
import { formatAppVersionWithUpdateDate } from '@/lib/app-release';
import { readSystemStatsIntervalMs } from '@/lib/workspace-prefs';
import { P0021AuthGate } from '@/features/auth/P0021AuthGate';
import { useHubAuth } from '@/features/auth/AuthSessionProvider';
import { getIdentitySupabase } from '@/lib/supabase-identity';
import { AppTabHeader, type TabHeaderMetaItem, type TabHeaderStatItem } from './AppTabHeader';
import type { HubGlyphComponent } from '@/lib/hub-ui';
import { FooterSettings } from './FooterSettings';
import { GlobalJobPoller } from './GlobalJobPoller';

type WorkspaceNavItem = {
  href: string;
  match: string;
  label: string;
  icon: typeof Film;
  iconTone: NavIconTone;
};

const APP_VERSION_LINE = formatAppVersionWithUpdateDate();

const navItems: WorkspaceNavItem[] = [
  { href: '/studio', match: '/studio', label: 'AutoVideo Studio', icon: Film, iconTone: 'indigo' },
  { href: '/system', match: '/system', label: 'System', icon: Settings2, iconTone: 'amber' },
];

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading, authRequired, policyReady, hubConfigured, signOut } = useHubAuth();
  const labels = hubSessionLabels(session);
  const isSystem = pathname.startsWith('/system');
  const isStudio = pathname.startsWith('/studio');
  const activeScreen = isSystem ? 'system' : 'studio';

  const [jobCounters, setJobCounters] = useState({ active: 0, done: 0, error: 0 });
  const [ramLabel, setRamLabel] = useState('RAM —');
  const [cpuLabel, setCpuLabel] = useState('CPU —');
  const [statsIntervalMs, setStatsIntervalMs] = useState(2000);

  useEffect(() => {
    const onCounters = (event: Event) => {
      const detail = (event as CustomEvent<{ active: number; done: number; error: number }>).detail;
      if (!detail) return;
      setJobCounters(detail);
    };
    window.addEventListener('studio-job-counters', onCounters);
    return () => window.removeEventListener('studio-job-counters', onCounters);
  }, []);

  useEffect(() => {
    setStatsIntervalMs(readSystemStatsIntervalMs());
    const onChange = (event: Event) => {
      const next = (event as CustomEvent<{ ms?: number }>).detail?.ms;
      if (typeof next === 'number' && Number.isFinite(next)) {
        setStatsIntervalMs(next);
        return;
      }
      setStatsIntervalMs(readSystemStatsIntervalMs());
    };
    window.addEventListener('autovideo-system-stats-interval', onChange);
    return () => window.removeEventListener('autovideo-system-stats-interval', onChange);
  }, []);

  useEffect(() => {
    const cores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency}c` : '—';
    setCpuLabel(`CPU ${cores}`);
    const tick = () => {
      const desktopApi = window.autovideo;
      if (desktopApi?.getSystemStats) {
        desktopApi
          .getSystemStats()
          .then((stats) => {
            const coresLabel = typeof stats.cpu.cores === 'number' ? `${stats.cpu.cores}c` : cores;
            const cpuPct = typeof stats.cpu.percent === 'number' ? `${stats.cpu.percent.toFixed(1)}%` : '—';
            setCpuLabel(`CPU ${coresLabel} · ${cpuPct}`);
            const used = stats.memory.usedBytes / (1024 ** 3);
            const total = stats.memory.totalBytes / (1024 ** 3);
            setRamLabel(`RAM ${used.toFixed(1)}/${total.toFixed(1)}GB`);
          })
          .catch(() => {});
        return;
      }

      const anyPerf = performance as any;
      const mem = anyPerf?.memory;
      if (mem?.usedJSHeapSize && mem?.jsHeapSizeLimit) {
        const used = mem.usedJSHeapSize / (1024 ** 3);
        const limit = mem.jsHeapSizeLimit / (1024 ** 3);
        setRamLabel(`RAM ${used.toFixed(1)}/${limit.toFixed(1)}GB`);
      } else {
        setRamLabel('RAM —');
      }
    };
    tick();
    const id = window.setInterval(tick, statsIntervalMs);
    return () => window.clearInterval(id);
  }, [statsIntervalMs]);

  const header = useMemo(() => {
    if (isSystem) {
      return resolveHeader(pathname);
    }

    const metaItems = [
      { icon: Cpu, title: 'System', value: cpuLabel, live: true },
      { icon: HardDrive, value: ramLabel },
      { icon: GitBranch, value: APP_VERSION_LINE },
    ] as TabHeaderMetaItem[];

    const centerStats: TabHeaderStatItem[] = isStudio
      ? [
          {
            key: 'active',
            label: 'Active',
            value: jobCounters.active,
            toneClass: 'text-sky-300',
            dotClass: 'bg-sky-400 animate-pulse',
          },
          { key: 'done', label: 'Done', value: jobCounters.done, toneClass: 'text-emerald-300', dotClass: 'bg-emerald-400' },
          { key: 'error', label: 'Error', value: jobCounters.error, toneClass: 'text-rose-300', dotClass: 'bg-rose-400' },
        ]
      : resolveHeader(pathname).centerStats;

    return {
      ariaLabel: 'AutoVideo Studio tab header',
      titleIcon: AutoVideoBrandIcon,
      titleIconClass: 'text-indigo-300',
      title: 'AutoVideo Studio',
      metaItems,
      centerStats,
    };
  }, [cpuLabel, isStudio, isSystem, jobCounters.active, jobCounters.done, jobCounters.error, pathname, ramLabel]);

  const loginMandatory = hubConfigured && !isWorkspaceAnonymousAllowed();
  const effectiveAuthRequired = loginMandatory || authRequired;

  const needsAuthGate = hubConfigured && effectiveAuthRequired && policyReady && !loading && !session;
  const authBootBlocking = hubConfigured && effectiveAuthRequired && (loading || !policyReady) && !session;

  let mainBody: ReactNode = children;
  if (needsAuthGate) {
    mainBody = (
      <div className="flex min-h-[50vh] items-center justify-center py-8">
        <P0021AuthGate />
      </div>
    );
  } else if (authBootBlocking) {
    mainBody = (
      <div className="flex min-h-[50vh] items-center justify-center py-8">
        <HubAuthBootPanel
          title="Welcome to AutoVideo Studio"
          toolInfo={{ name: 'AutoVideo Studio', tagline: 'Local video studio & render jobs' }}
          headerLeading={<HubAuthBrandIcon src="/icons/tools/P0021.svg" />}
          status="Checking workspace session…"
        />
      </div>
    );
  }

  const logPersistKey = session?.user?.id ? `P0021:${session.user.id}` : "P0021:anon";

  return (
    <HubAppLogProvider
      persistKey={logPersistKey}
      activeScreen={activeScreen}
      bootLog={{ scope: 'App', message: 'AutoVideo Studio started', screen: activeScreen }}
    >
      <div className="relative z-10 flex h-screen min-h-0 w-full overflow-hidden">
        <GlobalJobPoller />
        <HubSidebarShell
          brandLeading={<HubSidebarBrandIcon src="/icons/tools/P0021.svg" alt="AutoVideo Studio" />}
          brandTitle="Workspace Hub"
          nav={
            <>
              {navItems.map(({ href, match, label, icon, iconTone }) => {
                const active = pathname === match || pathname.startsWith(`${match}/`);
                return (
                  <HubSidebarNavScreenButton
                    key={href}
                    label={label}
                    icon={icon}
                    iconTone={iconTone}
                    active={active}
                    onClick={() => router.push(href)}
                  />
                );
              })}
            </>
          }
          footer={
            <>
              {hubConfigured ? (
                <HubWorkspaceUserShell
                  session={session}
                  labels={labels}
                  getHubClient={() => getIdentitySupabase() as never}
                  profileRoleClient={getIdentitySupabase() as never}
                  profileRoleUserId={session?.user?.id}
                  profileRoleEmail={session?.user?.email}
                  footerTitle="Open workspace user information"
                  emptyEmailLabel="Not signed in"
                  onSignOut={async () => {
                    await signOut();
                    return true;
                  }}
                />
              ) : (
                <HubSidebarFooterButton
                  icon={Settings2}
                  iconClass="text-violet-400"
                  label="User"
                  title="Hub login not configured"
                  disabled
                />
              )}
              <HubSidebarFooterButton
                icon={RefreshCcw}
                iconClass="text-emerald-300"
                label="Refresh"
                title="Refresh workspace"
                onClick={() => window.location.reload()}
              />
              <HubLogButton variant="global" />
              <FooterSettings scope="global" />
            </>
          }
        />

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-6 pb-5">
          <AppTabHeader {...header} />
          <div className="py-3">{mainBody}</div>
        </main>
      </div>
    </HubAppLogProvider>
  );
}

function resolveHeader(pathname: string): {
  ariaLabel: string;
  titleIcon: HubGlyphComponent;
  titleIconClass: string;
  title: string;
  metaItems: TabHeaderMetaItem[];
  centerStats: TabHeaderStatItem[];
} {
  const isSystem = pathname.startsWith('/system');

  if (isSystem) {
    return {
      ariaLabel: 'System tab header',
      titleIcon: Settings2,
      titleIconClass: 'text-violet-300',
      title: 'System',
      metaItems: [
        { icon: Code2, title: 'Workspace', value: 'P0021', live: true },
        { icon: GitBranch, value: APP_VERSION_LINE },
      ] as TabHeaderMetaItem[],
      centerStats: [
        { key: 'tabs', icon: Boxes, label: 'Tabs', value: 2, toneClass: 'text-indigo-300' },
        { key: 'systems', icon: Activity, label: 'Ready', value: 1, toneClass: 'text-emerald-300' },
      ] as TabHeaderStatItem[],
    };
  }

  return {
    ariaLabel: 'AutoVideo Studio tab header',
    titleIcon: AutoVideoBrandIcon,
    titleIconClass: 'text-indigo-300',
    title: 'AutoVideo Studio',
    metaItems: [
      { icon: Code2, title: 'Workspace', value: 'P0021', live: true },
      { icon: GitBranch, value: APP_VERSION_LINE },
    ] as TabHeaderMetaItem[],
    centerStats: [
      { key: 'voices', icon: Activity, label: 'Voices', value: 55, toneClass: 'text-emerald-300' },
      { key: 'providers', icon: Boxes, label: 'Providers', value: 3, toneClass: 'text-amber-300' },
    ] as TabHeaderStatItem[],
  };
}

function AutoVideoBrandIcon({
  size = 16,
  className = '',
  'aria-hidden': ariaHidden,
}: {
  size?: string | number;
  className?: string;
  'aria-hidden'?: boolean;
}) {
  const dimension = typeof size === 'number' ? size : Number.parseInt(String(size), 10) || 16;

  return (
    <Image
      src="/icons/tools/P0021.svg"
      alt=""
      width={dimension}
      height={dimension}
      className={`shrink-0 ${className}`}
      aria-hidden={ariaHidden}
    />
  );
}
