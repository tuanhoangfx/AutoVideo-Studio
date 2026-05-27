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
      restartWorker: () => Promise<string>;
      chooseOutputDirectory: () => Promise<{ name: string; path: string } | null>;
      saveOutputFile: (
        filename: string,
        bytes: ArrayBuffer
      ) => Promise<{ ok: true; name: string; path: string } | { ok: false; reason: string }>;
      openOutputDirectory: () => Promise<boolean>;
      getUpdateStatus: () => Promise<AutoVideoUpdateStatus>;
      checkForUpdates: () => Promise<AutoVideoUpdateStatus>;
      downloadUpdate: () => Promise<AutoVideoUpdateStatus>;
      installUpdate: () => Promise<AutoVideoUpdateStatus>;
      onUpdateStatus: (callback: (status: AutoVideoUpdateStatus) => void) => () => void;
    };
    electronAPI?: unknown;
    __TAURI__?: unknown;
  }
}
