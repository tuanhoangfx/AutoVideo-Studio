const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');

const packaged = app.isPackaged;
if (!packaged) {
  app.commandLine.appendSwitch('ignore-connections-limit', '127.0.0.1,localhost');
  app.commandLine.appendSwitch('disable-http2');
}
const forcedDevAppUrl = packaged ? '' : (process.env.AUTOVIDEO_APP_URL || '').trim();
const devAppRoot = path.resolve(__dirname, '..');
const productRoot = path.resolve(devAppRoot, '..');
const uiDistDir = packaged
  ? path.join(process.resourcesPath, 'ui')
  : path.join(devAppRoot, 'dist');
const repoRoot = packaged ? process.resourcesPath : productRoot;
const workerDir = packaged ? path.join(process.resourcesPath, 'worker-dist') : path.join(productRoot, 'worker');
const runtimeDir = packaged ? path.join(app.getPath('userData'), 'runtime') : path.join(repoRoot, '.runtime');
const workerStorageDir = path.join(runtimeDir, 'worker-storage', 'jobs');
const workerPreviewDir = path.join(runtimeDir, 'worker-storage', 'preview');
const workerLog = path.join(runtimeDir, 'desktop-worker.log');
const workerErrorLog = path.join(runtimeDir, 'desktop-worker.err.log');
const desktopConfigFile = path.join(runtimeDir, 'desktop-config.json');
const electronBootLog = path.join(runtimeDir, 'electron-boot.log');

function bootLogLine(message) {
  if (packaged) return;
  try {
    fs.appendFileSync(electronBootLog, `${message}\n`, 'utf8');
  } catch {
    /* ignore */
  }
}

function bootLog(message) {
  console.log(message);
  bootLogLine(message);
}

if (!packaged && process.env.AUTOVIDEO_DISABLE_GPU === '1') {
  app.disableHardwareAcceleration();
}

function resolveDesktopIcon() {
  const candidates = packaged
    ? [
        path.join(path.dirname(process.execPath), 'resources', 'build', 'icon.ico'),
        path.join(process.resourcesPath, 'build', 'icon.ico'),
      ]
    : [path.join(__dirname, '..', 'build', 'icon.ico')];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

const desktopIcon = resolveDesktopIcon();

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}

let mainWindow = null;
let workerProcess = null;
let workerUrl = '';
let workerPort = 8021;
let outputDirectory = '';
/** Background startup checks should not flash a warning when GitHub feed is unreachable. */
let updateCheckUserInitiated = false;

let updateStatus = {
  state: packaged ? 'latest' : 'dev',
  supportsUpdates: packaged,
  currentVersion: app.getVersion(),
  message: packaged
    ? `AutoVideo Studio ${app.getVersion()} is up to date.`
    : 'Auto update is available after installing the packaged app.',
  updateVersion: '',
  releaseName: '',
  releaseDate: '',
  progress: null,
};

let lastCpuSampleAtMs = 0;
let lastCpuTimes = null;
let lastCpuEma = null;

function sampleCpuPercent() {
  const now = Date.now();
  const cpus = os.cpus();
  if (!cpus || cpus.length === 0) return null;

  const total = cpus.reduce(
    (acc, cpu) => {
      const t = cpu.times;
      acc.user += t.user || 0;
      acc.nice += t.nice || 0;
      acc.sys += t.sys || 0;
      acc.idle += t.idle || 0;
      acc.irq += t.irq || 0;
      return acc;
    },
    { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 }
  );

  const totalTicks = total.user + total.nice + total.sys + total.idle + total.irq;
  const idleTicks = total.idle;

  if (!lastCpuTimes || !lastCpuSampleAtMs) {
    lastCpuTimes = { totalTicks, idleTicks };
    lastCpuSampleAtMs = now;
    return null;
  }

  const dtTotal = totalTicks - lastCpuTimes.totalTicks;
  const dtIdle = idleTicks - lastCpuTimes.idleTicks;
  lastCpuTimes = { totalTicks, idleTicks };
  lastCpuSampleAtMs = now;
  if (dtTotal <= 0) return null;

  const busy = Math.max(0, Math.min(1, 1 - dtIdle / dtTotal));
  const pct = Math.round(busy * 1000) / 10;
  const alpha = 0.25;
  lastCpuEma = typeof lastCpuEma === 'number' ? lastCpuEma * (1 - alpha) + pct * alpha : pct;
  return Math.round(lastCpuEma * 10) / 10;
}

