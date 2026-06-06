import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { ChevronDown, Clock } from "lucide-react";
import { usePageSessionSeconds } from "../hooks/usePageSessionSeconds";
import { compactIconSize } from "../ui-scale";
import "./app-tab-header.css";

export type TabTitleMenuItem = {
  id: string;
  label: string;
  icon?: ElementType<{ size?: number; className?: string }>;
};

export type TabHeaderMetaItem = {
  icon: ElementType<{ size?: number; className?: string }>;
  /** Omit or empty to hide label (e.g. release line: icon · version · date). */
  title?: string;
  value: string;
  live?: boolean;
};

export type TabHeaderStatItem = {
  key: string;
  icon: ElementType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  toneClass: string;
};

type AppTabHeaderProps = {
  ariaLabel: string;
  titleIcon: ElementType<{ size?: number; className?: string }>;
  titleIconClass?: string;
  title: string;
  /** Sub-pages under the title (e.g. System → Overview / Schema). */
  titleMenu?: TabTitleMenuItem[];
  activeTitleMenuId?: string;
  onTitleMenuSelect?: (id: string) => void;
  metaItems: TabHeaderMetaItem[];
  centerStats: TabHeaderStatItem[];
  pinSticky?: boolean;
  /** Bottom rule; off when Hub search bar is pinned (rule moves below search). */
  dividerBelow?: boolean;
  /** Inside shared sticky chrome (header + search); no own sticky/margins. */
  embedded?: boolean;
  actions?: ReactNode;
};

