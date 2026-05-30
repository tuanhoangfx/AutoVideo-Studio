export type ExportDurationMode = 'image' | 'script';

export type VideoNameTemplate =
  | 'time-date-yy-images'
  | 'time-date-yy'
  | 'date-yy-time'
  | 'topic-time-date'
  | 'jobid';

export type StudioExportSettings = {
  aspect: '9:16' | '16:9' | '1:1';
  fps: number;
  resolution: '720p' | '1080p' | '2k' | '4k';
  videoQuality: 'auto' | 'low' | 'medium' | 'high';
  outputFormat: 'mp4' | 'mov';
  autoDownload: boolean;
  exportDurationMode: ExportDurationMode;
  downloadDirectoryName?: string;
  videoNameTemplate?: VideoNameTemplate;
};

export const STUDIO_EXPORT_SETTINGS_EVENT = 'studio-export-settings-change';
const STUDIO_EXPORT_SETTINGS_KEY = 'p0021:studio-export-settings';

export const DEFAULT_STUDIO_EXPORT_SETTINGS: StudioExportSettings = {
  aspect: '16:9',
  fps: 30,
  resolution: '1080p',
  videoQuality: 'auto',
  outputFormat: 'mp4',
  autoDownload: true,
  exportDurationMode: 'image',
  videoNameTemplate: 'time-date-yy',
};

export function readStudioExportSettings(): StudioExportSettings {
  if (typeof window === 'undefined') return DEFAULT_STUDIO_EXPORT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STUDIO_EXPORT_SETTINGS_KEY);
    if (!raw) return DEFAULT_STUDIO_EXPORT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<StudioExportSettings>;
    return {
      aspect: isAspect(parsed.aspect) ? parsed.aspect : DEFAULT_STUDIO_EXPORT_SETTINGS.aspect,
      fps: isFps(parsed.fps) ? parsed.fps : DEFAULT_STUDIO_EXPORT_SETTINGS.fps,
      resolution: isResolution(parsed.resolution) ? parsed.resolution : DEFAULT_STUDIO_EXPORT_SETTINGS.resolution,
      videoQuality: isVideoQuality(parsed.videoQuality) ? parsed.videoQuality : DEFAULT_STUDIO_EXPORT_SETTINGS.videoQuality,
      outputFormat: isOutputFormat(parsed.outputFormat) ? parsed.outputFormat : DEFAULT_STUDIO_EXPORT_SETTINGS.outputFormat,
      autoDownload: typeof parsed.autoDownload === 'boolean' ? parsed.autoDownload : DEFAULT_STUDIO_EXPORT_SETTINGS.autoDownload,
      exportDurationMode: isExportDurationMode(parsed.exportDurationMode)
        ? parsed.exportDurationMode
        : DEFAULT_STUDIO_EXPORT_SETTINGS.exportDurationMode,
      downloadDirectoryName: typeof parsed.downloadDirectoryName === 'string' ? parsed.downloadDirectoryName : undefined,
      videoNameTemplate: isVideoNameTemplate(parsed.videoNameTemplate)
        ? parsed.videoNameTemplate
        : DEFAULT_STUDIO_EXPORT_SETTINGS.videoNameTemplate,
    };
  } catch {
    return DEFAULT_STUDIO_EXPORT_SETTINGS;
  }
}

export function writeStudioExportSettings(next: StudioExportSettings) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STUDIO_EXPORT_SETTINGS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent<StudioExportSettings>(STUDIO_EXPORT_SETTINGS_EVENT, { detail: next }));
}

function isAspect(value: unknown): value is StudioExportSettings['aspect'] {
  return value === '9:16' || value === '16:9' || value === '1:1';
}

function isFps(value: unknown): value is number {
  return value === 24 || value === 30 || value === 60;
}

function isResolution(value: unknown): value is StudioExportSettings['resolution'] {
  return value === '720p' || value === '1080p' || value === '2k' || value === '4k';
}

function isVideoQuality(value: unknown): value is StudioExportSettings['videoQuality'] {
  return value === 'auto' || value === 'low' || value === 'medium' || value === 'high';
}

function isOutputFormat(value: unknown): value is StudioExportSettings['outputFormat'] {
  return value === 'mp4' || value === 'mov';
}

function isExportDurationMode(value: unknown): value is ExportDurationMode {
  return value === 'image' || value === 'script';
}

function isVideoNameTemplate(value: unknown): value is VideoNameTemplate {
  return (
    value === 'time-date-yy-images' ||
    value === 'time-date-yy' ||
    value === 'date-yy-time' ||
    value === 'topic-time-date' ||
    value === 'jobid'
  );
}