let lastProcSampleAtMs = 0;
let lastProcCpu = null;
let lastProcEma = null;

function sampleProcessCpuPercent() {
  const now = Date.now();
  const cpu = process.cpuUsage();
  if (!lastProcCpu || !lastProcSampleAtMs) {
    lastProcCpu = cpu;
    lastProcSampleAtMs = now;
    return null;
  }

  const dtMs = now - lastProcSampleAtMs;
  const dtUserUs = cpu.user - lastProcCpu.user;
  const dtSystemUs = cpu.system - lastProcCpu.system;
  lastProcCpu = cpu;
  lastProcSampleAtMs = now;
  if (dtMs <= 0) return null;

  const dtCpuUs = dtUserUs + dtSystemUs;
  const pct = (dtCpuUs / (dtMs * 1000)) * 100;
  const alpha = 0.25;
  lastProcEma = typeof lastProcEma === 'number' ? lastProcEma * (1 - alpha) + pct * alpha : pct;
  return Math.round(lastProcEma * 10) / 10;
}

fs.mkdirSync(runtimeDir, { recursive: true });
loadDesktopConfig();
configureAutoUpdater();

async function findFreePort(startPort) {
  for (let port = startPort; port < startPort + 30; port += 1) {
    if (await isPortFree(port)) return port;
  }
  throw new Error(`No free worker port found from ${startPort}`);
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

function pythonExe() {
  const venvPython = path.join(workerDir, '.venv', 'Scripts', 'python.exe');
  return fs.existsSync(venvPython) ? venvPython : 'python';
}

function workerExecutable() {
  const candidates = packaged
    ? [path.join(process.resourcesPath, 'worker-dist', 'autovideo-worker.exe')]
    : [
        path.join(workerDir, 'dist', 'autovideo-worker', 'autovideo-worker.exe'),
        path.join(workerDir, 'dist', 'autovideo-worker.exe'),
      ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || '';
}

function ensureDefaultOutputDirectory() {
  if (outputDirectory) return;
  const defaultDir = path.join(app.getPath('downloads'), 'AutoVideo');
  try {
    fs.mkdirSync(defaultDir, { recursive: true });
    outputDirectory = defaultDir;
    saveDesktopConfig();
  } catch (error) {
    console.warn('[P0021] Could not create default output folder:', error);
  }
}

function loadDesktopConfig() {
  try {
    const data = JSON.parse(fs.readFileSync(desktopConfigFile, 'utf8'));
    outputDirectory = typeof data.outputDirectory === 'string' ? data.outputDirectory : '';
  } catch {
    outputDirectory = '';
  }
  ensureDefaultOutputDirectory();
}

function saveDesktopConfig() {
  fs.writeFileSync(desktopConfigFile, JSON.stringify({ outputDirectory }, null, 2));
}

function configureAutoUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('checking-for-update', () => {
    setUpdateStatus({
      state: 'checking',
      message: 'Checking GitHub Releases for a new version...',
      progress: null,
    });
  });

  autoUpdater.on('update-available', (info) => {
    setUpdateStatus({
      state: 'available',
      message: `Version ${info.version} is ready to download.`,
      ...updateInfoPayload(info),
      progress: null,
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    setUpdateStatus({
      state: 'latest',
      message: `AutoVideo Studio ${app.getVersion()} is up to date.`,
      ...updateInfoPayload(info),
      progress: null,
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    setUpdateStatus({
      state: 'downloading',
      message: `Downloading update ${Math.round(progress.percent || 0)}%...`,
      progress: {
        percent: progress.percent || 0,
        transferred: progress.transferred || 0,
        total: progress.total || 0,
        bytesPerSecond: progress.bytesPerSecond || 0,
      },
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    setUpdateStatus({
      state: 'downloaded',
      message: `Version ${info.version} is ready. Restart to update.`,
      ...updateInfoPayload(info),
      progress: null,
    });
  });

  autoUpdater.on('error', (error) => {
    const message = error instanceof Error ? error.message : String(error);
    if (!updateCheckUserInitiated) {
      setUpdateStatus({
        state: 'latest',
        message: `AutoVideo Studio ${app.getVersion()} is up to date.`,
        progress: null,
      });
      return;
    }
    setUpdateStatus({
      state: 'error',
      message,
      progress: null,
    });
  });
}

function updateInfoPayload(info = {}) {
  return {
    updateVersion: typeof info.version === 'string' ? info.version : '',
    releaseName: typeof info.releaseName === 'string' ? info.releaseName : '',
    releaseDate: typeof info.releaseDate === 'string' ? info.releaseDate : '',
  };
}

function setUpdateStatus(next) {
  updateStatus = {
    ...updateStatus,
    ...next,
    supportsUpdates: packaged,
    currentVersion: app.getVersion(),
  };
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('autovideo:update-status', updateStatus);
  }
  return updateStatus;
}

async function checkForDesktopUpdates(userInitiated = false) {
  updateCheckUserInitiated = Boolean(userInitiated);
  if (!packaged) {
    return setUpdateStatus({
      state: 'dev',
      message: 'Auto update is available after installing the packaged app.',
      progress: null,
    });
  }
  try {
    setUpdateStatus({
      state: 'checking',
      message: 'Checking GitHub Releases for a new version...',
      progress: null,
    });
    await autoUpdater.checkForUpdates();
    return updateStatus;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!updateCheckUserInitiated) {
      return setUpdateStatus({
        state: 'latest',
        message: `AutoVideo Studio ${app.getVersion()} is up to date.`,
        progress: null,
      });
    }
    return setUpdateStatus({
      state: 'error',
      message,
      progress: null,
    });
  }
}

async function downloadDesktopUpdate() {
  if (!packaged) return checkForDesktopUpdates();
  try {
    setUpdateStatus({
      state: 'downloading',
      message: 'Downloading update...',
      progress: { percent: 0, transferred: 0, total: 0, bytesPerSecond: 0 },
    });
    await autoUpdater.downloadUpdate();
    return updateStatus;
  } catch (error) {
    return setUpdateStatus({
      state: 'error',
      message: error instanceof Error ? error.message : String(error),
      progress: null,
    });
  }
}

function installDesktopUpdate() {
  if (!packaged) return checkForDesktopUpdates();
  setUpdateStatus({
    state: 'installing',
    message: 'Restarting AutoVideo Studio to install update...',
    progress: null,
  });
  setImmediate(() => autoUpdater.quitAndInstall(false, true));
  return updateStatus;
}

function showStartupError(error) {
  const message = error instanceof Error ? error.message : String(error);
  const lines = [
    message,
    '',
    'Do not run autovideo-worker.exe directly. Start AutoVideo Studio from the Start menu.',
    '',
    'Log files:',
    workerLog,
    workerErrorLog,
  ];
  if (packaged) {
    const bundledWorker = path.join(process.resourcesPath, 'worker-dist', 'autovideo-worker.exe');
    lines.push('', 'Expected worker:', bundledWorker, fs.existsSync(bundledWorker) ? '(found)' : '(MISSING — reinstall the app)');
  }
  dialog.showErrorBox('AutoVideo Studio could not start', lines.join('\n'));
}

async function startWorker() {
  if (workerProcess && workerUrl) return workerUrl;
  workerPort = await findFreePort(Number(process.env.AUTOVIDEO_WORKER_PORT || 8021));
  workerUrl = `http://127.0.0.1:${workerPort}`;
  process.env.AUTOVIDEO_DESKTOP_WORKER_URL = workerUrl;
  fs.mkdirSync(workerStorageDir, { recursive: true });
  fs.mkdirSync(workerPreviewDir, { recursive: true });

  const stdout = fs.openSync(workerLog, 'a');
  const stderr = fs.openSync(workerErrorLog, 'a');
  const exe = workerExecutable();
  if (packaged && !exe) {
    const bundledWorker = path.join(process.resourcesPath, 'worker-dist', 'autovideo-worker.exe');
    throw new Error(`Desktop worker is missing at ${bundledWorker}. Please reinstall AutoVideo Studio.`);
  }
  const command = exe || pythonExe();
  const args = exe
    ? ['--host', '127.0.0.1', '--port', String(workerPort)]
    : ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', String(workerPort)];
  const workerEnv = {
    ...process.env,
    AUTOVIDEO_WORKER_STORAGE_ROOT: workerStorageDir,
    AUTOVIDEO_WORKER_PREVIEW_ROOT: workerPreviewDir,
    AUTOVIDEO_VIDEO_ENCODER: process.env.AUTOVIDEO_VIDEO_ENCODER || 'libx264',
    AUTOVIDEO_RENDER_WORKERS: process.env.AUTOVIDEO_RENDER_WORKERS || '1',
    PYTHONIOENCODING: 'utf-8',
  };
  console.log(
    `[worker] ${exe ? 'exe' : 'python'} port=${workerPort} encoder=${workerEnv.AUTOVIDEO_VIDEO_ENCODER}`
  );
  workerProcess = spawn(command, args, {
    cwd: exe ? path.dirname(exe) : workerDir,
    env: workerEnv,
    stdio: ['ignore', stdout, stderr],
    windowsHide: true,
  });
  const earlyExit = new Promise((_, reject) => {
    workerProcess.once('exit', (code, signal) => {
      workerProcess = null;
      reject(
        new Error(
          `Worker stopped before it was ready (code=${code ?? 'null'}, signal=${signal ?? 'null'}). Check ${workerErrorLog}`
        )
      );
    });
  });
  workerProcess.on('exit', () => {
    workerProcess = null;
  });
  await Promise.race([waitForWorker(workerUrl), earlyExit]);
  workerProcess.removeAllListeners('exit');
  workerProcess.once('exit', () => {
    workerProcess = null;
  });
  return workerUrl;
}

async function resolveDevAppUrl() {
  const origin = 'http://127.0.0.1:3021';
  const url = forcedDevAppUrl || `${origin}/studio`;
  const waitOrigin = (() => {
    try {
      return new URL(url).origin;
    } catch {
      return origin;
    }
  })();
  await waitForHttpOk(`${waitOrigin}/`);
  await waitForHttpOk(`${waitOrigin}/@vite/client`, { requireOk: true });
  await prewarmViteDevGraph(waitOrigin);
  return url;
}

function packagedIndexHtml() {
  const indexHtml = path.join(uiDistDir, 'index.html');
  if (!fs.existsSync(indexHtml)) {
    throw new Error(`Packaged UI missing at ${indexHtml}. Run pnpm desktop:prepare then desktop:dist.`);
  }
  return indexHtml;
}

function desktopQuery() {
  const query = { desktop: '1' };
  if (workerUrl) query.workerUrl = workerUrl;
  return query;
}

async function restartWorker() {
  stopWorker();
  return startWorker();
}

function stopWorker() {
  if (!workerProcess) return;
  workerProcess.kill();
  workerProcess = null;
  workerUrl = '';
}

async function chooseOutputDirectory() {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose AutoVideo output folder',
    defaultPath: outputDirectory || app.getPath('downloads'),
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  outputDirectory = result.filePaths[0];
  saveDesktopConfig();
  return {
    name: path.basename(outputDirectory),
    path: outputDirectory,
  };
}

async function saveOutputFile(_event, payload) {
  if (!outputDirectory) return { ok: false, reason: 'missing-directory' };
  const filename = safeFilename(payload?.filename || 'autovideo-output.mp4');
  const bytes = payload?.bytes;
  if (!bytes) return { ok: false, reason: 'missing-bytes' };
  const filePath = path.join(outputDirectory, filename);
  const partPath = `${filePath}.part`;
  const buffer = Buffer.from(new Uint8Array(bytes));
  await fs.promises.writeFile(partPath, buffer);
  const stat = await fs.promises.stat(partPath);
  if (stat.size < 50_000) {
    await fs.promises.unlink(partPath).catch(() => {});
    return { ok: false, reason: 'file-too-small' };
  }
  await fs.promises.rename(partPath, filePath);
  return {
    ok: true,
    name: path.basename(outputDirectory),
    path: filePath,
    size: stat.size,
  };
}

function safeFilename(filename) {
  return path.basename(String(filename)).replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') || 'autovideo-output.mp4';
}

function waitForWorker(baseUrl) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const tick = () => {
      const request = http.get(`${baseUrl}/`, (response) => {
        response.resume();
        if (response.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
      });
      request.on('error', retry);
    };
    const retry = () => {
      if (Date.now() - startedAt > 45_000) {
        reject(new Error(`Worker did not become ready. Check ${workerErrorLog}`));
        return;
      }
      setTimeout(tick, 750);
    };
    tick();
  });
}

function httpGetStatus(url, timeoutMs = 120000) {
  return new Promise((resolve) => {
    const request = http.get(url, { timeout: timeoutMs }, (response) => {
      response.resume();
      resolve(response.statusCode || 0);
    });
    request.on('error', () => resolve(0));
    request.on('timeout', () => {
      request.destroy();
      resolve(0);
    });
  });
}

/** Compile the Electron entry graph in Node (no Chromium socket cap) before loadURL. */
async function prewarmViteDevGraph(origin) {
  const paths = [
    '/@vite/client',
    '/src/main.tsx',
    '/src/App.tsx',
    '/src/lib/app-router.tsx',
    '/src/components/workspace/ClientProviders.tsx',
    '/src/components/workspace/WorkspaceShell.tsx',
  ];
  for (const pathname of paths) {
    const url = `${origin}${pathname}`;
    const started = Date.now();
    const status = await httpGetStatus(url, 120000);
    bootLog(`[P0021] vite prewarm ${pathname} status=${status} ms=${Date.now() - started}`);
  }
}

function waitForHttpOk(baseUrl, { requireOk = false } = {}) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const tick = () => {
      const request = http.get(baseUrl, (response) => {
        response.resume();
        const status = response.statusCode || 0;
        const ok = requireOk ? status === 200 : status > 0 && status < 500;
        if (ok) {
          resolve();
        } else {
          retry();
        }
      });
      request.on('error', retry);
    };
    const retry = () => {
      if (Date.now() - startedAt > 45_000) {
        reject(new Error('App server did not become ready. Start Vite on :3021 (pnpm dev).'));
        return;
      }
      setTimeout(tick, 750);
    };
    tick();
  });
}

