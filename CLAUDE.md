# P0021 — AutoVideo Studio (Claude notes)

## Mục tiêu
Tool tự ghép video từ **ảnh upload có sẵn** + AI gen script + giọng TTS Việt + Ken Burns → MP4.

## Status: v0.3.1 FUNCTIONAL ✅
- Worker pipeline live (edge-tts + ffmpeg), end-to-end render verified
- Frontend Hub-themed at `/studio` — upload, AI script, edit, multi-project tabs, polling
- **v0.3 bundle**: BGM + auto-duck, Subtitle (line + CapCut word-by-word), Export presets (TikTok/Reels/Shorts/YouTube/Square)
- Inline `<video>` preview sau render
- Persist jobs to disk (survives worker restart)
- **v0.3.1 — Hub theme cloned from P0004**: indigo brand, dot-grid bg, hub-card hover glow, divider w/ gradient line, modal panel + animations
- **Single-screen layout**: 3-pane (Library / Preview+Script / Summary) + bottom Keyframe. Secondary configs (Voice/BGM/Subtitle/Export) trong **modals** không chiếm chỗ
- **Listen-test BEFORE render**: ▸ button trên mỗi voice preview (`/voices/preview` endpoint, cached SHA-1) + BGM `<audio>` play + **per-scene preview** ▸ trên mỗi dòng ScriptPanel (nghe đúng câu thoại + giọng + tốc độ đang chọn)
- **Sequence preview client-side INLINE**: nút "Preview" → canvas hiển thị THẲNG trong preview card (không modal). Fetch tất cả TTS song song, decode AudioContext, sequence playback. Compact transport bar dưới canvas (Play/Pause/Stop/Replay + progress + scene indicator). ~3-5s loading vs 30s render
- **Canvas crossfade 0.4s**: match ffmpeg `compose.py transition=0.4`. Trong fade zone draw current scene fading + next scene fading-in (globalAlpha blend). Caption cũng crossfade. Cảm giác mượt như render thật
- **All-direct panels**: Voice / Subtitle / BGM / Export hiển thị **trực tiếp** right column 3-col (4 cards stacked) — không cần mở modal cho mỗi setting. Modal "All settings" chỉ là backup khi user muốn focus mode
- **Auto-save localStorage + IndexedDB**: text metadata (script, voice, rate, aspect, fps, bgmVolume, subtitleStyle, presetId) lưu debounced 2s vào localStorage `p0021:studio:draft:v1`. **Image Files + BGM lưu vào IndexedDB** (DB `p0021-studio`, store `files`, keys `image:NNN` + `bgm`) — full session persist, ảnh + BGM khôi phục đầy đủ sau reload không cần re-upload. Banner "Phục hồi / Bỏ qua" hiện khi có draft. Live indicator "saved Xs trước" ở top bar
- Local + Cloud-ready (Docker)

## Tech stack
- **Frontend:** Next.js 14 App Router + Tailwind — port **3021**
- **Worker:** Python 3.12 + FastAPI + edge-tts + imageio-ffmpeg — port **8021**
- **ffmpeg:** bundled binary qua `imageio-ffmpeg` (KHÔNG cần install system ffmpeg)
- **TTS:** edge-tts primary, gTTS fallback (khi MS rate-limit)
- **LLM:** template gen offline, Gemini Flash optional (set `GEMINI_API_KEY`)
- **Concurrency:** ThreadPoolExecutor 2 jobs song song

## Design chốt: S2 Workspace Tabs (2026-05-26)
- Route `/studio` ([page](app/src/app/studio/page.tsx))
- Layout: project tabs top → 3-pane body (Library | Preview+Script | Properties) → Keyframe timeline bottom
- Components: [@/components/studio/](app/src/components/studio/)
  - `ProjectTabs` · multi-job switcher
  - `ImageLibrary` · drag-drop upload, badge "used"
  - `ScriptPanel` · inline edit + AI gen prompt
  - `KeyframeTimeline` · time ruler + scene clips + keyframe markers
  - `PropertiesPanel` · voice + aspect + job status + download

