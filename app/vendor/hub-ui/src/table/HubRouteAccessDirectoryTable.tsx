import type { ReactNode } from "react";
import { HubDataTable } from "../content/HubDataTable";
import { HubTableColumnHeader } from "../content/HubTableColumnHeader";
import { HubTablePager } from "../content/HubTablePager";
import { useHubTablePageSize } from "./hub-table-page-size";
import {
  hubPageAllSelectedByPredicate,
  hubTogglePageSelectAllByPredicate,
  useHubTablePagination,
} from "./hub-table-pagination";
import {
  buildHubRouteAccessModalColumns,
  HUB_ROUTE_ACCESS_COL,
  HUB_ROUTE_ACCESS_MODAL_TABLE_WRAP_CLASS,
  hubRouteAccessModalTableClass,
  type HubRouteAccessColumnLayout,
  type HubRouteAccessModalColumnOptions,
} from "./hub-route-access-table-meta";

export type HubRouteAccessDirectoryTableProps<TRow> = {
  items: readonly TRow[];
  resetKey?: string | number | boolean | null;
  getRowKey: (row: TRow) => string;
  getUserDisplay: (row: TRow) => { label: string; title?: string };
  renderRoleCell: (row: TRow) => ReactNode;
  /** Expanded layout — Synced timestamp column. */
  renderSyncAtCell?: (row: TRow) => ReactNode;
  /** Expanded layout — Loaded timestamp column. */
  renderLoadAtCell?: (row: TRow) => ReactNode;
  /** Expanded layout — Load permission column. */
  renderLoadPermCell?: (row: TRow) => ReactNode;
  /** Expanded layout — Sync permission column. */
  renderSyncPermCell?: (row: TRow) => ReactNode;
  /** Compact layout — merged activity column. */
  renderActivityCell?: (row: TRow) => ReactNode;
  /** Compact layout — merged rights column. */
  renderRightsCell?: (row: TRow) => ReactNode;
  renderRouteCell?: (row: TRow) => ReactNode;
  renderExpiresCell: (row: TRow) => ReactNode;
  showSelectColumn?: boolean;
  isSelected?: (row: TRow) => boolean;
  onToggleSelect?: (row: TRow) => void;
  onToggleSelectAll?: () => void;
  allVisibleSelected?: boolean;
  canSelectRow?: (row: TRow) => boolean;
  selectAllLabel?: string;
  rowClassName?: (row: TRow) => string;
  ariaLabel?: string;
  pageSize?: number;
  columnLayout?: HubRouteAccessColumnLayout;
  showRouteColumn?: boolean;
};

