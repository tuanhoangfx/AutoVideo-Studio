'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { Activity, Boxes, Code2, GitBranch, RefreshCcw, Rocket, Settings2, User, Video, type LucideIcon } from 'lucide-react';
import { AppTabHeader, type TabHeaderMetaItem, type TabHeaderStatItem } from './AppTabHeader';

type WorkspaceNavItem = {
  href: string;
  match: string;
  label: string;
  icon: typeof Video;
};

const APP_VERSION = '0.3';
const APP_USER_LABEL = 'czpgopro';

const navItems: WorkspaceNavItem[] = [
  { href: '/studio', match: '/studio', label: 'AutoVideo Studio', icon: Video },
  { href: '/system', match: '/system', label: 'System', icon: Settings2 },
];

const footerBtn =
  'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors text-[var(--muted)] hover:bg-white/5 hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-60';

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const header = resolveHeader(pathname);

  return (
    <div className="relative z-10 flex h-screen min-h-0 w-full overflow-hidden">
      <aside className="flex h-full min-h-0 w-60 shrink-0 flex-col overflow-visible border-r border-white/5 bg-[var(--panel)] p-4">
        <div className="mb-4 flex shrink-0 items-center gap-3">
          <div className="brand-icon-wrap grid h-10 w-10 place-items-center rounded-xl text-white">
            <Video size={20} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-tight">Workspace Hub</div>
            <div className="text-[10px] text-[var(--muted)]">P0021 · v{APP_VERSION}</div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, match, label, icon: Icon }) => {
            const active = pathname === match || pathname.startsWith(`${match}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all ${
                  active
                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/5 text-indigo-100'
                    : 'text-[var(--muted)] hover:bg-white/5 hover:text-[var(--text)]'
                }`}
              >
                {active ? (
                  <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-indigo-400" />
                ) : null}
                <Icon size={16} className={active ? 'text-indigo-300' : ''} />
                <span className="flex-1 text-left">{label}</span>
              </Link>
            );
          })}
        </nav>

        <footer className="mt-2 shrink-0 space-y-0.5 overflow-visible border-t border-white/5 pt-2.5">
          <SidebarFooterButton
            icon={User}
            iconClass="text-violet-400"
            label="User"
            title="Current workspace user"
            disabled
            trailing={<span className="text-xs font-medium text-[var(--text)]/80">{APP_USER_LABEL}</span>}
          />
          <SidebarFooterButton
            icon={RefreshCcw}
            iconClass="text-indigo-300"
            label="Refresh"
            title="Refresh workspace"
            onClick={() => window.location.reload()}
          />
        </footer>
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-6 pb-5">
        <AppTabHeader {...header} />
        <div className="py-3">
          {children}
        </div>
      </main>
    </div>
  );
}

function resolveHeader(pathname: string): {
  ariaLabel: string;
  titleIcon: LucideIcon;
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
        { icon: GitBranch, value: `v${APP_VERSION}` },
        { icon: Rocket, value: 'Design ready' },
      ],
      centerStats: [
        { key: 'tabs', icon: Boxes, label: 'Tabs', value: 2, toneClass: 'text-indigo-300' },
        { key: 'systems', icon: Activity, label: 'Ready', value: 1, toneClass: 'text-emerald-300' },
      ],
    };
  }

  return {
    ariaLabel: 'AutoVideo Studio tab header',
    titleIcon: Video,
    titleIconClass: 'text-indigo-300',
    title: 'AutoVideo Studio',
    metaItems: [
      { icon: Code2, title: 'Workspace', value: 'P0021', live: true },
      { icon: GitBranch, value: `v${APP_VERSION}` },
      { icon: Rocket, value: 'No release' },
    ],
    centerStats: [
      { key: 'voices', icon: Activity, label: 'Voices', value: 55, toneClass: 'text-emerald-300' },
      { key: 'providers', icon: Boxes, label: 'Providers', value: 3, toneClass: 'text-amber-300' },
    ],
  };
}

function SidebarFooterButton({
  icon: Icon,
  label,
  iconClass,
  onClick,
  disabled,
  title,
  trailing,
}: {
  icon: typeof RefreshCcw;
  label: string;
  iconClass: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  trailing?: ReactNode;
}) {
  return (
    <button type="button" className={footerBtn} onClick={onClick} disabled={disabled} title={title}>
      <Icon size={15} className={`shrink-0 ${iconClass}`} />
      <span className="flex-1 text-left">{label}</span>
      {trailing}
    </button>
  );
}
