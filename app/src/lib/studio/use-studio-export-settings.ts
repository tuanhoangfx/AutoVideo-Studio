'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_STUDIO_EXPORT_SETTINGS,
  readStudioExportSettings,
  STUDIO_EXPORT_SETTINGS_EVENT,
  type StudioExportSettings,
  type VideoNameTemplate,
} from '@/lib/studio-export-settings';
import type { StudioAspect } from './studio-types';

export function useStudioExportSettings() {
  const [aspect, setAspect] = useState<StudioAspect>(DEFAULT_STUDIO_EXPORT_SETTINGS.aspect);
  const [fps, setFps] = useState(DEFAULT_STUDIO_EXPORT_SETTINGS.fps);
  const [resolution, setResolution] = useState(DEFAULT_STUDIO_EXPORT_SETTINGS.resolution);
  const [videoQuality, setVideoQuality] = useState(DEFAULT_STUDIO_EXPORT_SETTINGS.videoQuality);
  const [outputFormat, setOutputFormat] = useState(DEFAULT_STUDIO_EXPORT_SETTINGS.outputFormat);
  const [autoDownload, setAutoDownload] = useState(DEFAULT_STUDIO_EXPORT_SETTINGS.autoDownload);
  const [exportDurationMode, setExportDurationMode] = useState(
    DEFAULT_STUDIO_EXPORT_SETTINGS.exportDurationMode
  );
  const [downloadDirectoryName, setDownloadDirectoryName] = useState<string | undefined>(undefined);
  const [videoNameTemplate, setVideoNameTemplate] = useState<VideoNameTemplate>(
    DEFAULT_STUDIO_EXPORT_SETTINGS.videoNameTemplate ?? 'time-date-yy-images'
  );

  useEffect(() => {
    const apply = (settings: StudioExportSettings) => {
      setAspect(settings.aspect);
      setFps(settings.fps);
      setResolution(settings.resolution);
      setVideoQuality(settings.videoQuality);
      setOutputFormat(settings.outputFormat);
      setAutoDownload(settings.autoDownload);
      setExportDurationMode(settings.exportDurationMode);
      setDownloadDirectoryName(settings.downloadDirectoryName);
      setVideoNameTemplate(settings.videoNameTemplate ?? 'time-date-yy-images');
    };
    apply(readStudioExportSettings());
    const onSettings = (event: Event) => {
      apply((event as CustomEvent<StudioExportSettings>).detail ?? DEFAULT_STUDIO_EXPORT_SETTINGS);
    };
    window.addEventListener(STUDIO_EXPORT_SETTINGS_EVENT, onSettings);
    return () => window.removeEventListener(STUDIO_EXPORT_SETTINGS_EVENT, onSettings);
  }, []);

  return {
    aspect,
    setAspect,
    fps,
    setFps,
    resolution,
    setResolution,
    videoQuality,
    setVideoQuality,
    outputFormat,
    setOutputFormat,
    autoDownload,
    setAutoDownload,
    exportDurationMode,
    setExportDurationMode,
    downloadDirectoryName,
    setDownloadDirectoryName,
    videoNameTemplate,
    setVideoNameTemplate,
  };
}
