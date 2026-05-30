'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Download, FolderOpen, Loader2, Music, Subtitles,
  Folder, FileText, Play, PlayCircle, Mic2,
} from 'lucide-react';
import * as api from '@/lib/api';
import { formatDuration } from '@/lib/format-duration';
import type { Job, SubtitleStyle, TTSProvider } from '@/lib/api';
import { useAutoSave, clearDraft, loadDraft, type DraftState } from '@/lib/autosave';
import {
  saveImages, saveBgm, clearAllFiles, summarizeFiles, loadImages, loadBgm,
} from '@/lib/draft-files';
import {
  cloneSnapshotImages,
  hydrateSnapshotImages,
  revokeEditorImages,
  type EditorSnapshot,
  type StudioDownloadState,
} from '@/lib/studio-editor-snapshot';
import {
  ProjectTabs,
  ImageLibrary,
  ScriptPanel,
  KeyframeTimeline,
  BGMPanel,
  SubtitlePanel,
  VoiceSelector,
  VOICE_OPTIONS,
  FlagBadge,
  SequencePreview,
  AudioPreview,
  type LibraryImage,
  type LibraryImageInput,
  type ScriptLine,
  type Effect,
  type Transition,
  type SequenceTiming,
} from '@/components/studio';
import {
  DEFAULT_STUDIO_EXPORT_SETTINGS,
  readStudioExportSettings,
  writeStudioExportSettings,
} from '@/lib/studio-export-settings';
import { canStartAnotherExport } from '@/lib/worker-capacity';
import { bindJobToSlot, removeJobSlot } from '@/lib/job-project-slot';
import { buildVideoFilename } from '@/lib/video-filename';
import { computeSceneDurationsSec, totalExportDurationSec } from '@/lib/export-duration';
import { resolveNarrationScript } from '@/lib/narration-script';
import { scriptMetrics } from '@/lib/script-metrics';
import { DEFAULT_STUDIO_SUBTITLE_STYLE, DEFAULT_STUDIO_VOICE } from '@/lib/studio-defaults';
import { clampVoicePreviewText } from '@/lib/voice-preview-text';
import { useStudioJobs } from '@/lib/studio/use-studio-jobs';
import { useStudioToast } from '@/lib/studio/use-studio-toast';
import { useStudioExportSettings } from '@/lib/studio/use-studio-export-settings';
import { useStudioProjectTabs } from '@/lib/studio/use-studio-project-tabs';
import { useStudioExport } from '@/lib/studio/use-studio-export';
import { buildSceneLines, moveItem, sourceFolderName } from '@/lib/studio/studio-scene-utils';
import type { StudioAspect, StudioDownloadRecord, StudioRightPanel } from '@/lib/studio/studio-types';
import {
  PanelHead,
  PreviewExportStatus,
  RightPanelTab,
} from '@/components/studio/StudioPageParts';

type Aspect = StudioAspect;
type RightPanel = StudioRightPanel;
type DownloadState = StudioDownloadState;
type DownloadRecord = StudioDownloadRecord;

