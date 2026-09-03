#!/usr/bin/env node
/**
 * P0021 resolve-login API smoke — catches missing Next App Router route (404 → Sign-in service unavailable).
 *
 *   node Tool/P0021-AutoVideo-Studio/scripts/smoke-p0021-login-resolve.mjs [--port 3021] [--json]
 */
import process from "node:process";

const argv = process.argv.slice(2);
const flag = (name, fallback = "") => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
};
const has = (name) => argv.includes(`--${name}`);

const port = Number(flag("port", "3021"));
const jsonOut = has("json");
const origin = `http://127.0.0.1:${port}`;
const resolveUrl = `${origin}/api/hub/auth/resolve-login`;

async function postResolve(loginId, identifierKind = "username") {
  const res = await fetch(resolveUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginId, identifierKind }),
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text.slice(0, 200) };
  }
  return { status: res.status, body, html: /<!DOCTYPE html>/i.test(text) };
}

async function main() {
  const errors = [];
  const checks = [];

  try {
    const studio = await fetch(`${origin}/studio`, { method: "GET" });
    checks.push({ id: "studio-http", ok: studio.status === 200, status: studio.status });
    if (studio.status !== 200) errors.push(`GET /studio returned ${studio.status}`);
  } catch (err) {
    errors.push(`Dev server down at ${origin} — start: cd app && pnpm dev`);
    checks.push({ id: "studio-http", ok: false, error: String(err) });
  }

  const empty = await postResolve("");
  checks.push({ id: "resolve-empty", status: empty.status, html: empty.html });
  if (empty.status === 404 || empty.html) {
    errors.push("POST /api/hub/auth/resolve-login returned 404/HTML — Next route missing");
  } else if (empty.status !== 400) {
    errors.push(`empty loginId expected 400, got ${empty.status}`);
  }

  const probe = await postResolve("czpqo", "username");
  checks.push({ id: "resolve-username", status: probe.status, html: probe.html, body: probe.body });
  if (probe.status === 404 || probe.html) {
    errors.push("username resolve-login returned 404/HTML — auth infra broken");
  } else if (probe.status >= 500) {
    errors.push(`username resolve-login server error ${probe.status}`);
  }

  const result = { ok: errors.length === 0, origin, resolveUrl, checks, errors };
  if (jsonOut) {
    console.log(JSON.stringify(result, null, 2));
  } else if (result.ok) {
    console.log(`smoke-p0021-login-resolve OK (${origin})`);
    for (const c of checks) console.log(`  ✓ ${c.id} → ${c.status}`);
  } else {
    console.error("smoke-p0021-login-resolve FAILED");
    for (const e of errors) console.error(`  ✗ ${e}`);
    for (const c of checks) console.error(`  · ${c.id}: ${JSON.stringify(c)}`);
  }
  process.exit(result.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
