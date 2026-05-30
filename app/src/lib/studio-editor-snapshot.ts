'use client';

import type { LibraryImage, ScriptLine, SequenceTiming } from '@/types/studio';
import type { Job, SubtitleStyle, TTSProvider } from '@/lib/api';
import { isRunningJob } from '@/lib/job-running';
import { DEFAULT_STUDIO_SUBTITLE_STYLE, DEFAULT_STUDIO_VOICE } from '@/lib/studio-defaults';

export type StudioDownloadState = 'idle' | 'exporting' | 'downloading' | 'downloaded' | 'error';

export type EditorSnapshot = {
  images: LibraryImage[];
  lines: ScriptLine[];
  scriptText: string;
  topic: string;
  selectedScene: number;
  selectedImage: number;
  selectedImageIndexes: number[];
  voice: string;
  aspect: '9:16' | '16:9' | '1:1';
  rate: string;
  ttsProvider: TTSProvider;
  fps: number;
  resolution: '720p' | '1080p' | '2k' | '4k';
  videoQuality: 'auto' | 'low' | 'medium' | 'high';
  outputFormat: 'mp4' | 'mov';
  imageDurationSec: number;
  bgm: File | null;
  bgmVolume: number;
  subtitleStyle: SubtitleStyle;
  previewMode: 'static' | 'sequence';
  previewPlayhead: number;
  sequenceTiming: SequenceTiming | null;
  downloadState: StudioDownloadState;
  downloadMessage: string;
};

export function revokeEditorImages(images: LibraryImage[]) {
  for (const im of images) {
    try {
      URL.revokeObjectURL(im.url);
    } catch {
      /* ignore */
    }
  }
}

/** Copy image metadata for tab cache (File refs only; blob URLs are recreated on restore). */
export function cloneSnapshotImages(images: LibraryImage[]): LibraryImage[] {
  return images.map((im) => ({ ...im }));
}

/** Fresh object URLs for display — required after tab switch (previous URLs may be revoked). */
export function hydrateSnapshotImages(images: LibraryImage[]): LibraryImage[] {
  return images.map((im) => ({
    ...im,
    url: URL.createObjectURL(im.file),
  }));
}

export function applyJobConfigToSnapshot(job: Job, base?: Partial<EditorSnapshot>): Partial<EditorSnapshot> {
  const c = job.config;
  return {
    ...base,
    topic: base?.topic ?? '',
    scriptText: c.narration_script ?? base?.scriptText ?? '',
    voice: c.voice ?? base?.voice ?? DEFAULT_STUDIO_VOICE,
    aspect: c.aspect ?? base?.aspect ?? '9:16',
    rate: c.rate ?? base?.rate ?? '+0%',
    ttsProvider: c.tts_provider ?? base?.ttsProvider ?? 'edge',
    fps: c.fps ?? base?.fps ?? 30,
    resolution: c.resolution ?? base?.resolution ?? '1080p',
    videoQuality: c.video_quality ?? base?.videoQuality ?? 'auto',
    outputFormat: c.output_format ?? base?.outputFormat ?? 'mp4',
    bgmVolume: c.bgm_volume ?? base?.bgmVolume ?? 0.18,
    subtitleStyle: c.subtitle_style ?? base?.subtitleStyle ?? DEFAULT_STUDIO_SUBTITLE_STYLE,
    images: base?.images ?? [],
    lines: base?.lines ?? [],
    selectedImageIndexes: base?.selectedImageIndexes ?? [],
  };
}

export function resolveTabDownloadUi(
  job: Job | undefined,
  snap: EditorSnapshot | undefined,
  savedFilename?: string
): Pick<EditorSnapshot, 'downloadState' | 'downloadMessage'> {
  if (job && isRunningJob(job)) {
    return {
      downloadState: 'exporting',
      downloadMessage: `Exporting · ${job.progress}%`,
    };
  }
  if (job?.status === 'error') {
    return {
      downloadState: 'error',
      downloadMessage: job.error || 'Export failed.',
    };
  }
  if (job?.status === 'done') {
    if (savedFilename) {
      return { downloadState: 'downloaded', downloadMessage: savedFilename };
    }
    return { downloadState: 'idle', downloadMessage: '' };
  }
  if (snap) {
    return { downloadState: snap.downloadState, downloadMessage: snap.downloadMessage };
  }
  return { downloadState: 'idle', downloadMessage: '' };
}
