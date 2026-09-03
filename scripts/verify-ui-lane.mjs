#!/usr/bin/env node
/**
 * UI verify lane for P0021 — audits + optional dev probe. No exe rebuild.
 *
 * Usage:
 *   node scripts/verify-ui-lane.mjs
 *   node scripts/verify-ui-lane.mjs --probe
 */
import fs from "node:fs";
import http from "node:http";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productRoot = path.resolve(__dirname, "..");
const devRoot = path.resolve(__dirname, "..", "..", "..");
const appPort = Number(process.env.AUTOVIDEO_APP_PORT || 3021);
const studioUrl = `http://127.0.0.1:${appPort}/studio`;

function parseArgs(argv) {
  return { probe: argv.includes("--probe") };
}

function runAudit(script, args) {
  const scriptPath = path.join(devRoot, "Tool", "scripts", script);
  const res = spawnSync(process.execPath, [scriptPath, ...args], {
    encoding: "utf8",
    stdio: "inherit",
    windowsHide: true,
  });
  if (res.status !== 0) {
    throw new Error(`${script} failed (exit ${res.status})`);
  }
}

function probeUrl(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 4000 }, (res) => {
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

async function main() {
  const opts = parseArgs(process.argv);
  console.log("==> P0021 UI verify lane (no desktop pack)");

  if (opts.probe) {
    const ok = await probeUrl(studioUrl);
    if (!ok) {
      console.error(`verify-ui-lane: dev server not ready at ${studioUrl}`);
      console.error("Start with: cd app && pnpm dev   (or pnpm desktop:dev for Electron shell)");
      process.exit(1);
    }
    console.log(`==> dev probe OK ${studioUrl}`);
  } else {
    const ok = await probeUrl(studioUrl);
    console.log(ok ? `==> dev server up ${studioUrl}` : `==> dev server down (audits only — run: cd app && pnpm dev)`);
  }

  runAudit('audit-hub-chrome-contract.mjs', ['--code', 'P0021', '--strict']);
  runAudit('audit-hub-split-workspace-chrome.mjs', ['--code', 'P0021', '--strict']);
  runAudit('audit-p0021-keyframe-scene-table.mjs', ['--strict']);

  const auditColumnWidths = path.join(productRoot, 'scripts', 'audit-p0021-directory-column-widths.mjs');
  if (fs.existsSync(auditColumnWidths)) {
    const res = spawnSync(process.execPath, [auditColumnWidths], {
      encoding: 'utf8',
      stdio: 'inherit',
      windowsHide: true,
    });
    if (res.status !== 0) throw new Error('audit-p0021-directory-column-widths failed');
  }

  runAudit('hub-auth-migration-check.mjs', ['--code', 'P0021']);
  runAudit('hub-identity-vendor-hash-check.mjs', ['--code', 'P0021']);

  const smokeBoot = path.join(productRoot, 'scripts', 'smoke-p0021-boot.mjs');
  if (opts.probe && fs.existsSync(smokeBoot)) {
    const res = spawnSync(process.execPath, [smokeBoot], {
      encoding: 'utf8',
      stdio: 'inherit',
      windowsHide: true,
    });
    if (res.status !== 0) throw new Error('smoke-p0021-boot failed');
  }

  const smokeKeyframe = path.join(productRoot, 'scripts', 'smoke-keyframe-chrome.mjs');
  if (opts.probe && fs.existsSync(smokeKeyframe)) {
    const res = spawnSync(process.execPath, [smokeKeyframe, '--json'], {
      encoding: 'utf8',
      stdio: 'inherit',
      windowsHide: true,
    });
    if (res.status !== 0) throw new Error('smoke-keyframe-chrome failed');
  }

  const electronProbe = path.join(productRoot, 'scripts', 'probe-electron-boot.ps1');
  if (opts.probe && process.platform === 'win32' && fs.existsSync(electronProbe)) {
    console.log('==> electron boot probe (launch + rootChildren check)');
    const res = spawnSync(
      'powershell',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', electronProbe],
      { encoding: 'utf8', stdio: 'inherit', windowsHide: true },
    );
    if (res.status !== 0) throw new Error('probe-electron-boot failed');
  }

  console.log("verify-ui-lane: OK — use desktop:dist:fast only when shipping exe");
}

main().catch((err) => {
  console.error(`verify-ui-lane: FAIL — ${err?.message || err}`);
  process.exit(1);
});
