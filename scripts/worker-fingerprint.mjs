#!/usr/bin/env node
/**
 * Hash worker sources; skip PyInstaller when stamp matches.
 *
 * Usage:
 *   node scripts/worker-fingerprint.mjs --check
 *   node scripts/worker-fingerprint.mjs --write
 *   node scripts/worker-fingerprint.mjs --print
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productRoot = path.resolve(__dirname, "..");
const workerDir = path.join(productRoot, "worker");
const pipelineCore = path.resolve(productRoot, "..", "..", "packages", "video-pipeline-core", "src");
const workerExe = path.join(workerDir, "dist", "autovideo-worker", "autovideo-worker.exe");
const stampPath = path.join(workerDir, "dist", "autovideo-worker", ".worker-build-fingerprint.json");

const SOURCE_GLOBS = [
  path.join(workerDir, "desktop_worker.py"),
  path.join(workerDir, "main.py"),
  path.join(workerDir, "requirements.txt"),
];

function parseArgs(argv) {
  return {
    check: argv.includes("--check"),
    write: argv.includes("--write"),
    print: argv.includes("--print"),
    force: argv.includes("--force"),
  };
}

function listFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === ".venv" || entry.name === "__pycache__" || entry.name === "dist" || entry.name === "build") {
        continue;
      }
      listFiles(full, acc);
      continue;
    }
    if (/\.(py|txt|spec)$/i.test(entry.name)) acc.push(full);
  }
  return acc;
}

function collectSourceFiles() {
  const files = [...SOURCE_GLOBS.filter((f) => fs.existsSync(f)), ...listFiles(path.join(workerDir, "pipeline"))];
  if (fs.existsSync(pipelineCore)) {
    files.push(...listFiles(pipelineCore));
  }
  return [...new Set(files)].sort((a, b) => a.localeCompare(b));
}

export function computeWorkerFingerprint() {
  const hash = crypto.createHash("sha256");
  for (const file of collectSourceFiles()) {
    const rel = path.relative(productRoot, file).replace(/\\/g, "/");
    hash.update(rel);
    hash.update("\0");
    hash.update(fs.readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function readStamp() {
  if (!fs.existsSync(stampPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(stampPath, "utf8"));
  } catch {
    return null;
  }
}

function writeStamp(fingerprint) {
  fs.mkdirSync(path.dirname(stampPath), { recursive: true });
  fs.writeFileSync(
    stampPath,
    `${JSON.stringify({ fingerprint, writtenAt: new Date().toISOString(), files: collectSourceFiles().length }, null, 2)}\n`,
    "utf8",
  );
}

function main() {
  const opts = parseArgs(process.argv);
  const fingerprint = computeWorkerFingerprint();

  if (opts.print) {
    console.log(fingerprint);
    return;
  }

  if (opts.write) {
    writeStamp(fingerprint);
    console.log(`worker-fingerprint: wrote ${fingerprint.slice(0, 12)}…`);
    return;
  }

  if (opts.check) {
    const stamp = readStamp();
    const exeOk = fs.existsSync(workerExe);
    const match = Boolean(stamp?.fingerprint && stamp.fingerprint === fingerprint && exeOk);
    if (match && !opts.force) {
      console.log(`worker-fingerprint: OK (skip PyInstaller) ${fingerprint.slice(0, 12)}…`);
      process.exit(0);
    }
    if (!exeOk) console.log("worker-fingerprint: worker exe missing");
    else if (!stamp?.fingerprint) console.log("worker-fingerprint: stamp missing");
    else console.log("worker-fingerprint: sources changed");
    process.exit(1);
  }

  console.log(`worker-fingerprint: ${fingerprint}`);
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) main();
