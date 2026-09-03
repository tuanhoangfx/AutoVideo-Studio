'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  Clock,
  FileVideo,
  Film,
  Gauge,
  MonitorPlay,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { HubSingleFilterDropdown } from '@/lib/hub-ui';
import {
  readStudioExportSettings,
  writeStudioExportSettings,
  DEFAULT_STUDIO_EXPORT_SETTINGS,
  STUDIO_EXPORT_SETTINGS_EVENT,
  type StudioExportSettings,
  type VideoNameTemplate,
} from '@/lib/studio-export-settings';
import { VIDEO_NAME_TEMPLATES } from '@/lib/studio/studio-types';
import {
  chooseStudioDownloadDirectory,
  clearStudioDownloadDirectory,
  restoreStudioDownloadDirectory,
  supportsStudioDownloadDirectory,
} from '@/lib/studio-download-target';
import { StudioExportDurationToggle } from '@/components/studio/StudioExportDurationToggle';

export function StudioOutputSettingsPanel() {
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
    void import('@/lib/api')
      .then(({ syncDesktopDownloadFolderFromRuntime }) => syncDesktopDownloadFolderFromRuntime())
      .catch(() => {});
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
  const setResolution = (resolution: StudioExportSettings['resolution']) =>
    update({ ...settings, resolution });
  const setVideoQuality = (videoQuality: StudioExportSettings['videoQuality']) =>
    update({ ...settings, videoQuality });
  const setOutputFormat = (outputFormat: StudioExportSettings['outputFormat']) =>
    update({ ...settings, outputFormat });
  const setAutoDownload = (autoDownload: StudioExportSettings['autoDownload']) =>
    update({ ...settings, autoDownload });
  const setVideoNameTemplate = (videoNameTemplate: VideoNameTemplate) =>
    update({ ...settings, videoNameTemplate });
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
        'Chrome blocked this folder. Choose a normal subfolder such as Downloads/AutoVideo, or use Browser Downloads.',
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
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <OutputSummary icon={<FileVideo size={13} />} label="File" value={settings.outputFormat.toUpperCase()} />
        <OutputSummary icon={<MonitorPlay size={13} />} label="Frame" value={settings.aspect} />
        <OutputSummary icon={<Gauge size={13} />} label="Resolution" value={settings.resolution} />
      </div>

      <div className="space-y-2 text-[12px]">
        <SettingsMenuRow icon={<FileVideo size={14} />} title="File Format" description="Choose the container used by Export & Download.">
          <Segmented options={['mp4', 'mov'] as const} value={settings.outputFormat} onChange={setOutputFormat} transform={(v) => String(v).toUpperCase()} />
        </SettingsMenuRow>
        <SettingsMenuRow icon={<FileVideo size={14} />} title="Auto Download" description="Save exported video automatically after render.">
          <Segmented options={['on', 'off'] as const} value={settings.autoDownload ? 'on' : 'off'} onChange={(v) => setAutoDownload(v === 'on')} transform={(v) => String(v).toUpperCase()} />
        </SettingsMenuRow>
        <SettingsMenuRow icon={<FileVideo size={14} />} title="Video Name" description="Template used by Export & Download.">
          <HubSingleFilterDropdown
            filterKey="studio-video-name-template"
            label="Video name"
            options={VIDEO_NAME_TEMPLATES.map(({ value, label }) => ({ value, label }))}
            value={settings.videoNameTemplate ?? 'date-yy-time'}
            onChange={(next) => setVideoNameTemplate(next as VideoNameTemplate)}
            allowClear={false}
            triggerFormat="value"
            className="min-w-[14rem]"
          />
        </SettingsMenuRow>
        <SettingsMenuRow
          icon={<Film size={14} />}
          title="Video Export Length"
          description="Image: total image time. Script: stop or black hold. Fit: split script time across all images."
          childrenClassName="w-[17rem]"
        >
          <StudioExportDurationToggle
            value={settings.exportDurationMode}
            onChange={(exportDurationMode) => update({ ...settings, exportDurationMode })}
          />
        </SettingsMenuRow>
        <SettingsMenuRow icon={<FileVideo size={14} />} title="Download Folder" description={settings.downloadDirectoryName ?? 'Browser default unless a folder is selected.'}>
          <div className="grid grid-cols-[1fr_auto] gap-1">
            <button
              type="button"
              onClick={() => void chooseDownloadFolder()}
              disabled={!supportsStudioDownloadDirectory()}
              className="min-w-0 truncate rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[11px] font-semibold text-white/65 transition hover:bg-white/[.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {settings.downloadDirectoryName ? `Change ${settings.downloadDirectoryName}` : 'Choose Folder'}
            </button>
            {settings.downloadDirectoryName ? (
              <button type="button" onClick={() => void clearDownloadFolder()} className="rounded-xl border border-white/10 bg-white/[.03] px-2 text-[10px] font-semibold text-white/45 hover:bg-white/[.06] hover:text-white">
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
        <SettingsMenuRow icon={<MonitorPlay size={14} />} title="Frame" description="Match the final video canvas.">
          <Segmented options={['9:16', '16:9', '1:1'] as const} value={settings.aspect} onChange={setAspect} />
        </SettingsMenuRow>
        <SettingsMenuRow icon={<Clock size={14} />} title="Frame Rate" description="Higher FPS is smoother and heavier.">
          <Segmented options={[24, 30, 60] as const} value={settings.fps} onChange={setFps} suffix="fps" />
        </SettingsMenuRow>
        <SettingsMenuRow icon={<Gauge size={14} />} title="Resolution" description="Controls export size and render cost.">
          <Segmented options={['720p', '1080p', '2k', '4k'] as const} value={settings.resolution} onChange={setResolution} />
        </SettingsMenuRow>
        <SettingsMenuRow icon={<SlidersHorizontal size={14} />} title="Quality" description="Bitrate profile for the final file.">
          <Segmented options={['auto', 'low', 'medium', 'high'] as const} value={settings.videoQuality} onChange={setVideoQuality} />
        </SettingsMenuRow>
      </div>

      <button
        type="button"
        onClick={resetDefault}
        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 text-[11px] font-semibold text-white/55 transition hover:bg-white/[.06] hover:text-white"
      >
        <RotateCcw size={12} />
        Reset output defaults
      </button>
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
  childrenClassName = 'w-[13.5rem]',
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  childrenClassName?: string;
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
      <div className={`${childrenClassName} shrink-0`}>{children}</div>
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
