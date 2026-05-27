# Desktop Hybrid Plan

## Goal

Keep one shared AutoVideo Studio UI. The web app and desktop app should use the same React/Next Studio screens. Desktop adds local render capability instead of creating a second UI.

## Selected Architecture

`V2 Web Companion + Desktop Agent`

```text
Shared Studio UI
├─ Web shell: Vercel
│  └─ calls tunnel/VPS/public worker
└─ Desktop shell: Electron/Tauri candidate
   └─ starts local worker + FFmpeg on the user's machine
```

## Runtime Adapter

The UI reads a runtime profile from `app/src/lib/runtime-mode.ts`.

Current render modes:

- `offline`: no worker URL configured
- `local`: `localhost` / `127.0.0.1`
- `tunnel`: Cloudflare Quick Tunnel
- `vps`: `zaloai.infix1.io.vn`
- `public`: any other public worker URL

Current shell modes:

- `web`: normal browser/Vercel shell
- `desktop`: future native shell, detected through `window.__TAURI__` or `window.electronAPI`

## Implementation Phases

1. Shared runtime adapter: done.
2. Desktop agent scaffold: done for Electron dev.
3. Desktop shell: done for Electron dev and Windows installer scaffold.
4. Native file bridge: output folder, open folder, FFmpeg health, worker logs.
5. Optional Supabase sync: upload finished videos and project metadata for sharing.

## Electron Dev Bridge

Run:

```powershell
cd app
pnpm desktop:dev
```

This starts the existing Next.js Studio UI, launches Electron, starts the local FastAPI worker, and injects a local worker URL into the shared UI through:

```ts
window.autovideo.getWorkerUrl()
window.autovideo.getRuntimeProfile()
window.autovideo.restartWorker()
```

The visible Studio UI remains the same. Electron only provides native process control and local worker discovery.

## Windows Installer

Run:

```powershell
cd app
pnpm desktop:dist
```

The package flow builds the PyInstaller worker exe, builds Next.js in standalone mode, copies static assets into the standalone bundle, and uses `electron-builder` to produce an NSIS installer under `app/dist-desktop/`.

Packaged Electron starts the bundled Next standalone server, starts the bundled PyInstaller worker exe, then opens `/studio` with the local worker URL injected. Worker jobs and voice previews write to the app user-data runtime folder, not the installation directory.

## Design Rule

Do not fork the Studio UI. Add native capability behind adapters and keep the current web workflow intact.