function TitleWithMenu({
  title,
  titleIcon: TitleIcon,
  titleIconClass,
  titleMenu,
  activeTitleMenuId,
  onTitleMenuSelect,
}: {
  title: string;
  titleIcon: ElementType<{ size?: number; className?: string }>;
  titleIconClass: string;
  titleMenu: TabTitleMenuItem[];
  activeTitleMenuId?: string;
  onTitleMenuSelect?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = titleMenu.find((m) => m.id === activeTitleMenuId);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex max-w-full items-center gap-1 rounded-lg py-0.5 pr-1 text-left transition-colors hover:bg-white/[.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400/50"
      >
        <TitleIcon size={compactIconSize(16)} className={`shrink-0 ${titleIconClass}`} aria-hidden />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-base font-semibold tracking-tight text-[var(--text)]">{title}</span>
          {active ? (
            <span className="truncate text-[10px] font-medium text-indigo-300/90">{active.label}</span>
          ) : null}
        </span>
        <ChevronDown
          size={compactIconSize(14)}
          className={`shrink-0 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-white/10 bg-[var(--panel)] py-1 shadow-xl shadow-black/40"
        >
          {titleMenu.map(({ id, label, icon: Icon }) => {
            const isActive = id === activeTitleMenuId;
            return (
              <button
                key={id}
                type="button"
                role="menuitem"
                onClick={() => {
                  onTitleMenuSelect?.(id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  isActive
                    ? "bg-indigo-500/15 text-indigo-100"
                    : "text-[var(--muted)] hover:bg-white/[.05] hover:text-[var(--text)]"
                }`}
              >
                {Icon ? <Icon size={compactIconSize(14)} className={isActive ? "text-indigo-300" : ""} /> : null}
                {label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function Rule({ visibleFrom = "sm" }: { visibleFrom?: "sm" | "md" | "lg" }) {
  const vis =
    visibleFrom === "lg" ? "hidden lg:block" : visibleFrom === "md" ? "hidden md:block" : "hidden sm:block";
  return <span className={`h-3.5 w-px shrink-0 self-center bg-white/10 ${vis}`} aria-hidden />;
}

function MetaLine({ icon: Icon, title, value, live }: TabHeaderMetaItem) {
  const tip = title ? `${title}: ${value}` : value;
  return (
    <div
      className="inline-flex max-w-full min-w-0 items-center gap-1.5 text-[0.8125rem] leading-none text-[var(--muted)]"
      title={tip}
    >
      <Icon size={compactIconSize(14)} className="shrink-0 text-indigo-400/90" />
      {title ? <span className="shrink-0">{title}</span> : null}
      {live !== undefined ? (
        <span
          className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${live ? "bg-emerald-400" : "bg-amber-400"}`}
          aria-hidden
        />
      ) : null}
      <span className="truncate tabular-nums text-[var(--text)]/90">{value}</span>
    </div>
  );
}

function SessionLine({ value }: { value: string }) {
  return (
    <span className="hidden shrink-0 items-center gap-1.5 text-[0.8125rem] leading-none text-[var(--muted)] sm:flex">
      <Clock size={compactIconSize(14)} className="shrink-0 text-indigo-400/90" />
      <span>Session</span>
      <span className="tabular-nums text-[var(--text)]/90">{value}</span>
    </span>
  );
}

function StatLine({
  icon: Icon,
  value,
  label,
  toneClass,
}: {
  icon: ElementType<{ size?: number; className?: string }>;
  value: number;
  label: string;
  toneClass: string;
}) {
  return (
    <div
      className="inline-flex items-center gap-1.5 text-[0.8125rem] leading-none text-[var(--muted)]"
      title={label}
    >
      <Icon size={compactIconSize(14)} className={`shrink-0 ${toneClass}`} />
      <span className="font-semibold tabular-nums text-[var(--text)]/90">{value}</span>
      <span>{label}</span>
    </div>
  );
}

export function AppTabHeader({
  ariaLabel,
  titleIcon: TitleIcon,
  titleIconClass = "text-indigo-400",
  title,
  titleMenu,
  activeTitleMenuId,
  onTitleMenuSelect,
  metaItems,
  centerStats,
  pinSticky = true,
  dividerBelow = true,
  embedded = false,
  actions,
}: AppTabHeaderProps) {
  const sessionMmSs = usePageSessionSeconds();
  const positionClass = embedded ? "relative z-50" : pinSticky ? "sticky top-0 z-40" : "relative z-0";
  const dividerClass = embedded || !dividerBelow ? "" : "border-b border-white/5";
  const gapBelow = embedded || !dividerBelow ? "" : "mb-[var(--app-tab-header-gap-below)]";
  const chromeClass = embedded ? "" : "-mx-6";
  const metaVisibility = (index: number) => (index === 0 ? "hidden sm:inline-flex" : index === 1 ? "hidden md:inline-flex" : "hidden lg:inline-flex");

  return (
    <header
      className={`app-tab-header ${positionClass} ${chromeClass} ${gapBelow} box-border grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 bg-[var(--bg)] ${dividerClass}`}
      aria-label={ariaLabel}
    >
      <div className="flex min-w-0 flex-wrap items-center justify-self-start gap-x-2.5 gap-y-0">
        {titleMenu?.length ? (
          <TitleWithMenu
            title={title}
            titleIcon={TitleIcon}
            titleIconClass={titleIconClass}
            titleMenu={titleMenu}
            activeTitleMenuId={activeTitleMenuId}
            onTitleMenuSelect={onTitleMenuSelect}
          />
        ) : (
          <>
            <TitleIcon size={compactIconSize(16)} className={`shrink-0 ${titleIconClass}`} aria-hidden />
            <h1 className="shrink-0 text-base font-semibold leading-none tracking-tight text-[var(--text)]">{title}</h1>
          </>
        )}
        <span className="hidden items-center gap-x-2.5 sm:inline-flex">
          <Rule />
          <SessionLine value={sessionMmSs} />
        </span>
        {metaItems.map((item, index) => (
          <span key={`${item.title}-${index}`} className={`${metaVisibility(index)} items-center gap-x-2.5`}>
            <Rule visibleFrom={index === 0 ? "sm" : index === 1 ? "md" : "lg"} />
            <MetaLine {...item} />
          </span>
        ))}
      </div>

      <div
        className="hidden min-w-0 items-center justify-center justify-self-center gap-x-2.5 overflow-x-auto xl:flex"
        role="status"
        aria-label={`${title} summary`}
      >
        {centerStats.map((stat, index) => (
          <span key={stat.key} className="inline-flex items-center gap-x-2.5">
            {index > 0 ? <Rule /> : null}
            <StatLine icon={stat.icon} value={stat.value} label={stat.label} toneClass={stat.toneClass} />
          </span>
        ))}
      </div>

      <div className="flex min-w-0 items-center justify-self-end gap-1.5" aria-label={`${title} actions`}>
        {actions}
      </div>
    </header>
  );
}
