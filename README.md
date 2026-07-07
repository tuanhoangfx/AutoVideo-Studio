# P0021 — AutoVideo Studio

Auto-generate videos from images + narration script → TTS → optional BGM/subtitles → MP4.

## Agent contract

- **Dev:** `node Tool/scripts/ensure-dev-product.cjs P0021 --open` (UI `:3021`, worker `:8021`)
- **Verify:** `node Tool/scripts/agent-verify-gate.mjs --code P0021 --json --ensure-dev --mark-active`
- **Shell SSOT:** [Tool/docs/ssot/hub-shell-ssot.md](../docs/ssot/hub-shell-ssot.md)

## Tech stack

| Layer | Stack |
|-------|--------|
| **UI** | Next.js 14 App Router + Tailwind (port **3021**) |
| **Desktop** | Electron + bundled worker (`autovideo-worker.exe`) |
| **Worker** | Python 3.11 + FastAPI + imageio-ffmpeg (port **8021**) |
| **TTS** | edge-tts (primary), gTTS (fallback) |
| **Render** | FFmpeg — Ken Burns (`zoompan`), xfade (0.4s), HW encoders (NVENC/QSV/AMF) |

## Folder structure

```
P0021-AutoVideo-Studio/
├── app/                    # Next.js UI + Electron
│   └── src/
│       ├── app/studio/     # Main editor (single screen)
│       ├── app/system/     # Overview + Design Template tab
│       ├── components/studio/
│       └── lib/studio/     # Hooks + shared studio utils
├── worker/
│   ├── main.py             # FastAPI job API
│   └── pipeline/
│       ├── runner.py       # tts → audio → subtitle → compose
│       ├── compose.py      # FFmpeg video
│       ├── tts.py, subtitle.py, ffmpeg_util.py
│       └── script_gen.py   # Optional offline CLI (Gemini/template)
├── docs/
├── tool.manifest.json
└── README.md
```

## Quick start

```bash
# App UI
cd app
pnpm install
pnpm dev                    # http://localhost:3021/studio

# Worker
cd worker
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\uvicorn main:app --reload --port 8021
```

## Workflow

1. Open **Studio** — add images (local or Google Drive), write narration script.
2. Configure voice, BGM, subtitles, export settings (aspect/fps/resolution).
3. **Preview** — client-side canvas preview (fast, approximate).
4. **Export & Download** — worker render; `GlobalJobPoller` tracks jobs and auto-downloads when done.

## Smoke test (worker)

```bash
cd worker
.venv\Scripts\python scripts\smoke_e2e.py
```

## Status

**v0.3.x** — Production studio UI at `/studio`, worker wired, desktop + Vercel deploy paths documented in `docs/DEPLOYMENT.md`.
