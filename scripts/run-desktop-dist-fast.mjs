#!/usr/bin/env node
/**
 * Fast desktop pack for P0021 — skip worker when fingerprint matches; dir-first; no Authenticode.
 *
 * Usage (from app/ via pnpm desktop:dist:fast):
 *   node ../scripts/run-desktop-dist-fast.mjs
 *   node ../scripts/run-desktop-dist-fast.mjs --nsis
 *   node ../scripts/run-desktop-dist-fast.mjs --rebuild-ui
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeWorkerFingerprint } from "./worker-fingerprint.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productRoot = path.resolve(__dirname, "..");
const appDir = path.join(productRoot, "app");
const devRoot = path.resolve(productRoot, "..", "..");
const runPnpm = path.join(devRoot, "Tool", "scripts", "run-pnpm.mjs");
const runPnpmExec = path.join(devRoot, "Tool", "scripts", "run-pnpm-exec.mjs");
const winUnpacked = path.join(appDir, "dist-desktop", "win-unpacked");
const distDir = path.join(appDir, "dist");

const BUDGET_MS = 120_000;

function parseArgs(argv) {
  return {
    nsis: argv.includes("--nsis"),
    rebuildUi: argv.includes("--rebuild-ui") || argv.includes("--rebuild-next") || process.env.DESKTOP_FORCE_UI === "1" || process.env.DESKTOP_FORCE_NEXT === "1",
    skipWorker: argv.includes("--skip-worker"),
    forceWorker: argv.includes("--force-worker") || process.env.DESKTOP_FORCE_WORKER === "1",
    json: argv.includes("--json"),
  };
}

function step(name, fn) {
  const started = Date.now();
  const result = fn();
  const ms = Date.now() - started;
  return { name, ms, ...result };
}

function run(cmd, args, cwd = appDir) {
  const res = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    stdio: "inherit",
    windowsHide: true,
    env: {
      ...process.env,
      DESKTOP_RELEASE_SIGN: process.env.DESKTOP_RELEASE_SIGN || "0",
    },
  });
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed (exit ${res.status ?? "null"})`);
  }
}

function runCapture(cmd, args, cwd = appDir) {
  return spawnSync(cmd, args, { cwd, encoding: "utf8", windowsHide: true });
}

function killDesktopZombies() {
  for (const image of ["AutoVideo Studio.exe", "autovideo-worker.exe"]) {
    spawnSync("taskkill", ["/IM", image, "/F", "/T"], { stdio: "ignore", windowsHide: true });
  }
}

function cleanWinUnpacked() {
  killDesktopZombies();
  spawnSync("cmd.exe", ["/c", "rmdir /s /q", winUnpacked], { stdio: "ignore", windowsHide: true });
  if (fs.existsSync(winUnpacked)) {
    throw new Error(`dist-desktop/win-unpacked is locked — close AutoVideo Studio and retry`);
  }
}

function workerNeedsRebuild(force) {
  if (force) return true;
  const check = runCapture(process.execPath, [path.join(productRoot, "scripts", "worker-fingerprint.mjs"), "--check"], productRoot);
  return check.status !== 0;
}

function uiNeedsBuild(rebuildUi) {
  if (rebuildUi) return true;
  return !fs.existsSync(path.join(distDir, "index.html"));
}

function main() {
  const opts = parseArgs(process.argv);
  const started = Date.now();
  const timings = [];

  try {
    timings.push(
      step("clean-win-unpacked", () => {
        cleanWinUnpacked();
        return { ok: true };
      }),
    );

    const rebuildWorker = !opts.skipWorker && workerNeedsRebuild(opts.forceWorker);
    if (opts.skipWorker) {
      timings.push({ name: "desktop-worker", ms: 0, ok: true, skipped: true });
      console.log("==> skip worker rebuild (--skip-worker)");
    } else if (rebuildWorker) {
      timings.push(
        step("desktop-worker", () => {
          run(process.execPath, [runPnpm, "run", "desktop:worker"], appDir);
          run(process.execPath, [path.join(productRoot, "scripts", "worker-fingerprint.mjs"), "--write"], productRoot);
          return { ok: true };
        }),
      );
    } else {
      timings.push({ name: "desktop-worker", ms: 0, ok: true, skipped: true });
      console.log("==> skip worker rebuild (fingerprint match)");
    }

    const rebuildUi = uiNeedsBuild(opts.rebuildUi);
    if (rebuildUi) {
      timings.push(
        step("vite-build", () => {
          run("powershell.exe", [
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            path.join(productRoot, "scripts", "prepare-desktop-build.ps1"),
          ]);
          return { ok: true };
        }),
      );
    } else {
      timings.push(
        step("desktop-prepare", () => {
          run("powershell.exe", [
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            path.join(productRoot, "scripts", "prepare-desktop-build.ps1"),
            "-SkipUiBuild",
          ]);
          return { ok: true, skippedUi: true };
        }),
      );
    }

    const builderArgs = [runPnpmExec, "electron-builder", "--win", "--x64", "--publish", "never", "-c.win.signExecutable=false"];
    if (opts.nsis) builderArgs.push("nsis");
    else builderArgs.push("--dir");

    timings.push(
      step(opts.nsis ? "electron-builder-nsis" : "electron-builder-dir", () => {
        run(process.execPath, builderArgs, appDir);
        return { ok: true };
      }),
    );

    const exePath = path.join(winUnpacked, "AutoVideo Studio.exe");
    if (!fs.existsSync(exePath)) {
      throw new Error(`packaged exe missing: ${exePath}`);
    }

    const totalMs = Date.now() - started;
    const budgetOk = totalMs <= BUDGET_MS;
    const summary = {
      ok: true,
      mode: opts.nsis ? "nsis" : "dir",
      exe: exePath,
      workerFingerprint: computeWorkerFingerprint().slice(0, 12),
      totalMs,
      budgetOk,
      budgetLabel: budgetOk ? "BUDGET OK" : "BUDGET MISS",
      timings,
    };

    console.log(`\n==> desktop:dist:fast ${summary.budgetLabel} (${(totalMs / 1000).toFixed(1)}s)`);
    for (const t of timings) {
      const skip = t.skipped ? " (skip)" : t.skippedUi ? " (skip ui)" : "";
      console.log(`    ${t.name}: ${(t.ms / 1000).toFixed(1)}s${skip}`);
    }

    if (opts.json) console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
  } catch (err) {
    const totalMs = Date.now() - started;
    console.error(`desktop:dist:fast: FAIL — ${err?.message || err} (${(totalMs / 1000).toFixed(1)}s)`);
    process.exit(1);
  }
}

main();
