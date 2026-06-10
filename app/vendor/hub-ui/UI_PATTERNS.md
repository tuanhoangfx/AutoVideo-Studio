# Hub UI patterns (unified)

**Catalog:** `Tool/schemas/ui-patterns.catalog.json`  
**Clone:** `node Tool/scripts/hub-ui-stack.cjs P00xx <screen>`  
**Agent tab:** Kind **Pattern** (ready goldens only)

**Deferred** (không có row Agent — chuẩn hóa sau): `dashboard`, `inbox-split` → `deferredPatterns[]` trong catalog.

---

## Ready patterns (Agent)

| ID | Layer | Golden |
|----|-------|--------|
| `directory` | screen | P0004/hub-list |
| `document-toc` | screen | P0004/overview-toc |
| `system-panels` | screen | P0004/system |
| `workspace-composer` | screen | P0020/notes |
| `inbox-split` | screen | P0016/inbox |
| `split-pane-scroll` | primitive | packages/hub-ui/split-pane-scroll |
| `auth-gate` | modal | hub-ui/auth (V2) |
| `user-access-modal` | modal | P0004/users |

**Directory** = card + table via **ViewToggle** (one pattern).  
**System** = Agent table + Quota table inside `panels[]` (not separate rows).

---

## Auth gate (golden V2 — hub-ui)

**Canonical source:** `packages/hub-ui/src/auth/` + `hub-auth-gate.css` → fan-out via `node Tool/scripts/sync-hub-ui-vendor.cjs`.

| Component | When to use |
|-----------|-------------|
| `WorkspaceAuthGate` | **Preferred** — tool login adapter + shared forgot-password (`createHubForgotPasswordHandler`) |
| `HubAuthGate` | Low-level gate wrapper — opens modal on mount |
| `HubAuthGateModal` | Sign In / Sign Up / Anonymous tabs (Anonymous optional via `onAnonymous`) |
| `HubWorkspaceUserShell` | **Preferred** — `HubSidebarUserFooter` + `HubWorkspaceUserModal` + sign-out state |
| `HubSidebarUserFooter` | Sidebar User row + `HubAuthSessionBadge` + email label |
| `HubWorkspaceUserModal` | Workspace logout / profile modal (P0020 / P0016) |
| `HubFullUserAccountModal` | Hub admin account modal (P0004) |
| `HubAuthLogoutChip` | Extension header (E0001) — email + LogOut icon |
| `HubAuthSessionBadge` | Anonymous / Signed in pill on User row |
| `HubAccessDeniedPanel` | Access denied card (replaces inline `auth-inline` in tool src) |
| `HubAuthGateGoldenPreview` | Design Template · onboarding examples |

**Rules**

- **No prompt overlay** — modal-only (removed `HubAuthPrompt` / `auth-waiting`).
- P0020: tab **Anonymous** → `onAnonymous` (local session); × / backdrop dismiss same path.
- P0004: **no Anonymous tab** — modal non-dismissible until sign-in.
- Panel **30rem**; backdrop `rgba(8,12,28,0.52)` + `blur(8px)`.
- Settings toggle label: **Anonymous mode** (not Offline).
- **Do not** import `theme/hub-auth.css` in tools — overrides golden `hub-auth-gate.css` (blur 14px / 26rem).

**Golden refs (single source)**

- **Canonical UI** — `packages/hub-ui/src/auth/HubAuthGateModal.tsx` · registry ref **`hub-ui/auth`**
- **Factory** — `WorkspaceAuthGate` + `createWorkspaceAuthGate` in `packages/hub-ui/src/auth/WorkspaceAuthGate.tsx`
- **Scaffold** — `node Tool/scripts/sync-hub-ui-screen.cjs P00xx auth` → `examples/GoldenAuthGateAdapter.tsx`
- **authVariant** — `standard` (P0004, P0016) · `anonymous-dual` (P0020) — see `ui-patterns.catalog.json` → `auth-gate.authVariants`
- **Adapters** — P0004 `HubAuthGate.tsx` · P0016 `ChatCenterAuthGate.tsx` · P0020 `NotesAuthGate.tsx`
- **Preview** — `HubAuthGateGoldenPreview` · `examples/GoldenAuthGateScreen.tsx`
- **CI** — `node Tool/scripts/hub-auth-migration-check.mjs`
- **E0001** — `popup.html` / `popup-theme.css` (parity script)