export default function StudioPage() {
  const { toast, toastActionRef, showToast, dismissToast } = useStudioToast();
  const {
    jobs,
    setJobs,
    activeJobId,
    setActiveJobId,
    newJobId,
    setNewJobId,
    serverOk,
    concurrentLimit,
    probingOutput,
    currentJob,
    runningExportCount,
    slotsFull,
    durationMismatchMs,
    probeCurrentJobOutput,
    closeJobTab,
  } = useStudioJobs(showToast);
  const exportSettings = useStudioExportSettings();
  const {
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
    exportDurationMode,
    setExportDurationMode,
    downloadDirectoryName,
    videoNameTemplate,
  } = exportSettings;

  /* ─── Project doc state ─── */
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [lines, setLines] = useState<ScriptLine[]>([]);
  const [scriptText, setScriptText] = useState('');
  const [topic, setTopic] = useState('');
  const [selectedScene, setSelectedScene] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedImageIndexes, setSelectedImageIndexes] = useState<number[]>([]);

  /* ─── Config ─── */
  const [voice, setVoice] = useState(DEFAULT_STUDIO_VOICE);
  const [rate, setRate] = useState('+0%');
  const [ttsProvider, setTtsProvider] = useState<TTSProvider>('edge');
  const [imageDurationSec, setImageDurationSec] = useState(5);
  const [bgm, setBgm] = useState<File | null>(null);
  const [bgmVolume, setBgmVolume] = useState(0.18);
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>(DEFAULT_STUDIO_SUBTITLE_STYLE);

  /* ─── UX flags ─── */
  const [previewMode, setPreviewMode] = useState<'static' | 'sequence'>('static');
  const [rightPanel, setRightPanel] = useState<RightPanel>('voice');
  const [previewPlayhead, setPreviewPlayhead] = useState(0);
  const [sequenceTiming, setSequenceTiming] = useState<SequenceTiming | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const [downloadMessage, setDownloadMessage] = useState('');
  const [downloadBadgeVersion, setDownloadBadgeVersion] = useState(0);
  const editorCacheRef = useRef<Map<string, EditorSnapshot>>(new Map());

  const captureEditorSnapshot = useCallback((): EditorSnapshot => {
    return {
      images: cloneSnapshotImages(images),
      lines: lines.map((l) => ({ ...l })),
      scriptText,
      topic,
      selectedScene,
      selectedImage,
      selectedImageIndexes: [...selectedImageIndexes],
      voice,
      aspect,
      rate,
      ttsProvider,
      fps,
      resolution,
      videoQuality,
      outputFormat,
      imageDurationSec,
      bgm,
      bgmVolume,
      subtitleStyle,
      previewMode,
      previewPlayhead,
      sequenceTiming,
      downloadState,
      downloadMessage,
    };
  }, [
    images,
    lines,
    scriptText,
    topic,
    selectedScene,
    selectedImage,
    selectedImageIndexes,
    voice,
    aspect,
    rate,
    ttsProvider,
    fps,
    resolution,
    videoQuality,
    outputFormat,
    imageDurationSec,
    bgm,
    bgmVolume,
    subtitleStyle,
    previewMode,
    previewPlayhead,
    sequenceTiming,
    downloadState,
    downloadMessage,
  ]);

  const applyEditorSnapshot = useCallback((snap: EditorSnapshot) => {
    setImages((prev) => {
      revokeEditorImages(prev);
      return hydrateSnapshotImages(snap.images);
    });
    setLines(snap.lines.map((l) => ({ ...l })));
    setScriptText(snap.scriptText);
    setTopic(snap.topic);
    setSelectedScene(snap.selectedScene);
    setSelectedImage(snap.selectedImage);
    setSelectedImageIndexes([...snap.selectedImageIndexes]);
    setVoice(snap.voice);
    setAspect(snap.aspect);
    setRate(snap.rate);
    setTtsProvider(snap.ttsProvider);
    setFps(snap.fps);
    setResolution(snap.resolution);
    setVideoQuality(snap.videoQuality);
    setOutputFormat(snap.outputFormat);
    setImageDurationSec(snap.imageDurationSec);
    setBgm(snap.bgm);
    setBgmVolume(snap.bgmVolume);
    setSubtitleStyle(snap.subtitleStyle);
    setPreviewMode(snap.previewMode);
    setPreviewPlayhead(snap.previewPlayhead);
    setSequenceTiming(snap.sequenceTiming);
  }, []);

  const applyEmptyEditor = useCallback(() => {
    setImages((prev) => {
      revokeEditorImages(prev);
      return [];
    });
    setLines([]);
    setScriptText('');
    setTopic('');
    setSelectedScene(0);
    setSelectedImage(0);
    setSelectedImageIndexes([]);
    setBgm(null);
    setPreviewMode('static');
    setPreviewPlayhead(0);
    setSequenceTiming(null);
  }, []);

  /* ─── Restore draft (localStorage + IDB) on mount ─── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await summarizeFiles();
        const draft = loadDraft();
        const imageFiles = await loadImages();
        const bgmFile = await loadBgm();
        if (cancelled) return;

        if (!draft && imageFiles.length === 0 && !bgmFile) return;

        const libImages: LibraryImage[] = imageFiles.map((file) => ({
          file,
          url: URL.createObjectURL(file),
          used: false,
          sourceKind: 'local',
        }));

        if (draft) {
          setLines(draft.lines.map((l) => ({ ...l })));
          setTopic(draft.topic);
          setVoice(draft.voice);
          setRate(draft.rate);
          if (draft.ttsProvider) setTtsProvider(draft.ttsProvider);
          if (draft.aspect) setAspect(draft.aspect);
          if (draft.fps) setFps(draft.fps);
          if (draft.resolution) setResolution(draft.resolution);
          if (draft.videoQuality) setVideoQuality(draft.videoQuality);
          if (draft.outputFormat) setOutputFormat(draft.outputFormat);
          if (draft.bgmVolume != null) setBgmVolume(draft.bgmVolume);
          if (draft.subtitleStyle) setSubtitleStyle(draft.subtitleStyle);
        }
        setImages(libImages);
        if (bgmFile) setBgm(bgmFile);

        const draftId = `draft-${Date.now()}`;
        const draftJob: Job = {
          id: draftId,
          status: 'pending',
          progress: 0,
          message: 'Draft',
          config: {
            aspect: draft?.aspect ?? DEFAULT_STUDIO_EXPORT_SETTINGS.aspect,
            voice: draft?.voice ?? DEFAULT_STUDIO_VOICE,
            fps: draft?.fps ?? DEFAULT_STUDIO_EXPORT_SETTINGS.fps,
            resolution: draft?.resolution ?? DEFAULT_STUDIO_EXPORT_SETTINGS.resolution,
            video_quality: draft?.videoQuality ?? DEFAULT_STUDIO_EXPORT_SETTINGS.videoQuality,
            output_format: draft?.outputFormat ?? DEFAULT_STUDIO_EXPORT_SETTINGS.outputFormat,
            rate: draft?.rate ?? '+0%',
            tts_provider: draft?.ttsProvider ?? 'edge',
            subtitle_style: draft?.subtitleStyle ?? DEFAULT_STUDIO_SUBTITLE_STYLE,
            bgm_volume: draft?.bgmVolume ?? 0.18,
          },
          scenes_count: draft?.lines.length ?? 0,
          created_at: new Date().toISOString(),
          output_url: null,
          error: null,
        };
        bindJobToSlot(draftId, draftId, { labelAt: draftJob.created_at });
        setJobs((prev) => [draftJob, ...prev.filter((j) => !j.id.startsWith('draft-'))]);
        setActiveJobId(draftId);
        editorCacheRef.current.set(draftId, {
          images: cloneSnapshotImages(libImages),
          lines: draft?.lines.map((l) => ({ ...l })) ?? [],
          scriptText: '',
          topic: draft?.topic ?? '',
          selectedScene: 0,
          selectedImage: 0,
          selectedImageIndexes: [],
          voice: draft?.voice ?? DEFAULT_STUDIO_VOICE,
          aspect: draft?.aspect ?? DEFAULT_STUDIO_EXPORT_SETTINGS.aspect,
          rate: draft?.rate ?? '+0%',
          ttsProvider: draft?.ttsProvider ?? 'edge',
          fps: draft?.fps ?? DEFAULT_STUDIO_EXPORT_SETTINGS.fps,
          resolution: draft?.resolution ?? DEFAULT_STUDIO_EXPORT_SETTINGS.resolution,
          videoQuality: draft?.videoQuality ?? DEFAULT_STUDIO_EXPORT_SETTINGS.videoQuality,
          outputFormat: draft?.outputFormat ?? DEFAULT_STUDIO_EXPORT_SETTINGS.outputFormat,
          imageDurationSec: 5,
          bgm: bgmFile,
          bgmVolume: draft?.bgmVolume ?? 0.18,
          subtitleStyle: draft?.subtitleStyle ?? DEFAULT_STUDIO_SUBTITLE_STYLE,
          previewMode: 'static',
          previewPlayhead: 0,
          sequenceTiming: null,
          downloadState: 'idle',
          downloadMessage: '',
        });
      } catch {
        // Ignore corrupt draft / IDB on mount.
      } finally {
        if (!cancelled) {
          setHydrated(true);
          setDownloadBadgeVersion((v) => v + 1);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ─── Auto-save debounced 2s ─── */
  const draftState: DraftState = useMemo(
    () => ({
      topic,
      lines,
      voice,
      rate,
      ttsProvider,
      aspect,
      fps,
      resolution,
      videoQuality,
      outputFormat,
      autoDownload,
      downloadDirectoryName,
      bgmVolume,
      subtitleStyle,
      imagesCount: images.length,
      savedAt: new Date().toISOString(),
    }),
    [topic, lines, voice, rate, ttsProvider, aspect, fps, resolution, videoQuality, outputFormat, autoDownload, downloadDirectoryName, bgmVolume, subtitleStyle, images.length]
  );
  // Only autosave AFTER initial hydration (avoid overwriting good draft with empty state).
  useAutoSave(hydrated ? draftState : ({ ...draftState, lines: lines } as DraftState));

  /* ─── Auto-save image blobs + BGM to IndexedDB (debounced 2s) ─── */
  useEffect(() => {
    if (!hydrated) return;
    const id = setTimeout(async () => {
      try {
        await saveImages(images.map((im) => im.file));
      } catch (e) {
        console.warn('[idb] saveImages failed:', e);
      }
    }, 2000);
    return () => clearTimeout(id);
  }, [images, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const id = setTimeout(async () => {
      try {
        await saveBgm(bgm);
      } catch (e) {
        console.warn('[idb] saveBgm failed:', e);
      }
    }, 2000);
    return () => clearTimeout(id);
  }, [bgm, hydrated]);

  /* ─── Image handlers ─── */
  const addImages = useCallback((files: FileList | File[] | LibraryImageInput[]) => {
    const items = Array.from(files as ArrayLike<File | LibraryImageInput>);
    const next: LibraryImage[] = items.map((item) => {
      const input: LibraryImageInput = item instanceof File ? { file: item } : item;
      return {
        file: input.file,
        url: URL.createObjectURL(input.file),
        used: false,
        sourceFolder: input.sourceFolder ?? sourceFolderName(input.file),
        sourceKind: input.sourceKind ?? 'local',
        driveFolderId: input.driveFolderId,
        driveFileId: input.driveFileId,
        thumbnailUrl: input.thumbnailUrl,
        cacheStatus: input.cacheStatus,
      };
    });
    setImages((prev) => [...prev, ...next]);
  }, []);
  const removeImage = useCallback((i: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, idx) => idx !== i);
    });
    setSelectedImageIndexes((prev) =>
      prev.filter((idx) => idx !== i).map((idx) => (idx > i ? idx - 1 : idx))
    );
  }, []);
  useEffect(() => {
    setImages((prev) => {
      const usedSet = new Set(selectedImageIndexes);
      return prev.map((im, idx) => ({ ...im, used: usedSet.has(idx) }));
    });
  }, [selectedImageIndexes]);

  /* ─── Script handlers ─── */
  const applyNarration = useCallback(
    (text: string) => {
      setScriptText(text);
      const targetIndexes =
        selectedImageIndexes.length > 0 ? selectedImageIndexes : images.map((_, index) => index);
      if (selectedImageIndexes.length === 0 && targetIndexes.length > 0) {
        setSelectedImageIndexes(targetIndexes);
      }
      setLines((prev) =>
        buildSceneLines(targetIndexes, prev, imageDurationSec, undefined, true).map((line) => ({
          ...line,
          text: '',
        }))
      );
      setSelectedScene(0);
      setSelectedImage(targetIndexes[0] ?? 0);
      setPreviewMode('static');
      setPreviewPlayhead(0);
      setSequenceTiming(null);
    },
    [imageDurationSec, images, selectedImageIndexes]
  );
  const changeEffect = (i: number, effect: Effect) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, effect } : l)));
  const changeTransition = (i: number, transition: Transition) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, transition } : l)));
  const changeDuration = (i: number, durationSec: number) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, durationSec } : l)));
  const changeExportDuration = useCallback((durationSec: number) => {
    setLines((prev) => {
      if (prev.length === 0) return prev;
      const perScene = Math.max(1, durationSec) / prev.length;
      return prev.map((line) => ({ ...line, durationSec: perScene }));
    });
  }, []);
  const addImagesToKeyframe = useCallback((indexes: number[]) => {
    const nextIndexes = indexes.filter((index) => index >= 0 && index < images.length);
    if (nextIndexes.length === 0) return;
    setSelectedImageIndexes((prev) => [...prev, ...nextIndexes]);
    setSelectedScene(selectedImageIndexes.length);
    setSelectedImage(nextIndexes[0]);
  }, [images, selectedImageIndexes.length]);
  const duplicateScenes = useCallback((indexes: number[]) => {
    if (indexes.length === 0) return;
    const ordered = [...indexes].sort((a, b) => a - b).filter((i) => lines[i]);
    if (ordered.length === 0) return;
    const insertAt = Math.min(Math.max(...ordered) + 1, selectedImageIndexes.length);
    const duplicated = ordered.map((i) => lines[i]);
    setLines((prev) => [
      ...prev.slice(0, insertAt),
      ...duplicated.map((line) => ({ ...line })),
      ...prev.slice(insertAt),
    ]);
    setSelectedImageIndexes((prev) => [
      ...prev.slice(0, insertAt),
      ...duplicated.map((line) => line.image_index),
      ...prev.slice(insertAt),
    ]);
    setSelectedScene(insertAt);
  }, [lines, selectedImageIndexes.length]);
  const removeScenes = useCallback((indexes: number[]) => {
    if (indexes.length === 0) return;
    const removeSet = new Set(indexes);
    setSelectedImageIndexes((prev) => prev.filter((_, idx) => !removeSet.has(idx)));
    setSelectedScene((prev) => Math.max(0, Math.min(prev, selectedImageIndexes.length - removeSet.size - 1)));
  }, [selectedImageIndexes.length]);
  const reorderScenes = useCallback((fromIndex: number, toIndex: number) => {
    setLines((prev) => moveItem(prev, fromIndex, toIndex));
    setSelectedImageIndexes((prev) => moveItem(prev, fromIndex, toIndex));
    setSelectedScene(toIndex);
  }, []);

  useEffect(() => {
    setSelectedImageIndexes((prev) => prev.filter((idx) => idx >= 0 && idx < images.length));
  }, [images.length]);

  useEffect(() => {
    setLines((prev) => buildSceneLines(selectedImageIndexes, prev, imageDurationSec));
    setSelectedScene((prev) => Math.max(0, Math.min(prev, Math.max(0, selectedImageIndexes.length - 1))));
    setSelectedImage(selectedImageIndexes[selectedScene] ?? selectedImageIndexes[0] ?? 0);
  }, [imageDurationSec, selectedImageIndexes, selectedScene]);

  const renderLines = useMemo(
    () => lines.filter((line) => images[line.image_index]),
    [lines, images]
  );

  const narrationScript = useMemo(
    () => resolveNarrationScript(scriptText, renderLines.map((line) => line.text).join(' ')),
    [renderLines, scriptText]
  );

  const transcriptDurationSec = scriptMetrics(narrationScript, voice, rate).readSeconds;
  const sceneDurationsSec = useMemo(
    () => computeSceneDurationsSec(exportDurationMode, renderLines, imageDurationSec, transcriptDurationSec),
    [exportDurationMode, renderLines, imageDurationSec, transcriptDurationSec]
  );
  const totalVideoSec = useMemo(
    () => totalExportDurationSec(exportDurationMode, sceneDurationsSec, transcriptDurationSec),
    [exportDurationMode, sceneDurationsSec, transcriptDurationSec]
  );
  const totalExportTextChars = narrationScript.length;
  const anyExportRunning = runningExportCount > 0;
  const activeJobIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeJobIdRef.current = activeJobId;
  }, [activeJobId]);

  const exportCtl = useStudioExport({
    jobs,
    setJobs,
    activeJobId,
    setActiveJobId,
    setNewJobId,
    activeJobIdRef,
    currentJob,
    anyExportRunning,
    hydrated,
    showToast,
    editorCacheRef,
    captureEditorSnapshot,
    setPreviewMode,
    topic,
    renderLines,
    images,
    sceneDurationsSec,
    imageDurationSec,
    narrationScript,
    totalVideoSec,
    totalExportTextChars,
    aspect,
    voice,
    fps,
    rate,
    resolution,
    videoQuality,
    outputFormat,
    ttsProvider,
    subtitleStyle,
    bgmVolume,
    bgm,
    videoNameTemplate,
    setDownloadBadgeVersion,
    downloadState,
    setDownloadState,
    downloadMessage,
    setDownloadMessage,
  });

  const {
    savedOutputFilenames,
    exportEstimateLabel,
    exportTimeModel,
    openJobOutput,
    openLatestJobOutput,
    triggerExportAndDownload,
    renderSpeedLabel,
    currentJobRunning,
    displayJobError,
  } = exportCtl;

  const { switchJob, newProject } = useStudioProjectTabs({
    activeJobIdRef,
    jobs,
    setJobs,
    activeJobId,
    setActiveJobId,
    setNewJobId,
    savedOutputFilenames,
    setDownloadState,
    setDownloadMessage,
    captureEditorSnapshot,
    applyEditorSnapshot,
    applyEmptyEditor,
    editorCacheRef,
    voice,
    aspect,
    rate,
    ttsProvider,
    fps,
    resolution,
    videoQuality,
    outputFormat,
    imageDurationSec,
    bgmVolume,
    subtitleStyle,
    setPreviewMode,
    setPreviewPlayhead,
  });

  useEffect(() => {
    const id = activeJobId;
    if (!id) return;
    const cached = editorCacheRef.current.get(id);
    if (!cached) return;
    editorCacheRef.current.set(id, { ...cached, downloadState, downloadMessage });
  }, [activeJobId, downloadState, downloadMessage]);

  /* ─── Derived ─── */
  const selectedLine = lines[selectedScene];
  const previewImg =
    selectedLine && images[selectedLine.image_index]
      ? images[selectedLine.image_index].url
      : null;
  const canRender =
    renderLines.length > 0 && canStartAnotherExport(jobs, concurrentLimit) && serverOk !== false;
  const selectedVoice = VOICE_OPTIONS.find((v) => v.id === voice) ?? VOICE_OPTIONS[0];
  const voicePreviewText = clampVoicePreviewText(
    selectedLine?.text.trim() ||
      scriptText.trim().slice(0, 200) ||
      topic.trim() ||
      'Hello, this is a voice preview in AutoVideo Studio.'
  );

  const sequenceScenes = useMemo(
    () =>
      lines
        .filter((l) => images[l.image_index])
        .map((l) => ({
          text: l.text,
          imageUrl: images[l.image_index].url,
          effect: l.effect,
          durationSec: l.durationSec ?? imageDurationSec,
          transition: l.transition ?? 'slide_left',
        })),
    [lines, images, imageDurationSec]
  );
  const canPreview = sequenceScenes.length > 0 && serverOk !== false;
  const hasExportedVideo = useMemo(
    () => jobs.some((j) => j.status === 'done' && j.output_url),
    [jobs]
  );
  const canOpenOutputFolder =
    hydrated && typeof window !== 'undefined' && Boolean(window.autovideo?.openOutputDirectory);

  useEffect(() => {
    setPreviewPlayhead(0);
    setSequenceTiming(null);
  }, [sequenceScenes, voice, rate]);

  const handlePreviewProgress = useCallback((elapsedSec: number) => {
    setPreviewPlayhead(elapsedSec);
  }, []);

  const handlePreviewTiming = useCallback((timing: SequenceTiming) => {
    setSequenceTiming(timing);
  }, []);

  return (
    <div className="studio-page">
      {/* Server status banner */}
      {serverOk === false && (
        <div className="mb-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-2 text-[11px] text-rose-200">
          {api.WORKER_URL ? (
            <>
              Worker is not running at <code className="font-mono">{api.WORKER_URL}</code>. Boot:{' '}
              <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono">
                cd worker &amp;&amp; .venv/Scripts/uvicorn main:app --port 8021
              </code>
            </>
          ) : (
            <>
              Worker URL is not configured. Set <code className="font-mono">NEXT_PUBLIC_WORKER_URL</code> in Vercel.
            </>
          )}
        </div>
      )}
      {/* TOP: Project tabs + render bar */}
      <div className="hub-card mb-3 overflow-hidden">
        <div className="flex items-stretch gap-0">
          <div className="flex-1 overflow-x-auto">
            <ProjectTabs
              jobs={jobs}
              activeId={activeJobId}
              newJobId={newJobId}
              savedOutputFilenames={savedOutputFilenames}
              downloadBadgeVersion={downloadBadgeVersion}
              onSelect={switchJob}
              onNew={newProject}
              onOpenOutput={openJobOutput}
              onClose={async (id) => {
                editorCacheRef.current.delete(id);
                removeJobSlot(id);
                await closeJobTab(id, {
                  activeJobId: activeJobIdRef.current,
                  onAfterClose: (nextJobs, nextActiveId) => {
                    setJobs(nextJobs);
                    if (activeJobIdRef.current === id) {
                      if (nextActiveId) switchJob(nextActiveId);
                      else {
                        setActiveJobId(null);
                        applyEmptyEditor();
                      }
                    }
                  },
                });
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid h-[50vh] min-h-[24rem] grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(17rem,0.85fr)] items-stretch gap-2">
        <section className="min-h-0">
          <div className="hub-card flex h-full min-h-0 flex-col overflow-hidden">
            <PanelHead
              icon={<Folder size={13} />}
              title="Image Library"
              count={images.length}
              compact
            />
            <ImageLibrary
              images={images}
              onAdd={addImages}
              onRemove={removeImage}
              selectedIndex={selectedImage}
              onSelect={setSelectedImage}
              selectedForRender={selectedImageIndexes}
              onAddToKeyframe={addImagesToKeyframe}
              imageDurationSec={imageDurationSec}
            />
          </div>
        </section>

        <section className="flex min-h-0 flex-col gap-2">
          <div className="hub-card h-[15rem] shrink-0 overflow-hidden">
            {currentJob?.status === 'done' &&
            durationMismatchMs != null &&
            durationMismatchMs > 2000 ? (
              <div className="flex items-center justify-between gap-2 border-b border-rose-400/30 bg-rose-500/15 px-3 py-1.5 text-[11px] text-rose-100">
                <span>
                  Duration mismatch: expected{' '}
                  {formatDuration((currentJob.expected_duration_ms ?? 0) / 1000)} but output is{' '}
                  {currentJob.output_duration_ms != null
                    ? formatDuration(currentJob.output_duration_ms / 1000)
                    : '—'}{' '}
                  (Δ {Math.round(durationMismatchMs / 1000)}s)
                </span>
                <button
                  type="button"
                  onClick={() => void probeCurrentJobOutput()}
                  disabled={probingOutput}
                  className="shrink-0 rounded-md border border-rose-300/30 bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-50 hover:bg-rose-500/30 disabled:opacity-40"
                >
                  {probingOutput ? 'Probing…' : 'Re-probe'}
                </button>
              </div>
            ) : null}
            {previewMode === 'sequence' && canPreview ? (
              <SequencePreview
                scenes={sequenceScenes}
                voice={voice}
                rate={rate}
                aspect={aspect}
                narrationText={narrationScript}
                autoPlay
                onClose={() => setPreviewMode('static')}
                onProgress={handlePreviewProgress}
                onTimingReady={handlePreviewTiming}
              />
            ) : (
              <div
                className="relative mx-auto grid h-full aspect-video max-w-full place-items-center overflow-hidden bg-black"
              >
                {currentJob?.status === 'done' && currentJob.output_url ? (
                  <video
                    key={currentJob.id}
                    src={api.resolveWorkerAssetUrl(api.outputUrl(currentJob.id))}
                    controls preload="metadata"
                    className="h-full"
                    style={{ maxWidth: '100%' }}
                  />
                ) : previewImg ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewImg}
                      alt="preview"
                      className="h-full"
                      style={{ maxWidth: '100%', objectFit: 'contain' }}
                    />
                    {selectedLine && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <div className="text-[9px] uppercase tracking-[0.2em] text-white/60">
                          Scene {String(selectedScene + 1).padStart(2, '0')} /{' '}
                          {String(lines.length).padStart(2, '0')}
                        </div>
                        <div className="mt-0.5 line-clamp-2 text-sm font-medium leading-tight text-white drop-shadow">
                          {selectedLine.text || '(empty dialogue)'}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-[var(--muted)]">
                    <PlayCircle size={28} className="mx-auto opacity-40" />
                  </div>
                )}
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[10px] text-white/80 backdrop-blur">
                  <Mic2 size={12} className="text-[var(--accent-2)]" />
                  <span className="font-semibold">{selectedVoice.label}</span>
                  <FlagBadge locale={selectedVoice.locale} />
                  <span className="text-white/45">{rate}</span>
                </div>
                <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 backdrop-blur">
                  <AudioPreview
                    src={api.voicePreviewUrl(voicePreviewText, voice, rate)}
                    label="Voice preview"
                    compact
                  />
                </div>
                {(!currentJob || currentJob.status === 'done' || currentJob.status === 'error') && canPreview && (
                  <button
                    type="button"
                    onClick={() => setPreviewMode('sequence')}
                    className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white shadow-[0_12px_36px_rgba(0,0,0,0.5)] ring-1 ring-white/20 backdrop-blur transition hover:scale-105 hover:bg-black/70"
                    aria-label="Preview video"
                    title="Preview video"
                  >
                    <Play size={28} className="translate-x-0.5 drop-shadow" fill="currentColor" />
                  </button>
                )}
                {(downloadState !== 'idle' || currentJobRunning) && (
                  <PreviewExportStatus
                    state={downloadState === 'idle' && currentJobRunning ? 'exporting' : downloadState}
                    message={
                      downloadState === 'idle' && currentJobRunning
                        ? `Exporting · ${currentJob?.progress ?? 0}%`
                        : downloadMessage
                    }
                    detail={currentJobRunning || downloadState === 'exporting' || downloadState === 'downloading' ? renderSpeedLabel : undefined}
                    progress={currentJob?.progress ?? (currentJobRunning ? 8 : 0)}
                  />
                )}
                {downloadState === 'idle' &&
                  !currentJobRunning &&
                  renderSpeedLabel &&
                  currentJob?.status === 'done' && (
                    <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/10 bg-black/55 px-2.5 py-1.5 text-[10px] text-white/60 backdrop-blur">
                      <span className="font-mono tabular-nums">{renderSpeedLabel}</span>
                    </div>
                  )}
                {downloadState === 'idle' && currentJob && currentJob.status !== 'done' && currentJob.status !== 'error' && (
                  <div className="absolute inset-x-0 bottom-0 bg-[var(--bg)]/90 px-3 py-2 backdrop-blur">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--accent-2)]" />
                      <span className="font-mono text-white/80">{currentJob.status}</span>
                      <span className="text-[var(--muted)]">{currentJob.message}</span>
                      <span className="ml-auto font-mono text-white">{currentJob.progress}%</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] transition-all"
                        style={{ width: `${currentJob.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                {currentJob?.status === 'error' && (
                  <div className="absolute inset-x-0 bottom-0 max-h-24 overflow-y-auto bg-[var(--danger)]/20 px-3 py-2 text-[11px] text-rose-200 backdrop-blur">
                    ⚠ {displayJobError}
                  </div>
                )}
              </div>
            )}
            {currentJob?.status === 'done' && currentJob.output_url && previewMode === 'static' && (
              <div className="flex items-center justify-between gap-2 border-t border-[var(--border-subtle)] px-3 py-1.5 text-[11px]">
                <span className="min-w-0 truncate font-mono text-[var(--muted)]">
                  ✓ {currentJob.id} · {currentJob.scenes_count} scenes · {currentJob.config.aspect}
                  <span
                    className={`ml-2 ${
                      durationMismatchMs != null && durationMismatchMs > 2000
                        ? 'text-rose-300'
                        : 'text-white/40'
                    }`}
                  >
                    Expected{' '}
                    {currentJob.expected_duration_ms != null
                      ? formatDuration(currentJob.expected_duration_ms / 1000)
                      : formatDuration(totalVideoSec)}{' '}
                    · Output{' '}
                    {currentJob.output_duration_ms != null
                      ? formatDuration(currentJob.output_duration_ms / 1000)
                      : '—'}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {currentJob.output_duration_ms == null ? (
                    <button
                      type="button"
                      onClick={() => void probeCurrentJobOutput()}
                      disabled={probingOutput}
                      className="rounded-md border border-white/10 bg-white/[.04] px-2 py-0.5 text-[10px] font-semibold text-white/70 hover:bg-white/[.08] disabled:opacity-40"
                    >
                      {probingOutput ? 'Probing…' : 'Re-probe'}
                    </button>
                  ) : null}
                  <a
                    href={api.resolveWorkerAssetUrl(api.outputUrl(currentJob.id))}
                    download={`${buildVideoFilename({
                      job: currentJob,
                      topic,
                      imagesCount: currentJob.scenes_count,
                      template: videoNameTemplate,
                    })}.${currentJob.config.output_format ?? 'mp4'}`}
                    className="text-[var(--accent-2)] hover:underline"
                  >
                    Download {(currentJob.config.output_format ?? 'mp4').toUpperCase()}
                  </a>
                </span>
              </div>
            )}
          </div>

          {/* Action bar between Preview and Script */}
          <div className="hub-card flex items-center justify-center gap-2 px-2 py-1">
            <button
              onClick={() => setPreviewMode('sequence')}
              disabled={!canPreview}
              className="studio-control studio-control--active inline-flex items-center gap-1 disabled:opacity-35"
              title="Client-side preview in the main frame, usually under 5 seconds"
            >
              <PlayCircle size={13} />
              Preview
            </button>
            <button
              onClick={triggerExportAndDownload}
              disabled={!canRender}
              title={
                slotsFull
                  ? `All ${concurrentLimit} export slot(s) busy — wait or switch tab`
                  : `Video ${formatDuration(totalVideoSec)} · Est ${exportEstimateLabel}${
                      exportTimeModel.sampleCount > 0 ? ` · learned×${exportTimeModel.sampleCount}` : ''
                    }`
              }
              className="studio-control inline-flex items-center gap-1 rounded-md border border-indigo-400/40 bg-indigo-500/20 px-3 text-[10px] font-semibold text-indigo-100 shadow-[0_10px_26px_rgba(99,102,241,0.18)] transition hover:bg-indigo-500/26 disabled:opacity-35"
            >
              {slotsFull ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Slots full ({runningExportCount}/{concurrentLimit})
                </>
              ) : (
                <>
                  <Download size={13} /> Export &amp; Download
                  <span className="font-mono text-[9px] font-normal text-indigo-200/70" suppressHydrationWarning>
                    {exportEstimateLabel}
                  </span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => openLatestJobOutput()}
              disabled={!canOpenOutputFolder || !hasExportedVideo}
              className={`studio-control inline-flex items-center gap-1 disabled:opacity-35 ${
                canOpenOutputFolder && hasExportedVideo
                  ? 'border-amber-300/30 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15'
                  : 'text-white/55'
              }`}
              title={
                !canOpenOutputFolder
                  ? 'Open file is only available in Desktop.'
                  : !hasExportedVideo
                  ? 'Export a video first.'
                  : 'Open latest exported video file'
              }
            >
              <FolderOpen
                size={13}
                className={canOpenOutputFolder && hasExportedVideo ? 'text-amber-300' : 'text-white/35'}
              />
              <span suppressHydrationWarning>Open file</span>
            </button>
          </div>

          {/* Script card */}
          <div className="hub-card flex min-h-[8.75rem] flex-1 flex-col overflow-hidden">
            <PanelHead
              icon={<FileText size={13} />}
              title="Script"
              count={lines.length}
              compact
              rightSlot={
                <span
                  className="rounded bg-white/[.04] px-1.5 py-0.5 font-mono text-[9px] text-[var(--accent-2)]"
                  suppressHydrationWarning
                >
                  {formatDuration(totalVideoSec)}
                </span>
              }
            />
            <ScriptPanel
              onApplyNarration={applyNarration}
              scriptText={scriptText}
              onScriptText={setScriptText}
              imagesCount={selectedImageIndexes.length}
              voice={voice}
              rate={rate}
            />
          </div>
        </section>

        <section className="min-h-0">
          <div className="hub-card flex h-full min-h-0 flex-col overflow-hidden">
            <div className="flex border-b border-[var(--border-subtle)] bg-black/10 p-1">
              <RightPanelTab
                active={rightPanel === 'voice'}
                icon={<Mic2 size={12} />}
                label="Voice"
                onClick={() => setRightPanel('voice')}
              />
              <RightPanelTab
                active={rightPanel === 'subtitle'}
                icon={<Subtitles size={12} />}
                label="Subtitle"
                onClick={() => setRightPanel('subtitle')}
              />
              <RightPanelTab
                active={rightPanel === 'music'}
                icon={<Music size={12} />}
                label="BGM"
                onClick={() => setRightPanel('music')}
              />
            </div>
            <div className="min-h-0 flex-1 overflow-hidden p-2">
              {rightPanel === 'voice' && (
              <VoiceSelector
                voice={voice}
                onVoice={setVoice}
                rate={rate}
                onRate={setRate}
                provider={ttsProvider}
                onProvider={setTtsProvider}
                previewText={voicePreviewText}
              />
              )}
              {rightPanel === 'subtitle' && (
                <SubtitlePanel value={subtitleStyle} onChange={setSubtitleStyle} />
              )}
              {rightPanel === 'music' && (
              <BGMPanel
                bgm={bgm}
                onSet={setBgm}
                onClear={() => setBgm(null)}
                volume={bgmVolume}
                onVolume={setBgmVolume}
              />
              )}
            </div>
          </div>
        </section>
      </div>

      {/* BOTTOM: keyframe timeline */}
      <div className="mt-3">
        <KeyframeTimeline
          lines={lines}
          images={images}
          selectedIndex={selectedScene}
          onSelectScene={setSelectedScene}
          onChangeEffect={changeEffect}
          onChangeTransition={changeTransition}
          onChangeDuration={changeDuration}
          onDuplicateScenes={duplicateScenes}
          onRemoveScenes={removeScenes}
          onReorderScenes={reorderScenes}
          imageDurationSec={imageDurationSec}
          onImageDurationSec={setImageDurationSec}
          exportDurationSec={totalVideoSec}
          onExportDurationSec={changeExportDuration}
          exportDurationMode={exportDurationMode}
          onExportDurationMode={(mode) => {
            setExportDurationMode(mode);
            writeStudioExportSettings({ ...readStudioExportSettings(), exportDurationMode: mode });
          }}
          transcriptDurationSec={transcriptDurationSec}
          narrationScript={narrationScript}
          playheadSec={previewPlayhead}
          audioDurations={sequenceTiming?.durations}
          waveforms={sequenceTiming?.waveforms}
        />
      </div>

      {toast.open && (
        <div className="fixed bottom-4 left-1/2 z-[300] -translate-x-1/2">
          <div className="flex max-w-[92vw] items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3 py-2 text-[11px] text-white shadow-2xl backdrop-blur">
            <span className="min-w-0 truncate text-white/85">{toast.text}</span>
            {toast.actionLabel ? (
              <button
                type="button"
                onClick={() => toastActionRef.current?.()}
                className="shrink-0 rounded-full border border-white/10 bg-white/[.06] px-2 py-1 text-[10px] font-semibold text-white/80 hover:bg-white/[.10]"
              >
                {toast.actionLabel}
              </button>
            ) : null}
            <button
              type="button"
              onClick={dismissToast}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-white/55 hover:bg-white/10 hover:text-white"
              aria-label="Dismiss"
              title="Dismiss"
            >
              <span className="text-[14px] leading-none">×</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

