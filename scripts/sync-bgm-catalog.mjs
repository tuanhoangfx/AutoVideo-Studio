#!/usr/bin/env node
/**
 * Mirror SoundHelix catalog MP3s into app/public/bgm for lenovo-static prod.
 * Dev skips this — Vite proxies /bgm → soundhelix.com.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '../app/public/bgm');
const BASE = 'https://www.soundhelix.com/examples/mp3';
const FILES = [
  'SoundHelix-Song-1.mp3',
  'SoundHelix-Song-2.mp3',
  'SoundHelix-Song-3.mp3',
  'SoundHelix-Song-4.mp3',
  'SoundHelix-Song-5.mp3',
  'SoundHelix-Song-6.mp3',
];

fs.mkdirSync(outDir, { recursive: true });

for (const file of FILES) {
  const dest = path.join(outDir, file);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 10_000) {
    console.log('skip', file);
    continue;
  }
  process.stdout.write(`fetch ${file}… `);
  const resp = await fetch(`${BASE}/${file}`);
  if (!resp.ok) {
    console.log('FAIL', resp.status);
    process.exitCode = 1;
    continue;
  }
  const buf = Buffer.from(await resp.arrayBuffer());
  fs.writeFileSync(dest, buf);
  console.log(`${(buf.length / 1024 / 1024).toFixed(1)} MB`);
}

console.log('done →', outDir);
