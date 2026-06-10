import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { RefreshCw } from "lucide-react";
import { HubResultCount } from "./HubResultCount";
import { HubTablePageSizeSelect } from "./HubTablePageSizeSelect";
import { ViewToggle, type HubViewMode } from "./ViewToggle";

export type DirectorySearchToolbarProps = {
  viewMode?: HubViewMode;
  onViewModeChange?: (mode: HubViewMode) => void;
  countIcon: LucideIcon;
  shown: number;
  total: number;
  countLabel?: string;
  refreshing: boolean;
  onRefresh: () => void;
  disabled?: boolean;
  showViewToggle?: boolean;
  showTablePageSize?: boolean;
  trailing?: ReactNode;
};

/** Shared FilterBar row-1 toolbar — golden P0004 Users search row. */
export function DirectorySearchToolbar({
  viewMode,
  onViewModeChange,
  countIcon,
  shown,
  total,
  countLabel = "tools",
  refreshing,
  onRefresh,
  disabled = false,
  showViewToggle = true,
  showTablePageSize = false,
  trailing,
}: DirectorySearchToolbarProps) {
  return (
    <>
      {showViewToggle && viewMode != null && onViewModeChange ? (
        <ViewToggle value={viewMode} onChange={onViewModeChange} />
      ) : null}
      {showTablePageSize ? <HubTablePageSizeSelect /> : null}
      <HubResultCount icon={countIcon} shown={shown} total={total} label={countLabel} />
      {trailing}
      <button
        type="button"
        onClick={onRefresh}
        disabled={disabled}
        className="inline-flex h-[var(--hub-control-h)] shrink-0 items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 text-xs font-medium text-emerald-200 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        {refreshing ? "Updating…" : "Refresh"}
      </button>
    </>
  );
}