---

## Filter (golden — P0004 Hub)

**Canonical source:** `P0004/vendor/hub-ui` → promoted to `packages/hub-ui` via `node Tool/scripts/sync-hub-ui-vendor.cjs`.

| Layer | Component | When to use |
|-------|-----------|-------------|
| Screen | `HubDirectoryScreen` + `FilterBar layout="hub"` | Directory tabs (Hub, 2FA, Cookie, Notes, System) |
| Dropdown | `HubSingleFilterDropdown` | Single-select in forms/modals |
| Primitives | `HubFilterDropdownTrigger`, `HubFilterDropdownCircle`, `HUB_FILTER_DROPDOWN_*_CLASS` | Custom multi-select pickers (e.g. note folder tagger) |
| Toolbar | `HubTimeRangeSelect`, `HubRowLimitSelect`, `HubResultCount` | FilterBar `toolbar` / `row2Actions` slot |

**Rules**

- Directory screens: **always** `FilterBar layout="hub"` via `HubDirectoryScreen` — never local chip/toolbar CSS.
- Modal / narrow context: `FilterBar layout="inline"` or `HubSingleFilterDropdown`.
- Custom folder/tag pickers: import primitives from `@tool-workspace/hub-ui` only — no per-tool `filter-dropdown-ui` copies.
- Register filter icons once: `configureFilterIcons` in app `setupHubUi()`.

**Exceptions (documented)**

- **P0008** — `app/src/components/table/FilterBar.tsx` fork for Next.js RSC (icon keys as strings). Align visually with golden tokens; do not copy into Vite tools.

**Removed legacy:** `ToolFilterBar` + `.filter-toolbar` / `.chip` CSS (P0004, P0020).

---

## Split-pane scroll (golden — hub-ui)

**Canonical source:** `packages/hub-ui/src/styles/hub-split-scroll.css` + tokens in tool `p0008-globals.css` → fan-out via `node Tool/scripts/sync-hub-ui-vendor.cjs`.

**CSS tokens** (`:root` / `.theme-hub` in `p0008-globals.css`):

| Token | Default | Role |
|-------|---------|------|
| `--hub-split-scroll-size` | `10px` | WebKit scrollbar width (matches global `::-webkit-scrollbar`) |
| `--hub-split-scroll-track` | `transparent` | Track |
| `--hub-split-scroll-thumb` | `#2a3158` | Thumb |
| `--hub-split-scroll-thumb-hover` | `#3a4178` | Thumb hover |
| `--hub-split-scroll-radius` | `6px` | Thumb radius |

**Classes**

| Class | When to use |
|-------|-------------|
| `hub-split-scroll` | Any fixed-height split pane body (list rail, editor body, History TOC, diff panes) |
| `hub-split-scroll--rail` | Left TOC / thread list / snapshot rail |
| `hub-split-scroll--panel` | Main editor / message body / compare center |

**Layout rules (workspace-composer / inbox-split)**

- Tab shell: `hub-main--notes` / `hub-main--inbox` → `overflow: hidden` (no page scroll).
- Flex chain: `hub-tab-content-zone` → `hub-tab-body-zone--split` → `notes-workspace__body` / `inbox-split-pane` — all `flex: 1; min-height: 0; overflow: hidden`.
- **One scroll layer per pane** — attach `hub-split-scroll` on the inner scroll container only; parent `overflow: hidden`.
- Editor textarea: `overflow: hidden` on `.notes-editor__textarea` — long content scrolls on `.notes-editor__body.hub-split-scroll`, not nested scrollbars.
- Import: `@import "…/hub-split-scroll.css"` in tool `hub-ui-styles.css` (after `hub-shell-layout.css`).