/** Golden route-access modal table — P0004 User Access · P0020 Cookie Route. */
export function HubRouteAccessDirectoryTable<TRow>({
  items,
  resetKey,
  getRowKey,
  getUserDisplay,
  renderRoleCell,
  renderSyncAtCell,
  renderLoadAtCell,
  renderLoadPermCell,
  renderSyncPermCell,
  renderActivityCell,
  renderRightsCell,
  renderRouteCell,
  renderExpiresCell,
  showSelectColumn = true,
  isSelected,
  onToggleSelect,
  onToggleSelectAll: _onToggleSelectAll,
  allVisibleSelected: _allVisibleSelected = false,
  canSelectRow,
  selectAllLabel = "Select all on this page",
  rowClassName,
  ariaLabel = "Route access table pages",
  pageSize,
  columnLayout = "expanded",
  showRouteColumn,
}: HubRouteAccessDirectoryTableProps<TRow>) {
  const columnOptions: HubRouteAccessModalColumnOptions = {
    layout: columnLayout,
    showRouteColumn,
  };
  const resolvedPageSize = useHubTablePageSize(pageSize);
  const pagination = useHubTablePagination(items, { resetKey, pageSize: resolvedPageSize });
  const pageItems = pagination.pageItems;
  const isRowSelected = (row: TRow) => isSelected?.(row) ?? false;
  const allPageSelected = hubPageAllSelectedByPredicate(pageItems, isRowSelected, canSelectRow);
  const showRoute =
    showRouteColumn ?? (columnLayout === "expanded" ? true : false);

  const columns = buildHubRouteAccessModalColumns(showSelectColumn, columnOptions).map((col) => {
    if (col.key === "select") {
      return {
        ...col,
        header: onToggleSelect ? (
          <label className="hub-users-select-all">
            <input
              type="checkbox"
              className="hub-checkbox"
              checked={pageItems.length > 0 && allPageSelected}
              onChange={() =>
                hubTogglePageSelectAllByPredicate(pageItems, isRowSelected, onToggleSelect, canSelectRow)
              }
              aria-label={selectAllLabel}
            />
          </label>
        ) : (
          <span aria-hidden />
        ),
      };
    }

    if (columnLayout === "expanded" && col.role) {
      const title =
        col.key === "syncAt"
          ? "Last Sync to cloud vault"
          : col.key === "loadAt"
            ? "Last Load on extension"
            : col.key === "permLoad"
              ? "Load cookies from vault"
              : col.key === "permSync"
                ? "Upload cookies to vault"
                : undefined;
      return {
        ...col,
        header: (
          <span
            className={`hub-users-th-btn hub-users-th-btn--static${
              col.key === "user" ? " hub-users-th-btn--align-start" : ""
            }`}
            title={title}
          >
            <span
              className={`hub-users-th-label${col.key === "user" ? " hub-users-th-label--start" : ""}`}
            >
              <HubTableColumnHeader label={col.label} role={col.role} />
            </span>
          </span>
        ),
      };
    }

    return col;
  });

  return (
    <>
      <HubDataTable
        columns={columns}
        tableClassName={hubRouteAccessModalTableClass(columnOptions)}
        wrapClassName={HUB_ROUTE_ACCESS_MODAL_TABLE_WRAP_CLASS}
      >
        {pageItems.map((row) => {
          const key = getRowKey(row);
          const user = getUserDisplay(row);
          const selected = isRowSelected(row);
          const selectable = canSelectRow?.(row) !== false;
          return (
            <tr
              key={key}
              className={`hub-users-row hub-users-row--static${selected ? " is-selected" : ""}${
                rowClassName?.(row) ?? ""
              }`}
            >
              {showSelectColumn ? (
                <td className={HUB_ROUTE_ACCESS_COL.select} onClick={(e) => e.stopPropagation()}>
                  {selectable ? (
                    <label className="hub-users-select-row">
                      <input
                        type="checkbox"
                        className="hub-checkbox"
                        checked={selected}
                        onChange={() => onToggleSelect?.(row)}
                        aria-label={`Select row ${key}`}
                      />
                    </label>
                  ) : null}
                </td>
              ) : null}
              <td
                className={`${HUB_ROUTE_ACCESS_COL.user} mono text-left`}
                title={user.title ?? user.label}
              >
                {user.label}
              </td>
              <td className={HUB_ROUTE_ACCESS_COL.role}>
                <div className="hub-users-role-cell">{renderRoleCell(row)}</div>
              </td>
              {columnLayout === "expanded" ? (
                <>
                  <td className={`${HUB_ROUTE_ACCESS_COL.syncAt} hub-users-cell-muted text-center`}>
                    {renderSyncAtCell?.(row)}
                  </td>
                  <td className={`${HUB_ROUTE_ACCESS_COL.loadAt} hub-users-cell-muted text-center`}>
                    {renderLoadAtCell?.(row)}
                  </td>
                  <td className={`${HUB_ROUTE_ACCESS_COL.perm} text-center`}>
                    {renderLoadPermCell?.(row)}
                  </td>
                  <td className={`${HUB_ROUTE_ACCESS_COL.perm} text-center`}>
                    {renderSyncPermCell?.(row)}
                  </td>
                </>
              ) : (
                <>
                  <td className={`${HUB_ROUTE_ACCESS_COL.activity} hub-users-cell-muted text-center`}>
                    {renderActivityCell?.(row)}
                  </td>
                  <td className={`${HUB_ROUTE_ACCESS_COL.rights} text-center`}>{renderRightsCell?.(row)}</td>
                </>
              )}
              {showRoute ? (
                <td className={`${HUB_ROUTE_ACCESS_COL.route} text-center`}>{renderRouteCell?.(row)}</td>
              ) : null}
              <td className={`${HUB_ROUTE_ACCESS_COL.expires} hub-users-cell-muted text-center`}>
                {renderExpiresCell(row)}
              </td>
            </tr>
          );
        })}
      </HubDataTable>
      <HubTablePager
        pageIndex={pagination.pageIndex}
        totalPages={pagination.totalPages}
        rangeStart={pagination.rangeStart}
        rangeEnd={pagination.rangeEnd}
        totalCount={pagination.totalCount}
        onPrev={pagination.goPrev}
        onNext={pagination.goNext}
        pageSize={resolvedPageSize}
        ariaLabel={ariaLabel}
      />
    </>
  );
}
