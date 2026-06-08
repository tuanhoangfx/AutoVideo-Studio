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
| `auth-gate` | modal | P0004/auth |
| `user-access-modal` | modal | P0004/users |

**Directory** = card + table via **ViewToggle** (one pattern).  
**System** = Agent table + Quota table inside `panels[]` (not separate rows).

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
