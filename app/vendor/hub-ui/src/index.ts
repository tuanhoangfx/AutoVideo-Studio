export { HubDisplayPrefs } from "./display-prefs/HubDisplayPrefs";
export { Section, SectionIcon, TabButton, ToggleRow } from "./display-prefs/primitives";
export { LIMIT_OPTIONS, TIME_RANGES, type TimeRange } from "./display-prefs/constants";
export {
  CHART_KEY_MIGRATION,
  migrateChartKeyList,
  migrateChartKeySet,
  migrateChartKeysWithPersist,
  serializeChartKeySet,
} from "./display-prefs/chart-key-migrate";
export {
  MAX_VISIBLE_KPI,
  defaultKpiKeysExcluding,
  defaultKpiKeysFromDefs,
  enforceKpiMaxOnAdd,
  resolveVisibleKpiKeys,
} from "./display-prefs/kpi-visible";
export type {
  DisplayPrefsPrefs,
  HubDisplayPrefsProps,
  PrefItem,
  SettingsExtraTab,
  SystemDisplayAdapter,
} from "./display-prefs/types";
export { compactIconSize, HUB_COMPACT_SCALE } from "./ui-scale";
export {
  applyHubUserZoomPct,
  HUB_USER_ZOOM_DEFAULT,
  HUB_USER_ZOOM_MAX,
  HUB_USER_ZOOM_MIN,
  HUB_USER_ZOOM_STEPS,
  hubUserZoomStepIndex,
  initHubUserZoom,
  readHubUserZoomPct,
  type HubUserZoomPct,
} from "./hub-user-zoom";
export { HubUiZoomControl } from "./shell/HubUiZoomControl";
export {
  hideBootLoader,
  ensureHubTabLoaderRoot,
  HUB_BOOT_LOADER_ID,
  HUB_TAB_LOADER_ROOT_ID,
} from "./loading/hub-loader-dom";
export { HubLoaderRoot } from "./shell/HubLoaderRoot";
export { HubLoadingView, type HubLoadingViewProps } from "./shell/HubLoadingView";
export {
  FilterBar,
  HubSingleFilterDropdown,
  type FilterDef,
  type FilterOption,
  type FilterValues,
  type HubSingleFilterDropdownProps,
} from "./shell/FilterBar";
export {
  HUB_FILTER_DROPDOWN_PANEL_CLASS,
  HUB_FILTER_DROPDOWN_PANEL_PORTAL_CLASS,
  HUB_FILTER_DROPDOWN_ROW_CLASS,
  HubFilterDropdownCircle,
  HubFilterDropdownTrigger,
  folderFilterButtonLabel,
  hubFilterTriggerClass,
} from "./shell/filter-dropdown-primitives";
export { enrichFilterDefs } from "./lib/filter-option-counts";
export { HubFilterSelect, type HubFilterSelectOption } from "./shell/HubFilterSelect";
export {
  AppTabHeader,
  type TabHeaderMetaItem,
  type TabHeaderStatItem,
  type TabTitleMenuItem,
} from "./shell/AppTabHeader";
export { KpiStrip, type KpiTileData } from "./shell/KpiStrip";
export { MiniBarChart, type BarItem } from "./shell/MiniBarChart";
export { MiniDonut, type DonutItem } from "./shell/MiniDonut";
export { MetricBadge, RegistryMetricBadge, type MetricBadgeProps, type MetricBadgeTone } from "./shell/MetricBadge";
export { HubCopyBadge, type HubCopyBadgeProps } from "./shell/HubCopyBadge";
export { CopyMetaChip, MetaChip, type MetaTone } from "./shell/CopyMetaChip";
export { HubResultCount } from "./shell/HubResultCount";
export { ViewToggle, type HubViewMode } from "./shell/ViewToggle";
export {
  HubTabChrome,
  HubTabBody,
  configureHubChromePrefs,
  useHubChromePrefs,
  type HubChromePrefs,
} from "./shell/HubTabChrome";
export { HubTabSectionRule } from "./shell/HubTabSectionRule";
export { HubAlert } from "./content/HubAlert";
export { HubDataTable, HubTableEmptyRow, type HubTableColumn } from "./content/HubDataTable";
export { HubTableColumnHeader, type HubTableColumnHeaderProps } from "./content/HubTableColumnHeader";
export {
  HUB_TABLE_COLUMN_META,
  resolveHubTableColumnMeta,
  type HubTableColumnMeta,
  type HubTableColumnRole,
} from "./table/hub-table-column-meta";
export { HubPanel } from "./content/HubPanel";
export { HubDirectoryCard } from "./content/HubDirectoryCard";
export { HubTabScreenBody } from "./content/HubTabScreenBody";
export { HubDirectoryScreen, type HubDirectoryScreenProps } from "./templates/HubDirectoryScreen";
export {
  HUB_UI_TEMPLATES,
  GOLDEN_SOURCES,
  isHubUiTemplate,
  type HubUiTemplate,
  type UiScreenEntry,
} from "./ui-template-types";
export {
  configureFilterIcons,
  resolveFilterAllIcon,
  resolveFilterOptionIcon,
  type FilterIconMeta,
  type FilterIconResolver,
} from "./shell/filter-icons";
export {
  CHART_OTHERS_LABEL,
  configureChartLegend,
  prepareChartItems,
  topChartItems,
  type ChartRow,
} from "./chart-items";
export { usePageSessionSeconds } from "./hooks/usePageSessionSeconds";
export {
  HUB_SHORTCUT_LEGEND,
  configureHubPageShortcuts,
  getHubActiveScreen,
  registerHubPageShortcuts,
  registerHubSearchClear,
  registerHubSearchFocus,
  registerHubSettingsOpen,
  setHubActiveScreen,
  type HubPageShortcutHandlers,
  type HubShortcutId,
} from "./keyboard/hub-keyboard-shortcuts";
export { useHubPageShortcuts } from "./keyboard/useHubPageShortcuts";
export {
  hubSystemShortcutScope,
  resolveHubActiveScreenId,
  useHubActiveScreenSync,
} from "./keyboard/useHubActiveScreenSync";
export { HubKeyboardHints } from "./keyboard/HubKeyboardHints";
export { HubKeyboardShortcutsPanel } from "./keyboard/HubKeyboardShortcutsPanel";
export { WorkspaceTabHeader, type WorkspaceTabHeaderProps } from "./shell/WorkspaceTabHeader";
export { buildVersionMetaItems } from "./shell/workspace-tab-header-meta";
export { HubModalCloseButton, type HubModalCloseButtonProps } from "./shell/HubModalCloseButton";
export { HubModalFrame, type HubModalFrameProps } from "./shell/HubModalFrame";
export { HubDetailModal, type HubDetailModalProps, type HubDetailModalSize } from "./shell/HubDetailModal";
export {
  HubToolDetailModal,
  HubToolDetailModalPrimaryAction,
  HubToolDetailModalSecondaryAction,
  HubToolDetailModalTocLayout,
  HUB_TOOL_DETAIL_BODY_SCROLL_CLASS,
  HUB_TOOL_DETAIL_SCROLL_CLASS,
  HUB_TOOL_DETAIL_SCROLL_ROOT,
  HUB_TOOL_DETAIL_TITLE_ID,
  type HubToolDetailModalPrimaryActionProps,
  type HubToolDetailModalProps,
  type HubToolDetailModalTocLayoutProps,
} from "./shell/HubToolDetailModal";
export { HubFormFieldLabel, type HubFormFieldLabelProps } from "./shell/HubFormFieldLabel";
export { HubModalFilterField, type HubModalFilterFieldProps } from "./shell/HubModalFilterField";
export {
  HubToolDetailSection,
  HubToolDetailSections,
  HUB_TOOL_DETAIL_SECTIONS_CLASS,
  HUB_TOOL_DETAIL_FORM_GRID_CLASS,
  HUB_TOOL_DETAIL_FORM_GRID_2_CLASS,
  HUB_TOOL_DETAIL_FORM_GRID_3_CLASS,
  type HubToolDetailSectionProps,
} from "./shell/HubToolDetailSection";
export {
  HubTocSectionHighlightProvider,
  HubTocHighlightContent,
  useHubTocNavHighlight,
  useHubTocNavActive,
  useHubTocSectionHighlightOptional,
} from "./shell/HubTocSectionHighlight";
export { scrollToHubTocSection, findHubTocScrollContainer } from "./shell/hub-toc-scroll";
export { resolveActiveTocSection, useHubTocSectionSpy } from "./shell/hub-toc-section-spy";
export { HubTocSectionNav, type HubTocNavItem } from "./shell/HubTocSectionNav";
export { HubHeaderPanelButton, type HubHeaderPanelButtonProps } from "./shell/HubHeaderPanelButton";
export { HubUsageLogPanel, type HubLogEntry, type HubUsageLogPanelProps } from "./shell/HubUsageLogPanel";
