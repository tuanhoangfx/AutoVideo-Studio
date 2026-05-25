# Deploy AutoVideo Studio

## Architecture: Path 2 — Best-of-both

Code chạy **cả local lẫn cloud** không cần đổi gì. Single binary, env-driven.

```
┌──────────────────┐         ┌──────────────────┐
│  Next.js Frontend│  HTTPS  │  Python Worker   │
│  (Vercel hoặc    │ ◀──────▶│  (Docker hoặc    │
│   localhost:3021)│         │   uvicorn local) │
└──────────────────┘         └──────────────────┘
                                      │
                                      ▼
                              storage/jobs/<id>/
                                  output.mp4
```

Env var quan trọng duy nhất ở frontend:
```
NEXT_PUBLIC_WORKER_URL=http://127.0.0.1:8021   # local
NEXT_PUBLIC_WORKER_URL=https://avs-worker.example.com   # cloud
```

---

## Mode 1: Local development (đang dùng)

### Setup once
```powershell
# Worker
cd worker
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt

# Frontend
cd ..\app
corepack pnpm install
```

### Run
```powershell
# Terminal 1 — worker
cd worker
.venv\Scripts\uvicorn main:app --port 8021

# Terminal 2 — frontend
cd app
pnpm dev
# → http://localhost:3021/studio
```

### Optional: Gemini key cho script gen chất lượng cao
```powershell
$env:GEMINI_API_KEY = "AIza..."
.venv\Scripts\uvicorn main:app --port 8021
```

---

## Mode 2: Docker local

```bash
docker compose up worker
# Worker live tại http://localhost:8021
```

Frontend vẫn `pnpm dev` riêng, hoặc deploy Vercel.

---

## Mode 3: Cloud deploy (VPS — khuyến nghị cho production)

### 3a. Backend (Python worker) — Hetzner CX22 ~€4.5/m

```bash
# Trên VPS Ubuntu 22+
ssh root@your-vps-ip
apt update && apt install -y docker.io docker-compose-v2 git nginx certbot
git clone https://github.com/tuanhoangfx/AutoVideo-Studio.git
cd AutoVideo-Studio
docker compose up -d worker

# Nginx reverse proxy + SSL (Let's Encrypt)
cat > /etc/nginx/sites-available/avs <<'EOF'
server {
    listen 80;
    server_name avs-worker.your-domain.com;
    client_max_body_size 100M;        # cho upload nhiều ảnh
    location / {
        proxy_pass http://127.0.0.1:8021;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_read_timeout 600s;       # render có thể dài
    }
}
EOF
ln -s /etc/nginx/sites-available/avs /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d avs-worker.your-domain.com
```

### 3b. Frontend (Vercel) — Free

```bash
cd app
vercel link
vercel env add NEXT_PUBLIC_WORKER_URL production
# Paste: https://avs-worker.your-domain.com
vercel --prod
```

### 3c. CORS — update worker

Mở `worker/main.py` line `allow_origins=[...]`, thêm URL Vercel:
```python
allow_origins=[
    "http://localhost:3021",
    "http://127.0.0.1:3021",
    "https://autovideo-studio.vercel.app",   # ← thêm dòng này
],
```
Rebuild + restart container.

---

## Cost summary

| Mode | Cost/tháng | Setup time |
|---|---|---|
| Local-only | $0 | 5 phút |
| Hybrid (UI Vercel + worker local) | $0 | 15 phút |
| Full cloud (VPS Hetzner + Vercel) | ~€4.5 | 2-3 giờ |

---

## Health check

```bash
# Worker
curl http://127.0.0.1:8021/
# → {"name":"AutoVideo Studio Worker","version":"0.2.0","jobs":N,...}

# Voices
curl http://127.0.0.1:8021/voices | jq '.[0].ShortName'
# → "vi-VN-HoaiMyNeural"

# End-to-end smoke (Python)
cd worker
.venv/Scripts/python -c "
from pathlib import Path
from pipeline.runner import JobSpec, SceneSpec, run_job
out = run_job(JobSpec(
    job_id='smoke',
    scenes=[SceneSpec(text='Test', image_path=str(Path('storage/test-assets/test_img_1.jpg').resolve()))],
))
print(out, out.stat().st_size, 'bytes')
"
```
