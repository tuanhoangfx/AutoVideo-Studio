## 2026-07-31 - Release 2.1.1 - Desktop worker noconsole hardening

- Version: `2.1.1`
- Timestamp: 2026-07-31
- Type: Major
- Status: Committed

### Changes

- **Release:** Major release bundling the worker noconsole stdout guard (`1.2.12`) and restored `app/build/icon.ico`; worker exe rebuilt.

### Verification

- `build-worker-exe.ps1` OK � `autovideo-worker.exe` rebuilt with icon.
## 2026-07-31 - Fix packaged worker crash (noconsole stdout)

- Version: `1.2.12`
- Timestamp: 2026-07-31
- Type: Patch
- Status: Verified

### Changes

- **Worker:** `desktop_worker.py` guards `sys.stdout/stderr = None` (PyInstaller `--noconsole` + no stdio redirect) � uvicorn formatter crashed with `AttributeError: 'NoneType' object has no attribute 'isatty'`.

### Verification

- Same SSOT fix as P0010 2.1.30; exe rebuild deferred to next Release.
# Changelog

## 2026-07-30 - preShip SSOT: verify-untracked + verify-no-sibling-tool-imports

- Version: `1.2.11`
- Timestamp: 2026-07-30 17:46 (UTC+7)
- Type: Patch
- Status: Draft

### Changes

- Patch bump for uncommitted code changes (P0021).

### Verification

- pending

---
## 2026-07-24 - preShip SSOT: verify-untracked + verify-no-sibling-tool-imports

- Version: `1.2.10`
- Timestamp: 2026-07-24
- Type: Patch
- Status: Pending

### Changes

- preShip SSOT: verify-untracked + verify-no-sibling-tool-imports

### Verification

- ship-pipeline slice → commit scoped paths only

---
## 2026-07-24 - preShip SSOT: verify-untracked-imports gate

- Version: `1.2.9`
- Timestamp: 2026-07-24
- Type: Patch
- Status: Pending

### Changes

- preShip SSOT: verify-untracked-imports gate

### Verification

- ship-pipeline slice → commit scoped paths only

---
## 2026-07-17 - hub-ui SSOT hook-stability vendor sync

- Version: `1.2.8`
- Timestamp: 2026-07-17 22:26 (UTC+7)
- Type: Patch
- Status: Draft

### Changes

- Sync hub-ui SSOT hook-stability patch into vendor/hub-ui: `useHubDirectorySelection`, `useDirectoryHaystackFilter`, and `useDirectoryTableSort` now self-stabilize their row-projection callbacks (idOf/keyOf/sortableValue) via refs, so inline `(row) => row.id` no longer rebuilds the selection/haystack/sort memos every render — snappier checkbox click, drag-sweep, search, and sort with no consumer code changes.

### Verification

- pending

---
## 2026-07-17 - PWA install icon (Next.js manifest + maskable PNG)

- Version: `1.2.7`
- Timestamp: 2026-07-17 18:25 (UTC+7)
- Type: Patch
- Status: Verified

### Changes

- **PWA "Install as app" icon:** added `app/public/manifest.json` + raster icons (`icon-192/512.png` any + maskable, `apple-touch-icon.png` 180) rendered from `favicon.svg` via SSOT `Tool/scripts/ensure-pwa-manifest.mjs`; declared `manifest: "/manifest.json"` in the App Router `metadata` export (`src/app/layout.tsx`). Fixes Chrome install showing a generated letter placeholder.
- Verified: `check-tool-favicons.mjs` OK (manifest cache-bust + raster icons present); PNG 192/512/180 present.

## 2026-07-17 - Vendor sync + Supabase 2.106 + lighter postinstall

- Version: `1.2.6`
- Timestamp: 2026-07-17 11:16 (UTC+7)
- Type: Patch
- Status: Draft

### Changes

- Patch bump for uncommitted code changes (P0021).

### Verification

- pending

---
# Changelog â€” P0021-AutoVideo-Studio

> **Ship keywords:** `Git P0021` Â· `Push P0021` Â· `Release P0021`  
> **Template:** `E:\Dev\Rules\templates\tool-docs\CHANGELOG_ENTRY_TEMPLATE.md`  
> **Script:** `powershell -File E:\Dev\Tool\scripts\ship-product.ps1 -Code P0021 -Keyword Push`

## 2026-07-06 - Vendor sync + Supabase 2.106 + lighter postinstall

