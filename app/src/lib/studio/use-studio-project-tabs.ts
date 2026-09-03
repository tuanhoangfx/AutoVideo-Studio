'use client';

import { useCallback } from 'react';
import type { Job } from '@/lib/api';
import { clearDraft } from '@/lib/autosave';
import { clearAllFiles } from '@/lib/draft-files';
import {
  applyJobConfigToSnapshot,
  resolveTabDownloadUi,
  type EditorSnapshot,
  type StudioDownloadState,
} from '@/lib/studio-editor-snapshot';
import { bindJobToSlot } from '@/lib/job-project-slot';
import type { StudioAspect } from './studio-types';
import type { SubtitleStyle, TTSProvider } from '@/lib/api';
import type {
  StudioExportSettings,
} from '@/lib/studio-export-settings';

type ExportResolution = StudioExportSettings['resolution'];
type ExportVideoQuality = StudioExportSettings['videoQuality'];
type ExportOutputFormat = StudioExportSettings['outputFormat'];

type TabDeps = {
  activeJobIdRef: React.MutableRefObject<string | null>;
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  activeJobId: string | null;
  setActiveJobId: (id: string | null) => void;
  setNewJobId: (id: string | null) => void;
  savedOutputFilenames: Record<string, string>;
  setDownloadState: (s: StudioDownloadState) => void;
  setDownloadMessage: (m: string) => void;
  captureEditorSnapshot: () => EditorSnapshot;
  applyEditorSnapshot: (snap: EditorSnapshot) => void;
  applyEmptyEditor: () => void;
  editorCacheRef: React.MutableRefObject<Map<string, EditorSnapshot>>;
  voice: string;
  aspect: StudioAspect;
  rate: string;
  ttsProvider: TTSProvider;
  fps: number;
  resolution: ExportResolution;
  videoQuality: ExportVideoQuality;
  outputFormat: ExportOutputFormat;
  imageDurationSec: number;
  bgmVolume: number;
  subtitleStyle: SubtitleStyle;
  setPreviewMode: (m: 'static' | 'sequence') => void;
  setPreviewPlayhead: (n: number) => void;
};

export function useStudioProjectTabs(deps: TabDeps) {
  const switchJob = useCallback(
    (id: string) => {
      const fromId = deps.activeJobIdRef.current;
      if (fromId && fromId !== id) {
        deps.editorCacheRef.current.set(fromId, deps.captureEditorSnapshot());
      }

      const job = deps.jobs.find((j) => j.id === id);
      const cached = deps.editorCacheRef.current.get(id);
      if (cached) {
        deps.applyEditorSnapshot(cached);
      } else if (job && !job.id.startsWith('draft-')) {
        deps.applyEmptyEditor();
        const partial = applyJobConfigToSnapshot(job);
        deps.applyEditorSnapshot({
          images: [],
          lines: [],
          scriptText: partial.scriptText ?? '',
          topic: partial.topic ?? '',
          selectedScene: 0,
          selectedImage: 0,
          selectedImageIndexes: [],
          voice: partial.voice ?? deps.voice,
          aspect: partial.aspect ?? deps.aspect,
          rate: partial.rate ?? deps.rate,
          ttsProvider: partial.ttsProvider ?? deps.ttsProvider,
          fps: partial.fps ?? deps.fps,
          resolution: partial.resolution ?? deps.resolution,
          videoQuality: partial.videoQuality ?? deps.videoQuality,
          outputFormat: partial.outputFormat ?? deps.outputFormat,
          imageDurationSec: deps.imageDurationSec,
          bgm: null,
          bgmVolume: partial.bgmVolume ?? deps.bgmVolume,
          subtitleStyle: partial.subtitleStyle ?? deps.subtitleStyle,
          previewMode: 'static',
          previewPlayhead: 0,
          sequenceTiming: null,
          downloadState: 'idle',
          downloadMessage: '',
          sceneOrderMode: 'sequential',
        });
      } else {
        deps.applyEmptyEditor();
      }

      deps.activeJobIdRef.current = id;
      deps.setActiveJobId(id);
      deps.setPreviewMode('static');
      deps.setPreviewPlayhead(0);

      const dl = resolveTabDownloadUi(job, cached, deps.savedOutputFilenames[id]);
      deps.setDownloadState(dl.downloadState);
      deps.setDownloadMessage(dl.downloadMessage);
    },
    [deps]
  );

  const newProject = useCallback(() => {
    const fromId = deps.activeJobIdRef.current;
    if (fromId) {
      deps.editorCacheRef.current.set(fromId, deps.captureEditorSnapshot());
    }
    deps.applyEmptyEditor();
    deps.setDownloadState('idle');
    deps.setDownloadMessage('');
    clearDraft();
    clearAllFiles().catch(() => {});
    const draftId = `draft-${Date.now()}`;
    const draft: Job = {
      id: draftId,
      status: 'pending',
      progress: 0,
      message: 'Draft',
      config: {
        aspect: deps.aspect,
        voice: deps.voice,
        fps: deps.fps,
        resolution: deps.resolution,
        video_quality: deps.videoQuality,
        output_format: deps.outputFormat,
        rate: deps.rate,
        tts_provider: deps.ttsProvider,
        subtitle_style: deps.subtitleStyle,
        bgm_volume: deps.bgmVolume,
      },
      scenes_count: 0,
      created_at: new Date().toISOString(),
      output_url: null,
      error: null,
    };
    deps.editorCacheRef.current.set(draftId, {
      images: [],
      lines: [],
      scriptText: '',
      topic: '',
      selectedScene: 0,
      selectedImage: 0,
      selectedImageIndexes: [],
      voice: deps.voice,
      aspect: deps.aspect,
      rate: deps.rate,
      ttsProvider: deps.ttsProvider,
      fps: deps.fps,
      resolution: deps.resolution,
      videoQuality: deps.videoQuality,
      outputFormat: deps.outputFormat,
      imageDurationSec: deps.imageDurationSec,
      bgm: null,
      bgmVolume: deps.bgmVolume,
      subtitleStyle: deps.subtitleStyle,
      previewMode: 'static',
      previewPlayhead: 0,
      sequenceTiming: null,
      downloadState: 'idle',
      downloadMessage: '',
      sceneOrderMode: 'sequential',
    });
    bindJobToSlot(draftId, draftId, { labelAt: new Date().toISOString() });
    deps.setJobs((prev) => [draft, ...prev]);
    deps.activeJobIdRef.current = draftId;
    deps.setActiveJobId(draftId);
    deps.setNewJobId(draftId);
  }, [deps]);

  return { switchJob, newProject };
}
