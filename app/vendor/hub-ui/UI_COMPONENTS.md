# Hub UI component patterns

> **Deprecated:** merged into [`UI_PATTERNS.md`](./UI_PATTERNS.md) + `Tool/schemas/ui-patterns.catalog.json`. Modal/auth patterns are Layer **modal**.

Only patterns **not** already bundled in a screen/table golden. Directory chrome lives in **`directory`** pattern golden `HubListPage`.

**Catalog:** `Tool/schemas/ui-patterns.catalog.json`  
**Legacy:** `ui-components.catalog.json`

---

## Patterns (6)

| ID | Golden | Clone |
|----|--------|-------|
| `hub-filter-bar` | P0004/hub-list | *(via directory screen)* |
| `hub-view-toggle` | P0004/hub-list | *(via directory screen)* |
| `hub-display-prefs` | P0004/hub-list | *(via directory/system screen)* |
| `hub-tab-chrome` | P0004/system | P0020/system |
| `hub-user-access-modal` | P0004/users | — |
| `hub-auth-gate` | **P0004/auth** (`HubAuthGate.tsx`) | **P0020/auth** (`NotesAuthGate.tsx`) |

---

## Auth gate

- **Golden:** `Tool/P0004-Tool-Hub/src/features/identity/HubAuthGate.tsx` · ref `P0004/auth`
- **Clone:** `Tool/P0020-Data-Box/src/features/notes/NotesAuthGate.tsx` (CSS `hub-auth.css` synced from P0004)

---

## Related

- [UI_TABLES.md](./UI_TABLES.md) — `directory-table` + `composedChrome`
- [UI_TEMPLATES.md](./UI_TEMPLATES.md)
