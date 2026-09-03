/** Narrow re-exports for P0021 (Next.js + vendor copy). */
export { HubSingleFilterDropdown } from '../../vendor/hub-ui/src/shell/FilterBar';
export { AppTabHeader } from '../../vendor/hub-ui/src/shell/AppTabHeader';
export type { TabHeaderMetaItem, TabHeaderStatItem } from '../../vendor/hub-ui/src/shell/AppTabHeader';
export type { HubGlyphComponent } from '../../vendor/hub-ui/src/types/filter-badge';
export {
  HubVersionUpdateStatusIcon,
  type HubVersionUpdateState,
  type HubVersionDesktopUpdate,
  type HubVersionUpdateStatusIconProps,
} from '../../vendor/hub-ui/src/shell/HubVersionUpdateStatusIcon';
export { HubHeaderOpsPanels, type HubHeaderOpsPanelsProps } from '../../vendor/hub-ui/src/shell/HubHeaderOpsPanels';
export { HubListChromeHeader, type HubListChromeHeaderProps } from '../../vendor/hub-ui/src/shell/HubListChromeHeader';
export { buildConsoleVersionMetaItems } from '../../vendor/hub-ui/src/shell/console-version-meta';
export {
  HubDirectorySelectAllChip,
  type HubDirectorySelectAllChipProps,
} from '../../vendor/hub-ui/src/shell/HubDirectorySelectAllChip';
export {
  HubBulkActionButton,
  type HubBulkActionButtonProps,
} from '../../vendor/hub-ui/src/shell/HubBulkActionButton';
export {
  HubDirectoryBulkActionBar,
  type HubDirectoryBulkActionBarProps,
} from '../../vendor/hub-ui/src/shell/HubDirectoryBulkActionBar';
export {
  HubDirectoryDeleteBulkAction,
  type HubDirectoryDeleteBulkActionProps,
} from '../../vendor/hub-ui/src/shell/HubDirectoryDeleteBulkAction';
export {
  HubDirectoryAdaptiveEditAction,
  type HubDirectoryAdaptiveEditActionProps,
} from '../../vendor/hub-ui/src/shell/HubDirectoryAdaptiveEditAction';
export {
  HubHeaderPanelButton,
  type HubHeaderPanelButtonProps,
} from '../../vendor/hub-ui/src/shell/HubHeaderPanelButton';
export {
  HubSegmentToggle,
  hubSegmentIconSize,
  hubSegmentActiveToneClass,
  type HubSegmentToggleOption,
  type HubSegmentActiveTone,
} from '../../vendor/hub-ui/src/shell/HubSegmentToggle';
export { HubTableColumnHeader } from '../../vendor/hub-ui/src/content/HubTableColumnHeader';
export { hubDirectoryFrameTableClass } from '../../vendor/hub-ui/src/table/hub-directory-table-meta';
export {
  HUB_DIRECTORY_TABLE_PANE_CHROME_SPLIT_CLASS,
  HUB_DIRECTORY_TABLE_SCROLL_FLEX_CLASS,
  HUB_DIRECTORY_TABLE_INLINE_WRAP_CLASS,
} from '../../vendor/hub-ui/src/table/directory-table-scroll';
export {
  HubDirectoryTableShell,
  type HubDirectoryTableColumn,
  type HubDirectoryTableStaticColumn,
} from '../../vendor/hub-ui/src/table/HubDirectoryTableShell';
export {
  DirectoryTableBodyCell,
  type DirectoryTableBodyCellProps,
} from '../../vendor/hub-ui/src/table/DirectoryTableBodyCell';
export {
  buildDirectoryColumns,
  buildDirectoryColgroupForShell,
  hubDirectoryTableClass,
} from '../../vendor/hub-ui/src/table/hub-directory-table-meta';
export { createDirectoryColumnMetaHelpers } from '../../vendor/hub-ui/src/lib/directory-column-meta-helpers';
export {
  applyStandardDirectoryColumnHints,
  colHint,
  withFilterLabelHints,
} from '../../vendor/hub-ui/src/lib/directory-column-hint-helpers';
export { hubNoneFilterOption } from '../../vendor/hub-ui/src/lib/hub-none-option';
export {
  countryCodeForLocale,
  flagsApiUrl,
  localeFlagIconSrc,
} from '../../vendor/hub-ui/src/lib/locale-flag';
export {
  buildHubCountryFilterOptions,
  hubCountryFilterOption,
  hubLocaleFlagFilterOption,
} from '../../vendor/hub-ui/src/lib/country-filter-options';
export {
  HubCountryFlagBadge,
  HubCountryInline,
  type HubCountryInlineProps,
} from '../../vendor/hub-ui/src/shell/HubCountryInline';
export {
  hubFilterEmojiToneClass,
  hubFilterOptionEmojiClass,
} from '../../vendor/hub-ui/src/shell/filter-dropdown-primitives';
export {
  HubDirectoryDisplayPanel,
  type HubDirectoryDisplayPanelProps,
} from '../../vendor/hub-ui/src/display-prefs/HubDirectoryDisplayPanel';
export { useDirectoryTableSort } from '../../vendor/hub-ui/src/table/useDirectoryTableSort';
export {
  HubSplitDirectoryPane,
  type HubSplitDirectoryPaneProps,
} from '../../vendor/hub-ui/src/shell/HubSplitDirectoryPane';
export {
  HubSplitDirectoryFilterBar,
  type HubSplitDirectoryFilterBarProps,
} from '../../vendor/hub-ui/src/shell/HubSplitDirectoryFilterBar';
export {
  DirectorySearchToolbar,
  type DirectorySearchToolbarProps,
} from '../../vendor/hub-ui/src/shell/DirectorySearchToolbar';
export {
  useDirectorySearchQuery,
  type DirectorySearchQuery,
  type UseDirectorySearchQueryOptions,
} from '../../vendor/hub-ui/src/hooks/useDirectorySearchQuery';
export {
  enrichFilterDefs,
  type EnrichFilterOptionValuesOf,
} from '../../vendor/hub-ui/src/lib/filter-option-counts';
export {
  createDirectoryTableColumnPrefs,
  countHiddenDirectoryTableColumns,
  type DirectoryTableColumnItem,
  type DirectoryTableColumnPrefs,
} from '../../vendor/hub-ui/src/prefs/directory-table-column-prefs';
export {
  DirectoryTableColumnsSettings,
  type DirectoryTableColumnsSettingsProps,
} from '../../vendor/hub-ui/src/prefs/DirectoryTableColumnsSettings';
export { hubPortalPanelPosition } from '../../vendor/hub-ui/src/shell/hub-portal-panel-position';
export type { FilterDef, FilterOption, FilterValues } from '../../vendor/hub-ui/src/shell/FilterBar';
export {
  HubDirectoryBulkMoreMenu,
  type HubDirectoryBulkMoreAction,
} from '../../vendor/hub-ui/src/shell/HubDirectoryBulkMoreMenu';
export { HUB_SETTINGS_ICON_CLASS } from '../../vendor/hub-ui/src/shell/hub-typography';
export { HubToolDetailModal } from '../../vendor/hub-ui/src/shell/HubToolDetailModal';
export {
  HubToolDetailModalSecondaryAction,
  HubToolDetailModalPrimaryAction,
} from '../../vendor/hub-ui/src/shell/HubToolDetailModalActions';
export { HubToolDetailModalTocLayout } from '../../vendor/hub-ui/src/shell/HubToolDetailModalTocLayout';
export { HUB_TOOL_DETAIL_SCROLL_ROOT } from '../../vendor/hub-ui/src/shell/hubToolDetailModalChrome';
export { HubLazyScreenBoundary } from '../../vendor/hub-ui/src/loading/HubLazyScreenBoundary';
export { HubTocSectionNav, type HubTocNavItem } from '../../vendor/hub-ui/src/shell/HubTocSectionNav';
export { HubToolDetailSection, HUB_TOOL_DETAIL_SECTIONS_CLASS } from '../../vendor/hub-ui/src/shell/HubToolDetailSection';
export { HubAccountDetailAdmScaffold } from '../../vendor/hub-ui/src/shell/HubAccountDetailAdmScaffold';
export {
  hubAccountDetailShellClass,
  HUB_ACCOUNT_DETAIL_MAIN_SCROLL_ROOT,
} from '../../vendor/hub-ui/src/shell/hubAccountDetailModal';
export { HubToolDetailModalAccountFooter } from '../../vendor/hub-ui/src/shell/HubToolDetailModalAccountFooter';
export { HUB_NO_SPELLCHECK_PROPS } from '../../vendor/hub-ui/src/lib/no-spellcheck';
export {
  HubAdmClickEditField,
  HubAdmClickFilterField,
} from '../../vendor/hub-ui/src/shell/HubAdmClickEditField';
export {
  HubAdmNoteEditorField,
  type HubAdmNoteEditorFieldProps,
} from '../../vendor/hub-ui/src/shell/HubAdmNoteEditorField';
export {
  HubAdmDetailNoteLineField,
  HUB_ADM_DETAIL_NOTE_LINE_CLASS,
  type HubAdmDetailNoteLineFieldProps,
} from '../../vendor/hub-ui/src/shell/HubAdmDetailNoteLineField';
export {
  HubAdmGridSlotPad,
  HubBulkDetailField,
  groupHubBulkDetailFieldsForRows,
  type HubBulkDetailFieldDef,
} from '../../vendor/hub-ui/src/shell/HubBulkDetailField';
export type { HubNotifyPanelProps } from '../../vendor/hub-ui/src/shell/HubNotifyPanel';
export { HubAppLogProvider, useHubAppLog } from '../../vendor/hub-ui/src/shell/HubAppLogProvider';
export { HubLogButton } from '../../vendor/hub-ui/src/shell/HubLogButton';
export { HubSidebarShell } from '../../vendor/hub-ui/src/shell/HubSidebarShell';
export { HubSidebarBrandIcon } from '../../vendor/hub-ui/src/shell/HubSidebarBrandIcon';
export { HubSidebarNavScreenButton } from '../../vendor/hub-ui/src/shell/HubSidebarNavScreenButton';
export {
  HubSidebarFooterButton,
  HUB_SIDEBAR_FOOTER_BTN_CLASS,
} from '../../vendor/hub-ui/src/shell/HubSidebarFooterButton';
export {
  navActiveBarClass,
  navActiveBgClass,
  navActiveTextClass,
  navIconClass,
  type NavIconTone,
} from '../../vendor/hub-ui/src/shell/sidebar-nav-tones';

/* Desktop chrome / Display / KPI — required after banning package-index imports */
export { hubDirectoryListResetKey, useHubTablePagination } from '../../vendor/hub-ui/src/table/hub-table-pagination';
export { HubTablePager, type HubTablePagerProps } from '../../vendor/hub-ui/src/content/HubTablePager';
export type { KpiTileData } from '../../vendor/hub-ui/src/shell/KpiStrip';
export {
  HubSplitWorkspaceScreen,
  type HubSplitWorkspaceScreenProps,
} from '../../vendor/hub-ui/src/templates/HubSplitWorkspaceScreen';
export {
  HubDirectorySettings,
  type HubDirectorySettingsProps,
} from '../../vendor/hub-ui/src/shell/HubDirectorySettings';
export {
  patchHubListPrefs,
  readHubListPrefsCore,
} from '../../vendor/hub-ui/src/lib/hub-url-prefs';
export { triggerHubSettingsOpen } from '../../vendor/hub-ui/src/keyboard/hub-keyboard-shortcuts';
export { resolveHubToolIconSrcForVite } from '../../vendor/hub-ui/src/loading/resolve-hub-tool-icon';
export type { NavStructureEntry } from '../../vendor/hub-ui/src/shell/nav-sidebar-structure';
