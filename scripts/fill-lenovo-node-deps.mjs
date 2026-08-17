#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outRoot = path.resolve(__dirname, "../dist-node");
const store = path.resolve(__dirname, "../../../node_modules/.pnpm");
const nm = path.join(outRoot, "node_modules");

function findPnpmPkg(name) {
  if (!fs.existsSync(store)) return null;
  if (name.startsWith("@")) {
    const [scope, pkg] = name.split("/");
    const prefix = `${scope.slice(1)}+${pkg}@`;
    for (const d of fs.readdirSync(store)) {
      if (!d.startsWith(prefix)) continue;
      const cand = path.join(store, d, "node_modules", scope, pkg);
      if (fs.existsSync(cand)) return cand;
    }
    return null;
  }
  for (const d of fs.readdirSync(store)) {
    if (!d.startsWith(`${name}@`)) continue;
    const cand = path.join(store, d, "node_modules", name);
    if (fs.existsSync(cand)) return cand;
  }
  return null;
}

function copyPkg(name) {
  const src = findPnpmPkg(name);
  if (!src) {
    console.warn("[fill-lenovo-node-deps] missing", name);
    return false;
  }
  const dst = path.join(nm, ...name.split("/"));
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  if (fs.existsSync(dst)) fs.rmSync(dst, { recursive: true, force: true });
  fs.cpSync(src, dst, { recursive: true });
  return true;
}

for (const name of [
  "styled-jsx",
  "@swc/helpers",
  "@swc/counter",
  "@next/env",
  "busboy",
  "caniuse-lite",
  "postcss",
  "client-only",
  "react-dom",
  "@next/swc-win32-x64-msvc",
]) {
  copyPkg(name);
}

for (let i = 0; i < 40; i++) {
  const r = spawnSync(process.execPath, ["-e", "require('next')"], { cwd: outRoot, encoding: "utf8" });
  if (r.status === 0) {
    console.log(JSON.stringify({ ok: true, requireNext: true }));
    process.exit(0);
  }
  const msg = String(r.stderr || r.stdout || "");
  const m = msg.match(/Cannot find module '([^']+)'/);
  if (!m) {
    console.error(msg.slice(0, 500));
    process.exit(1);
  }
  const mod = m[1];
  const name = mod.startsWith("@") ? mod.split("/").slice(0, 2).join("/") : mod.split("/")[0];
  if (!copyPkg(name)) process.exit(1);
}
console.error("still missing deps after retries");
process.exit(1);