## Worker endpoints
```
GET    /                       → health
GET    /voices                 → VN voices list
GET    /voices/preview?text&voice&rate → MP3 stream preview (cached by SHA-1)
GET    /jobs                   → list all (newest first, persisted JSON)
POST   /jobs                   → multipart: scenes JSON + config JSON + files[] + bgm? (optional)
GET    /jobs/{id}              → status + progress
GET    /jobs/{id}/output       → MP4 stream
POST   /jobs/{id}/cancel
DELETE /jobs/{id}              → remove from disk + memory
```

## Hub theme tokens (cloned from P0004)
```
--bg #0b1020  --panel #121830  --panel-2 #1a2140
--text #e6e8ef  --muted #8a93b2
--accent #6366f1 (indigo-500)  --accent-2 #818cf8 (indigo-400)
--shadow-card-hover 0 8px 24px rgba(99,102,241,0.12)
```
Utility classes: `.hub-card` (border-white/5 + hover glow), `.btn-primary` (indigo gradient), `.brand-icon-wrap`, `.dot-grid-bg`, `.hub-divider`, `.modal-backdrop` + `.modal-panel`.

## v0.3 features (Bundle 1)
- **A1 BGM + auto-duck**: `bgm` upload via multipart, ffmpeg sidechaincompress duck `-12dB` khi voice nói (`pipeline/runner.py::_mix_bgm`)
- **A2/B3 Subtitle**: `subtitle_style = off | line | word_capcut`. ASS file gen từ edge-tts WordBoundary, burn-in qua ffmpeg `subtitles` filter (`pipeline/subtitle.py`)
- **A4 Export presets**: frontend-only, set aspect+fps qua 1 click (`lib/api.ts::EXPORT_PRESETS`)
- **Inline video**: `components/studio/VideoPreview.tsx` — `<video controls preload="metadata">` khi job.status=done
- **Persist**: `main.py::_persist_job` + `_load_jobs` on startup, scan `storage/jobs/*/job.json`

## Subtitle ASS format
Style `WordHL` (CapCut hot): font 84px bold, yellow `&H0000F5FF&`, animation `\fscx60\fscy60 → \fscx110\fscy110 → \fscx100\fscy100` (pop-in 160ms).
Style `Word` (line): font 72px white, 1 dòng cả câu.

## Deploy options
Xem [DEPLOY.md](DEPLOY.md):
1. **Local**: `cd worker && .venv/Scripts/uvicorn main:app --port 8021` + `cd app && pnpm dev` → $0
2. **Docker local**: `docker compose up worker` → $0
3. **Cloud** (VPS Hetzner ~€4.5/m + Vercel free) → URL public, multi-user OK

## Use case lock
- ✅ Upload ảnh có sẵn (drag-drop, multiple)
- ❌ KHÔNG gen ảnh AI (Stable Diffusion / DALL-E) — đã chốt
- ❌ KHÔNG video clips upload (chỉ ảnh tĩnh) — Ken Burns tạo motion

## Don'ts
- ❌ KHÔNG render trong Next.js process (memory leak với ffmpeg) — always delegate worker
- ❌ KHÔNG hardcode `NEXT_PUBLIC_WORKER_URL` — env-driven cho cloud-portability
- ❌ KHÔNG dùng moviepy (đã thử, slow + heavy deps) — pure ffmpeg subprocess

## Design (locked)
Production UI: `/studio` (single-screen editor). Design preview routes removed after lock; new UI reviews use **System → Design Template** tab per workspace rules.

## Smoke test verified
```
Job J260526-smoke1 · 2 scenes · 9:16 · 30fps
TTS: 4.46s + 4.21s = 8.67s voice
Render: 6.87s MP4 (after crossfade trim), 133KB
Time: ~8s end-to-end
```

## Design baseline
Shared CSS: `E:\Dev\Rules\standards\workspace-design-base.css`.
