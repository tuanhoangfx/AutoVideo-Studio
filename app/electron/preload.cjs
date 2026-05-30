const { contextBridge, ipcRenderer } = require('electron');

const workerUrl = process.env.AUTOVIDEO_DESKTOP_WORKER_URL || '';

contextBridge.exposeInMainWorld('autovideo', {
  shell: 'desktop',
  workerUrl,
  getWorkerUrl: () => ipcRenderer.invoke('autovideo:get-worker-url'),
  getRuntimeProfile: () => ipcRenderer.invoke('autovideo:get-runtime-profile'),
  getSystemStats: () => ipcRenderer.invoke('autovideo:get-system-stats'),
  restartWorker: () => ipcRenderer.invoke('autovideo:restart-worker'),
  chooseOutputDirectory: () => ipcRenderer.invoke('autovideo:choose-output-directory'),
  saveOutputFile: (filename, bytes) => ipcRenderer.invoke('autovideo:save-output-file', { filename, bytes }),
  openOutputDirectory: () => ipcRenderer.invoke('autovideo:open-output-directory'),
  openOutputFile: (filename) => ipcRenderer.invoke('autovideo:open-output-file', filename),
  getUpdateStatus: () => ipcRenderer.invoke('autovideo:get-update-status'),
  checkForUpdates: () => ipcRenderer.invoke('autovideo:check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('autovideo:download-update'),
  installUpdate: () => ipcRenderer.invoke('autovideo:install-update'),
  onUpdateStatus: (callback) => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on('autovideo:update-status', listener);
    return () => ipcRenderer.removeListener('autovideo:update-status', listener);
  },
});