**Virtual list (Notes / Inbox rail)**

| Constant | Value | Location |
|----------|-------|----------|
| `VIRTUAL_THRESHOLD` | `48` notes | P0020 `useNotesListVirtualWindow.ts` |
| Row height compact | `38px` | `NOTES_LIST_ROW_HEIGHT.compact` |
| Row height comfortable | `46px` | `NOTES_LIST_ROW_HEIGHT.comfortable` |

**Selected row scroll-into-view**

- P0020 `NotesListRail`: `scrollNoteIntoView(noteId, index)` on `selectedId` change (`block: nearest`, virtual = index × rowHeight math).
- Row button: `data-note-id="{id}"` for non-virtual DOM path.
- Skip scroll when row already in viewport (`isIndexInScrollView` margin `6px`).

**Golden refs**

- CSS — `vendor/hub-ui/src/styles/hub-split-scroll.css`
- P0020 — `NotesListRail.tsx`, `NoteEditorPanel.tsx`, `noteHistoryTocRails.tsx`, `theme/data-box-layout.css`
- P0016 — `InboxThreadsRail.tsx`, `InboxThreadPanel.tsx`, `theme/inbox-layout.css`
- History modal — `note-history-modal.css` + `hub-split-scroll` on TOC / diff panes

**Do not**

- Duplicate webkit scrollbar rules per tool (`inbox-layout.css` local overrides — removed).
- Use `overflow-y: scroll` on both `hub-main` and pane body (double scrollbar).
- Expand textarea to `scrollHeight` without constraining pane height.

---

## Tab header (golden — AppTabHeader)

**Canonical source:** `packages/hub-ui/src/shell/AppTabHeader.tsx` + `app-tab-header.css` → fan-out via `node Tool/scripts/sync-hub-ui-vendor.cjs`.

**Layout contract (P0004 Hub / all directory tabs):**

```
[start]  title · session · version/meta     [center]  centerStats (KPI strip)     [end]  actions only
```

| Column | CSS class | Content | Rules |
|--------|-----------|---------|-------|
| Start | `.app-tab-header__start` | Tab title (icon + h1) · **Session** timer · version meta (`Tag` + `vX · hh:mm dd/mm/yy`) | Session **before** version meta; never in end rail |
| Center | `.app-tab-header-center-stats` | `centerStats` from app (`buildHubHeaderStats`, `buildDashboardHeaderStats`, …) | Always `flex` (not `hidden xl:flex`); `justify-self-center` |
| End | `.app-tab-header__end` | `actions` slot — **Log** + **Settings** only | No Session, no KPI stats |

**Grid:** `grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr)` — symmetric columns so center stats stay viewport-centered.

**App wiring**

| Tool | Header wrapper | Version meta |
|------|----------------|--------------|
| P0004 Dashboard | `DashboardChromeHeader` | `buildVersionMetaItems` + `resolveVersionReleaseMeta` |
| P0004 Hub | `HubStickyHeader` / `HubListChromeHeader` | same |
| P0004 Users | `UserListChromeHeader` | same |
| P0004 System | `SystemTabHeader` | same |
| P0020 workspace | `WorkspaceTabHeader` | `buildVersionMetaItems(versionLine)` in hub-ui |

**Version timestamp sources** (`resolveVersionReleaseMeta`): GitHub release → manifest `latestPublished` → CHANGELOG exact semver → CHANGELOG latest block (dev fallback).

**Version triple** (`package.json` · `tool.manifest.json release.version` · CHANGELOG top `- Version:`): kept in sync by `bumpAndSyncDocs` (pre-commit), `ensure-changelog-version-block.mjs --write` (pre-push), and `syncToolManifestReleaseVersion` in `version-sync-lib.cjs`.

**Do not**

