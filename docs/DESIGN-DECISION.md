# Design Decision

## Selected Direction

`V2 Web Companion + Desktop Agent`

## Decision

AutoVideo Studio will keep the current web interface as the single shared UI. The desktop app/agent will not introduce a separate product interface. It will add local render capability behind the same Studio workflow.

## Runtime Model

- Web shell: Vercel-hosted Vite SPA (`app/dist`).
- Desktop shell: packaged Electron loads the same Studio UI from `dist/` (no embedded Next server).
- Render adapter: switches between worker modes without changing the visible UI.
- Local render: desktop agent runs the existing Python/FastAPI/FFmpeg worker on the user's machine.
- Cloud sync: Supabase remains optional for project metadata, assets, and output storage.

## Why

- Preserves the existing Studio layout and user muscle memory.
- Avoids maintaining two separate interfaces.
- Moves heavy render work to user hardware when packaged as desktop.
- Keeps web sharing possible through worker/tunnel/VPS modes.

## Implementation Rule

Production work should add runtime adapters and native bridge/agent capability under the current UI instead of creating a second desktop-only UI.

## Source Workspace Tree Decision

Selected: `V5 Compact Power Tree`

Decision date: 2026-05-27

The image source area uses a dense workspace tree for local folders and multiple Google Drive folders. Each selected local folder or Drive link becomes a workspace, with search, folder-level selection, file-level selection, and a single sync action into the Image Library.
