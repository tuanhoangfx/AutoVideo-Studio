import { useCallback, useMemo, useState } from "react";
import type { HubSortDir } from "./HubSortIndicator";

export function useDirectoryTableSort<TKey extends string, TItem>(
  items: TItem[],
  defaultKey: TKey,
  sortableValue: (item: TItem, key: TKey) => string | number,
  defaultDir: HubSortDir = "asc",
) {
  const [sortKey, setSortKey] = useState<TKey>(defaultKey);
  const [sortDir, setSortDir] = useState<HubSortDir>(defaultDir);

  const onSort = useCallback((key: TKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("asc");
      return key;
    });
  }, []);

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const av = sortableValue(a, sortKey);
      const bv = sortableValue(b, sortKey);
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [items, sortKey, sortDir, sortableValue]);

  return { sortKey, sortDir, onSort, sorted };
}
