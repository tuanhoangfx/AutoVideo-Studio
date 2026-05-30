# Changelog

## 1.1.1

- Official desktop release: timeline scene table V1, compact Duration/Transition/Effect columns, Random/None for transitions and effects.
- Studio defaults (Jenny voice, subtitle off), open latest exported video, architecture cleanup (shared types, job events, dead code removal).
- Worker: random effect pool, cut transitions (none), lib sync with preview pipeline.

## 0.2.15

- Transition/Effect: add Random + None options; worker preview resolves random effects and cut (none) transitions.

## 0.2.14

- Timeline Duration column: 2.67rem width, shared bulk/row padding with Transition/Effect; compact w-full controls.

## 0.2.13

- Timeline Transition/Effect columns reduced to one-third width (2.67rem / 2.33rem).

## 0.2.12

- Timeline Transition column 8rem, Effect column 7rem; bulk filters in native table cells aligned with row dropdowns.

## 0.2.11

- Timeline scene table: equal Transition/Effect column width (6.5rem); bulk filters grid-aligned; row inline filters fill column.

## 0.2.10

- Timeline toolbar: remove empty grip/transcript header cells; action buttons flush left, bulk Effect aligned without 40% dead space.

## 0.2.9

- Lock timeline scene table design V1 (fixed grid, flat actions, transcript 40%); remove Design Template mocks.

## 0.2.8

- Timeline scene table: flat action buttons (no frame), table-fixed columns with Transcript 40%.
- System → Design Template: 5 mockups (V1–V5) for timeline table layout review.

## 0.2.7

- Timeline table: bulk Duration / Transition / Effect filters align with column headers; Apply sits next to Delete.

## 0.2.6

- Timeline storyboard: hide duration overlay on scene thumbnails.
- Library: allow adding the same image to keyframes multiple times; remove duration badge on library thumbs.

## 0.2.5

- Architecture cleanup: shared `types/studio`, `lib/job-events`, remove dead code and duplicate helpers.
- Defaults: Jenny (en-US) voice first, subtitles Off.
- Open file button reveals the latest exported video (same as job-tab download badge), not just the output folder.

## 0.2.4

- Remove redundant Voice duration hint on Timeline stats row.

## 0.2.3

- Fix duplicate Save As when auto-download runs on a background tab or second Studio tab; defer blob download until tab is visible; dedupe job downloads via localStorage.

## 0.2.2

- Default voice Jenny (en-US); voice list sorts en-US first; output filename `hh:mm:ss dd/mm/yy`; export defaults 30fps + time-date template.

## 0.2.1

- Studio refactor (hooks, JobTabTooltip, export/download), FFmpeg libx264 default on Windows, desktop worker env hardening.
- Header shows release version and update date; worker smoke/repro scripts; remove design-preview routes.

## 0.1.9

- Header & sidebar show real release version (`package.json`) and update date; P0004 catalog `localVersion` synced for P0021.

## 0.1.8

- Fix export encode on Windows: default `libx264` (NVENC fallback), refresh encoder per job, clearer FFmpeg errors in Studio.
- Desktop worker: `AUTOVIDEO_VIDEO_ENCODER=libx264`, single render worker; rebuild `autovideo-worker.exe`.
- Refactor Studio hooks (`use-studio-jobs`, `use-studio-export`, …), remove design-preview routes, shared pipeline constants.

## 0.1.7

- Fix Preview silent when using Paste Full Script (narration track TTS, not skipped by durationSec).
- Fix auto-download video missing audio: wait for stable output, correct Blob MIME, ffmpeg faststart on mux.
- Voice preview API allows up to 800 chars for longer client previews.

## 0.1.6

- Fix ProjectTabs crash when pointer leaves download badge (`relatedTarget` not a Node).

## 0.1.5

- Re-export on the same project tab (replace tab, keep slot); per-slot download count badge on tab.
- Unified job tab label and download filenames: `hh:mm dd/mm/yy` (files use `hh-mm dd-mm-yy`); local time; export v2+ suffix.

## 0.1.4

- Fix voice preview "no supported sources": fetch MP3 before play, short per-locale samples in voice list, clamp preview text, use runtime worker URL.

## 0.1.3

- Fix broken image thumbnails after switching project tabs (revoked blob URLs in tab cache).

## 0.1.2

- Fix studio tab switch losing project editor state and export progress UI while worker jobs still run.
- Per-tab in-memory editor snapshots; restore local draft from localStorage + IndexedDB on load.
- Export overlay only shows during active export/download (not misleading "Exporting" on completed jobs).
