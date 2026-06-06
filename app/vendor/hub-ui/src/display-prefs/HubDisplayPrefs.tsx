import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BarChart3,
  Clock,
  Columns3,
  Filter,
  Gauge,
  Keyboard,
  LayoutDashboard,
  PanelTop,
  Rows3,
  Settings,
} from "lucide-react";
import { LIMIT_OPTIONS, TIME_RANGES } from "./constants";
import {
  MAX_VISIBLE_KPI,
  enforceKpiMaxOnAdd,
  resolveVisibleKpiKeys,
} from "./kpi-visible";
import { ToggleRow } from "./primitives";
import type { HubDisplayPrefsProps, PrefItem } from "./types";
import { compactIconSize } from "../ui-scale";
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
  generalExtras,
  generalSectionToc = [],
  tablePanel,
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => {
      setScreen(getScreen());
      if (getSystemTab) setSystemTab(getSystemTab());
    };
    window.addEventListener("popstate", sync);
    window.addEventListener("system-display-change", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("system-display-change", sync);
    };
  }, [getScreen, getSystemTab]);

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

  const systemSlice = isSystem && systemDisplay && systemTab ? systemDisplay.read(systemTab) : null;
  const visKpiEffective = isSystem && systemDisplay ? systemSlice?.kpi ?? null : prefs.kpi;
  const visChartsEffective = isSystem && systemDisplay ? systemSlice?.charts ?? null : prefs.charts;
  const visHubFilters = filtersFromUrl ? parseSet(rawFilters) : (prefs.hubFilters ?? null);

  const isGlobalScope = scope === "global";
  const tabKpis = isGlobalScope ? [] : (kpis ?? []);
  const tabCharts = isGlobalScope ? [] : (charts ?? []);
  const tabFilters = isGlobalScope ? [] : (filters ?? []);
  const headerStats = isGlobalScope ? [] : headerStatsProp;
  const headerStatDefaults = isGlobalScope ? new Set<string>() : (defaultHeaderStatKeys ?? new Set<string>());
  const visHeaderStats = isSystem ? prefs.systemHeaderStats : prefs.headerStats;
  const headerStatParam = isSystem ? "sstat" : "hstat";

  const logScope = isGlobalScope ? "Tool" : isSystem ? `System / ${systemTab}` : "Hub";

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

    if (isSystem && systemDisplay && systemTab && (param === "kpi" || param === "charts")) {
      systemDisplay.patch(systemTab, {
        [param]: allDefault ? null : [...next],
      });
      emitLog(`Updated ${systemTab} display`);
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
  const visKpiResolved = resolveVisibleKpiKeys(visKpiEffective, kpiDefaults, tabKpis);
  const visKpiCount = visKpiResolved.size;
  const visChartsCount = visChartsEffective === null ? chartsDefaults.size : visChartsEffective.size;
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

    if (isSystem && systemDisplay && systemTab) {
      systemDisplay.reset(systemTab);
      update({ sstat: null }, `Reset ${systemTab} display settings`);
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
    update(patch, "Reset display settings");
  }

  const tocItems: HubTocNavItem[] = [];
  const sectionIds: string[] = [];
  const sectionNodes: ReactNode[] = [];

  const pushSection = (id: string, label: string, icon: ReactNode | undefined, body: ReactNode) => {
    const sectionId = settingsSectionId(id);
    tocItems.push({ id: sectionId, label, icon });
    sectionIds.push(sectionId);
    sectionNodes.push(
      <HubToolDetailSection key={sectionId} id={sectionId} title={label}>
        {body}
      </HubToolDetailSection>,
    );
  };

  const pushTocOnly = (items: HubTocNavItem[]) => {
    for (const item of items) {
      const sectionId = settingsSectionId(item.id);
      tocItems.push({ ...item, id: sectionId });
      sectionIds.push(sectionId);
    }
  };

  if (!isGlobalScope && showRange) {
    pushSection(
      "range",
      "Time range",
      <Clock size={compactIconSize(11)} className="text-sky-300" />,
      <div className="grid grid-cols-3 gap-1">
        {TIME_RANGES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => update({ range: r.value === "30d" ? null : r.value })}
            className={`rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
              prefs.range === r.value
                ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-500/40"
                : "bg-white/[.03] text-[var(--muted)] hover:bg-white/[.06] hover:text-[var(--text)]"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>,
    );
  }

  if (!isGlobalScope && showLimit) {
    pushSection(
      "rows",
      "Rows",
      <Rows3 size={compactIconSize(11)} className="text-violet-300" />,
      <div className="grid grid-cols-5 gap-1">
        {LIMIT_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => update({ limit: n === 100 ? null : String(n) })}
            className={`rounded-md px-1.5 py-1.5 text-[11px] font-semibold transition-colors ${
              prefs.limit === n
                ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-500/40"
                : "bg-white/[.03] text-[var(--muted)] hover:bg-white/[.06] hover:text-[var(--text)]"
            }`}
          >
            {n}
          </button>
        ))}
      </div>,
    );
  }

  if (showHeaderPin) {
    pushSection(
      "header",
      "Header",
      <PanelTop size={compactIconSize(11)} className="text-amber-300" />,
      <>
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
      </>,
    );
  }

  if (generalExtras) {
    pushTocOnly(generalSectionToc);
    sectionNodes.push(
      <div key="settings-general-extras" className="contents">
        {generalExtras}
      </div>,
    );
  }

  for (const tab of extraTabs) {
    pushSection(tab.id, tab.label, tab.icon, tab.content);
  }

  if (!isGlobalScope && tabKpis.length > 0) {
    pushSection(
      "kpi",
      `KPI (${visKpiCount}/${MAX_VISIBLE_KPI})`,
      <Gauge size={compactIconSize(11)} className="text-emerald-300" />,
      <div className="space-y-0.5">
        {tabKpis.map((k) => (
          <ToggleRow
            key={k.key}
            label={k.label}
            on={visKpiResolved.has(k.key)}
            onChange={() => toggle("kpi", tabKpis, kpiDefaults, k.key)}
          />
        ))}
      </div>,
    );
  }

  if (!isGlobalScope && tabCharts.length > 0) {
    pushSection(
      "charts",
      `Charts (${visChartsCount}/${tabCharts.length})`,
      <BarChart3 size={compactIconSize(11)} className="text-indigo-300" />,
      <div className="space-y-0.5">
        {tabCharts.map((c) => (
          <ToggleRow
            key={c.key}
            label={c.label}
            on={isVisible(visChartsEffective, chartsDefaults, c.key)}
            onChange={() => toggle("charts", tabCharts, chartsDefaults, c.key)}
          />
        ))}
      </div>,
    );
  }

  if (!isGlobalScope && tabFilters.length > 0) {
    pushSection(
      "filters",
      `Filters (${visFilterCount}/${tabFilters.length})`,
      <Filter size={compactIconSize(11)} className="text-cyan-300" />,
      <div className="space-y-0.5">
        {tabFilters.map((f) => (
          <ToggleRow
            key={f.key}
            label={f.label}
            on={isVisible(visHubFilters, filterDefaults, f.key)}
            onChange={() => toggle(filterParam, tabFilters, filterDefaults, f.key)}
          />
        ))}
      </div>,
    );
  }

  if (!isGlobalScope && headerStats.length > 0) {
    pushSection(
      "header-stats",
      `${headerStatLabel(isSystem)} (${visHeaderStatCount}/${headerStats.length})`,
      <LayoutDashboard size={compactIconSize(11)} className="text-orange-300" />,
      <div className="space-y-0.5">
        {headerStats.map((h) => (
          <ToggleRow
            key={h.key}
            label={h.label}
            on={isVisible(visHeaderStats, headerStatDefaults, h.key)}
            onChange={() => toggle(headerStatParam, headerStats, headerStatDefaults, h.key)}
          />
        ))}
      </div>,
    );
  }

  if (hasTablePanel) {
    pushSection(
      "table",
      "Table columns",
      <Columns3 size={compactIconSize(11)} className="text-violet-300" />,
      tablePanel,
    );
  }

  pushSection(
    "shortcuts",
    "Keyboard shortcuts",
    <Keyboard size={compactIconSize(11)} className="text-indigo-300" />,
    <HubKeyboardShortcutsPanel className="-mx-1" />,
  );

  const showSettingsToc = tocItems.length > 1;

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