function withDesktopParams(rawUrl) {
  const url = new URL(rawUrl);
  url.searchParams.set('desktop', '1');
  url.searchParams.set('workerUrl', workerUrl);
  return url.toString();
}

let devWindowRevealed = false;
let rendererEverReady = false;

function revealDevWindow(reason) {
  if (!mainWindow || packaged || devWindowRevealed) return;
  devWindowRevealed = true;
  mainWindow.show();
  mainWindow.focus();
  bootLog(`[P0021] dev window revealed (${reason})`);
}

async function probeRendererBoot(webContents) {
  return webContents.executeJavaScript(
    `(() => ({
      boot: window.__p0021Boot || null,
      hubReady: Boolean(window.__hubBootReady),
      rootChildren: document.getElementById('root')?.childElementCount ?? 0,
      lastError: window.__P0021_LAST_ERROR || window.__HUB_LAST_RENDER_ERROR || null,
      crash: Boolean(document.getElementById('hub-boot-crash')),
      boundary: Array.from(document.querySelectorAll('h2')).some((el) => /failed to load/i.test(el.textContent || '')),
      moduleScripts: Array.from(document.querySelectorAll('script[type="module"]')).map((el) => el.getAttribute('src') || ''),
    }))()`,
    true,
  );
}

function rendererBootFailed(boot) {
  return Boolean(boot?.lastError || boot?.crash || boot?.boundary);
}

