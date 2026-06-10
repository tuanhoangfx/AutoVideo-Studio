import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Settings } from "lucide-react";
import { buildSemanticTocIcon } from "../lib/semantic-icon-registry";
import { LIMIT_OPTIONS, TABLE_PAGE_SIZE_OPTIONS, TIME_RANGES } from "./constants";
import { HUB_TABLE_PAGE_SIZE_DEFAULT, patchHubTablePageSizeValue } from "../table/hub-table-page-size";
import {
  MAX_VISIBLE_CHART,
  enforceChartMaxOnAdd,
  resolveVisibleChartKeys,
} from "./chart-visible";
import {
  MAX_VISIBLE_KPI,
  enforceKpiMaxOnAdd,
} from "./kpi-visible";
import { Section, ToggleRow } from "./primitives";
import type { HubDisplayPrefsProps, PrefItem } from "./types";
import { HubHeaderPanelButton } from "../shell/HubHeaderPanelButton";
import { HubKeyboardShortcutsPanel } from "../keyboard/HubKeyboardShortcutsPanel";
import { HubToolDetailModal, HubToolDetailModalSecondaryAction, HUB_TOOL_DETAIL_SCROLL_ROOT } from "../shell/HubToolDetailModal";
import { HubToolDetailSection, HUB_TOOL_DETAIL_SECTIONS_CLASS } from "../shell/HubToolDetailSection";
import { HubTocSectionNav, type HubTocNavItem } from "../shell/HubTocSectionNav";
import { registerHubSettingsOpen } from "../keyboard/hub-keyboard-shortcuts";

function parseSet(raw: string | null): Set<string> | null {
  if (raw === null) return null;
  if (raw === "") return new Set();
  return new Set(raw.split(",").filter(Boolean));
}

function searchParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

function settingsSectionId(key: string) {
  return key.startsWith("settings-") ? key : `settings-${key}`;
}