- Put Session in `__end` or mix KPI stats into `actions`.
- Fork `AppTabHeader` per tool — re-export from `@tool-workspace/hub-ui` only.
- Use asymmetric grid (`max-content` right column) — breaks center alignment.

**CI**

```bash
node Tool/scripts/hub-ui-parity-check.mjs --code P0004 --screen dashboard
node Tool/scripts/hub-ui-parity-check.mjs --app-tab-header-only
node Tool/scripts/ensure-changelog-version-block.mjs --code P0004 --check
```

Checks: `session-in-start-rail`, `center-stats-always-visible`, `grid-three-column-centered`, vendor byte-sync for `AppTabHeader.tsx` + `app-tab-header.css` across P0004 · P0016 · P0008 · P0020 · P0021.

**CI / hooks:** `Tool/.github/workflows/hub-ui-governance.yml` runs `--app-tab-header-only` + `ensure-changelog-version-block.mjs --all --check`. Pre-push (via `install-product-git-hooks.cjs --all`) runs CHANGELOG ensure `--write` then header check.

**Golden refs**

- Package — `AppTabHeader.tsx`, `WorkspaceTabHeader.tsx` (docstring)
- P0004 — `DashboardChromeHeader.tsx`, `HubStickyHeader.tsx`, `src/lib/app-release.ts`

---

## Sidebar nav tones (golden — hub-ui)

**Canonical source:** `packages/hub-ui/src/shell/sidebar-nav-tones.ts` → fan-out via `node Tool/scripts/sync-hub-ui-vendor.cjs`.

| API | When to use |
|-----|-------------|
| `NavIconTone` | Per menu item — assign once in nav registry (`items[]`, `NAV_STRUCTURE`, `SYSTEM_TAB_ITEMS`) |
| `navIconClass(tone, active)` | Icon color (idle 75% · hover · active) |
| `navDotClass` / `navRailClass` | System-style subnav dot + vertical connector |
| `HubSidebarNavGroup` / `NavGroupSubNav` | Expandable group header + dot/rail subnav list |
| `NavScreenGroupConfig` / `NavViewGroupConfig` | Sidebar nav registry — screen children vs URL sub-view children |
| `navGroupSubnavOpenKey` / `flatMapNavScreenItems` | SessionStorage keys + flat nav for tab headers |
| `navActiveBarClass` / `navActiveBgClass` / `navActiveTextClass` | Main nav active row (left bar · gradient · label) |

**Tone palette:** `sky` · `indigo` · `emerald` · `amber` · `cyan` · `violet` · `rose` · `fuchsia` · `blue` — one distinct tone per sidebar item; reuse across Dashboard cards, tab headers, and subnav.

**Rules**

- Import helpers from `@tool-workspace/hub-ui` only — no per-tool `sidebar-nav-tones.ts` copies.
- Every primary nav item **must** declare `iconTone`; subnav items inherit the same contract.
- Footer rows keep fixed tones: User `violet`, Refresh `emerald`, Log `cyan`, Settings `amber`.
- Tab group badges (`HUB_APP_TAB_GROUP_META`) and template badges (`HUB_UI_TEMPLATE_META`) use `iconTone` → `navBadgeIconClass` / `navBadgeVariantClass`.
- Dashboard KPI tiles use `navKpiTone(meta.iconTone)` — `KpiStripTone` matches full `NavIconTone` palette.
- Dashboard header stats use `navBadgeIconClass(meta.iconTone)`; filter **group** / **template** All-icons and options delegate to tab-group / template meta.
- Chart bars/donuts use `navChartColor(meta.iconTone)`; card/table meta lines use `navMetaTextClass(entry.iconTone)`.
- Do **not** hardcode `text-indigo-300` / `from-indigo-500/20` on active sidebar rows when `iconTone` is available.

**Golden refs**