function rendererBootReady(boot) {
  return Number(boot?.rootChildren ?? 0) > 0 && !rendererBootFailed(boot);
}

async function waitForRendererBoot(webContents, maxWaitMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const boot = await probeRendererBoot(webContents);
    if (rendererBootReady(boot) || rendererBootFailed(boot)) return boot;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return probeRendererBoot(webContents);
}

async function createWindow() {
  if (!packaged) {
    try {
      fs.writeFileSync(electronBootLog, '', 'utf8');
    } catch {
      /* ignore */
    }
  }
  await startWorker();
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1120,
    minHeight: 760,
    title: 'AutoVideo Studio',
    icon: desktopIcon ?? undefined,
    backgroundColor: '#0b1020',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  if (!packaged) {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        {
          label: 'View',
          submenu: [
            { role: 'reload', accelerator: 'CmdOrCtrl+R' },
            { role: 'forceReload', accelerator: 'CmdOrCtrl+Shift+R' },
            { role: 'toggleDevTools' },
          ],
        },
      ]),
    );
  }

  mainWindow.once('ready-to-show', () => {
    if (!mainWindow || !packaged) return;
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (packaged) {
      if (!url.startsWith('file://')) {
        event.preventDefault();
        shell.openExternal(url);
      }
      return;
    }
    const devOrigin = 'http://127.0.0.1:3021';
    if (!url.startsWith(devOrigin)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  if (packaged) {
    console.log(`[P0021] boot mode=packaged-file ui=${packagedIndexHtml()} worker=${workerUrl || 'none'}`);
    await mainWindow.loadFile(packagedIndexHtml(), { query: desktopQuery(), hash: "/studio" });
  } else {
    const resolvedAppUrl = withDesktopParams(await resolveDevAppUrl());
    bootLog(`[P0021] boot mode=dev-url url=${resolvedAppUrl} worker=${workerUrl || 'none'}`);
    mainWindow.webContents.on('did-fail-load', (_event, code, desc, url) => {
      console.error(`[P0021] did-fail-load code=${code} desc=${desc} url=${url}`);
    });
    mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
      bootLog(`[P0021][renderer:${level}] ${message} (${sourceId}:${line})`);
    });
    mainWindow.webContents.on('preload-error', (_event, preloadPath, error) => {
      bootLog(`[P0021] preload-error ${preloadPath} ${error?.message || error}`);
    });
    mainWindow.webContents.on('did-finish-load', async () => {
      try {
        const waitMs = rendererEverReady ? 8000 : 90000;
        const boot = await waitForRendererBoot(mainWindow.webContents, waitMs);
        bootLog(
          `[P0021] renderer boot=${boot.boot} rootChildren=${boot.rootChildren} err=${boot.lastError || ''} crash=${boot.crash ? 'yes' : 'no'} boundary=${boot.boundary ? 'yes' : 'no'} modules=${JSON.stringify(boot.moduleScripts || [])}`,
        );
        if (rendererBootReady(boot)) {
          rendererEverReady = true;
          revealDevWindow('content-ready');
          return;
        }
        if (rendererEverReady) {
          bootLog('[P0021] empty root after prior ready — keeping Vite graph (no cache reload)');
          revealDevWindow('keep-warm-after-nav');
          return;
        }
        bootLog('[P0021] empty root after 90s — splash Retry/DevTools; not reloading Vite');
        revealDevWindow('boot-waiting-splash');
      } catch (error) {
        console.error('[P0021] boot probe failed', error);
        revealDevWindow('probe-failed');
      }
    });
    setTimeout(() => {
      if (!packaged && mainWindow && !devWindowRevealed) {
        console.warn('[P0021] dev reveal timeout — splash visible, Vite stays warm');
        revealDevWindow('timeout');
      }
    }, 15000);
    await mainWindow.loadURL(resolvedAppUrl);
  }
  setUpdateStatus(updateStatus);
  if (packaged) {
    setTimeout(() => {
      checkForDesktopUpdates().catch((error) => console.error(error));
    }, 3000);
  }
}

