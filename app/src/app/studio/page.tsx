'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Download, Loader2, Music, Subtitles,
  Folder, FileText, Play, PlayCircle, Mic2,
} from 'lucide-react';
import * as api from '@/lib/api';
import type { Job, SubtitleStyle, TTSProvider } from '@/lib/api';
import { useAutoSave, clearDraft, type DraftState } from '@/lib/autosave';
import {
  saveImages, saveBgm, clearAllFiles, summarizeFiles,
} from '@/lib/draft-files';
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
  STUDIO_EXPORT_SETTINGS_EVENT,
  type StudioExportSettings,
} from '@/lib/studio-export-settings';
import { saveBlobToStudioDirectory, triggerBrowserDownload } from '@/lib/studio-download-target';
import { scriptMetrics } from '@/lib/script-metrics';

type Aspect = '9:16' | '16:9' | '1:1';
type RightPanel = 'voice' | 'subtitle' | 'music';
type DownloadState = 'idle' | 'exporting' | 'downloading' | 'downloaded' | 'error';
type DownloadRecord = {
  id: string;
  filename: string;
  url: string;
  target: string;
  size: number;
  at: number;
};

export default function StudioPage() {
  /* ─── Jobs & connection ─── */
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [serverOk, setServerOk] = useState<boolean | null>(null);

  /* ─── Project doc state ─── */
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [lines, setLines] = useState<ScriptLine[]>([]);
  const [scriptText, setScriptText] = useState('');
  const [scriptTexts, setScriptTexts] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [selectedScene, setSelectedScene] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedImageIndexes, setSelectedImageIndexes] = useState<number[]>([]);

  /* ─── Config ─── */
  const [voice, setVoice] = useState('vi-VN-HoaiMyNeural');
  const [aspect, setAspect] = useState<Aspect>(() => readStudioExportSettings().aspect);
  const [rate, setRate] = useState('+0%');
  const [ttsProvider, setTtsProvider] = useState<TTSProvider>('edge');
  const [fps, setFps] = useState(() => readStudioExportSettings().fps);
  const [resolution, setResolution] = useState(() => readStudioExportSettings().resolution);
  const [videoQuality, setVideoQuality] = useState(() => readStudioExportSettings().videoQuality);
  const [outputFormat, setOutputFormat] = useState(() => readStudioExportSettings().outputFormat);
  const [autoDownload, setAutoDownload] = useState(() => readStudioExportSettings().autoDownload);
  const [downloadDirectoryName, setDownloadDirectoryName] = useState(() => readStudioExportSettings().downloadDirectoryName);
  const [imageDurationSec, setImageDurationSec] = useState(5);
  const [bgm, setBgm] = useState<File | null>(null);
  const [bgmVolume, setBgmVolume] = useState(0.18);
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>('word_capcut');

  /* ─── UX flags ─── */
  const [rendering, setRendering] = useState(false);
  const [previewMode, setPreviewMode] = useState<'static' | 'sequence'>('static');
  const [rightPanel, setRightPanel] = useState<RightPanel>('voice');
  const [previewPlayhead, setPreviewPlayhead] = useState(0);
  const [sequenceTiming, setSequenceTiming] = useState<SequenceTiming | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const [downloadMessage, setDownloadMessage] = useState('');
  const [downloadHistory, setDownloadHistory] = useState<DownloadRecord[]>([]);
  const autoDownloadedJobsRef = useRef<Set<string>>(new Set());

  /* ─── Connect server + load jobs ─── */
  useEffect(() => {
    (async () => {
      try {
        await api.getRoot();
        setServerOk(true);
        setJobs(await api.listJobs());
      } catch {
        setServerOk(false);
      }
    })();
  }, []);

  useEffect(() => {
    const apply = (settings: StudioExportSettings) => {
      setAspect(settings.aspect);
      setFps(settings.fps);
      setResolution(settings.resolution);
      setVideoQuality(settings.videoQuality);
      setOutputFormat(settings.outputFormat);
      setAutoDownload(settings.autoDownload);
      setDownloadDirectoryName(settings.downloadDirectoryName);
    };
    apply(readStudioExportSettings());
    const onSettings = (event: Event) => {
      apply((event as CustomEvent<StudioExportSettings>).detail ?? DEFAULT_STUDIO_EXPORT_SETTINGS);
    };
    window.addEventListener(STUDIO_EXPORT_SETTINGS_EVENT, onSettings);
    return () => window.removeEventListener(STUDIO_EXPORT_SETTINGS_EVENT, onSettings);
  }, []);

  /* ─── Detect draft (localStorage + IDB) on mount ─── */
  useEffect(() => {
    (async () => {
      try {
        await summarizeFiles();
      } catch {
        // Ignore old draft prompt in the compact Studio layout.
      }
      setHydrated(true);
    })();
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

  /* ─── Poll active job ─── */
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentJob = useMemo(
    () => jobs.find((j) => j.id === activeJobId) || null,
    [jobs, activeJobId]
  );
  const downloadJobOutput = useCallback(async (job: Job) => {
    if (!job.output_url || autoDownloadedJobsRef.current.has(job.id)) return;
    autoDownloadedJobsRef.current.add(job.id);
    const settings = readStudioExportSettings();
    if (!settings.autoDownload) {
      setDownloadState('downloaded');
      setDownloadMessage('Export ready. Auto-download is off.');
      return;
    }
    setDownloadState('downloading');
    setDownloadMessage(settings.downloadDirectoryName ? `Saving to ${settings.downloadDirectoryName}...` : 'Preparing browser download...');
    try {
      const outputUrl = api.resolveWorkerAssetUrl(job.output_url);
      const response = await fetch(outputUrl);
      if (!response.ok) throw new Error(`Download failed: ${response.status}`);
      const blob = await response.blob();
      const ext = job.config.output_format ?? outputFormat ?? 'mp4';
      const filename = `${job.id}.${ext}`;
      const savedToFolder = await saveBlobToStudioDirectory(filename, blob);
      if (!savedToFolder) triggerBrowserDownload(filename, blob);
      setDownloadState('downloaded');
      setDownloadMessage(savedToFolder ? `Saved ${filename}` : `Downloaded ${filename}`);
      setDownloadHistory((prev) => [
        {
          id: job.id,
          filename,
          url: outputUrl,
          target: savedToFolder ? (readStudioExportSettings().downloadDirectoryName ?? 'Selected folder') : 'Browser downloads',
          size: blob.size,
          at: Date.now(),
        },
        ...prev.filter((item) => item.id !== job.id),
      ].slice(0, 4));
    } catch (e: any) {
      autoDownloadedJobsRef.current.delete(job.id);
      setDownloadState('error');
      setDownloadMessage(e?.message || 'Download failed.');
    }
  }, [outputFormat]);

  useEffect(() => {
    if (!activeJobId) return;
    const j = jobs.find((x) => x.id === activeJobId);
    if (!j || j.status === 'done' || j.status === 'error') return;
    pollRef.current = setInterval(async () => {
      try {
        const updated = await api.getJob(activeJobId);
        setJobs((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
        if (updated.status === 'done' || updated.status === 'error') {
          setRendering(false);
          if (pollRef.current) clearInterval(pollRef.current);
          if (updated.status === 'done') {
            void downloadJobOutput(updated);
          } else {
            setDownloadState('error');
            setDownloadMessage(updated.error || 'Export failed.');
          }
        }
      } catch {}
    }, 1500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeJobId, downloadJobOutput, jobs]);

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
  const applyBulkScript = useCallback((texts: string[]) => {
    setScriptTexts(texts);
    const targetIndexes = selectedImageIndexes.length > 0
      ? selectedImageIndexes
      : images.map((_, index) => index);
    if (selectedImageIndexes.length === 0 && targetIndexes.length > 0) {
      setSelectedImageIndexes(targetIndexes);
    }
    setLines((prev) => buildSceneLines(targetIndexes, prev, imageDurationSec, texts, true));
    setSelectedScene(0);
    setSelectedImage(targetIndexes[0] ?? 0);
    setPreviewMode('static');
    setPreviewPlayhead(0);
    setSequenceTiming(null);
  }, [imageDurationSec, images, selectedImageIndexes]);
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
    const nextIndexes = indexes.filter((index) => images[index] && !selectedImageIndexes.includes(index));
    if (nextIndexes.length === 0) return;
    setSelectedImageIndexes((prev) => [...prev, ...nextIndexes]);
    setSelectedScene(selectedImageIndexes.length);
    setSelectedImage(nextIndexes[0]);
  }, [images, selectedImageIndexes]);
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
    setLines((prev) => buildSceneLines(selectedImageIndexes, prev, imageDurationSec, scriptTexts));
    setSelectedScene((prev) => Math.max(0, Math.min(prev, Math.max(0, selectedImageIndexes.length - 1))));
    setSelectedImage(selectedImageIndexes[selectedScene] ?? selectedImageIndexes[0] ?? 0);
  }, [imageDurationSec, scriptTexts, selectedImageIndexes, selectedScene]);

  const renderLines = useMemo(
    () => lines.filter((line) => images[line.image_index]),
    [lines, images]
  );

  /* ─── Render ─── */
  const startRender = useCallback(async () => {
    if (renderLines.length === 0) return;
    setRendering(true);
    setDownloadState('exporting');
    setDownloadMessage('Exporting video...');
    try {
      const job = await api.createJob({
        scenes: renderLines.map((l, order) => ({
          text: l.text,
          image_index: order,
          duration_ms: Math.max(1, l.durationSec ?? imageDurationSec) * 1000,
          transition: l.transition ?? 'slide_left',
          effect: !l.effect || l.effect === 'auto' ? null : l.effect,
        })),
        config: {
          aspect, voice, fps, rate,
          resolution,
          video_quality: videoQuality,
          output_format: outputFormat,
          tts_provider: ttsProvider,
          subtitle_style: subtitleStyle,
          bgm_volume: bgmVolume,
        },
        files: renderLines.map((line) => images[line.image_index].file),
        bgm,
      });
      setJobs((prev) => [job, ...prev]);
      setActiveJobId(job.id);
      setPreviewMode('static');
    } catch (e: any) {
      alert(`Export failed: ${e?.message || e}`);
      setDownloadState('error');
      setDownloadMessage(e?.message || 'Export failed.');
      setRendering(false);
    }
  }, [renderLines, imageDurationSec, images, aspect, voice, fps, resolution, videoQuality, outputFormat, rate, ttsProvider, subtitleStyle, bgmVolume, bgm]);

  const switchJob = useCallback((id: string) => {
    setActiveJobId(id);
    setPreviewMode('static');
    setPreviewPlayhead(0);
    setDownloadState('idle');
    setDownloadMessage('');
  }, []);
  const newProject = useCallback(() => {
    images.forEach((im) => URL.revokeObjectURL(im.url));
    setImages([]); setLines([]); setTopic(''); setBgm(null); setActiveJobId(null);
    setScriptText(''); setScriptTexts([]);
    setSelectedImageIndexes([]);
    setPreviewMode('static'); setPreviewPlayhead(0); setSequenceTiming(null);
    setDownloadState('idle'); setDownloadMessage('');
    clearDraft();
    clearAllFiles().catch(() => {});
  }, [images]);
  /* ─── Derived ─── */
  const selectedLine = lines[selectedScene];
  const previewImg =
    selectedLine && images[selectedLine.image_index]
      ? images[selectedLine.image_index].url
      : null;
  const totalVideoSec = renderLines.reduce((sum, line) => sum + (line.durationSec ?? imageDurationSec), 0);
  const transcriptDurationSec = scriptMetrics(
    scriptText || renderLines.map((line) => line.text).join('\n'),
    voice,
    rate
  ).readSeconds;
  const canRender = renderLines.length > 0 && !rendering && serverOk !== false;
  const selectedVoice = VOICE_OPTIONS.find((v) => v.id === voice) ?? VOICE_OPTIONS[0];
  const voicePreviewText =
    selectedLine?.text.trim() ||
    topic.trim() ||
    'Hello, this is a voice preview in AutoVideo Studio.';

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
              onSelect={switchJob}
              onNew={newProject}
            />
          </div>
          <div className="flex items-center gap-2 border-l border-[var(--border-subtle)] px-3">
            <button
              onClick={() => setPreviewMode('sequence')}
              disabled={!canPreview}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-2 text-xs font-semibold text-[var(--accent-2)] transition hover:bg-[var(--accent)]/20 disabled:opacity-30"
              title="Client-side preview in the main frame, usually under 5 seconds"
            >
              <PlayCircle size={13} /> Preview
            </button>
            <button
              onClick={startRender}
              disabled={!canRender}
              className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold"
            >
              {rendering ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={13} /> Export & Download
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid h-[50vh] min-h-[24rem] grid-cols-3 items-stretch gap-2">
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
          <div className="hub-card h-[17rem] shrink-0 overflow-hidden">
            {previewMode === 'sequence' && canPreview ? (
              <SequencePreview
                scenes={sequenceScenes}
                voice={voice}
                rate={rate}
                aspect={aspect}
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
                    src={api.resolveWorkerAssetUrl(currentJob.output_url)}
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
                {(downloadState !== 'idle' || rendering) && (
                  <PreviewExportStatus
                    state={downloadState}
                    message={downloadMessage}
                    progress={currentJob?.progress ?? (rendering ? 8 : 0)}
                  />
                )}
                {downloadHistory.length > 0 && (downloadState === 'idle' || downloadState === 'downloaded') && (
                  <PreviewDownloadHistory records={downloadHistory} />
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
                  <div className="absolute inset-x-0 bottom-0 bg-[var(--danger)]/20 px-3 py-2 text-[11px] text-rose-200 backdrop-blur">
                    ⚠ {currentJob.error}
                  </div>
                )}
              </div>
            )}
            {currentJob?.status === 'done' && currentJob.output_url && previewMode === 'static' && (
              <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-3 py-1.5 text-[11px]">
                <span className="font-mono text-[var(--muted)]">
                  ✓ {currentJob.id} · {currentJob.scenes_count} scenes · {currentJob.config.aspect}
                </span>
                <a
                  href={api.resolveWorkerAssetUrl(currentJob.output_url)}
                  download={`${currentJob.id}.${currentJob.config.output_format ?? 'mp4'}`}
                  className="text-[var(--accent-2)] hover:underline"
                >
                  Download {(currentJob.config.output_format ?? 'mp4').toUpperCase()}
                </a>
              </div>
            )}
          </div>

          {/* Script card */}
          <div className="hub-card flex min-h-[8.75rem] flex-1 flex-col overflow-hidden">
            <PanelHead
              icon={<FileText size={13} />}
              title="Script"
              count={lines.length}
              compact
              rightSlot={
                <span className="rounded bg-white/[.04] px-1.5 py-0.5 font-mono text-[9px] text-[var(--accent-2)]">
                  {formatDuration(totalVideoSec)}
                </span>
              }
            />
            <ScriptPanel
              onBulkScript={applyBulkScript}
              scriptText={scriptText}
              onScriptText={setScriptText}
              onScriptLines={setScriptTexts}
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
          transcriptDurationSec={transcriptDurationSec}
          playheadSec={previewPlayhead}
          audioDurations={sequenceTiming?.durations}
          waveforms={sequenceTiming?.waveforms}
        />
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function PanelHead({
  icon, title, count, rightSlot, compact = false,
}: { icon: React.ReactNode; title: string; count?: number; rightSlot?: React.ReactNode; compact?: boolean }) {
  return (
    <div className={`flex items-center justify-between border-b border-[var(--border-subtle)] ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'}`}>
      <div className="studio-panel-label">
        <span className="studio-panel-label-icon">{icon}</span>
        {title}
        {typeof count === 'number' && (
          <span className="studio-panel-count">
            {count}
          </span>
        )}
      </div>
      {rightSlot}
    </div>
  );
}

function RightPanelTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition ${
        active
          ? 'bg-[var(--accent)] text-white'
          : 'text-white/45 hover:bg-white/[.04] hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function PreviewExportStatus({
  state,
  message,
  progress,
}: {
  state: DownloadState;
  message: string;
  progress: number;
}) {
  const isBusy = state === 'exporting' || state === 'downloading';
  const label =
    state === 'downloading'
      ? 'Downloading'
      : state === 'downloaded'
      ? 'Downloaded'
      : state === 'error'
      ? 'Export issue'
      : 'Exporting';
  const pct = state === 'downloaded' ? 100 : state === 'downloading' ? 100 : Math.max(5, Math.min(100, progress));
  return (
    <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/10 bg-black/70 p-2 text-white shadow-2xl backdrop-blur">
      <div className="mb-1.5 flex items-center gap-2 text-[11px]">
        {isBusy ? <Loader2 size={13} className="animate-spin text-[var(--accent-2)]" /> : null}
        <span className="font-semibold">{label}</span>
        <span className="min-w-0 flex-1 truncate text-white/55">{message}</span>
        <span className="font-mono text-[10px] text-white/70">{Math.round(pct)}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${
            state === 'error'
              ? 'bg-rose-400'
              : state === 'downloaded'
              ? 'bg-emerald-400'
              : 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function PreviewDownloadHistory({ records }: { records: DownloadRecord[] }) {
  return (
    <div className="absolute bottom-3 right-3 w-52 overflow-hidden rounded-2xl border border-white/10 bg-black/60 text-[10px] text-white shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/10 px-2 py-1.5">
        <span className="font-semibold">Download History</span>
        <span className="font-mono text-white/35">{records.length}</span>
      </div>
      <div className="max-h-24 overflow-auto p-1">
        {records.map((record) => (
          <div key={record.id} className="rounded-lg px-1.5 py-1 hover:bg-white/[.05]">
            <a
              href={record.url}
              download={record.filename}
              className="block truncate font-mono text-[9px] text-[var(--accent-2)] hover:underline"
            >
              {record.filename}
            </a>
            <div className="mt-0.5 flex items-center justify-between gap-2 text-[8px] text-white/45">
              <span className="truncate">{record.target}</span>
              <span className="shrink-0">{formatExportTime(record.at)} · {formatBytes(record.size)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function sourceFolderName(file: File) {
  const relativePath = 'webkitRelativePath' in file ? file.webkitRelativePath : '';
  const [folderName] = relativePath.split(/[\\/]/);
  return folderName || undefined;
}

function buildSceneLines(
  imageIndexes: number[],
  existing: ScriptLine[],
  durationSec: number,
  nextTexts?: string[],
  forceTexts = false
): ScriptLine[] {
  return imageIndexes.map((imageIndex, order) => {
    const current =
      existing[order]?.image_index === imageIndex
        ? existing[order]
        : existing.find((line) => line.image_index === imageIndex);
    return {
      text: forceTexts ? (nextTexts?.[order] ?? '') : (current?.text ?? nextTexts?.[order] ?? ''),
      image_index: imageIndex,
      durationSec,
      effect: current?.effect ?? 'none',
      transition: current?.transition ?? 'slide_left',
    };
  });
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return items;
  if (fromIndex >= items.length || toIndex >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function formatDuration(totalSec: number) {
  const safe = Math.max(0, Math.round(totalSec));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainMinutes = minutes % 60;
    return `${hours}h${String(remainMinutes).padStart(2, '0')}m`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatExportTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