- P0004 — `SalesSidebar.tsx`, `SystemTabSubNav.tsx`, `dashboard-tab-registry.ts` (`iconTone` on `DashboardTabEntry`)
- P0020 — `WorkspaceSidebar.tsx`
- P0016 — `nav-structure.ts`, `HubShellSidebar.tsx` (`HubSidebarNavGroup` + `NavGroupSubNav`)
- P0008 — `layout/Sidebar.tsx`, `system/SystemTabs.tsx`
- P0021 — `workspace/WorkspaceShell.tsx`

**Verify:** `node Tool/scripts/hub-ui-duplication-check.mjs`

---

## Semantic icon registry (golden)

**Canonical:** `packages/hub-ui/src/lib/semantic-icon-registry.ts`  
**Types:** `packages/hub-ui/src/types/semantic-icon.ts`

One semantic key maps icon + tone across **badge**, **KPI strip**, **tab header stat**, and **modal TOC** surfaces.

| Helper | Surface | Example |
|--------|---------|---------|
| `semanticFilterMeta(key)` | Filter chips / MetricBadge | `skill` → Puzzle |
| `semanticKpiIcon(key)` | `KpiStrip` tiles | `{ ...semanticKpiIcon("kpi.inbox.unread") }` |
| `semanticHeaderStat(key)` | Tab header stat line | `{ ...semanticHeaderStat("kpi.fanpages.pages") }` |
| `buildSemanticTocIcon(key)` | Settings / User / Log TOC + section header | `icon={buildSemanticTocIcon("user.account")}` |
| `resolveSemanticIcon(key)` | Raw `{ icon, className, tone }` | Custom wrappers |

**Key namespaces (add new keys here — never hardcode Lucide in screens):**

| Prefix | Use |
|--------|-----|
| `agent.*` | Agent context kind / scope / apply mode |
| `settings.*` | Display prefs modal TOC sections |
| `user.*` | Workspace / full user account modals |
| `log.*` | Usage log panel TOC + trigger |
| `personality.*` | Personality edit modal sections |
| `kpi.*` | Hub / User tab KPI tiles (`kpi.inbox.*`, `kpi.schema.*`, …) |
| `template.*` | Design template KPI |
| `field.custom` | JSONB custom fields |

**Rules**

- Hub / User `*Screen.tsx` and directory `*Page.tsx` KPI tiles **must** spread `semanticKpiIcon("…")` — enforced by `node Tool/scripts/hub-ui-icon-parity-check.mjs`.
- Modal TOC sections use `buildSemanticTocIcon` on **both** TOC rail and `HubToolDetailSection` `icon` prop (Settings golden).
- Dynamic per-row icons (e.g. `createBotAccountKpiIcon`) are allowed; static Lucide in KPI objects is not.
- Fan-out: `node Tool/scripts/sync-hub-ui-vendor.cjs` copies registry to all vendor `hub-ui`.

**Golden refs**

- Settings TOC — `HubDisplayPrefs.tsx` (`settings.*` keys)
- User modal — shell V5 · labels L1 `HubUserModalFieldTable` · `HubFullUserAccountModal` / `HubWorkspaceUserModal` (Cookie FAB FieldRow)
- Log panel — `HubUsageLogPanel.tsx` (`log.*` keys)
- P0016 directory KPIs — `InboxScreen.tsx`, `FanpagesScreen.tsx`, …

---

## URL prefs + toolbar (golden — hub-ui)

**Canonical source:** `packages/hub-ui/src/lib/hub-url-prefs.ts`, `HubTimeRangeSelect.tsx`, `HubRowLimitSelect.tsx`.

| API | When to use |
|-----|-------------|
| `configureHubUrlPrefs({ defaultRange, defaultLimit, patchImpl, usePrefsChangeEvent })` | Once in app bootstrap / `url-prefs.ts` module load |
| `readHubListPrefsCore()` + app extras | Per-tool `readHubListPrefs()` wrapper |
| `patchHubListPrefs` / `parseHubPrefSet` | Shared URL read/write |
| `HubTimeRangeSelect` / `HubRowLimitSelect` | FilterBar toolbar — import from `@tool-workspace/hub-ui` |

