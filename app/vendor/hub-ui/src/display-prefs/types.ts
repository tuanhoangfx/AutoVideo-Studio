import type { ReactNode } from "react";
import type { TimeRange } from "./constants";

export type PrefItem = { key: string; label: string };

/** Extra settings tab (e.g. Cookie bridge / vault) between General and Display. */
export type SettingsExtraTab = {
  id: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
};

export type DisplayPrefsPrefs = {
  range: TimeRange;
  limit: number;
  kpi: Set<string> | null;
  charts: Set<string> | null;
  headerStats: Set<string> | null;
  systemHeaderStats: Set<string> | null;
  headerPin: boolean;
  searchPin: boolean;
  navToggleIcon?: boolean;
  hubFilters?: Set<string> | null;
};

export type SystemDisplaySlice = {
  kpi: Set<string> | null;
  charts: Set<string> | null;
};

export type SystemDisplayAdapter = {
  read: (tab: string) => SystemDisplaySlice | null;
  patch: (tab: string, patch: Partial<{ kpi: string[] | null; charts: string[] | null }>) => void;
  reset: (tab: string) => void;
};

export type HubDisplayPrefsProps = {
  kpis?: PrefItem[];
  charts?: PrefItem[];
  filters?: PrefItem[];
  headerStats?: PrefItem[];
  showHeaderPin?: boolean;
  showRange?: boolean;
  showLimit?: boolean;
  showNavToggle?: boolean;
  /** Hide “Pin search bar” on system screen (P0020 behavior). */
  hideSearchPinOnSystem?: boolean;
  defaultKpiKeys?: Set<string>;
  defaultChartKeys?: Set<string>;
  defaultFilterKeys?: Set<string>;
  defaultHeaderStatKeys?: Set<string>;
  menuPlacement?: "bottom" | "top";
  compact?: boolean;
  sidebarRow?: boolean;
  scope?: "tab" | "global";
  filterParam?: string;
  /** Read visible filter keys from URL (`nfilt`, `cfilt`, …) instead of prefs.hubFilters. */
  filtersFromUrl?: boolean;
  readPrefs: () => DisplayPrefsPrefs;
  patchPrefs: (patch: Record<string, string | null>, logMessage?: string) => void;
  /** Fired after patchPrefs updates URL (default `hub-list-prefs-change`). */
  prefsChangeEvent?: string;
  getScreen: () => string;
  getSystemTab?: () => string;
  systemDisplay?: SystemDisplayAdapter;
  generalExtras?: ReactNode;
  /** TOC rows for sections inside `generalExtras` (DOM ids must match). */
  generalSectionToc?: { id: string; label: string; icon?: ReactNode; emoji?: string }[];
  tablePanel?: ReactNode;
  tableActiveCount?: number;
  headerStatLabel?: (isSystem: boolean) => string;
  onLog?: (scope: string, message: string) => void;
  mainSelector?: string;
  title?: string;
  /** Header dropdown width in px (default 420 — P0020 Cookie Auto). */
  panelWidth?: number;
  /** CSS max-height for scrollable panel (default min(80vh, 42rem)). */
  maxPanelHeight?: string;
  extraTabs?: SettingsExtraTab[];
};