- Version: `1.2.5`
- Type: Patch
- Product: P0021
- Timestamp: 2026-07-06 15:25 (UTC+7)
- Prompt: Sync hub-identity vendor; align @supabase/supabase-js with workspace SSOT
- Status: Committed

### Changes

- `app/package.json` — pin `@supabase/*` 2.106.1 (match P0020); vendor hub-identity/hub-ui re-synced.
- Removed stale `app/dist-desktop/` (~1.5 GB); prune + `.cursorignore` cover `dist-desktop/`.

Version: 1.2.4 → 1.2.5

## 2026-07-06 - Workspace: React 19 + hub-ui peer alignment

- Version: `1.2.4`
- Type: Patch
- Product: P0021
- Timestamp: 2026-07-06 15:10 (UTC+7)
- Prompt: Align React 19 with `@tool-workspace/hub-ui` peers after pnpm workspace hoist
- Status: Verified
- Release: https://p0021.infi.io.vn

### Changes

- `app/package.json` — `react` / `react-dom` ^19.2.1; Next.js 15; `@types/react*` ^19.
- `tool.manifest.json` — stack React 19; release `1.2.4`.

Version: 1.2.3 → 1.2.4

## 2026-06-03 - Vercel: unset NEXT_PUBLIC_WORKER_URL script

- Version: `1.2.3`
- Type: Patch
- Product: P0021
- Timestamp: 2026-06-08 15:40 (UTC+7)
- Prompt: xóa NEXT_PUBLIC_WORKER_URL trên Vercel; Working Rules
- Commit: `ef54d81`
- Status: Verified
- Release: https://p0021.infi.io.vn

### Changes

- `scripts/vercel-unset-worker-url.ps1` — remove VPS worker env from production/preview/development.

Version: 1.2.2 → 1.2.3

## 2026-06-03 - Local render only; drop VPS worker

- Version: `1.2.2`
- Type: Patch
- Product: P0021
- Prompt: chỉ render trên máy — có cần giữ worker VPS không
- Commit: pending
- Status: Draft

### Changes

- Manifest: remove VPS `workerUrl`; document `workerLocal` + desktop/local render path.
- VPS `/opt/autovideo-studio` docker stopped (see P0006 `pnpm vps:cleanup --apply --include-autovideo`).

Version: 1.2.1 → 1.2.2

## 2026-06-03 - Fix Vercel deploy root + upload size

- Version: `1.2.1`
- Type: Patch
- Product: P0021
- Prompt: Fix 404 after root deploy — deploy from app/ with vercelignore
- Commit: pending
- Status: Draft

### Changes

- Add `app/.vercelignore` and ignore `dist-desktop/` in git.
- Add root `vercel.json`; redeploy production from `app/` directory.

### Verification

- https://p0021.infi.io.vn loads AutoVideo Studio (browser).

### Rollback

- Revert vercel.json; promote prior Vercel deployment.

---

## 2026-06-03 - Vercel deploy trim + p0021.infi.io.vn

- Version: `1.2.0`
- Type: Minor
- Product: P0021
- Prompt: ok 3 — .vercelignore to fix 100MB upload limit; production redeploy
- Commit: pending
- Status: Draft

### Changes

- Add root `.vercelignore` excluding Python worker, `_reference/`, `.runtime/`, and desktop artifacts.
- Mark `p0021.infi.io.vn` custom domain verified in manifest.

### Verification

- `vercel --prod` upload under 100 MB; https://p0021.infi.io.vn loads AutoVideo Studio.

### Rollback

- Remove `.vercelignore`; revert manifest domain status.

---

## 2026-06-03 - Workspace version triple sync

- Version: `1.1.1`
- Type: Patch
- Product: P0021
- Prompt: Workspace version triple standardization (ok 1 2 3)
- Commit: pending
- Status: Draft

### Changes

- Align package.json, tool.manifest.json release.version, and CHANGELOG top Version to `1.1.1`.
- Use workspace `check-version-sync.mjs --code` (no per-repo script copy).

### Verification

- `node E:\Dev\Tool\scripts\check-version-sync.mjs --code P0021`

### Rollback

- Revert this CHANGELOG block and version files

---

