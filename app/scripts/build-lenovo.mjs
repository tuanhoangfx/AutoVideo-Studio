#!/usr/bin/env node
/** Lenovo static deploy — Vite only (no pre-build tsc; vitest owns types in CI). */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vite = path.join(root, "node_modules/vite/bin/vite.js");
const r = spawnSync(process.execPath, [vite, "build"], { cwd: root, stdio: "inherit", env: process.env });
process.exit(r.status ?? 1);
