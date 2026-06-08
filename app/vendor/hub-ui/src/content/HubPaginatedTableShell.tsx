import type { ReactNode } from "react";
import { HubTablePager } from "./HubTablePager";
import { useHubTablePagination } from "../table/hub-table-pagination";
import { useHubTablePageSize } from "../table/hub-table-page-size";

export type HubPaginatedTableShellProps<T> = {
  items: readonly T[];
  resetKey?: string | number | boolean | null;
  pageSize?: number;
  ariaLabel?: string;
  className?: string;
  children: (pageItems: readonly T[]) => ReactNode;
};

/** Pager + slice wrapper for custom hub-users-table markup. */
export function HubPaginatedTableShell<T>({
  items,
  resetKey,
  pageSize,
  ariaLabel,
  className,
  children,
}: HubPaginatedTableShellProps<T>) {
  const resolvedPageSize = useHubTablePageSize(pageSize);
  const pagination = useHubTablePagination(items, { resetKey, pageSize: resolvedPageSize });
  const body = (
    <>
      {children(pagination.pageItems)}
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

  return className ? <div className={className}>{body}</div> : body;
}
