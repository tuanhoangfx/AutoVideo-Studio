import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const desktopBuild = process.argv.includes("--desktop");
if (desktopBuild) process.env.AUTOVIDEO_DESKTOP_BUILD = "1";

const childEnv = {
  ...process.env,
  ...(desktopBuild ? { AUTOVIDEO_DESKTOP_BUILD: "1" } : {}),
};

function runNode(modulePath, args = []) {
  const result = spawnSync(process.execPath, [modulePath, ...args], {
    stdio: "inherit",
    cwd: root,
    env: childEnv,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const viteCache = path.join(root, "node_modules", ".vite");
if (fs.existsSync(viteCache)) {
  try {
    fs.rmSync(viteCache, { recursive: true, force: true });
  } catch {
    /* ignore locked cache */
  }
}

if (!desktopBuild) {
  runNode(path.join(root, "node_modules/typescript/bin/tsc"), ["--noEmit"]);
}

if (desktopBuild) {
  const distDir = path.join(root, "dist");
  if (fs.existsSync(distDir)) {
    try {
      fs.rmSync(distDir, { recursive: true, force: true });
    } catch (error) {
      console.warn("build.mjs: could not wipe dist:", error instanceof Error ? error.message : error);
    }
  }
}

runNode(path.join(root, "node_modules/vite/bin/vite.js"), ["build"]);

if (desktopBuild) {
  const indexHtml = path.join(root, "dist", "index.html");
  const html = fs.readFileSync(indexHtml, "utf8");
  if (!/\bsrc=["']\.\/assets\//.test(html)) {
    console.error("Desktop build missing relative ./assets/ script — abort.");
    process.exit(1);
  }
  console.log("Desktop UI OK: relative asset URLs in dist/index.html");
}
