# P0021 — AutoVideo Studio

Auto-generate videos: topic → script → images → voice-over → subtitle → effects → MP4.

## Tech stack

- **Frontend:** Next.js 14 App Router + Tailwind (port 3021)
- **Worker:** Python 3.11 + FastAPI + MoviePy + FFmpeg (port 8021)
- **Pipeline:**
  - **Script:** LLM (Gemini Flash / OpenAI / Ollama)
  - **Image source:** (A) user upload (drag-drop) OR (B) auto-gen (Stable Diffusion local / DALL·E / Flux API)
  - **TTS:** edge-tts (free, giọng VN `vi-VN-HoaiMyNeural` / `vi-VN-NamMinhNeural`) — fallback ElevenLabs
  - **Subtitle align:** Whisper (base/small) → SRT word-level
  - **Effects:** Ken Burns (zoom/pan), fade in/out, slide transition
  - **Render:** FFmpeg via MoviePy

## Folder structure

```
P0021-AutoVideo-Studio/
├── app/                              # Next.js 14 UI
│   └── src/app/
│       ├── design-preview/auto-video/  # 5 mockups V1–V5 (design-first rule)
│       ├── projects/                 # job list + create
│       ├── render/[id]/              # progress + preview player
│       └── layout.tsx
├── worker/                           # Python FastAPI
│   ├── main.py
│   ├── pipeline/
│   │   ├── script.py
│   │   ├── image_gen.py              # SD / DALL-E / Flux
│   │   ├── image_upload.py           # user uploads
│   │   ├── tts.py                    # edge-tts
│   │   ├── subtitle.py               # whisper
│   │   ├── effects.py                # Ken Burns + transitions
│   │   └── compose.py                # ffmpeg final render
│   ├── storage/                      # /jobs/<id>/{images,audio,output}
│   └── requirements.txt
├── docs/ARCHITECTURE.md
├── tool.manifest.json
├── README.md
└── CLAUDE.md
```

## Quick start

```bash
# 1. App UI
cd app
pnpm install
pnpm dev                    # http://localhost:3021

# 2. Worker
cd worker
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\uvicorn main:app --reload --port 8021
```

## Workflow

1. **Design phase (hiện tại):** Xem 5 mockup ở `/design-preview/auto-video`, chốt 1 layout.
2. **Promote:** Variant đã chọn → wire vào `/projects/new`.
3. **Job lifecycle:** create → script → images → tts → subtitle → compose → done.

## Status

🚧 Bootstrap. Chưa wire worker. Đang ở giai đoạn design preview.
