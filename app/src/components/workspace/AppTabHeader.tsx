'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileVideo,
  Gauge,
  MonitorPlay,
  RefreshCw,
  RotateCcw,
  Settings2,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  readStudioExportSettings,
  writeStudioExportSettings,
  DEFAULT_STUDIO_EXPORT_SETTINGS,
  STUDIO_EXPORT_SETTINGS_EVENT,
  type StudioExportSettings,
} from '@/lib/studio-export-settings';
import {
  chooseStudioDownloadDirectory,
  clearStudioDownloadDirectory,
  restoreStudioDownloadDirectory,
  supportsStudioDownloadDirectory,
} from '@/lib/studio-download-target';
import type { AutoVideoUpdateStatus } from '@/types/autovideo-desktop';

export type TabHeaderMetaItem = {
  icon: LucideIcon;
  title?: string;
  value: string;
  live?: boolean;
};

export type TabHeaderStatItem = {
  key: string;
  icon: LucideIcon;
  label: string;
  value: number;
  toneClass: string;
};

type AppTabHeaderProps = {
  ariaLabel: string;
  titleIcon: ElementType;
  titleIconClass?: string;
  title: string;
  metaItems: TabHeaderMetaItem[];
  centerStats: TabHeaderStatItem[];
};

export function AppTabHeader({
  ariaLabel,
  titleIcon: TitleIcon,
  titleIconClass = 'text-indigo-400',
  title,
  metaItems,
  centerStats,
}: AppTabHeaderProps) {
  const session = useSessionClock();

  return (
    <header
      className="app-tab-header sticky top-0 z-40 -mx-6 grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 border-b border-white/5 bg-[var(--bg)]"
      aria-label={ariaLabel}
    >
      <div className="flex min-w-0 flex-wrap items-center justify-self-start gap-x-2.5 gap-y-0">
        <TitleIcon size={16} className={`shrink-0 ${titleIconClass}`} aria-hidden />
        <h1 className="shrink-0 text-base font-semibold leading-none tracking-tight text-[var(--text)]">{title}</h1>
        {metaItems.map((item, index) => (
          <span key={`${item.title ?? 'meta'}-${index}`} className="inline-flex items-center gap-x-2.5">
            <Rule visibleFrom={index === 0 ? 'sm' : index === 1 ? 'md' : 'lg'} />
            <MetaLine {...item} />
          </span>
        ))}
      </div>

      <div
        className="hidden min-w-0 items-center justify-center justify-self-center gap-x-2.5 overflow-x-auto xl:flex"
        role="status"
        aria-label={`${title} summary`}
      >
        {centerStats.map((stat, index) => (
          <span key={stat.key} className="inline-flex items-center gap-x-2.5">
            {index > 0 ? <Rule /> : null}
            <StatLine {...stat} />
          </span>
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-self-end gap-2 text-[13px] leading-none text-[var(--muted)]">
        <div className="inline-flex items-center gap-1.5">
          <Clock size={14} className="shrink-0 text-indigo-400/90" />
          <span>Session</span>
          <span className="tabular-nums text-[var(--text)]/90">{session}</span>
        </div>
        <HeaderUpdateButton />
        <HeaderOutputSettings />
      </div>
    </header>
  );
}

function Rule({ visibleFrom = 'sm' }: { visibleFrom?: 'sm' | 'md' | 'lg' }) {
  const vis = visibleFrom === 'lg' ? 'hidden lg:block' : visibleFrom === 'md' ? 'hidden md:block' : 'hidden sm:block';
  return <span className={`h-3.5 w-px shrink-0 self-center bg-white/10 ${vis}`} aria-hidden />;
}

function MetaLine({ icon: Icon, title, value, live }: TabHeaderMetaItem) {
  return (
    <div className="inline-flex max-w-full min-w-0 items-center gap-1.5 text-[13px] leading-none text-[var(--muted)]">
      <Icon size={14} className="shrink-0 text-indigo-400/90" />
      {title ? <span className="shrink-0">{title}</span> : null}
      {live !== undefined ? (
        <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${live ? 'bg-emerald-400' : 'bg-amber-400'}`} />
      ) : null}
      <span className="truncate tabular-nums text-[var(--text)]/90">{value}</span>
    </div>
  );
}

function StatLine({ icon: Icon, value, label, toneClass }: TabHeaderStatItem) {
  return (
    <div className="inline-flex items-center gap-1.5 text-[13px] leading-none text-[var(--muted)]" title={label}>
      <Icon size={14} className={`shrink-0 ${toneClass}`} />
      <span className="font-semibold tabular-nums text-[var(--text)]/90">{value}</span>
      <span>{label}</span>
    </div>
  );
}

function HeaderUpdateButton() {
  const [status, setStatus] = useState<AutoVideoUpdateStatus | null>(null);
  const [hasDesktopApi, setHasDesktopApi] = useState(false);
  const [busy, setBusy] = useState(false);
  const [updateToastOpen, setUpdateToastOpen] = useState(false);
  const dismissedUpdateKey = useRef('');

  useEffect(() => {
    const desktopApi = window.autovideo;
    setHasDesktopApi(Boolean(desktopApi));
    if (!desktopApi) return;

    desktopApi.getUpdateStatus().then(setStatus).catch(() => {});
    return desktopApi.onUpdateStatus(setStatus);
  }, []);

  useEffect(() => {
    if (status?.state === 'available') {
      const updateKey = status.updateVersion || status.releaseName || 'available';
      if (dismissedUpdateKey.current !== updateKey) {
        setUpdateToastOpen(true);
      }
      return;
    }

    if (status?.state === 'downloading' || status?.state === 'downloaded' || status?.state === 'latest') {
      setUpdateToastOpen(false);
    }
  }, [status?.state, status?.updateVersion, status?.releaseName]);

  if (!hasDesktopApi) return null;

  const currentState = status?.state ?? 'idle';
  const progress = Math.round(status?.progress?.percent ?? 0);
  const label =
    currentState === 'available'
      ? 'Update'
      : currentState === 'downloaded'
      ? 'Install'
      : currentState === 'downloading'
      ? `${progress}%`
      : currentState === 'checking'
      ? 'Checking'
      : currentState === 'latest'
      ? 'Latest'
      : currentState === 'dev'
      ? 'Dev'
      : 'Update';
  const title =
    status?.message ||
    (currentState === 'available'
      ? 'New version available'
      : currentState === 'latest'
      ? 'You are using the latest version'
      : 'Check for AutoVideo Studio updates');
  const disabled = busy || currentState === 'checking' || currentState === 'downloading' || currentState === 'installing' || currentState === 'dev';
  const isActive = currentState === 'available' || currentState === 'downloaded';
  const isSuccess = currentState === 'latest';
  const isError = currentState === 'error';

  const runUpdateAction = async () => {
    const desktopApi = window.autovideo;
    if (!desktopApi || disabled) return;
    setBusy(true);
    try {
      const next =
        currentState === 'available'
          ? await desktopApi.downloadUpdate()
          : currentState === 'downloaded'
          ? await desktopApi.installUpdate()
          : await desktopApi.checkForUpdates();
      setStatus(next);
    } finally {
      if (currentState !== 'downloaded') setBusy(false);
    }
  };

  const dismissUpdateToast = () => {
    dismissedUpdateKey.current = status?.updateVersion || status?.releaseName || 'available';
    setUpdateToastOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={runUpdateAction}
        disabled={disabled}
        className={`relative inline-flex h-7 items-center gap-1.5 rounded-lg border px-2 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-65 ${
          isActive
            ? 'border-amber-300/45 bg-amber-400/15 text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.16)]'
            : isSuccess
            ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-100'
            : isError
            ? 'border-rose-300/35 bg-rose-500/10 text-rose-100'
            : 'border-white/10 bg-white/[.03] text-[var(--muted)] hover:bg-white/[.06] hover:text-[var(--text)]'
        }`}
        aria-label={title}
        title={title}
      >
        {currentState === 'latest' ? (
          <CheckCircle2 size={13} className="shrink-0 text-emerald-200" />
        ) : currentState === 'error' ? (
          <AlertTriangle size={13} className="shrink-0 text-rose-200" />
        ) : currentState === 'available' || currentState === 'downloaded' ? (
          <Download size={13} className="shrink-0 text-amber-200" />
        ) : (
          <RefreshCw size={13} className={`shrink-0 ${currentState === 'checking' || busy ? 'animate-spin text-indigo-200' : ''}`} />
        )}
        <span className="hidden sm:inline">{label}</span>
        {isActive ? (
          <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-300" />
          </span>
        ) : null}
      </button>

      {updateToastOpen && currentState === 'available' ? (
        <div className="fixed right-4 top-14 z-[90] w-[22rem] overflow-hidden rounded-2xl border border-amber-300/25 bg-[#11142a]/95 shadow-2xl shadow-black/45 backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_42%)]" />
          <div className="relative p-3">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-400/15 text-amber-100 ring-1 ring-amber-300/25">
                <Download size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-white">Có bản cập nhật mới</div>
                <div className="mt-1 text-[11px] leading-5 text-white/60">
                  {status?.updateVersion ? `AutoVideo Studio ${status.updateVersion} đã sẵn sàng để tải.` : status?.message}
                </div>
              </div>
              <button
                type="button"
                onClick={dismissUpdateToast}
                className="grid h-7 w-7 place-items-center rounded-lg text-white/45 hover:bg-white/10 hover:text-white"
                aria-label="Dismiss update notification"
              >
                <X size={13} />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={dismissUpdateToast}
                className="rounded-lg px-2 py-1 text-[11px] font-semibold text-white/50 hover:bg-white/10 hover:text-white"
              >
                Later
              </button>
              <button
                type="button"
                onClick={() => void runUpdateAction()}
                className="rounded-lg bg-amber-400 px-3 py-1 text-[11px] font-bold text-slate-950 shadow-lg shadow-amber-400/15 hover:bg-amber-300"
              >
                Download update
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function HeaderOutputSettings() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<StudioExportSettings>(() => readStudioExportSettings());
  const [downloadFolderNotice, setDownloadFolderNotice] = useState('');

  useEffect(() => {
    const onSettings = (event: Event) => {
      setSettings((event as CustomEvent<StudioExportSettings>).detail ?? readStudioExportSettings());
    };
    window.addEventListener(STUDIO_EXPORT_SETTINGS_EVENT, onSettings);
    return () => window.removeEventListener(STUDIO_EXPORT_SETTINGS_EVENT, onSettings);
  }, []);

  useEffect(() => {
    restoreStudioDownloadDirectory()
      .then((name) => {
        if (name && !readStudioExportSettings().downloadDirectoryName) {
          update({ ...readStudioExportSettings(), downloadDirectoryName: name, autoDownload: true });
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (next: StudioExportSettings) => {
    setSettings(next);
    writeStudioExportSettings(next);
  };

  const setAspect = (aspect: StudioExportSettings['aspect']) => update({ ...settings, aspect });
  const setFps = (fps: number) => update({ ...settings, fps });
  const setResolution = (resolution: StudioExportSettings['resolution']) => update({ ...settings, resolution });
  const setVideoQuality = (videoQuality: StudioExportSettings['videoQuality']) => update({ ...settings, videoQuality });
  const setOutputFormat = (outputFormat: StudioExportSettings['outputFormat']) => update({ ...settings, outputFormat });
  const setAutoDownload = (autoDownload: StudioExportSettings['autoDownload']) => update({ ...settings, autoDownload });
  const chooseDownloadFolder = async () => {
    setDownloadFolderNotice('');
    try {
      const name = await chooseStudioDownloadDirectory();
      if (name) {
        update({ ...settings, downloadDirectoryName: name, autoDownload: true });
        setDownloadFolderNotice(`Download folder set to ${name}.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.toLowerCase().includes('aborted')) return;
      setDownloadFolderNotice(
        'Chrome blocked this folder. Choose a normal subfolder such as Downloads/AutoVideo, or use Browser Downloads.'
      );
    }
  };
  const clearDownloadFolder = async () => {
    await clearStudioDownloadDirectory().catch(() => {});
    const { downloadDirectoryName: _ignored, ...rest } = settings;
    update(rest);
    setDownloadFolderNotice('Using Browser Downloads for exported files.');
  };
  const resetDefault = () => update(DEFAULT_STUDIO_EXPORT_SETTINGS);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`grid h-7 w-7 place-items-center rounded-lg border text-[12px] font-semibold transition ${
          open
            ? 'border-indigo-300/40 bg-indigo-500/15 text-indigo-100'
            : 'border-white/10 bg-white/[.03] text-[var(--muted)] hover:bg-white/[.06] hover:text-[var(--text)]'
        }`}
        aria-label="Open output settings"
        aria-expanded={open}
        title="Output settings"
      >
        <Settings2 size={14} />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-end bg-black/45 p-4 backdrop-blur-sm"
          onMouseDown={() => setOpen(false)}
        >
          <div
            className="mt-9 w-full max-w-[30rem] overflow-hidden rounded-3xl border border-white/10 bg-[var(--panel)] shadow-2xl shadow-black/55"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="relative overflow-hidden border-b border-white/10 px-4 py-4">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_42%)]" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-100 ring-1 ring-indigo-300/20">
                    <SlidersHorizontal size={18} />
                  </span>
                  <div>
                    <div className="text-base font-semibold text-white">Output Settings</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      Configure export format, frame, resolution, and quality.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/[.03] text-white/50 hover:bg-white/[.06] hover:text-white"
                  aria-label="Close output settings"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="relative mt-4 grid grid-cols-3 gap-2">
                <OutputSummary icon={<FileVideo size={13} />} label="File" value={settings.outputFormat.toUpperCase()} />
                <OutputSummary icon={<MonitorPlay size={13} />} label="Frame" value={settings.aspect} />
                <OutputSummary icon={<Gauge size={13} />} label="Resolution" value={settings.resolution} />
              </div>
            </div>

            <div className="space-y-2 p-4 text-[12px]">
              <SettingsMenuRow
                icon={<FileVideo size={14} />}
                title="File Format"
                description="Choose the container used by Export & Download."
              >
                <Segmented
                  options={['mp4', 'mov'] as const}
                  value={settings.outputFormat}
                  onChange={setOutputFormat}
                  transform={(value) => String(value).toUpperCase()}
                />
              </SettingsMenuRow>
              <SettingsMenuRow
                icon={<FileVideo size={14} />}
                title="Auto Download"
                description="Save exported video automatically after render."
              >
                <Segmented
                  options={['on', 'off'] as const}
                  value={settings.autoDownload ? 'on' : 'off'}
                  onChange={(value) => setAutoDownload(value === 'on')}
                  transform={(value) => String(value).toUpperCase()}
                />
              </SettingsMenuRow>
              <SettingsMenuRow
                icon={<FileVideo size={14} />}
                title="Download Folder"
                description={settings.downloadDirectoryName ?? 'Browser default unless a folder is selected.'}
              >
                <div className="grid grid-cols-[1fr_auto] gap-1">
                  <button
                    type="button"
                    onClick={() => void chooseDownloadFolder()}
                    disabled={!supportsStudioDownloadDirectory()}
                    className="min-w-0 truncate rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[11px] font-semibold text-white/65 transition hover:bg-white/[.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    title={supportsStudioDownloadDirectory() ? 'Choose a normal download subfolder' : 'Folder access is not supported in this browser'}
                  >
                    {settings.downloadDirectoryName ? `Change ${settings.downloadDirectoryName}` : 'Choose Folder'}
                  </button>
                  {settings.downloadDirectoryName ? (
                    <button
                      type="button"
                      onClick={() => void clearDownloadFolder()}
                      className="rounded-xl border border-white/10 bg-white/[.03] px-2 text-[10px] font-semibold text-white/45 hover:bg-white/[.06] hover:text-white"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </SettingsMenuRow>
              {downloadFolderNotice ? (
                <div className="rounded-2xl border border-amber-300/15 bg-amber-400/10 px-3 py-2 text-[10px] leading-snug text-amber-100/80">
                  {downloadFolderNotice}
                </div>
              ) : null}
              <SettingsMenuRow
                icon={<MonitorPlay size={14} />}
                title="Frame"
                description="Match the final video canvas."
              >
                <Segmented
                  options={['9:16', '16:9', '1:1'] as const}
                  value={settings.aspect}
                  onChange={setAspect}
                />
              </SettingsMenuRow>
              <SettingsMenuRow
                icon={<Clock size={14} />}
                title="Frame Rate"
                description="Higher FPS is smoother and heavier."
              >
                <Segmented
                  options={[24, 30, 60] as const}
                  value={settings.fps}
                  onChange={setFps}
                  suffix="fps"
                />
              </SettingsMenuRow>
              <SettingsMenuRow
                icon={<Gauge size={14} />}
                title="Resolution"
                description="Controls export size and render cost."
              >
                <Segmented
                  options={['720p', '1080p', '2k', '4k'] as const}
                  value={settings.resolution}
                  onChange={setResolution}
                />
              </SettingsMenuRow>
              <SettingsMenuRow
                icon={<SlidersHorizontal size={14} />}
                title="Quality"
                description="Bitrate profile for the final file."
              >
                <Segmented
                  options={['auto', 'low', 'medium', 'high'] as const}
                  value={settings.videoQuality}
                  onChange={setVideoQuality}
                />
              </SettingsMenuRow>
              <button
                type="button"
                onClick={resetDefault}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[.03] px-3 py-2.5 text-[12px] font-semibold text-white/60 transition hover:bg-white/[.06] hover:text-white"
              >
                <RotateCcw size={13} />
                Reset to Default
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OutputSummary({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-white/35">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-mono text-xs font-semibold text-white">{value}</div>
    </div>
  );
}

function SettingsMenuRow({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 p-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-indigo-200 ring-1 ring-white/10">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-semibold leading-tight text-white">{title}</div>
        <div className="mt-0.5 truncate text-[10px] leading-tight text-[var(--muted)]">{description}</div>
      </div>
      <div className="w-[13.5rem] shrink-0">{children}</div>
    </div>
  );
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  suffix = '',
  transform,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  suffix?: string;
  transform?: (value: T) => ReactNode;
}) {
  const cols = options.length === 4 ? 'grid-cols-4' : options.length === 2 ? 'grid-cols-2' : 'grid-cols-3';
  return (
    <div className={`grid ${cols} gap-1 rounded-xl border border-white/10 bg-black/20 p-1`}>
      {options.map((option) => {
        const active = option === value;
        return (
          <button
            key={String(option)}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
              active ? 'bg-indigo-500/25 text-indigo-100' : 'text-white/45 hover:bg-white/[.05] hover:text-white'
            }`}
          >
            {transform ? transform(option) : option}
            {suffix ? <span className="ml-0.5 text-[9px] opacity-60">{suffix}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

function useSessionClock() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}
