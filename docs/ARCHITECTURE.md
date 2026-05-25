# Architecture — AutoVideo Studio

## Pipeline overview

```
[USER INPUT]
  topic | script | uploaded_images[]
       │
       ▼
┌────────────────────────────────────────────────┐
│  Next.js UI (port 3021)                        │
│  - /projects: create + list                    │
│  - /render/[id]: progress + preview            │
└─────────────────┬──────────────────────────────┘
                  │ POST /jobs
                  ▼
┌────────────────────────────────────────────────┐
│  Python Worker (FastAPI port 8021)             │
│                                                │
│  ① script.py     → LLM gen script              │
│  ② image_*.py    → gen (SD/DALL-E) OR upload   │
│  ③ tts.py        → edge-tts mp3 per scene      │
│  ④ subtitle.py   → whisper align → SRT         │
│  ⑤ effects.py    → ken burns + transitions     │
│  ⑥ compose.py    → ffmpeg final MP4            │
└─────────────────┬──────────────────────────────┘
                  │ GET /jobs/:id (status poll)
                  ▼
              storage/jobs/<id>/output.mp4
```

## Scene model

```ts
type Scene = {
  index: number;
  text: string;              // câu thoại
  image: { source: 'upload' | 'gen'; path?: string; prompt?: string };
  duration_ms: number;       // = TTS audio length per scene
  effect: 'ken_burns_in' | 'ken_burns_out' | 'pan_left' | 'pan_right' | 'none';
  transition: 'fade' | 'slide' | 'cut';
};

type Job = {
  id: string;                // J260525-a3f2c1
  status: 'pending' | 'script' | 'images' | 'tts' | 'subtitle' | 'compose' | 'done' | 'error';
  topic: string;
  config: { aspect: '9:16' | '16:9'; voice: string; bgm?: string };
  scenes: Scene[];
  output_url?: string;
  error?: string;
};
```

## API contract

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/jobs` | `{ topic, config, images?: File[] }` | `{ job_id }` |
| GET | `/jobs/:id` | — | `Job` |
| GET | `/jobs/:id/output.mp4` | — | binary |
| GET | `/jobs/:id/preview` | — | thumbnail PNG |
| POST | `/jobs/:id/cancel` | — | `{ ok }` |

## Decisions to confirm (asked user)

- **Render engine:** MoviePy (Python, nhanh prototype) vs Remotion (React, đẹp + debug bằng browser).
- **Image gen default:** local SD (free, cần GPU) vs DALL-E (paid, không cần GPU).
- **LLM default:** Gemini Flash free tier vs OpenAI gpt-4o-mini paid.
