import type { FilterIconMeta } from "../types/filter-badge";
import { prepareChartItems } from "../chart-items";
import { compactIconSize } from "../ui-scale";

export type BarItem = {
  label: string;
  value: number;
  color?: string;
  iconMeta?: FilterIconMeta | null;
  iconSrc?: string;
};

function fmtInt(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export function MiniBarChart({
  title,
  items,
  max,
  formatter,
}: {
  title: string;
  items: BarItem[];
  max?: number;
  formatter?: (n: number) => string;
}) {
  const rows = prepareChartItems(items);
  const m = max ?? Math.max(1, ...rows.map((i) => i.value));
  const fmt = formatter ?? fmtInt;

  return (
    <div className="hub-chart-card rounded-2xl border border-white/5 bg-[var(--panel)] p-4">
      <div className="mb-2 shrink-0 text-[10px] uppercase tracking-wider text-[var(--muted)]">{title}</div>
      <ul className="hub-chart-card__body space-y-1.5">
        {rows.map((it, i) => {
          const pct = Math.max(2, (it.value / m) * 100);
          const color = it.color ?? defaultColor(i);
          return (
            <li key={`${it.label}-${i}`} className="hub-chart-row anim-slide text-xs">
              <span className="hub-chart-legend-label" title={it.label}>
                {it.iconSrc ? (
                  <img
                    src={it.iconSrc}
                    alt=""
                    className="h-3.5 w-3.5 shrink-0 rounded-sm object-contain"
                    aria-hidden
                  />
                ) : it.iconMeta ? (
                  <it.iconMeta.icon size={compactIconSize(11)} className={`shrink-0 ${it.iconMeta.className}`} aria-hidden />
                ) : null}
                <span className="hub-chart-legend-label__text">{it.label}</span>
              </span>
              <div className="relative h-1.5 min-w-0 overflow-hidden rounded-full bg-white/5">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
                  style={{ width: `${pct}%`, background: color, boxShadow: `0 0 12px ${color}55` }}
                />
              </div>
              <span className="text-right font-mono text-[10px] tabular-nums">{fmt(it.value)}</span>
            </li>
          );
        })}
        {rows.length === 0 ? <li className="py-3 text-center text-xs text-[var(--muted)]">—</li> : null}
      </ul>
    </div>
  );
}

function defaultColor(i: number): string {
  const palette = ["#818cf8", "#22c55e", "#a855f7", "#f59e0b", "#06b6d4", "#ec4899", "#f43f5e"];
  return palette[i % palette.length]!;
}
