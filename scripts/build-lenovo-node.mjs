#!/usr/bin/env node
/**
 * Build Next.js standalone bundle for Lenovo Node SSR deploy.
 * Output: dist-node/ (server.js + .next/static + public + runtime deps)
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productRoot = path.resolve(__dirname, "..");
const appRoot = path.join(productRoot, "app");
const outRoot = path.join(productRoot, "dist-node");
const sharedEnvPath = path.resolve(productRoot, "../../.env.shared");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

function sh(cmd, cwd, env) {
  console.log("[build-lenovo-node] " + cmd);
  const r = spawnSync(cmd, { cwd, env, shell: true, stdio: "inherit" });
  if (r.status !== 0) throw new Error("failed: " + cmd);
}

function copyDir(src, dst, { dereference = false } = {}) {
  fs.mkdirSync(dst, { recursive: true });
  // pnpm links node_modules entries to the workspace store — must dereference for Lenovo.
  fs.cpSync(src, dst, { recursive: true, dereference });
}

const shared = loadEnvFile(sharedEnvPath);
const local = loadEnvFile(path.join(appRoot, ".env.local"));
const bake = {
  ...process.env,
  ...shared,
  ...local,
  NEXT_PUBLIC_HUB_AUTH_URL: local.NEXT_PUBLIC_HUB_AUTH_URL || shared.VITE_HUB_AUTH_URL || shared.NEXT_PUBLIC_HUB_AUTH_URL || "https://api.infi.io.vn",
  NEXT_PUBLIC_HUB_AUTH_ANON_KEY:
    local.NEXT_PUBLIC_HUB_AUTH_ANON_KEY || shared.VITE_HUB_AUTH_ANON_KEY || shared.NEXT_PUBLIC_HUB_AUTH_ANON_KEY || "",
  NEXT_PUBLIC_HUB_SUPABASE_URL:
    local.NEXT_PUBLIC_HUB_SUPABASE_URL || shared.VITE_HUB_SUPABASE_URL || "https://hub-api.infi.io.vn",
  NEXT_PUBLIC_HUB_SUPABASE_ANON_KEY:
    local.NEXT_PUBLIC_HUB_SUPABASE_ANON_KEY || shared.VITE_HUB_SUPABASE_ANON_KEY || shared.NEXT_PUBLIC_HUB_SUPABASE_ANON_KEY || "",
  GOOGLE_DRIVE_API_REFERER: local.GOOGLE_DRIVE_API_REFERER || "https://p0021.infi.io.vn/studio",
};

if (!bake.NEXT_PUBLIC_HUB_SUPABASE_ANON_KEY && !bake.NEXT_PUBLIC_HUB_AUTH_ANON_KEY) {
  console.warn("[build-lenovo-node] warning: hub anon key empty — login may fail in prod");
}

sh("pnpm run build", appRoot, bake);

const standalone = path.join(appRoot, ".next", "standalone");
if (!fs.existsSync(standalone)) throw new Error("Missing .next/standalone after build");

// Next may nest under app/ when the project lives in a subfolder
let serverDir = standalone;
if (!fs.existsSync(path.join(serverDir, "server.js")) && fs.existsSync(path.join(standalone, "app", "server.js"))) {
  serverDir = path.join(standalone, "app");
}
if (!fs.existsSync(path.join(serverDir, "server.js"))) {
  throw new Error("server.js not found under standalone");
}

if (fs.existsSync(outRoot)) fs.rmSync(outRoot, { recursive: true, force: true });
copyDir(serverDir, outRoot, { dereference: true });


// Force-materialize node_modules (Windows tar cannot ship pnpm symlink targets to Lenovo).
const nmSrc = path.join(serverDir, "node_modules");
const nmDst = path.join(outRoot, "node_modules");
if (fs.existsSync(nmSrc)) {
  if (fs.existsSync(nmDst)) fs.rmSync(nmDst, { recursive: true, force: true });
  copyDir(nmSrc, nmDst, { dereference: true });
}

const staticSrc = path.join(appRoot, ".next", "static");
const staticDst = path.join(outRoot, ".next", "static");
if (fs.existsSync(staticSrc)) copyDir(staticSrc, staticDst);

const publicSrc = path.join(appRoot, "public");
const publicDst = path.join(outRoot, "public");
if (fs.existsSync(publicSrc)) copyDir(publicSrc, publicDst);

// Runtime secrets for API routes (not inlined as NEXT_PUBLIC_*)
const runtimeEnv = {
  GOOGLE_DRIVE_API_KEY: bake.GOOGLE_DRIVE_API_KEY || "",
  GOOGLE_DRIVE_API_REFERER: bake.GOOGLE_DRIVE_API_REFERER || "https://p0021.infi.io.vn/studio",
  NEXT_PUBLIC_GOOGLE_API_KEY: bake.NEXT_PUBLIC_GOOGLE_API_KEY || bake.GOOGLE_DRIVE_API_KEY || "",
};
fs.writeFileSync(
  path.join(outRoot, ".env"),
  Object.entries(runtimeEnv)
    .filter(([, v]) => v)
    .map(([k, v]) => k + "=" + v)
    .join("\n") + "\n",
  "utf8",
);

sh("node \"" + path.join(__dirname, "fill-lenovo-node-deps.mjs") + "\"", productRoot, process.env);
console.log(JSON.stringify({ ok: true, outRoot, hasServer: fs.existsSync(path.join(outRoot, "server.js")) }, null, 2));
