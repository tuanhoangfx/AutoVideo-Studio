import { useMemo, useState, type ReactNode } from "react";
import { FileText, ScrollText } from "lucide-react";
import { compactIconSize } from "../ui-scale";
import { HubHeaderPanelButton } from "./HubHeaderPanelButton";
import { HubToolDetailModal, HUB_TOOL_DETAIL_SCROLL_ROOT } from "./HubToolDetailModal";
import { HubToolDetailSection, HUB_TOOL_DETAIL_SECTIONS_CLASS } from "./HubToolDetailSection";
import { HubTocSectionNav, type HubTocNavItem } from "./HubTocSectionNav";

export type HubLogEntry = {
  id: string;
  at: number;
  scope: string;
  message: string;
};

export type HubUsageLogPanelProps = {
  logs: HubLogEntry[];
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  compact?: boolean;
  sidebarRow?: boolean;
  /** Optional count badge on trigger (defaults to logs.length). */
  badge?: number;
};

function scopeSectionId(scope: string) {
  const slug = scope.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "general";
  return `log-scope-${slug}`;
}

function LogRows({ logs, formatter }: { logs: HubLogEntry[]; formatter: Intl.DateTimeFormat }) {
  return (
    <div className="space-y-1">
      {logs.map((log) => (
        <div key={log.id} className="rounded-lg border border-white/5 bg-white/[.02] px-2.5 py-2">
          <div className="flex items-center justify-between gap-2 text-[10px] text-[var(--muted)]">
            <span>{log.scope}</span>
            <span className="tabular-nums">{formatter.format(log.at)}</span>
          </div>
          <div className="mt-0.5 text-xs leading-snug text-[var(--text)]/90">{log.message}</div>
        </div>
      ))}
    </div>
  );
}

/** Usage log — same HubToolDetailModal shell as Settings (TOC · sections · fixed size). */
export function HubUsageLogPanel({
  logs,
  title = "Usage log",
  subtitle = "Runtime actions in this session",
  emptyMessage = "No actions logged in this session yet.",
  compact = false,
  sidebarRow = false,
  badge,
}: HubUsageLogPanelProps) {
  const [open, setOpen] = useState(false);
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    [],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, HubLogEntry[]>();
    for (const log of logs) {
      const key = log.scope.trim() || "General";
      const list = map.get(key) ?? [];
      list.push(log);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [logs]);

  const { tocItems, sectionIds, body } = useMemo(() => {
    const toc: HubTocNavItem[] = [];
    const ids: string[] = [];
    const sections: ReactNode[] = [];

    if (grouped.length === 0) {
      const id = "log-empty";
      toc.push({ id, label: "Session", icon: <ScrollText size={compactIconSize(11)} className="text-cyan-300" /> });
      ids.push(id);
      sections.push(
        <HubToolDetailSection key={id} id={id} title="Session">
          <div className="rounded-lg border border-dashed border-white/10 px-3 py-5 text-center text-xs text-[var(--muted)]">
            {emptyMessage}
          </div>
        </HubToolDetailSection>,
      );
      return { tocItems: toc, sectionIds: ids, body: sections };
    }

    for (const [scope, rows] of grouped) {
      const id = scopeSectionId(scope);
      toc.push({
        id,
        label: scope,
        icon: <ScrollText size={compactIconSize(11)} className="text-cyan-300" />,
      });
      ids.push(id);
      sections.push(
        <HubToolDetailSection key={id} id={id} title={`${scope} (${rows.length})`}>
          <LogRows logs={rows} formatter={formatter} />
        </HubToolDetailSection>,
      );
    }

    return { tocItems: toc, sectionIds: ids, body: sections };
  }, [emptyMessage, formatter, grouped]);

  const showToc = tocItems.length > 1;
  const badgeCount = badge ?? logs.length;

  return (
    <>
      <HubHeaderPanelButton
        icon={FileText}
        iconClassName="text-cyan-300"
        label="Log"
        title={title}
        badge={badgeCount}
        compact={compact}
        sidebarRow={sidebarRow}
        onClick={() => setOpen(true)}
      />

      <HubToolDetailModal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        titleId="hub-usage-log-title"
        headerIcon={FileText}
        headerIconClassName="text-cyan-300"
        headerTrailing={
          <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-cyan-200">
            {logs.length}
          </span>
        }
        shellClassName="hub-header-panel-modal"
        sectionIds={showToc ? sectionIds : undefined}
        toc={
          showToc ? (
            <div className="hub-toc-nav">
              <HubTocSectionNav items={tocItems} scrollRootSelector={HUB_TOOL_DETAIL_SCROLL_ROOT} />
            </div>
          ) : undefined
        }
      >
        <div className={HUB_TOOL_DETAIL_SECTIONS_CLASS}>{body}</div>
      </HubToolDetailModal>
    </>
  );
}