export function HubDisplayPrefs({
  kpis,
  charts,
  filters,
  headerStats: headerStatsProp = [],
  showHeaderPin = true,
  showRange = true,
  showLimit = true,
  showNavToggle = true,
  hideSearchPinOnSystem = false,
  defaultKpiKeys,
  defaultChartKeys,
  defaultFilterKeys,
  defaultHeaderStatKeys,
  compact = false,
  sidebarRow = false,
  scope = "tab",
  filterParam = "hfilt",
  filtersFromUrl = false,
  readPrefs,
  patchPrefs,
  getScreen,
  getSystemTab,
  systemDisplay,
  getSubTab,
  subTabDisplay,
  generalExtras,
  displayExtras,
  tablePanel,
  tableSectionActions,
  tableActiveCount = 0,
  headerStatLabel = (isSystem) => (isSystem ? "System header" : "Hub header"),
  onLog,
  title = "Settings",
  extraTabs = [],
}: HubDisplayPrefsProps) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(readPrefs);
  const [screen, setScreen] = useState(getScreen);
  const [systemTab, setSystemTab] = useState(() => getSystemTab?.() ?? "");
  const [subTab, setSubTab] = useState(() => getSubTab?.() ?? "");
  const [displayTick, setDisplayTick] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const subTabChangeEvent = subTabDisplay?.changeEvent ?? "subtab-display-change";
    const sync = () => {
      setScreen(getScreen());
      if (getSystemTab) setSystemTab(getSystemTab());
      if (getSubTab) setSubTab(getSubTab());
      setDisplayTick((n) => n + 1);
    };
    window.addEventListener("popstate", sync);
    window.addEventListener("system-display-change", sync);
    window.addEventListener(subTabChangeEvent, sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("system-display-change", sync);
      window.removeEventListener(subTabChangeEvent, sync);
    };
  }, [getScreen, getSystemTab, getSubTab, subTabDisplay?.changeEvent]);

  useEffect(() => {
    if (scope === "global") return;
    return registerHubSettingsOpen(() => setOpen(true));
  }, [scope]);

  useEffect(() => {
    const sync = () => setPrefs(readPrefs());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [readPrefs]);

  const isSystem = screen === "system";
  const rawKpi = searchParam("kpi");
  const rawCharts = searchParam("charts");
  const rawFilters = searchParam(filterParam);
  const rawHeaderStats = searchParam(isSystem ? "sstat" : "hstat");
  const rawHpin = searchParam("hpin");
  const rawSpin = searchParam("spin");
  const rawNavicon = searchParam("navicon");

  const effectiveSubTab = isSystem && subTabDisplay?.screens.includes("system") ? systemTab : subTab;
  const usesSubTabDisplay = Boolean(
    subTabDisplay?.screens.includes(screen) && effectiveSubTab && subTabDisplay?.adapter,
  );
  const usesLegacySystemDisplay = Boolean(isSystem && systemDisplay && systemTab && !usesSubTabDisplay);
  const systemSlice = useMemo(() => {
    void displayTick;
    return usesLegacySystemDisplay ? systemDisplay!.read(systemTab) : null;
  }, [usesLegacySystemDisplay, systemDisplay, systemTab, displayTick]);
  const subTabSlice = useMemo(() => {
    void displayTick;
    return usesSubTabDisplay ? subTabDisplay!.adapter.read(effectiveSubTab) : null;
  }, [usesSubTabDisplay, subTabDisplay, effectiveSubTab, displayTick]);
  const visKpiEffective = usesSubTabDisplay
    ? (subTabSlice?.kpi ?? null)
    : usesLegacySystemDisplay
      ? (systemSlice?.kpi ?? null)
      : prefs.kpi;
  const visChartsEffective = usesSubTabDisplay
    ? (subTabSlice?.charts ?? null)
    : usesLegacySystemDisplay
      ? (systemSlice?.charts ?? null)
      : prefs.charts;
  const visHubFilters = filtersFromUrl ? parseSet(rawFilters) : (prefs.hubFilters ?? null);

  const isGlobalScope = scope === "global";
  const tabKpis = isGlobalScope ? [] : (kpis ?? []);
  const tabCharts = isGlobalScope ? [] : (charts ?? []);
  const tabFilters = isGlobalScope ? [] : (filters ?? []);
  const headerStats = isGlobalScope ? [] : headerStatsProp;
  const headerStatDefaults = isGlobalScope ? new Set<string>() : (defaultHeaderStatKeys ?? new Set<string>());
  const visHeaderStats = isSystem ? prefs.systemHeaderStats : prefs.headerStats;
  const headerStatParam = isSystem ? "sstat" : "hstat";

  const logScope = isGlobalScope
    ? "Tool"
    : usesSubTabDisplay
      ? (subTabDisplay?.logScope?.(effectiveSubTab) ?? `${screen} / ${effectiveSubTab}`)
      : isSystem
        ? `System / ${systemTab}`
        : "Hub";

  function emitLog(message: string) {
    onLog?.(logScope, message);
  }

  function update(patch: Record<string, string | null>, logMessage = "Updated display settings") {
    patchPrefs(patch, logMessage);
    setPrefs(readPrefs());
    emitLog(logMessage);
  }

  function defaultsFor(allItems: PrefItem[], defaults?: Set<string>) {
    return defaults ?? new Set(allItems.map((i) => i.key));
  }

  function toggleSetParam(
    param: string,
    cur: Set<string> | null,
    allItems: PrefItem[],
    defaults: Set<string>,
    key: string,
  ) {
    let next: Set<string>;
    if (cur === null) {
      next = new Set(defaults);
      if (next.has(key)) next.delete(key);
      else next.add(key);
    } else {
      next = new Set(cur);
      if (next.has(key)) next.delete(key);
      else next.add(key);
    }
    const allDefault = next.size === defaults.size && [...next].every((k) => defaults.has(k));
    return { next, allDefault };
  }

  function toggle(
    param: "kpi" | "charts" | "hstat" | "sstat" | typeof filterParam,
    allItems: PrefItem[],
    defaults: Set<string>,
    key: string,
  ) {
    const cur =
      param === "kpi"
        ? visKpiEffective
        : param === "charts"
          ? visChartsEffective
          : param === "hstat" || param === "sstat"
            ? visHeaderStats
            : visHubFilters;

    let { next, allDefault } = toggleSetParam(param, cur, allItems, defaults, key);

    if (param === "kpi" && next.has(key)) {
      next = enforceKpiMaxOnAdd(next, allItems, key);
      allDefault =
        next.size === defaults.size && [...next].every((k) => defaults.has(k));
    }

    if (param === "charts" && next.has(key)) {
      next = enforceChartMaxOnAdd(next, allItems, key);
      allDefault =
        next.size === defaults.size && [...next].every((k) => defaults.has(k));
    }

    if (usesLegacySystemDisplay && systemDisplay && systemTab && (param === "kpi" || param === "charts")) {
      systemDisplay.patch(systemTab, {
        [param]: allDefault ? null : [...next],
      });
      setDisplayTick((n) => n + 1);
      emitLog(`Updated ${systemTab} display`);
      return;
    }

    if (usesSubTabDisplay && subTabDisplay && (param === "kpi" || param === "charts")) {
      subTabDisplay.adapter.patch(effectiveSubTab, {
        [param]: allDefault ? null : [...next],
      });
      setDisplayTick((n) => n + 1);
      const evt = subTabDisplay.changeEvent ?? "subtab-display-change";
      window.dispatchEvent(new CustomEvent(evt));
      emitLog(`Updated ${effectiveSubTab} display`);
      return;
    }

    if (allDefault) {
      update({ [param]: null });
    } else {
      update({ [param]: [...next].join(",") });
    }
  }

  function isVisible(set: Set<string> | null, defaults: Set<string>, key: string) {
    return set === null ? defaults.has(key) : set.has(key);
  }

  const kpiDefaults = defaultsFor(tabKpis, defaultKpiKeys);
  const chartsDefaults = defaultsFor(tabCharts, defaultChartKeys);
  const filterDefaults = defaultsFor(tabFilters, defaultFilterKeys);
  const visKpiCount = tabKpis.filter((k) => isVisible(visKpiEffective, kpiDefaults, k.key)).length;
  const kpiAtMax = visKpiCount >= MAX_VISIBLE_KPI;
  const visChartsResolved = resolveVisibleChartKeys(visChartsEffective, chartsDefaults, tabCharts);
  const visChartsCount = visChartsResolved.size;
  const visFilterCount = visHubFilters === null ? filterDefaults.size : visHubFilters.size;
  const visHeaderStatCount = visHeaderStats === null ? headerStatDefaults.size : visHeaderStats.size;

  const hasTablePanel = Boolean(tablePanel) && !isGlobalScope;

  const activeCount =
    (isGlobalScope
      ? (showHeaderPin && rawHpin !== null ? 1 : 0) +
        (rawSpin === "0" ? 1 : 0) +
        (showNavToggle && rawNavicon === "0" ? 1 : 0)
      : (showRange && prefs.range !== "30d" ? 1 : 0) +
        (showLimit && prefs.limit !== 100 ? 1 : 0) +
        (prefs.tablePageSize !== HUB_TABLE_PAGE_SIZE_DEFAULT ? 1 : 0) +
        (rawKpi !== null ? 1 : 0) +
        (rawCharts !== null ? 1 : 0) +
        (rawFilters !== null ? 1 : 0) +
        (rawHeaderStats !== null ? 1 : 0)) + (tableActiveCount > 0 ? 1 : 0);

  function resetDefaults() {
    if (isGlobalScope) {
      const patch: Record<string, string | null> = { hpin: null, spin: null };
      if (showNavToggle) patch.navicon = null;
      update(patch, "Reset global settings");
      return;
    }

    if (usesLegacySystemDisplay && systemDisplay && systemTab) {
      systemDisplay.reset(systemTab);
      update({ sstat: null }, `Reset ${systemTab} display settings`);
      return;
    }

    if (usesSubTabDisplay && subTabDisplay) {
      subTabDisplay.adapter.reset(effectiveSubTab);
      const evt = subTabDisplay.changeEvent ?? "subtab-display-change";
      window.dispatchEvent(new CustomEvent(evt));
      update({}, `Reset ${effectiveSubTab} display settings`);
      return;
    }

    const patch: Record<string, string | null> = {
      kpi: null,
      charts: null,
      [filterParam]: null,
      hstat: null,
    };
    if (showRange) patch.range = null;
    if (showLimit) patch.limit = null;
    patch.tpage = null;
    update(patch, "Reset display settings");
  }

  const tocItems: HubTocNavItem[] = [];
  const sectionIds: string[] = [];
  const sectionNodes: ReactNode[] = [];

  const pushSection = (
    id: string,
    label: string,
    icon: ReactNode | undefined,
    body: ReactNode,
    headerActions?: ReactNode,
  ) => {
    const sectionId = settingsSectionId(id);
    tocItems.push({ id: sectionId, label, icon });
    sectionIds.push(sectionId);
    sectionNodes.push(
      <HubToolDetailSection key={sectionId} id={sectionId} title={label} icon={icon} headerActions={headerActions}>
        {body}
      </HubToolDetailSection>,
    );
  };

  const displayParts: ReactNode[] = [];

  if (!isGlobalScope && showRange) {
    displayParts.push(
      <Section
        key="range"
        label="Time range"
        icon={buildSemanticTocIcon("settings.range")}
      >
        <div className="grid grid-cols-3 gap-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => update({ range: r.value === "30d" ? null : r.value })}
              className={`rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
                prefs.range === r.value
                  ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-500/40"
                  : "bg-white/[.03] text-[var(--muted)]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </Section>,
    );
  }

  if (!isGlobalScope) {
    displayParts.push(
      <Section
        key="page-size"
        label="Page size"
        icon={buildSemanticTocIcon("settings.pageSize")}
      >
        <div className="grid grid-cols-3 gap-1">
          {TABLE_PAGE_SIZE_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => update({ tpage: patchHubTablePageSizeValue(n) })}
              className={`rounded-md px-1.5 py-1.5 text-[11px] font-semibold transition-colors ${
                prefs.tablePageSize === n
                  ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-500/40"
                  : "bg-white/[.03] text-[var(--muted)]"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </Section>,
    );
  }

  if (!isGlobalScope && showLimit) {
    displayParts.push(
      <Section key="rows" label="Rows" icon={buildSemanticTocIcon("settings.rows")}>
        <div className="grid grid-cols-5 gap-1">
          {LIMIT_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => update({ limit: n === 100 ? null : String(n) })}
              className={`rounded-md px-1.5 py-1.5 text-[11px] font-semibold transition-colors ${
                prefs.limit === n
                  ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-500/40"
                  : "bg-white/[.03] text-[var(--muted)]"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </Section>,
    );
  }

  if (showHeaderPin) {
    displayParts.push(
      <Section key="header" label="Header" icon={buildSemanticTocIcon("settings.header")}>
        <ToggleRow
          label="Pin header (sticky)"
          on={prefs.headerPin}
          onChange={() => update({ hpin: prefs.headerPin ? "0" : null })}
        />
        {!(hideSearchPinOnSystem && isSystem) ? (
          <ToggleRow
            label="Pin search bar (sticky)"
            on={prefs.searchPin}
            onChange={() => update({ spin: prefs.searchPin ? "0" : null })}
          />
        ) : null}
        {showNavToggle && prefs.navToggleIcon !== undefined ? (
          <ToggleRow
            label="Show submenu +/- icon"
            on={prefs.navToggleIcon}
            onChange={() => update({ navicon: prefs.navToggleIcon ? "0" : null })}
          />
        ) : null}
      </Section>,
    );
  }

  const toolDisplayExtras = displayExtras ?? generalExtras;
  if (toolDisplayExtras) {
    displayParts.push(<Fragment key="display-extras">{toolDisplayExtras}</Fragment>);
  }

  for (const tab of extraTabs) {
    displayParts.push(
      <Section key={`extra-${tab.id}`} label={tab.label} icon={tab.icon}>
        {tab.content}
      </Section>,
    );
  }

  if (!isGlobalScope && tabKpis.length > 0) {
    displayParts.push(
      <Section
        key="kpi"
        label={`KPI (${visKpiCount}/${MAX_VISIBLE_KPI})`}
        icon={buildSemanticTocIcon("settings.kpi")}
      >
        <div className="space-y-0.5">
          {tabKpis.map((k) => {
            const selected = isVisible(visKpiEffective, kpiDefaults, k.key);
            return (
              <ToggleRow
                key={k.key}
                label={k.label}
                on={selected}
                disabled={kpiAtMax && !selected}
                onChange={() => toggle("kpi", tabKpis, kpiDefaults, k.key)}
              />
            );
          })}
        </div>
      </Section>,
    );
  }

  if (!isGlobalScope && tabCharts.length > 0) {
    displayParts.push(
      <Section
        key="charts"
        label={`Charts (${visChartsCount}/${MAX_VISIBLE_CHART})`}
        icon={buildSemanticTocIcon("settings.charts")}
      >
        <div className="space-y-0.5">
          {tabCharts.map((c) => (
            <ToggleRow
              key={c.key}
              label={c.label}
              on={isVisible(visChartsEffective, chartsDefaults, c.key)}
              onChange={() => toggle("charts", tabCharts, chartsDefaults, c.key)}
            />
          ))}
        </div>
      </Section>,
    );
  }

  if (!isGlobalScope && tabFilters.length > 0) {
    displayParts.push(
      <Section
        key="filters"
        label={`Filters (${visFilterCount}/${tabFilters.length})`}
        icon={buildSemanticTocIcon("settings.filters")}
      >
        <div className="space-y-0.5">
          {tabFilters.map((f) => (
            <ToggleRow
              key={f.key}
              label={f.label}
              on={isVisible(visHubFilters, filterDefaults, f.key)}
              onChange={() => toggle(filterParam, tabFilters, filterDefaults, f.key)}
            />
          ))}
        </div>
      </Section>,
    );
  }

  if (!isGlobalScope && headerStats.length > 0) {
    displayParts.push(
      <Section
        key="header-stats"
        label={`${headerStatLabel(isSystem)} (${visHeaderStatCount}/${headerStats.length})`}
        icon={buildSemanticTocIcon("settings.headerStats")}
      >
        <div className="space-y-0.5">
          {headerStats.map((h) => (
            <ToggleRow
              key={h.key}
              label={h.label}
              on={isVisible(visHeaderStats, headerStatDefaults, h.key)}
              onChange={() => toggle(headerStatParam, headerStats, headerStatDefaults, h.key)}
            />
          ))}
        </div>
      </Section>,
    );
  }

  if (displayParts.length > 0) {
    pushSection(
      "display",
      "Display",
      buildSemanticTocIcon("settings.display"),
      <div className="space-y-0">{displayParts}</div>,
    );
  }

  if (hasTablePanel) {
    pushSection(
      "table",
      "Table columns",
      buildSemanticTocIcon("settings.table"),
      tablePanel,
      tableSectionActions,
    );
  }

  pushSection(
    "shortcuts",
    "Keyboard shortcuts",
    buildSemanticTocIcon("settings.shortcuts"),
    <HubKeyboardShortcutsPanel className="-mx-1" />,
  );

  /** Always show TOC when any section exists — matches Log / User access modals. */
  const showSettingsToc = tocItems.length > 0;

  return (
    <div ref={ref} className={sidebarRow ? "relative w-full" : "relative"}>
      <HubHeaderPanelButton
        icon={Settings}
        iconClassName="text-amber-300"
        label={title}
        title={title}
        badge={activeCount}
        compact={compact}
        sidebarRow={sidebarRow}
        onClick={() => setOpen(true)}
      />

      <HubToolDetailModal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        titleId="hub-settings-modal-title"
        headerIcon={Settings}
        headerIconClassName="text-amber-300"
        shellClassName="hub-header-panel-modal"
        sectionIds={showSettingsToc ? sectionIds : undefined}
        toc={
          showSettingsToc ? (
            <div className="hub-toc-nav">
              <HubTocSectionNav items={tocItems} scrollRootSelector={HUB_TOOL_DETAIL_SCROLL_ROOT} />
            </div>
          ) : undefined
        }
        footer={
          <HubToolDetailModalSecondaryAction label="Reset to defaults" onClick={resetDefaults} />
        }
      >
        <div className={HUB_TOOL_DETAIL_SECTIONS_CLASS}>{sectionNodes}</div>
      </HubToolDetailModal>
    </div>
  );
}
