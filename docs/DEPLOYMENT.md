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

## Health Check

Open `System > Overview` and review `Deployment Check`.
It verifies:

- Frontend runtime
- Worker reachability
- Output storage backend and missing env values