**Rules**

- Do **not** fork toolbar selects per tool — configure defaults via `configureHubUrlPrefs`.
- P0004: custom `patchImpl` (`buildAppUrl` + screen sanitize). P0020: `usePrefsChangeEvent: true`.
- Per-tool `url-prefs.ts` stays Tier 2 (extra fields only).

**Verify:** `node Tool/scripts/hub-ui-duplication-check.mjs`

---

## KPI + Charts analytics band (golden — hub-ui)

**Canonical source:** `packages/hub-ui/src/display-prefs/kpi-visible.ts`, `chart-visible.ts`, `HubDisplayPrefs.tsx`, `KpiStrip.tsx`, `hub-shell-layout.css` → fan-out via `node Tool/scripts/sync-hub-ui-vendor.cjs`.

| API / component | When to use |
|-----------------|-------------|
| `MAX_VISIBLE_KPI` (8) | Hard cap — max tiles rendered per tab row |
| `DEFAULT_KPI_ON_COUNT` (4) | Default on-count via `defaultKpiKeysFromDefs(defs)` — do not pass `MAX_VISIBLE_KPI` as default |
| `resolveVisibleKpiKeys` / `useResolvedVisibleKpiKeys` | Filter KPI tile data before `KpiStrip` |
| `enforceKpiMaxOnAdd` | Settings toggle only — drops earliest visible key when user exceeds cap |
| `KpiStrip` | Render filtered tiles; sets `data-kpi-count` for CSS slot grid |
| `HubDisplayPrefs` + `SubTabDisplayConfig` | Settings panel; URL prefs (Hub/Dashboard/Users) or `sessionStorage` (System/Fanpages) |

**Layout rules (KPI strip + Charts band)**

- **Fixed slot grid (1–3 visible)** — `md+` (768px): **4-column** grid; each slot = **1/4 row**. Example: 3 visible → **3/4** width (KPI + Charts).
- **Full row (4–8 KPI / 4 Charts)** — `md+` grid columns = visible count (`repeat(n, 1fr)`); tiles **fill the full line**.
- **Charts band** — `hub-charts-band` + `data-chart-count` (auto via `countAnalyticsBandSlots` in `HubTabScreenBody`; override with `chartCount` prop).
- CSS canonical: `hub-shell-layout.css` only — `node Tool/scripts/hub-ui-duplication-check.mjs` fails on per-tool grid overrides.
- **P0016 dashboard** exception: `p0016-hub-charts.css` mirrors golden rules on `.p0016-charts-row[data-chart-count]` inside full-width layout wrapper.

**Settings / multi-select rules**

- KPI toggles are **multi-select** `Set`, not radio. Label: `KPI (n/8)`.
- Sub-tab screens (System, Fanpages): `HubDisplayPrefs` must bump `displayTick` after `adapter.patch()` so the open Settings modal re-reads `sessionStorage` (avoid overwrite on 2nd toggle).
- Toggle `on` uses `isVisible(stored, defaults, key)` — not `resolveVisibleKpiKeys().has(key)`.
- When `n >= MAX_VISIBLE_KPI`, **disable** unselected toggles (`ToggleRow disabled`) — user must turn one off before adding another.

**Per-tool wiring**

- Define `*_KPI_DEFS: PrefItem[]` + `DEFAULT_*_KPI_KEYS = defaultKpiKeysFromDefs(defs)` (4 on by default).
- URL tabs: `readHubListPrefs().kpi` + `patchHubListPrefs({ kpi: "a,b,c" })`.
- Sub-tab tabs: `SubTabDisplayConfig` with `changeEvent` (e.g. `system-display-change`); analytics hook listens + `displayTick`.

**Golden refs**

- P0004 — `HubListPage.tsx`, `system-display-prefs.ts`, `DisplayPrefs.tsx` (`SYSTEM_SUBTAB_CFG`)
- P0016 — `fanpage-display-prefs.ts`, `use-screen-display-prefs.ts`
- P0020 — `cookie-display-prefs.ts`, `twofa-display-prefs.ts`

