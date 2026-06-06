import { Ellipsis, Pencil } from "lucide-react";
import type { FilterIconMeta } from "./types/filter-badge";

export type ChartLegendIcon = FilterIconMeta;

export type ChartRow = {
  label: string;
  value: number;
  color?: string;
  iconMeta?: FilterIconMeta | null;
  /** Brand image — takes precedence over iconMeta when set. */
  iconSrc?: string;
};

export const CHART_OTHERS_LABEL = "Others";

const OTHERS_COLOR = "#64748b";

const FALLBACK_LEGEND: Record<string, FilterIconMeta> = {
  [CHART_OTHERS_LABEL]: { icon: Ellipsis, className: "text-slate-400" },
  Other: { icon: Ellipsis, className: "text-slate-400" },
  Draft: { icon: Pencil, className: "text-amber-300" },
};

let resolveLegend: ((label: string) => FilterIconMeta | null) | null = null;

/** Host app wires P0004 `resolveChartLegendIcon` for full registry parity. */
export function configureChartLegend(resolve: (label: string) => FilterIconMeta | null) {
  resolveLegend = resolve;
}

function legendFor(label: string): FilterIconMeta | null {
  const key = label.trim();
  return resolveLegend?.(key) ?? FALLBACK_LEGEND[key] ?? null;
}

export function withChartLegendIcon<T extends ChartRow>(row: T): T {
  const iconMeta = row.iconMeta ?? legendFor(row.label);
  const color = row.label === CHART_OTHERS_LABEL ? (row.color ?? OTHERS_COLOR) : row.color;
  return iconMeta ? { ...row, iconMeta, color } : { ...row, color };
}

export function topChartItems<T extends ChartRow>(items: T[], topN = 3, othersLabel = CHART_OTHERS_LABEL): T[] {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  if (sorted.length <= topN + 1) return sorted.map(withChartLegendIcon);
  const head = sorted.slice(0, topN).map(withChartLegendIcon);
  const rest = sorted.slice(topN);
  const othersValue = rest.reduce((sum, row) => sum + row.value, 0);
  return [...head, withChartLegendIcon({ label: othersLabel, value: othersValue, color: OTHERS_COLOR } as T)];
}

export function prepareChartItems<T extends ChartRow>(items: T[]): T[] {
  return topChartItems(items);
}
