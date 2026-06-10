import type { ReactNode } from "react";
import { MetricBadge, type MetricBadgeTone } from "./MetricBadge";

export type EntityRankRow = {
  id: string;
  label: string;
  value: number;
  total?: number;
  color?: string;
  statusLabel?: string;
  statusTone?: MetricBadgeTone;
  badgeLabel?: string;
  badgeTone?: MetricBadgeTone;
  onClick?: () => void;
};

type Props = {
  title: ReactNode;
  rows: EntityRankRow[];
  footer?: ReactNode;
  emptyLabel?: string;
};

function fmtInt(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n);
}

function defaultColor(i: number): string {
  const palette = ["#818cf8", "#22c55e", "#a855f7", "#f59e0b", "#06b6d4", "#ec4899", "#f43f5e"];
  return palette[i % palette.length]!;
}

/** Ranked entity list — hub-chart-card rows (KPI/chart visual parity). */
export function EntityRankMiniChart({ title, rows, footer, emptyLabel = "—" }: Props) {
  const max = Math.max(1, ...rows.map((r) => r.value || 0));

  return (
    <div className="hub-chart-card rounded-2xl border border-white/5 bg-[var(--panel)] p-4">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">{title}</div>
      <ul className="hub-chart-card__body space-y-2">
        {rows.length === 0 ? (
          <li className="py-3 text-center text-xs text-[var(--muted)]">{emptyLabel}</li>
        ) : (
          rows.map((row, i) => {
            const pct = Math.max(2, ((row.value || 0) / max) * 100);
            const color = row.color ?? defaultColor(i);
            const LabelTag = row.onClick ? "button" : "span";
            return (
              <li key={row.id} className="hub-chart-row anim-slide text-xs">
                <LabelTag
                  type={row.onClick ? "button" : undefined}
                  className={
                    row.onClick
                      ? "hub-chart-legend-label text-left hover:text-indigo-200"
                      : "hub-chart-legend-label"
                  }
                  title={row.label}
                  onClick={row.onClick}
                >
                  <span className="hub-chart-legend-label__text truncate">{row.label}</span>
                </LabelTag>
                <div className="relative h-1.5 min-w-0 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${pct}%`, background: color, boxShadow: `0 0 12px ${color}55` }}
                  />
                </div>
                <div className="flex min-w-[4.5rem] flex-col items-end gap-0.5">
                  <span className="font-mono text-[10px] tabular-nums text-[var(--text)]">
                    {fmtInt(row.value)}
                    {row.total != null ? (
                      <span className="text-[var(--muted)]"> / {fmtInt(row.total)}</span>
                    ) : null}
                  </span>
                  <div className="flex flex-wrap justify-end gap-1">
                    {row.statusLabel ? (
                      <MetricBadge label={row.statusLabel} tone={row.statusTone ?? "neutral"} />
                    ) : null}
                    {row.badgeLabel ? (
                      <MetricBadge label={row.badgeLabel} tone={row.badgeTone ?? "neutral"} />
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>
      {footer ? <div className="mt-2 border-t border-white/5 pt-2">{footer}</div> : null}
    </div>
  );
}
