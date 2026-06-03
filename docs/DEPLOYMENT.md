# AutoVideo Studio Deployment

## Runtime Layout

- Vercel hosts the Next.js UI in `app`.
- The browser stores drafts, images, BGM, voice favorites, and download-folder handles locally.
- The Python worker in `worker` handles FFmpeg/TTS rendering.
- The frontend talks to the worker through `NEXT_PUBLIC_WORKER_URL`.

## Vercel Environment

Set this in Vercel Project Settings:

```env
NEXT_PUBLIC_WORKER_URL=https://your-worker-domain.com
GOOGLE_DRIVE_API_KEY=
GOOGLE_DRIVE_API_REFERER=https://your-vercel-domain.vercel.app/studio
```

If `NEXT_PUBLIC_WORKER_URL` is missing, production will fall back to `http://127.0.0.1:8021`,
which only works for local development.

**Local/desktop render only:** remove the VPS worker URL from Vercel (if it was set):

```powershell
cd E:\Dev\Tool\P0021-AutoVideo-Studio
.\scripts\vercel-unset-worker-url.ps1
```

Then redeploy production once so the UI stops calling `zaloai…/p0021-worker`.

## Worker Environment

Local disk output is the default:

```env
P0021_STORAGE_BACKEND=local
```

For persistent cloud output, use Supabase Storage:

```env
P0021_STORAGE_BACKEND=supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
SUPABASE_STORAGE_BUCKET=p0021-autovideo-exports
SUPABASE_STORAGE_PREFIX=p0021-exports
```

The service role key must stay on the worker. Never expose it through `NEXT_PUBLIC_*`.

## Free Public Worker From Your PC

For a no-cost setup that other people can use while your PC is on:

```powershell
.\scripts\start-public-worker.ps1
```

The script will:

- start the FastAPI worker on `127.0.0.1:8021`
- start a Cloudflare Quick Tunnel to expose it as `https://*.trycloudflare.com`
- set Vercel `NEXT_PUBLIC_WORKER_URL` to that tunnel URL
- deploy the Vercel frontend to production

Keep the script running while other users are rendering. Quick Tunnel URLs are temporary,
so run the script again whenever the tunnel changes.

## Health Check

Open `System > Overview` and review `Deployment Check`.
It verifies:

- Frontend runtime
- Worker reachability
- Worker mode: `Local`, `Tunnel`, `VPS`, `Public`, or `Offline`
- Output storage backend and missing env values