---

## Copy affordance (golden — hub-ui)

**Canonical source:** `packages/hub-ui/src/shell/HubCopyBadge.tsx`, `CopyMetaChip.tsx` → fan-out via `node Tool/scripts/sync-hub-ui-vendor.cjs`.

| Component | When to use | Feedback |
|-----------|-------------|----------|
| `HubCopyBadge` | Directory table ID column, mono value chip (P0004 Users, P0016 bots/groups/channels) | Fingerprint + label + **Copy icon always visible**; small **Check** appended on success (~1.4s) |
| `CopyMetaChip` | Meta strip pills (note ID, tagged values) | Tone chip unchanged; **Check** beside chip on success — never swap label to "Copied" |
| `TwofaCopyControl` | 2FA table Account / Password / Secret / Code (P0020 production) | Plain text or badge body unchanged; **Check 10px** beside value |

**Rules**

- Import from `@tool-workspace/hub-ui` — no per-tool `HubCopyBadge` forks (P0016/P0020 re-export shims are deprecated).
- Do **not** replace content with "Copied" text or swap the leading icon for a check.
- Do **not** change chip tone on copy (`CopyMetaChip` keeps original `MetaTone`).
- Table cells: `e.stopPropagation()` on copy button so row select does not fire.

**Golden refs**

- `HubCopyBadge` — `P0004/UserDirectoryTable.tsx` ID column
- `CopyMetaChip` — `P0020/NoteEditorMetaStrip.tsx` note ID
- `TwofaCopyControl` — `P0020/twofa-copy-cells.tsx` (Design V1 Platform Mirror)

---

## Table pager (golden — hub-ui)

**Canonical source:** `packages/hub-ui/src/content/HubTablePager.tsx`, `HubPaginatedTableShell.tsx`, `HubPaginatedDataTable.tsx` → fan-out via `node Tool/scripts/sync-hub-ui-vendor.cjs`.

| Component | When to use |
|-----------|-------------|
| `HubPaginatedDataTable` | Standard `HubDataTable` + columns + `renderRow` (Logs, User access modal, golden directory example) |
| `HubPaginatedTableShell` | Custom `hub-users-table` markup (directory clones, Overview panel tables, Cookie routes) |
| `HubPaginatedCardGrid` | Directory card/grid views (Users, Tools, Groups, …) — bottom pager |
| `useHubTablePagination` + `HubTablePager` | Manual composition when shell layout must split pager/table |

**Rules**

- **25 rows/page** default (`HUB_TABLE_PAGE_SIZE` / `readHubTablePageSize`) — E0001 `route-table-pager` visual parity (prev/next + `Page X of Y · Showing A–B of N`).
- **Page size** 25/50/100 via Settings → Display → Page size (`tpage` URL param, `useHubTablePageSize()` in shells).
- Pass `resetKey` when filter/search changes (e.g. `` `${query}|${JSON.stringify(filterValues)}` ``); omit for auto signature from list head/tail.
- Pager sits **below** the table (or card grid); hidden when `totalCount ≤ pageSize`.
- Card directory views use `HubPaginatedCardGrid` (or `HubPaginatedTableShell` when the child supplies its own grid).
- **Select all** in directory tables applies to **current page only** (`hubTogglePageSelectAll` / `hubPageAllSelected`); label `"Select all on this page"`.
- Import CSS via `@import "@tool-workspace/hub-ui/styles/hub-users-table.css"` (`.hub-table-pager` tokens).

**Golden refs**

- Overview panel tables — `P0004/ToolLinksTable.tsx`, `ToolVersionsPanel.tsx`
- Directory — `P0004/HubToolsDirectoryTable.tsx`, `UserDirectoryTable.tsx`
- Clone — P0016 bots/groups/channels/logs/fanpages; P0020 cookie/twofa/notes folders

