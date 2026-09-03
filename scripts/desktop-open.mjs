#!/usr/bin/env node
/**
 * Launch P0021 desktop — kill zombies, open packaged exe or dev shell, verify visible window.
 * Packaged mode: process/window only (P0010 parity — no HTTP probe on :3021).
 * Dev mode: optional HTTP probe on Vite :3021/studio + electron window title match.
 *
 * Usage:
 *   node scripts/desktop-open.mjs
 *   node scripts/desktop-open.mjs --dev
 *   node scripts/desktop-open.mjs --exe "app/dist-desktop/win-unpacked/AutoVideo Studio.exe"
 *   node scripts/desktop-open.mjs --json
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productRoot = path.resolve(__dirname, "..");
const appDir = path.join(productRoot, "app");
const defaultExe = path.join(appDir, "dist-desktop", "win-unpacked", "AutoVideo Studio.exe");
const appPort = Number(process.env.AUTOVIDEO_APP_PORT || 3021);
const studioUrl = `http://127.0.0.1:${appPort}/studio`;

function parseArgs(argv) {
  const opts = { dev: argv.includes("--dev"), json: argv.includes("--json"), exe: "", timeoutMs: 90_000 };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--exe" && argv[i + 1]) opts.exe = path.resolve(argv[++i]);
    else if (argv[i] === "--timeout-ms" && argv[i + 1]) opts.timeoutMs = Number(argv[++i]) || 90_000;
  }
  return opts;
}

function killZombies({ electronOnly = false } = {}) {
  for (let pass = 0; pass < 2; pass++) {
    const images = electronOnly
      ? ["AutoVideo Studio.exe"]
      : ["AutoVideo Studio.exe", "autovideo-worker.exe"];
    for (const image of images) {
      spawnSync("taskkill", ["/IM", image, "/F", "/T"], { stdio: "ignore", windowsHide: true });
    }
    const killArgs = [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      path.join(productRoot, "scripts", "kill-desktop-workers.ps1"),
      "-StopElectron",
    ];
    if (electronOnly) killArgs.push("-SkipWorker");
    spawnSync("powershell.exe", killArgs, { stdio: "ignore", windowsHide: true });
    if (pass === 0) spawnSync("powershell", ["-NoProfile", "-Command", "Start-Sleep -Seconds 1"], { stdio: "ignore", windowsHide: true });
  }
}

function listDesktopShellProcesses() {
  const script = path.join(productRoot, "scripts", "kill-desktop-workers.ps1");
  const ps = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, "-ListOnly"],
    { encoding: "utf8", windowsHide: true },
  );
  const raw = (ps.stdout || "").trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function hasVisibleWindow() {
  return listDesktopShellProcesses().some((p) => Number(p.MainWindowHandle) > 0);
}

function isPidAlive(pid) {
  if (!pid || pid <= 0) return false;
  if (process.platform === "win32") {
    const r = spawnSync("tasklist", ["/FI", `PID eq ${pid}`, "/NH"], {
      encoding: "utf8",
      windowsHide: true,
    });
    return new RegExp(`\\b${pid}\\b`).test(String(r.stdout || ""));
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function probeHttp(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 3000 }, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

function launchPackaged(exe) {
  const launch = spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-Command",
      `$p = Start-Process -FilePath ${JSON.stringify(exe)} -WorkingDirectory ${JSON.stringify(path.dirname(exe))} -PassThru; Write-Output $p.Id`,
    ],
    { encoding: "utf8", windowsHide: true, timeout: 15_000 },
  );
  const pid = Number((launch.stdout || "").trim().split(/\r?\n/).pop());
  if (!Number.isFinite(pid) || pid <= 0) {
    throw new Error(`Start-Process failed for ${exe}`);
  }
  return pid;
}

function launchDev() {
  const script = path.join(productRoot, "scripts", "start-desktop-dev.ps1");
  const child = spawn(
    "powershell.exe",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script],
    { cwd: productRoot, detached: true, stdio: "ignore", windowsHide: true },
  );
  child.unref();
  return child.pid;
}

async function waitReady({ dev, pid, timeoutMs }) {
  const deadline = Date.now() + timeoutMs;
  let last = { processes: [], http: false, visible: false, pidAlive: false };
  while (Date.now() < deadline) {
    const processes = listDesktopShellProcesses();
    const visible = processes.some((p) => Number(p.MainWindowHandle) > 0);
    const pidAlive = isPidAlive(pid);
    const http = dev ? await probeHttp(studioUrl) : false;
    last = { processes, http, visible, pidAlive };
    if (visible) return { ok: true, reason: "MainWindowHandle", ...last };
    if (!dev && pidAlive) return { ok: true, reason: "packaged-pid", ...last };
    if (dev && http && processes.length > 0) return { ok: true, reason: "dev-http+process", ...last };
    await new Promise((r) => setTimeout(r, 1000));
  }
  return { ok: false, reason: "timeout", ...last };
}

async function main() {
  const opts = parseArgs(process.argv);
  killZombies({ electronOnly: Boolean(opts.dev) });
  await new Promise((r) => setTimeout(r, 800));

  const exe = opts.exe || defaultExe;
  const useDev = opts.dev || !fs.existsSync(exe);
  let pid = 0;

  if (useDev) {
    if (!opts.dev && !fs.existsSync(exe)) {
      console.log(`desktop-open: packaged exe missing — falling back to --dev (${defaultExe})`);
    }
    pid = launchDev();
    console.log(`desktop-open: dev shell starting (pid=${pid})`);
  } else {
    pid = launchPackaged(exe);
    console.log(`desktop-open: launched ${exe} (pid=${pid})`);
  }

  const ready = await waitReady({ dev: useDev, pid, timeoutMs: opts.timeoutMs });
  const result = {
    ok: ready.ok,
    mode: useDev ? "dev" : "packaged",
    pid,
    exe: useDev ? "" : exe,
    studioUrl,
    visible: ready.visible,
    http: ready.http,
    processes: ready.processes,
    reason: ready.reason,
  };

  if (opts.json) console.log(JSON.stringify(result, null, 2));

  if (!ready.ok) {
    console.error(
      `desktop-open: FAIL — no visible window after ${opts.timeoutMs}ms (http=${ready.http}, processes=${ready.processes.length})`,
    );
    process.exit(1);
  }

  console.log(`desktop-open: OK (${ready.reason}) visible=${ready.visible} http=${ready.http}`);
}

main().catch((err) => {
  console.error(`desktop-open: FAIL — ${err?.message || err}`);
  process.exit(1);
});
