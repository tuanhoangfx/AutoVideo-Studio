#!/usr/bin/env node
/**
 * Fail when P0021 directory column meta still uses % widths (hub-ui rem/px SSOT).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appSrc = path.resolve(__dirname, "..", "app", "src");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/meta\.tsx?$/.test(entry.name) || /directory.*meta\.tsx?$/i.test(entry.name)) out.push(full);
  }
  return out;
}

const failures = [];
const percentInCol = /col\([^)]*,\s*['"][^'"]*%['"]/;
const autoInCol = /col\([^)]*,\s*['"]auto['"]/;

for (const file of walk(appSrc)) {
  const rel = path.relative(appSrc, file).replace(/\\/g, "/");
  const text = fs.readFileSync(file, "utf8");
  if (percentInCol.test(text)) {
    failures.push(`${rel}: col() width still uses %`);
  }
  if (autoInCol.test(text)) {
    failures.push(`${rel}: col() width still uses auto`);
  }
}

if (failures.length) {
  console.error("audit-p0021-directory-column-widths: FAIL");
  for (const line of failures) console.error(`  - ${line}`);
  process.exit(1);
}

console.log("audit-p0021-directory-column-widths: OK");
