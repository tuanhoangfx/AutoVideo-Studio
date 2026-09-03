#!/usr/bin/env node
/**
 * P0021 keyframe scene chrome smoke — HTTP probe + audit (no Stealth).
 *
 *   node Tool/P0021-AutoVideo-Studio/scripts/smoke-keyframe-chrome.mjs
 *   node Tool/P0021-AutoVideo-Studio/scripts/smoke-keyframe-chrome.mjs --json
 */
import { spawnSync } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const devRoot = path.resolve(__dirname, '..', '..', '..');
const appPort = Number(process.env.AUTOVIDEO_APP_PORT || 3021);
const studioUrl = `http://127.0.0.1:${appPort}/studio`;
const json = process.argv.includes('--json');

function probe(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 4000 }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => resolve({ ok: res.statusCode === 200, status: res.statusCode, body }));
    });
    req.on('error', () => resolve({ ok: false, status: 0, body: '' }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 0, body: '' });
    });
  });
}

function runAudit() {
  const script = path.join(devRoot, 'Tool', 'scripts', 'audit-p0021-keyframe-scene-table.mjs');
  const res = spawnSync(process.execPath, [script, '--strict', '--json'], { encoding: 'utf8' });
  if (res.status !== 0) return { ok: false, raw: res.stdout || res.stderr };
  try {
    return { ok: true, report: JSON.parse(res.stdout) };
  } catch {
    return { ok: false, raw: res.stdout || res.stderr };
  }
}

async function main() {
  const probeResult = await probe(studioUrl);
  const auditResult = runAudit();
  const ok = probeResult.ok && auditResult.ok;
  const result = {
    ok,
    studioUrl,
    http: probeResult.status,
    audit: auditResult.ok,
    failures: auditResult.ok ? [] : [auditResult.raw || 'audit failed'],
  };
  if (json) console.log(JSON.stringify(result, null, 2));
  else if (!ok) {
    console.error('smoke-keyframe-chrome: FAIL');
    if (!probeResult.ok) console.error(`  - dev server not ready at ${studioUrl}`);
    if (!auditResult.ok) console.error(`  - audit failed`);
    process.exit(1);
  } else {
    console.log(`smoke-keyframe-chrome: OK ${studioUrl}`);
  }
}

main().catch((err) => {
  console.error(`smoke-keyframe-chrome: FAIL — ${err?.message || err}`);
  process.exit(1);
});
