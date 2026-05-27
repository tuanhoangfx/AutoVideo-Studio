const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');

const packaged = app.isPackaged;
const appDir = packaged ? path.join(process.resourcesPath, 'next') : path.resolve(__dirname, '..');
const repoRoot = packaged ? process.resourcesPath : path.resolve(appDir, '..');
const workerDir = path.join(repoRoot, 'worker');
const runtimeDir = packaged ? path.join(app.getPath('userData'), 'runtime') : path.join(repoRoot, '.runtime');
const workerStorageDir = path.join(runtimeDir, 'worker-storage', 'jobs');
const workerPreviewDir = path.join(runtimeDir, 'worker-storage', 'preview');
const workerLog = path.join(runtimeDir, 'desktop-worker.log');
const workerErrorLog = path.join(runtimeDir, 'desktop-worker.err.log');
const nextLog = path.join(runtimeDir, 'desktop-next.log');
const nextErrorLog = path.join(runtimeDir, 'desktop-next.err.log');
const desktopConfigFile = path.join(runtimeDir, 'desktop-config.json');

let mainWindow = null;
let workerProcess = null;
let nextProcess = null;
let workerUrl = '';
let workerPort = 8021;
let appUrl = '';
let outputDirectory = '';
let updateStatus = {
  state: packaged ? 'idle' : 'dev',
  supportsUpdates: packaged,
  currentVersion: app.getVersion(),
  message: packaged ? 'Ready to check for desktop updates.' : 'Auto update is available after installing the packaged app.',
  updateVersion: '',
  releaseName: '',
  releaseDate: '',
  progress: null,
};

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

function loadDesktopConfig() {
  try {
    const data = JSON.parse(fs.readFileSync(desktopConfigFile, 'utf8'));
    outputDirectory = typeof data.outputDirectory === 'string' ? data.outputDirectory : '';
  } catch {
    outputDirectory = '';
  }
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
    setUpdateStatus({
      state: 'error',
      message: error instanceof Error ? error.message : String(error),
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

async function checkForDesktopUpdates() {
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
    return setUpdateStatus({
      state: 'error',
      message: error instanceof Error ? error.message : String(error),
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
  const command = exe || pythonExe();
  const args = exe
    ? ['--host', '127.0.0.1', '--port', String(workerPort)]
    : ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', String(workerPort)];
  workerProcess = spawn(command, args, {
    cwd: exe ? path.dirname(exe) : workerDir,
    env: {
      ...process.env,
      AUTOVIDEO_WORKER_STORAGE_ROOT: workerStorageDir,
      AUTOVIDEO_WORKER_PREVIEW_ROOT: workerPreviewDir,
    },
    stdio: ['ignore', stdout, stderr],
    windowsHide: true,
  });
  workerProcess.once('exit', () => {
    workerProcess = null;
  });
  await waitForWorker(workerUrl);
  return workerUrl;
}

async function resolveAppUrl() {
  if (process.env.AUTOVIDEO_APP_URL) return process.env.AUTOVIDEO_APP_URL;
  if (!packaged) return 'http://127.0.0.1:3021/studio';
  if (nextProcess && appUrl) return appUrl;

  const port = await findFreePort(Number(process.env.AUTOVIDEO_APP_PORT || 3021));
  appUrl = `http://127.0.0.1:${port}/studio`;
  const stdout = fs.openSync(nextLog, 'a');
  const stderr = fs.openSync(nextErrorLog, 'a');
  nextProcess = spawn(
    process.execPath,
    [path.join(appDir, 'server.js')],
    {
      cwd: appDir,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        HOSTNAME: '127.0.0.1',
        NODE_PATH: packaged ? path.join(process.resourcesPath, 'app.asar', 'node_modules') : process.env.NODE_PATH,
        PORT: String(port),
      },
      stdio: ['ignore', stdout, stderr],
      windowsHide: true,
    }
  );
  nextProcess.once('exit', () => {
    nextProcess = null;
  });
  await waitForHttpOk(`http://127.0.0.1:${port}`);
  return appUrl;
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

function stopNextServer() {
  if (!nextProcess) return;
  nextProcess.kill();
  nextProcess = null;
  appUrl = '';
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
  await fs.promises.writeFile(filePath, Buffer.from(new Uint8Array(bytes)));
  return {
    ok: true,
    name: path.basename(outputDirectory),
    path: filePath,
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

function waitForHttpOk(baseUrl) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const tick = () => {
      const request = http.get(baseUrl, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) {
          resolve();
        } else {
          retry();
        }
      });
      request.on('error', retry);
    };
    const retry = () => {
      if (Date.now() - startedAt > 45_000) {
        reject(new Error(`App server did not become ready. Check ${nextErrorLog}`));
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

async function createWindow() {
  await startWorker();
  const resolvedAppUrl = await resolveAppUrl();
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1120,
    minHeight: 760,
    title: 'AutoVideo Studio',
    backgroundColor: '#0b1020',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(new URL(resolvedAppUrl).origin)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  await mainWindow.loadURL(withDesktopParams(resolvedAppUrl));
  setUpdateStatus(updateStatus);
  if (packaged) {
    setTimeout(() => {
      checkForDesktopUpdates().catch((error) => console.error(error));
    }, 3000);
  }
}

ipcMain.handle('autovideo:get-worker-url', async () => startWorker());
ipcMain.handle('autovideo:get-runtime-profile', async () => ({
  shell: 'desktop',
  workerUrl: await startWorker(),
  workerPort,
  outputDirectory,
  workerExecutable: workerExecutable() || pythonExe(),
  logs: { workerLog, workerErrorLog },
}));
ipcMain.handle('autovideo:restart-worker', async () => restartWorker());
ipcMain.handle('autovideo:choose-output-directory', chooseOutputDirectory);
ipcMain.handle('autovideo:save-output-file', saveOutputFile);
ipcMain.handle('autovideo:open-output-directory', async () => {
  if (!outputDirectory) return false;
  await shell.openPath(outputDirectory);
  return true;
});
ipcMain.handle('autovideo:get-update-status', async () => updateStatus);
ipcMain.handle('autovideo:check-for-updates', checkForDesktopUpdates);
ipcMain.handle('autovideo:download-update', downloadDesktopUpdate);
ipcMain.handle('autovideo:install-update', installDesktopUpdate);

app.whenReady().then(createWindow);

app.on('before-quit', () => {
  stopWorker();
  stopNextServer();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow().catch((error) => console.error(error));
  }
});
