#!/usr/bin/env node
/**
 * P0021 boot smoke — HTTP module graph + optional Stealth DOM probe.
 *
 * Usage:
 *   node scripts/smoke-p0021-boot.mjs
 *   node scripts/smoke-p0021-boot.mjs --stealth
 *   node scripts/smoke-p0021-boot.mjs --json
 */
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { openStealthCdpSession, cdpEvaluate } from "../../scripts/lib/stealth-cdp-session.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appPort = Number(process.env.AUTOVIDEO_APP_PORT || 3021);
const studioUrl = `http://127.0.0.1:${appPort}/studio?desktop=1&workerUrl=http%3A%2F%2F127.0.0.1%3A8021`;

function parseArgs(argv) {
  return { stealth: argv.includes("--stealth"), json: argv.includes("--json") };
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: 8000 }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

async function probeModuleGraph() {
  const failures = [];
  const studio = await fetchText(`http://127.0.0.1:${appPort}/studio`);
  if (studio.status !== 200) failures.push(`studio HTTP ${studio.status}`);

  const api = await fetchText(`http://127.0.0.1:${appPort}/src/lib/api.ts`);
  if (api.status !== 200) failures.push(`api.ts HTTP ${api.status}`);
  if (/process\.env/.test(api.body)) failures.push("api.ts still uses process.env");
  if (!/import\.meta\.env/.test(api.body)) failures.push("api.ts missing import.meta.env");

  const hub = await fetchText(`http://127.0.0.1:${appPort}/src/lib/hub-supabase-env.ts`);
  if (hub.status !== 200) failures.push(`hub-supabase-env.ts HTTP ${hub.status}`);
  if (/readViteEnvString/.test(hub.body)) failures.push("hub-supabase-env imports readViteEnvString (vendor drift risk)");

  return failures;
}

function assignAgentPoolProfile() {
  const assign = spawnSync(
    process.execPath,
    [path.resolve(__dirname, "../../scripts/assign-agent-stealth-profile.mjs"), "--json"],
    { encoding: "utf8", windowsHide: true },
  );
  try {
    const parsed = JSON.parse(assign.stdout || "{}");
    return String(parsed.profile || "9990");
  } catch {
    return "9990";
  }
}

async function probeStealth() {
  process.env.STEALTH_AGENT_SMOKE = process.env.STEALTH_AGENT_SMOKE || "1";
  process.env.STEALTH_HEADLESS_SMOKE = process.env.STEALTH_HEADLESS_SMOKE || "1";
  if (!process.env.STEALTH_BROWSER_API_URL && !process.env.STEALTH_BROWSER_API_MODE) {
    process.env.STEALTH_BROWSER_API_MODE = "prod";
  }
  const profile = assignAgentPoolProfile();
  const session = await openStealthCdpSession(profile, { matchUrl: studioUrl });
  try {
    await session.send("Page.navigate", { url: studioUrl });
    await session.send("Page.loadEventFired").catch(() => null);
    const started = Date.now();
    let snapshot = null;
    while (Date.now() - started < 90_000) {
      snapshot = await cdpEvaluate(
        session.send,
        `(() => ({
          boot: window.__p0021Boot || null,
          hubBootReady: Boolean(window.__hubBootReady),
          rootChildren: document.getElementById('root')?.childElementCount ?? 0,
          lastError: window.__P0021_LAST_ERROR || window.__HUB_LAST_RENDER_ERROR || null,
          crash: Boolean(document.getElementById('hub-boot-crash')),
          crashText: document.getElementById('hub-boot-crash')?.innerText || null,
          bootText: document.getElementById('hub-boot-loader')?.innerText || null,
          boundary: Array.from(document.querySelectorAll('h2')).some((el) => /failed to load/i.test(el.textContent || '')),
          title: document.title,
        }))()`,
      );
      if (snapshot?.rootChildren > 0 || snapshot?.lastError || snapshot?.crash || snapshot?.boundary) break;
      await new Promise((r) => setTimeout(r, 2000));
    }
    const rootChildren = Number(snapshot?.rootChildren ?? 0);
    const okBoot = rootChildren > 0 && !snapshot?.lastError && !snapshot?.crash && !snapshot?.boundary;
    if (!okBoot) return { ok: false, snapshot };

    await new Promise((r) => setTimeout(r, 1500));
    await cdpEvaluate(
      session.send,
      `(() => {
        const btn = [...document.querySelectorAll("button.hub-filter-trigger")].find((el) => {
          const t = (el.textContent || "") + (el.getAttribute("title") || "") + (el.getAttribute("aria-label") || "");
          return /Gender/i.test(t) || (el.querySelector(".hub-filter-option-emoji")?.textContent || "").includes("⚧");
        });
        btn?.click();
        return Boolean(btn);
      })()`,
    );
    await new Promise((r) => setTimeout(r, 400));
    const gap = await cdpEvaluate(
      session.send,
      `(() => {
        const panel = document.querySelector("[data-hub-multi-filter-panel]");
        const cluster = panel?.querySelector(".hub-inline-gap-name");
        const emoji = cluster?.querySelector(".hub-filter-option-emoji");
        const label = [...(cluster?.querySelectorAll("span") || [])].find((s) =>
          /Female|Select shown/.test(s.textContent || ""),
        );
        let delta = null;
        if (emoji && label) {
          const er = emoji.getBoundingClientRect();
          const lr = label.getBoundingClientRect();
          delta = Math.round((lr.left - er.right) * 10) / 10;
        }
        return {
          gap: cluster ? getComputedStyle(cluster).gap : null,
          delta,
          female: Boolean(label),
          triggers: [...document.querySelectorAll("button.hub-filter-trigger")].map((el) =>
            (el.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 40),
          ),
        };
      })()`,
    );
    snapshot.genderGap = gap;
    return { ok: true, snapshot };
  } finally {
    await session.close();
  }
}

async function main() {
  const opts = parseArgs(process.argv);
  const failures = await probeModuleGraph();
  let stealth = null;

  if (opts.stealth && failures.length === 0) {
    try {
      stealth = await probeStealth();
      if (!stealth.ok) {
        const snap = stealth.snapshot || {};
        failures.push(
          `stealth boot: root=${snap.rootChildren ?? "?"} crash=${snap.crash ? "yes" : "no"} err=${snap.lastError || snap.crashText || "empty root"}`,
        );
      }
    } catch (err) {
      failures.push(`stealth boot: ${err?.message || err}`);
    }
  }

  const payload = {
    ok: failures.length === 0,
    studioUrl,
    failures,
    stealth: stealth?.snapshot ?? null,
  };

  if (opts.json) console.log(JSON.stringify(payload, null, 2));
  else if (payload.ok) console.log(`smoke-p0021-boot: OK ${studioUrl}`);
  else console.error(`smoke-p0021-boot: FAIL\n- ${failures.join("\n- ")}`);

  if (!payload.ok) process.exit(1);
}

main().catch((err) => {
  console.error(`smoke-p0021-boot: FAIL — ${err?.message || err}`);
  process.exit(1);
});
