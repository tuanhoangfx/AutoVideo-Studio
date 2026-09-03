export {};

export type AutoVideoUpdateState =
  | 'idle'
  | 'dev'
  | 'checking'
  | 'latest'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'installing'
  | 'error';

export type AutoVideoUpdateStatus = {
  state: AutoVideoUpdateState;
  supportsUpdates: boolean;
  currentVersion: string;
  message: string;
  updateVersion?: string;
  releaseName?: string;
  releaseDate?: string;
  progress?: {
    percent: number;
    transferred: number;
    total: number;
    bytesPerSecond: number;
  } | null;
};

export type AutoVideoSystemStats = {
  cpu: {
    percent: number | null;
    cores: number | null;
  };
  memory: {
    totalBytes: number;
    freeBytes: number;
    usedBytes: number;
  };
  processes: {
    desktop: {
      pid: number;
      cpuPercent: number | null;
      rssBytes: number;
    };
    worker: { pid: number } | null;
  };
  at: number;
};

declare global {
  interface Window {
    autovideo?: {
      shell: 'desktop';
      workerUrl?: string;
      getWorkerUrl: () => Promise<string>;
      getRuntimeProfile: () => Promise<{
        shell: 'desktop';
        workerUrl: string;
        workerPort: number;
        outputDirectory?: string;
        workerExecutable?: string;
        logs?: {
          workerLog: string;
          workerErrorLog: string;
        };
      }>;
      getSystemStats: () => Promise<AutoVideoSystemStats>;
      restartWorker: () => Promise<string>;
      chooseOutputDirectory: () => Promise<{ name: string; path: string } | null>;
      saveOutputFile: (
        filename: string,
        bytes: ArrayBuffer
      ) => Promise<{ ok: true; name: string; path: string } | { ok: false; reason: string }>;
      openOutputDirectory: () => Promise<boolean>;
      openOutputFile: (
        filename: string
      ) => Promise<{ ok: true; path: string } | { ok: false; reason: string }>;
      getUpdateStatus: () => Promise<AutoVideoUpdateStatus>;
      checkForUpdates: (opts?: { userInitiated?: boolean }) => Promise<AutoVideoUpdateStatus>;
      downloadUpdate: () => Promise<AutoVideoUpdateStatus>;
      installUpdate: () => Promise<AutoVideoUpdateStatus>;
      onUpdateStatus: (callback: (status: AutoVideoUpdateStatus) => void) => () => void;
    };
    electronAPI?: unknown;
    __TAURI__?: unknown;
  }
}
