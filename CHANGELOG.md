# Changelog

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
