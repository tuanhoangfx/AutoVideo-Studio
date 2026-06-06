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
  charts?: ReactNode;
  sectionRuleLabel?: string;
  filters?: FilterDef[];
  query?: string;
  onQueryChange?: (q: string) => void;
  filterValues?: FilterValues;
  onFilterValuesChange?: (v: FilterValues) => void;
  filterPlaceholder?: string;
  /** FilterBar keyboard focus scope (e.g. `library`, `bots`). */
  filterShortcutScope?: string;
  filterToolbar?: ReactNode;
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
  charts,
  sectionRuleLabel,
  filters = [],
  query = "",
  onQueryChange,
  filterValues = {},
  onFilterValuesChange,
  filterPlaceholder = "Search…",
  filterShortcutScope = "default",
  filterToolbar,
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
      row2Actions={filterRowActions}
    />
  ) : undefined;

  return (
    <HubTabChrome header={header} filterBar={filterBar}>
      <HubTabScreenBody
        kpis={kpis}
        charts={charts}
        sectionRuleLabel={sectionRuleLabel}
        bodyFlex={bodyFlex}
      >
        {children}
      </HubTabScreenBody>
    </HubTabChrome>
  );
}