---

## Modal directory section (golden — hub-ui)

**Canonical source:** `packages/hub-ui/src/shell/HubModalDirectorySection.tsx`, `route-detail/HubRouteAboutSummary.tsx`, `table/hub-route-access-table-meta.tsx`.

| Component | When to use |
|-----------|-------------|
| `HubModalDirectorySection` | **Any** `HubToolDetailSection` that has FilterBar + table (User Access tools, Cookie Route access, future P0016) |
| `HubToolDetailIdentityHeader` | Modal header row — avatar/icon · title · trailing badges (User Access, Cookie Route, **Hub Tool detail**) |
| `HubModalDirectoryEmptyFiltered` | Zero rows after search/filters — same empty box as P0004 User Access |
| `HubPaginatedDataTable` | Modal table **≤6 columns**, simple rows, optional checkbox in `renderRow` (P0004 User Access tools) |
| `HubRouteAccessDirectoryTable` | Route People & access — `HubPaginatedDataTable` + `--route-access-modal` (same wrap as User Tools) |
| `HubRouteAccessDirectoryTableSkeleton` | Loading placeholder for route access table (7 columns incl. Activity) |
| `HubUserToolsDirectoryTable` | User Access tools table — wraps `HubPaginatedDataTable` + `HUB_USER_TOOLS_*` meta; inject category/access cells only |
| `HubUserToolsDirectoryTableSkeleton` | Loading placeholder for User Access tools table |
| `HubDirectoryTableShell` | Lower-level directory table with sort, select-all, static columns (Hub/Users directory) |
| `HubRouteAboutSummary` | Route detail About — stat chips row + Route TM + Note ID `CopyMetaChip` |
| `HUB_ROUTE_ACCESS_*` meta | Column classes, colgroup, directory columns for route People & access tables |

**Structure (mandatory — do not add extra panel wrappers)**

```
HubToolDetailModal
  └─ HubToolDetailSection
       └─ HubModalDirectorySection
            ├─ banner? / error?
            ├─ FilterBar layout="inline"
            └─ HubPaginatedDataTable | HubDirectoryTableShell
```

**Rules**

- Modal sections: **always** `FilterBar layout="inline"` inside `HubModalDirectorySection` — never `layout="hub"`, never local `hub-*-access-panel` wrappers.
- Do **not** use `--flush` / negative-margin section hacks — section padding is golden default.
- Pick table primitive by column complexity (see Table pager section above); both sit inside the same `HubModalDirectorySection`.
- Route About: `HubRouteAboutSummary` — chips + TM sync id + Note ID; publish/share live in About (not access table Route column).
- Import route-access column meta from hub-ui — no copy `hub-route-access-col--*` in tools.
- Access filters: `hubRouteAccessFilterDefs("single-route")` — P0020 Cookie modal (Access + Permission only). `hubRouteAccessFilterDefs("multi-route")` — future P0004 user route directory (+ Publish filter).

**Golden refs**

- P0004 — `UserAccessModal.tsx` → Tools: `HubUserToolsDirectoryTable`; `ToolDetailModal.tsx` → identity header
- P0020 — `CookieRouteMembers.tsx` → Access section; `CookieRouteAccessTable` → `HubRouteAccessDirectoryTable`

---

## Agent Kind (manifest)

| Kind | Nội dung |
|------|----------|
| **pattern** | Hub UI clone goldens |
| **rule** | Cursor rules |
| **skill** | Cursor skills |
| **command** | Slash commands + `Tool/scripts/hub-ui-*.cjs` |
| **doc** | AGENTS.md, UI_PATTERNS, keyboard doc, hub-load refs |

Đã gộp/bỏ: `contract`+`file`→**doc**, `script`→**command**, `table`/`screen`/`component`→**pattern**.

---

## Related

- `ui-screens.catalog.json` — `defaults` + deferred templates
- Legacy: `UI_TABLES.md`, `UI_COMPONENTS.md`
