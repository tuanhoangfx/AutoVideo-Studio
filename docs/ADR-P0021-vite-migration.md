# ADR: P0021 Vite migration

**Status:** Accepted (2026-09-03)  
**Context:** P0021 was the only active video tool on Next.js 15 (hybrid: Vercel web + Electron Next standalone). Dev instability (hydration, dev overlay) and maintenance drift vs P0010/P0003 Vite stack.

## Decision

Migrate P0021 UI bundler from **Next.js 15** to **Vite 7** (golden: **P0010** Video Lab).

- **UI:** Vite SPA + `react-router-dom` (`/studio`, `/system`)
- **Dev auth:** `hub-auth-dev-api-vite-plugin` (same as P0004/P0010)
- **Google Drive API:** Vite dev middleware + Vercel serverless `api/google-drive-public.js`
- **Desktop:** Electron `loadFile(dist)` — no embedded Next server
- **Web (Vercel):** static `dist/` + SPA rewrites (P0020 pattern)

## What stays the same

- Studio 3-pane UI, worker Python/FastAPI, hub-ui/hub-identity vendor parity
- Desktop ship: `ship-desktop.ps1` User/Agent lanes
- Nested version clock: `app/package.json`

## Rollback

Git tag pre-migration + keep `latestPublished` desktop installer until Vite desktop verified.

## Consequences

- `hub-auth-migration-check` expects `vite.config.ts` + auth plugin (not App Router route)
- `hub-vite-alias-check` now applies to P0021
- Installer size drops (no `.next/standalone` ~400MB bundle)
