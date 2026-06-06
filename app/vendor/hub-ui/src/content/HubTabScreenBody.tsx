import type { ReactNode } from "react";
import { KpiStrip, type KpiTileData } from "../shell/KpiStrip";
import { HubTabSectionRule } from "../shell/HubTabSectionRule";

/**
 * P0004 HubListPage content bands below chrome:
 * mt-5 KPI/charts → section rule pill → space-y-3 main body.
 */
export function HubTabScreenBody({
  kpis,
  charts,
  sectionRuleLabel,
  bodyFlex = false,
  /** Inside `hub-tab-content-zone` (System tabs) — skip outer zone wrapper. */
  embedded = false,
  children,
}: {
  kpis?: KpiTileData[];
  charts?: ReactNode;
  sectionRuleLabel?: string;
  bodyFlex?: boolean;
  embedded?: boolean;
  children: ReactNode;
}) {
  const hasAnalytics = Boolean(kpis?.length || charts);

  const bodyClass = bodyFlex
    ? "hub-tab-body-zone hub-tab-body-zone--split space-y-3"
    : "hub-tab-body-zone space-y-3";

  const inner = (
    <>
      {hasAnalytics ? (
        <div className="hub-tab-kpi-zone flex flex-col">
          {kpis?.length ? <KpiStrip items={kpis} /> : null}
          {charts ? <div className="hub-charts-band">{charts}</div> : null}
        </div>
      ) : null}
      {hasAnalytics && sectionRuleLabel ? <HubTabSectionRule label={sectionRuleLabel} /> : null}
      <div className={bodyClass}>{children}</div>
    </>
  );

  if (embedded) return inner;
  return <div className="hub-tab-content-zone">{inner}</div>;
}
