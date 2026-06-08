import { useEffect, useMemo, useState } from "react";

/** Default rows per Hub table page (E0001 route pager parity). */
export const HUB_TABLE_PAGE_SIZE = 25;

/** Reset pager when search/filter/sort/columns change — table + card grid share this contract. */
export function hubDirectoryListResetKey(
  ...segments: (string | number | boolean | null | undefined | Record<string, unknown>)[]
): string {
  return segments
    .map((s) => {
      if (s === null || s === undefined) return "";
      if (typeof s === "object") return JSON.stringify(s);
      return String(s);
    })
    .join("|");
}

/** Cheap signature when parent does not pass an explicit resetKey. */
export function hubTablePaginationResetKey(
  items: readonly unknown[],
  explicit?: string | number | boolean | null,
): string | number | boolean | null {
  if (explicit !== undefined) return explicit;
  const n = items.length;
  if (n === 0) return "0";
  const first = items[0] as { id?: string } | undefined;
  const last = items[n - 1] as { id?: string } | undefined;
  const firstKey = first?.id ?? String(first ?? 0);
  const lastKey = last?.id ?? String(last ?? n - 1);
  return `${n}:${firstKey}:${lastKey}`;
}

export type HubTablePaginationState<T> = {
  pageIndex: number;
  pageItems: T[];
  totalCount: number;
  totalPages: number;
  pageSize: number;
  rangeStart: number;
  rangeEnd: number;
  showPager: boolean;
  goPrev: () => void;
  goNext: () => void;
  setPageIndex: (index: number) => void;
};

export function paginateHubTableItems<T>(
  items: readonly T[],
  pageIndex: number,
  pageSize = HUB_TABLE_PAGE_SIZE,
): Omit<HubTablePaginationState<T>, "goPrev" | "goNext" | "setPageIndex"> {
  const totalCount = items.length;
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 1;
  const clampedPageIndex = Math.min(Math.max(0, pageIndex), Math.max(0, totalPages - 1));
  const pageStart = clampedPageIndex * pageSize;
  const pageItems = items.slice(pageStart, pageStart + pageSize);
  const rangeStart = totalCount > 0 ? pageStart + 1 : 0;
  const rangeEnd = Math.min(totalCount, pageStart + pageSize);

  return {
    pageIndex: clampedPageIndex,
    pageItems,
    totalCount,
    totalPages,
    pageSize,
    rangeStart,
    rangeEnd,
    showPager: totalCount > pageSize,
  };
}

export function hubPageAllSelected<T>(
  pageItems: readonly T[],
  getKey: (item: T) => string,
  selectedIds: Set<string> | undefined,
  canSelect?: (item: T) => boolean,
): boolean {
  if (!selectedIds) return false;
  const selectable = pageItems.filter((item) => canSelect?.(item) !== false);
  return selectable.length > 0 && selectable.every((item) => selectedIds.has(getKey(item)));
}

/** Toggle selection for the current page only (header checkbox in paginated tables). */
export function hubPageAllSelectedByPredicate<T>(
  pageItems: readonly T[],
  isSelected: (item: T) => boolean,
  canSelect?: (item: T) => boolean,
): boolean {
  const selectable = pageItems.filter((item) => canSelect?.(item) !== false);
  return selectable.length > 0 && selectable.every(isSelected);
}

export function hubTogglePageSelectAllByPredicate<T>(
  pageItems: readonly T[],
  isSelected: (item: T) => boolean,
  onToggle: (item: T) => void,
  canSelect?: (item: T) => boolean,
) {
  const selectable = pageItems.filter((item) => canSelect?.(item) !== false);
  const allSelected = hubPageAllSelectedByPredicate(pageItems, isSelected, canSelect);
  for (const item of selectable) {
    if (allSelected) {
      if (isSelected(item)) onToggle(item);
    } else if (!isSelected(item)) {
      onToggle(item);
    }
  }
}

export function hubTogglePageSelectAll<T>(
  pageItems: readonly T[],
  getKey: (item: T) => string,
  selectedIds: Set<string> | undefined,
  onToggleSelect: ((id: string) => void) | undefined,
  canSelect?: (item: T) => boolean,
) {
  if (!onToggleSelect || !selectedIds) return;
  const selectable = pageItems.filter((item) => canSelect?.(item) !== false);
  const allSelected = hubPageAllSelected(pageItems, getKey, selectedIds, canSelect);
  for (const item of selectable) {
    const key = getKey(item);
    if (allSelected) {
      if (selectedIds.has(key)) onToggleSelect(key);
    } else if (!selectedIds.has(key)) {
      onToggleSelect(key);
    }
  }
}

export function useHubTablePagination<T>(
  items: readonly T[],
  options?: { pageSize?: number; resetKey?: string | number | boolean | null },
): HubTablePaginationState<T> {
  const pageSize = options?.pageSize ?? HUB_TABLE_PAGE_SIZE;
  const [pageIndex, setPageIndex] = useState(0);
  const resolvedResetKey = useMemo(
    () => hubTablePaginationResetKey(items, options?.resetKey),
    [items, options?.resetKey],
  );

  useEffect(() => {
    setPageIndex(0);
  }, [resolvedResetKey]);

  const base = useMemo(() => paginateHubTableItems(items, pageIndex, pageSize), [items, pageIndex, pageSize]);
  const totalPages = base.totalPages;

  return {
    ...base,
    goPrev: () => setPageIndex((p) => Math.max(0, p - 1)),
    goNext: () => setPageIndex((p) => Math.min(totalPages - 1, p + 1)),
    setPageIndex: (index: number) =>
      setPageIndex(Math.min(Math.max(0, index), Math.max(0, totalPages - 1))),
  };
}