## 1.1.2
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Architecture: job poll coordinator (single owner), Image Library split (Drive/Folder/Grid panels), pipeline transition SSOT in `pipeline-constants.ts`.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Studio: lazy-load Sequence Preview, Image Library, Voice Selector; cancel export button; blob URL cleanup on unmount; fix scene index effect deps.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Voice: Edge TTS only in UI until other providers are implemented; worker default aspect 16:9 aligned with UI.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Dev: `pnpm test:worker` script and GitHub Actions worker smoke workflow.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 1.1.1
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Official desktop release: timeline scene table V1, compact Duration/Transition/Effect columns, Random/None for transitions and effects.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Studio defaults (Jenny voice, subtitle off), open latest exported video, architecture cleanup (shared types, job events, dead code removal).
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Worker: random effect pool, cut transitions (none), lib sync with preview pipeline.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.2.15
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Transition/Effect: add Random + None options; worker preview resolves random effects and cut (none) transitions.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.2.14
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Timeline Duration column: 2.67rem width, shared bulk/row padding with Transition/Effect; compact w-full controls.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.2.13
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Timeline Transition/Effect columns reduced to one-third width (2.67rem / 2.33rem).
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.2.12
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Timeline Transition column 8rem, Effect column 7rem; bulk filters in native table cells aligned with row dropdowns.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.2.11
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Timeline scene table: equal Transition/Effect column width (6.5rem); bulk filters grid-aligned; row inline filters fill column.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.2.10
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Timeline toolbar: remove empty grip/transcript header cells; action buttons flush left, bulk Effect aligned without 40% dead space.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.2.9
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Lock timeline scene table design V1 (fixed grid, flat actions, transcript 40%); remove Design Template mocks.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.2.8
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Timeline scene table: flat action buttons (no frame), table-fixed columns with Transcript 40%.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- System → Design Template: 5 mockups (V1–V5) for timeline table layout review.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.2.7
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Timeline table: bulk Duration / Transition / Effect filters align with column headers; Apply sits next to Delete.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.2.6
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Timeline storyboard: hide duration overlay on scene thumbnails.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Library: allow adding the same image to keyframes multiple times; remove duration badge on library thumbs.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.2.5
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Architecture cleanup: shared `types/studio`, `lib/job-events`, remove dead code and duplicate helpers.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Defaults: Jenny (en-US) voice first, subtitles Off.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Open file button reveals the latest exported video (same as job-tab download badge), not just the output folder.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.2.4
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Remove redundant Voice duration hint on Timeline stats row.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.2.3
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Fix duplicate Save As when auto-download runs on a background tab or second Studio tab; defer blob download until tab is visible; dedupe job downloads via localStorage.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.2.2
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Default voice Jenny (en-US); voice list sorts en-US first; output filename `hh:mm:ss dd/mm/yy`; export defaults 30fps + time-date template.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.2.1
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Studio refactor (hooks, JobTabTooltip, export/download), FFmpeg libx264 default on Windows, desktop worker env hardening.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Header shows release version and update date; worker smoke/repro scripts; remove design-preview routes.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.1.9
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Header & sidebar show real release version (`package.json`) and update date; P0004 catalog `localVersion` synced for P0021.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.1.8
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Fix export encode on Windows: default `libx264` (NVENC fallback), refresh encoder per job, clearer FFmpeg errors in Studio.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Desktop worker: `AUTOVIDEO_VIDEO_ENCODER=libx264`, single render worker; rebuild `autovideo-worker.exe`.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Refactor Studio hooks (`use-studio-jobs`, `use-studio-export`, …), remove design-preview routes, shared pipeline constants.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.1.7
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Fix Preview silent when using Paste Full Script (narration track TTS, not skipped by durationSec).
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Fix auto-download video missing audio: wait for stable output, correct Blob MIME, ffmpeg faststart on mux.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Voice preview API allows up to 800 chars for longer client previews.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.1.6
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Fix ProjectTabs crash when pointer leaves download badge (`relatedTarget` not a Node).
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.1.5
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Re-export on the same project tab (replace tab, keep slot); per-slot download count badge on tab.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Unified job tab label and download filenames: `hh:mm dd/mm/yy` (files use `hh-mm dd-mm-yy`); local time; export v2+ suffix.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.1.4
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Fix voice preview "no supported sources": fetch MP3 before play, short per-locale samples in voice list, clamp preview text, use runtime worker URL.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.1.3
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Fix broken image thumbnails after switching project tabs (revoked blob URLs in tab cache).
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
## 0.1.2
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry

- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Fix studio tab switch losing project editor state and export progress UI while worker jobs still run.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Per-tab in-memory editor snapshots; restore local draft from localStorage + IndexedDB on load.
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
- Export overlay only shows during active export/download (not misleading "Exporting" on completed jobs).
- Prompt: Legacy entry
- Product: P0021
- Prompt: Legacy entry
