import type { ReactNode } from "react";
import { ChartsBand } from "../shell/ChartsBand";
import { KpiStrip, type KpiTileData } from "../shell/KpiStrip";
import { HubTabSectionRule } from "../shell/HubTabSectionRule";

/**
 * P0004 HubListPage content bands below chrome:
 * mt-5 KPI/charts → section rule pill → space-y-3 main body.
 */
export function HubTabScreenBody({
  kpis,
  charts,
  /** Override auto-count of chart band slots (facet charts in a fragment). */
  chartCount,
  sectionRuleLabel,
  bodyFlex = false,
  /** Keep KPI/charts slot height before band data arrives (directory tabs). */
  reserveAnalyticsBand = false,
  /** Inside `hub-tab-content-zone` (System tabs) — skip outer zone wrapper. */
  embedded = false,
  children,
}: {
  kpis?: KpiTileData[];
  charts?: ReactNode;
  chartCount?: number;
  sectionRuleLabel?: string;
  bodyFlex?: boolean;
  reserveAnalyticsBand?: boolean;
  embedded?: boolean;
  children: ReactNode;
}) {
  const hasAnalytics = Boolean(kpis?.length || charts);
  const showAnalyticsZone = hasAnalytics || reserveAnalyticsBand;
  const showSectionRule = Boolean(sectionRuleLabel && showAnalyticsZone);
  const bodyClass = bodyFlex
    ? "hub-tab-body-zone hub-tab-body-zone--split space-y-3"
    : "hub-tab-body-zone space-y-3";

  const inner = (
    <>
      {showAnalyticsZone ? (
        <div
          className={`hub-tab-kpi-zone flex flex-col${!hasAnalytics && reserveAnalyticsBand ? " hub-tab-kpi-zone--reserved" : ""}`}
        >
          {kpis?.length ? (
            <KpiStrip items={kpis} />
          ) : reserveAnalyticsBand ? (
            <div className="hub-kpi-strip hub-kpi-strip--reserve" aria-hidden />
          ) : null}
          {charts ? (
            <ChartsBand count={chartCount}>{charts}</ChartsBand>
          ) : reserveAnalyticsBand ? (
            <ChartsBand reserve />
          ) : null}
        </div>
      ) : null}
      {showSectionRule ? <HubTabSectionRule label={sectionRuleLabel!} /> : null}
      <div className={bodyClass}>{children}</div>
    </>
  );

  if (embedded) return inner;
  return <div className="hub-tab-content-zone">{inner}</div>;
}
