# Architecture — AutoVideo Studio

## Pipeline overview

```
[USER INPUT]
  images[] + narration script + voice/BGM/subtitle config
       │
       ▼
┌────────────────────────────────────────────────┐
│  Next.js UI (port 3021) — /studio              │
│  - Image library, script, timeline, export     │
│  - GlobalJobPoller + auto-download             │
└─────────────────┬──────────────────────────────┘
                  │ POST /jobs (multipart)
                  ▼
┌────────────────────────────────────────────────┐
│  Python Worker (FastAPI port 8021)             │
│                                                │
│  ① tts.py        → edge-tts narration track    │
│  ② runner.py     → trim/pad audio, BGM duck    │
│  ③ subtitle.py   → ASS/SRT (line / word_capcut)│
│  ④ compose.py    → Ken Burns + xfade + mux MP4 │
└─────────────────┬──────────────────────────────┘
                  │ GET /jobs/:id (poll)
                  ▼
              storage/jobs/<id>/output.mp4
```

## Frontend modules (`app/src/lib/studio/`)

| Module | Role |
|--------|------|
| `use-studio-jobs.ts` | Worker connection, job list, polling hooks |
| `use-studio-export-settings.ts` | Aspect/fps/resolution from settings |
| `use-studio-project-tabs.ts` | Tab switch, draft projects, editor cache |
| `use-studio-toast.ts` | Toast notifications |
| `studio-scene-utils.ts` | Scene line builders, reorder helpers |
| `pipeline-constants.ts` | `EFFECTS_CYCLE`, `TRANSITION_S` (sync with worker) |

## Worker modules (`worker/pipeline/`)

| Module | Role |
|--------|------|
| `runner.py` | Orchestrate tts → audio → subtitle → compose |
| `compose.py` | FFmpeg scene render + concat/xfade |
| `ffmpeg_util.py` | Shared `run_ffmpeg`, `probe_duration_ms` |
| `pipeline_constants.py` | Shared effect/transition constants |
| `script_gen.py` | Optional offline CLI (not wired to API) |

## API (current)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/` | Health + storage |
| GET | `/voices`, `/voices/preview` | TTS voice list + preview MP3 |
| GET/POST | `/jobs` | List / create job |
| GET | `/jobs/{id}` | Status + metrics |
| POST | `/jobs/{id}/probe` | Re-probe output duration |
| GET | `/jobs/{id}/output` | MP4 stream |
| POST | `/jobs/{id}/cancel` | Cancel running job |
| DELETE | `/jobs/{id}` | Remove job |

## Design decisions (locked)

- **Render:** FFmpeg subprocess only (no MoviePy in worker).
- **Images:** User upload / Google Drive — no AI image generation.
- **TTS:** edge-tts primary; single narration track per export.
- **UI:** Single-screen `/studio` (design previews removed after lock).
