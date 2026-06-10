import type { ReactNode } from "react";
import { FilterBar, type FilterDef, type FilterValues } from "../shell/FilterBar";
import type { SettingsExtraTab } from "../display-prefs/types";
import type { TabHeaderStatItem } from "../shell/AppTabHeader";
import type { KpiTileData } from "../shell/KpiStrip";
import { HubTabChrome, useHubChromePrefs } from "../shell/HubTabChrome";
import { HubTabScreenBody } from "../content/HubTabScreenBody";

export type HubDirectoryScreenProps = {
  /** App-built tab header (e.g. ConsoleTabHeader, AppTabHeader). */
  header: ReactNode;
  centerStats?: TabHeaderStatItem[];
  kpis?: KpiTileData[];
  kpiBand?: ReactNode;
  charts?: ReactNode;
  chartCount?: number;
  sectionRuleLabel?: string;
  reserveAnalyticsBand?: boolean;
  bandOrder?: "kpis-first" | "charts-first";
  kpiZoneClassName?: string;
  filters?: FilterDef[];
  query?: string;
  onQueryChange?: (q: string) => void;
  filterValues?: FilterValues;
  onFilterValuesChange?: (v: FilterValues) => void;
  filterPlaceholder?: string;
  /** FilterBar keyboard focus scope (e.g. `library`, `bots`). */
  filterShortcutScope?: string;
  filterToolbar?: ReactNode;
  /** Row 2 leading — before filter dropdowns (e.g. active bot selector). */
  filterRowLeading?: ReactNode;
  filterRowActions?: ReactNode;
  settingsExtraTabs?: SettingsExtraTab[];
  /** ViewToggle + HubResultCount — rendered in FilterBar toolbar when filters/search enabled */
  directoryToolbar?: ReactNode;
  bodyFlex?: boolean;
  children: ReactNode;
};

/**
 * Golden **directory** template: Hub tab header + FilterBar + KPI/charts + section rule + table/card body.
 * Golden screens: P0004 Users/Hub list; P0006 Bots/Groups/Channels (via app TabScreenChrome wrapper).
 */
export function HubDirectoryScreen({
  header,
  kpis,
  kpiBand,
  charts,
  chartCount,
  sectionRuleLabel,
  reserveAnalyticsBand = false,
  bandOrder,
  kpiZoneClassName,
  filters = [],
  query = "",
  onQueryChange,
  filterValues = {},
  onFilterValuesChange,
  filterPlaceholder = "Search…",
  filterShortcutScope = "default",
  filterToolbar,
  filterRowLeading,
  filterRowActions,
  directoryToolbar,
  bodyFlex = false,
  children,
}: HubDirectoryScreenProps) {
  const { searchPin, headerPin, stackChrome } = useHubChromePrefs();
  const showFilterBar = Boolean(onQueryChange);
  const noopFilterValues = onFilterValuesChange ?? (() => {});

  const filterBar = showFilterBar ? (
    <FilterBar
      shortcutScope={filterShortcutScope}
      layout="hub"
      pinSticky={searchPin && !stackChrome}
      headerPinned={headerPin}
      embedded={stackChrome}
      placeholder={filterPlaceholder}
      filters={filters}
      query={query}
      onQueryChange={onQueryChange!}
      values={filterValues}
      onValuesChange={noopFilterValues}
      toolbar={
        directoryToolbar || filterToolbar ? (
          <>
            {directoryToolbar}
            {filterToolbar}
          </>
        ) : undefined
      }
      row2Leading={filterRowLeading}
      row2Actions={filterRowActions}
    />
  ) : undefined;

  return (
    <HubTabChrome header={header} filterBar={filterBar}>
      <HubTabScreenBody
        kpis={kpis}
        kpiBand={kpiBand}
        charts={charts}
        chartCount={chartCount}
        sectionRuleLabel={sectionRuleLabel}
        reserveAnalyticsBand={reserveAnalyticsBand}
        bandOrder={bandOrder}
        kpiZoneClassName={kpiZoneClassName}
        bodyFlex={bodyFlex}
      >
        {children}
      </HubTabScreenBody>
    </HubTabChrome>
  );
}