ipcMain.handle('autovideo:open-devtools', async () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
  return true;
});
ipcMain.handle('autovideo:get-worker-url', async () => startWorker());
ipcMain.handle('autovideo:get-runtime-profile', async () => ({
  shell: 'desktop',
  workerUrl: await startWorker(),
  workerPort,
  outputDirectory,
  workerExecutable: workerExecutable() || pythonExe(),
  logs: { workerLog, workerErrorLog },
}));
ipcMain.handle('autovideo:get-system-stats', async () => {
  const totalMemBytes = os.totalmem();
  const freeMemBytes = os.freemem();
  const cpuPercent = sampleCpuPercent();
  const procCpuPercent = sampleProcessCpuPercent();
  const procMem = process.memoryUsage();
  return {
    cpu: {
      percent: cpuPercent,
      cores: Array.isArray(os.cpus()) ? os.cpus().length : null,
    },
    memory: {
      totalBytes: totalMemBytes,
      freeBytes: freeMemBytes,
      usedBytes: Math.max(0, totalMemBytes - freeMemBytes),
    },
    processes: {
      desktop: {
        pid: process.pid,
        cpuPercent: procCpuPercent,
        rssBytes: procMem.rss,
      },
      worker: workerProcess?.pid ? { pid: workerProcess.pid } : null,
    },
    at: Date.now(),
  };
});
ipcMain.handle('autovideo:restart-worker', async () => restartWorker());
ipcMain.handle('autovideo:choose-output-directory', chooseOutputDirectory);
ipcMain.handle('autovideo:save-output-file', saveOutputFile);
ipcMain.handle('autovideo:open-output-directory', async () => {
  if (!outputDirectory) return false;
  await shell.openPath(outputDirectory);
  return true;
});
ipcMain.handle('autovideo:open-output-file', async (_event, filename) => {
  if (!outputDirectory) return { ok: false, reason: 'missing-directory' };
  const filePath = path.join(outputDirectory, safeFilename(filename || ''));
  if (!fs.existsSync(filePath)) return { ok: false, reason: 'missing-file' };
  shell.showItemInFolder(filePath);
  return { ok: true, path: filePath };
});
ipcMain.handle('autovideo:get-update-status', async () => updateStatus);
ipcMain.handle('autovideo:check-for-updates', async (_event, opts) =>
  checkForDesktopUpdates(Boolean(opts?.userInitiated)),
);
ipcMain.handle('autovideo:download-update', downloadDesktopUpdate);
ipcMain.handle('autovideo:install-update', installDesktopUpdate);

app.whenReady().then(() => {
  if (!gotSingleInstanceLock) return;
  if (process.platform === 'win32') {
    app.setAppUserModelId('vn.infix1.autovideo-studio');
  }
  if (desktopIcon) {
    app.dock?.setIcon?.(desktopIcon);
  }
  createWindow().catch((error) => {
    console.error(error);
    showStartupError(error);
    app.quit();
  });
});

if (gotSingleInstanceLock) {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
      return;
    }
    createWindow().catch((error) => {
      console.error(error);
      showStartupError(error);
    });
  });
}

app.on('before-quit', () => {
  stopWorker();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow) {
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
    return;
  }
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch((error) => {
      console.error(error);
      showStartupError(error);
      app.quit();
    });
  }
});
