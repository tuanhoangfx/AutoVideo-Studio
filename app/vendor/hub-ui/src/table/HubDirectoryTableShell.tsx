import type { ReactNode } from "react";
import { HubPaginatedTableShell } from "../content/HubPaginatedTableShell";
import { hubPageAllSelected, hubTogglePageSelectAll } from "./hub-table-pagination";
import { HubTableColumnHeader, type HubTableColumnHeaderProps } from "../content/HubTableColumnHeader";
import type { HubTableColumnRole } from "./hub-table-column-meta";
import { HubSortIndicator, type HubSortDir } from "./HubSortIndicator";

export type HubDirectoryTableColumn<TKey extends string> = {
  key: TKey;
  label: string;
  role: HubTableColumnRole;
  colClass: string;
  sortable?: boolean;
  headerAlign?: "start" | "center";
};

export type HubDirectoryTableStaticColumn = {
  label: string;
  role: HubTableColumnRole;
  colClass: string;
};

export type HubDirectoryTableShellProps<TItem, TSortKey extends string> = {
  items: TItem[];
  ariaLabel: string;
  tableClassName?: string;
  columns: HubDirectoryTableColumn<TSortKey>[];
  staticColumns?: HubDirectoryTableStaticColumn[];
  sortKey: TSortKey;
  sortDir: HubSortDir;
  onSort: (key: TSortKey) => void;
  getRowKey: (item: TItem) => string;
  onRowClick?: (item: TItem) => void;
  onRowMouseEnter?: (item: TItem) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  allVisibleSelected?: boolean;
  selectAllLabel?: string;
  emptyMessage?: string;
  pageSize?: number;
  /** Reset to page 1 when search/filter/sort changes (share with card grid). */
  resetKey?: string | number | boolean | null;
  wrapClassName?: string;
  /** Inside modal section panel — no outer border/radius on table wrap. */
  flushWrap?: boolean;
  colgroup?: ReactNode;
  getRowClassName?: (item: TItem) => string;
  /** When false, row has no select checkbox (e.g. route owner row). */
  canSelectRow?: (item: TItem) => boolean;
  renderRowCells: (item: TItem) => ReactNode;
  renderStaticCells?: (item: TItem) => ReactNode;
};

/**
 * Golden directory table chrome — select column, sortable headers, pager shell.
 * Golden: P0004 HubToolsDirectoryTable · UserDirectoryTable · DashboardScreensTable.
 */
export function HubDirectoryTableShell<TItem, TSortKey extends string>({
  items,
  ariaLabel,
  tableClassName = "hub-users-table",
  columns,
  staticColumns = [],
  sortKey,
  sortDir,
  onSort,
  getRowKey,
  onRowClick,
  onRowMouseEnter,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allVisibleSelected = false,
  selectAllLabel = "Select all on this page",
  emptyMessage = "No rows match the current filters.",
  pageSize,
  resetKey,
  wrapClassName = "overflow-x-auto",
  flushWrap = false,
  colgroup,
  getRowClassName,
  canSelectRow,
  renderRowCells,
  renderStaticCells,
}: HubDirectoryTableShellProps<TItem, TSortKey>) {
  const showSelect = Boolean(onToggleSelect);

  return (
    <HubPaginatedTableShell items={items} ariaLabel={ariaLabel} pageSize={pageSize} resetKey={resetKey}>
      {(pageItems) => {
        const allPageSelected = hubPageAllSelected(pageItems, getRowKey, selectedIds, canSelectRow);
        return (
        <div
          className={`hub-users-table-wrap ${wrapClassName}${flushWrap ? "" : " rounded-2xl border border-white/5"}`}
        >
          <table className={tableClassName}>
            {colgroup}
            <thead>
              <tr>
                {showSelect ? (
                  <th className="hub-users-col--select" scope="col">
                    <label className="hub-users-select-all">
                      <input
                        type="checkbox"
                        className="hub-checkbox"
                        checked={pageItems.length > 0 && allPageSelected}
                        onChange={() =>
                          hubTogglePageSelectAll(pageItems, getRowKey, selectedIds, onToggleSelect, canSelectRow)
                        }
                        aria-label={selectAllLabel}
                      />
                    </label>
                  </th>
                ) : null}
                {columns.map((col) => (
                  <th key={col.key} className={col.colClass} scope="col">
                    {col.sortable === false ? (
                      <span
                        className={`hub-users-th-btn hub-users-th-btn--static${col.headerAlign === "start" ? " hub-users-th-btn--align-start" : ""}`}
                      >
                        <span
                          className={`hub-users-th-label${col.headerAlign === "start" ? " hub-users-th-label--start" : ""}`}
                        >
                          <HubTableColumnHeader label={col.label} role={col.role} />
                        </span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="hub-users-th-btn"
                        onClick={() => onSort(col.key)}
                        aria-sort={sortKey === col.key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                      >
                        <span className="hub-users-th-label">
                          <HubTableColumnHeader label={col.label} role={col.role} />
                          <HubSortIndicator active={sortKey === col.key} dir={sortDir} />
                        </span>
                      </button>
                    )}
                  </th>
                ))}
                {staticColumns.map((col) => (
                  <th key={col.colClass + col.label} className={col.colClass} scope="col">
                    <span className="hub-users-th-btn hub-users-th-btn--static">
                      <span className="hub-users-th-label">
                        <HubTableColumnHeader label={col.label} role={col.role} />
                      </span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => {
                const rowKey = getRowKey(item);
                const selected = selectedIds?.has(rowKey) ?? false;
                return (
                  <tr
                    key={rowKey}
                    className={`hub-users-row${selected ? " is-selected" : ""}${getRowClassName?.(item) ?? ""}`}
                    onClick={onRowClick ? () => onRowClick(item) : undefined}
                    onMouseEnter={onRowMouseEnter ? () => onRowMouseEnter(item) : undefined}
                  >
                    {showSelect ? (
                      <td className="hub-users-col--select" onClick={(e) => e.stopPropagation()}>
                        {canSelectRow?.(item) !== false ? (
                          <label className="hub-users-select-row">
                            <input
                              type="checkbox"
                              className="hub-checkbox"
                              checked={selected}
                              onChange={() => onToggleSelect?.(rowKey)}
                              aria-label={`Select row ${rowKey}`}
                            />
                          </label>
                        ) : null}
                      </td>
                    ) : null}
                    {renderRowCells(item)}
                    {renderStaticCells?.(item)}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {pageItems.length === 0 ? <div className="hub-users-empty">{emptyMessage}</div> : null}
        </div>
        );
      }}
    </HubPaginatedTableShell>
  );
}

export type { HubTableColumnHeaderProps };
