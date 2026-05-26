'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles, Music, Subtitles, Smartphone,
  Folder, FileText, ChevronRight, PlayCircle, Mic2,
  Save,
} from 'lucide-react';
import * as api from '@/lib/api';
import type { Job, SubtitleStyle, ExportPreset } from '@/lib/api';
import { useAutoSave, loadDraft, clearDraft, timeAgo, type DraftState } from '@/lib/autosave';
import {
  saveImages, loadImages, saveBgm, loadBgm, clearAllFiles, summarizeFiles,
} from '@/lib/draft-files';
import {
  ProjectTabs,
  ImageLibrary,
  ScriptPanel,
  KeyframeTimeline,
  BGMPanel,
  SubtitlePanel,
  ExportPresets,
  VoiceSelector,
  VOICE_OPTIONS,
  SequencePreview,
  AudioPreview,
  type LibraryImage,
  type ScriptLine,
  type Effect,
  type SequenceTiming,
} from '@/components/studio';

type Aspect = '9:16' | '16:9' | '1:1';

export default function StudioPage() {
  /* ─── Jobs & connection ─── */
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [serverOk, setServerOk] = useState<boolean | null>(null);

  /* ─── Project doc state ─── */
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [lines, setLines] = useState<ScriptLine[]>([]);
  const [topic, setTopic] = useState('');
  const [selectedScene, setSelectedScene] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);

  /* ─── Config ─── */
  const [voice, setVoice] = useState('vi-VN-HoaiMyNeural');
  const [aspect, setAspect] = useState<Aspect>('9:16');
  const [rate, setRate] = useState('+0%');
  const [fps, setFps] = useState(30);
  const [bgm, setBgm] = useState<File | null>(null);
  const [bgmVolume, setBgmVolume] = useState(0.18);
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>('word_capcut');
  const [presetId, setPresetId] = useState<ExportPreset['id'] | null>('tiktok');

  /* ─── UX flags ─── */
  const [aiGenerating, setAiGenerating] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [previewMode, setPreviewMode] = useState<'static' | 'sequence'>('static');
  const [previewPlayhead, setPreviewPlayhead] = useState(0);
  const [sequenceTiming, setSequenceTiming] = useState<SequenceTiming | null>(null);
  const [exportExpanded, setExportExpanded] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState<DraftState | null>(null);
  const [draftFilesSummary, setDraftFilesSummary] = useState<{ images: number; bgm: boolean }>({ images: 0, bgm: false });
  const [hydrated, setHydrated] = useState(false);
  const [filesSavedAt, setFilesSavedAt] = useState<number | null>(null);

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

  /* ─── Detect draft (localStorage + IDB) on mount ─── */
  useEffect(() => {
    (async () => {
      const draft = loadDraft();
      try {
        const summary = await summarizeFiles();
        setDraftFilesSummary(summary);
        if ((draft && draft.lines.length > 0) || summary.images > 0 || summary.bgm) {
          setDraftAvailable(draft ?? null);
        }
      } catch {
        if (draft && draft.lines.length > 0) setDraftAvailable(draft);
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
      aspect,
      fps,
      bgmVolume,
      subtitleStyle,
      presetId,
      imagesCount: images.length,
      savedAt: new Date().toISOString(),
    }),
    [topic, lines, voice, rate, aspect, fps, bgmVolume, subtitleStyle, presetId, images.length]
  );
  // Only autosave AFTER initial hydration (avoid overwriting good draft with empty state).
  const savedAt = useAutoSave(hydrated ? draftState : ({ ...draftState, lines: lines } as DraftState));

  /* ─── Auto-save image blobs + BGM to IndexedDB (debounced 2s) ─── */
  useEffect(() => {
    if (!hydrated) return;
    // Skip if user is currently looking at restore banner — they haven't applied yet.
    if (draftAvailable) return;
    const id = setTimeout(async () => {
      try {
        await saveImages(images.map((im) => im.file));
        setFilesSavedAt(Date.now());
      } catch (e) {
        console.warn('[idb] saveImages failed:', e);
      }
    }, 2000);
    return () => clearTimeout(id);
  }, [images, hydrated, draftAvailable]);

  useEffect(() => {
    if (!hydrated) return;
    if (draftAvailable) return;
    const id = setTimeout(async () => {
      try {
        await saveBgm(bgm);
        setFilesSavedAt(Date.now());
      } catch (e) {
        console.warn('[idb] saveBgm failed:', e);
      }
    }, 2000);
    return () => clearTimeout(id);
  }, [bgm, hydrated, draftAvailable]);

  /* Restore actions */
  const applyDraft = useCallback(async () => {
    const d = draftAvailable;
    if (d) {
      setTopic(d.topic);
      setLines(d.lines);
      setVoice(d.voice);
      setRate(d.rate);
      setAspect(d.aspect);
      setFps(d.fps);
      setBgmVolume(d.bgmVolume);
      setSubtitleStyle(d.subtitleStyle);
      setPresetId(d.presetId);
    }
    // Restore images + bgm from IDB
    try {
      const restoredFiles = await loadImages();
      if (restoredFiles.length > 0) {
        const libItems: LibraryImage[] = restoredFiles.map((f) => ({
          file: f,
          url: URL.createObjectURL(f),
          used: false,
        }));
        setImages(libItems);
      }
      const restoredBgm = await loadBgm();
      if (restoredBgm) setBgm(restoredBgm);
    } catch (e) {
      console.warn('[restore] IDB load failed:', e);
    }
    setDraftAvailable(null);
  }, [draftAvailable]);

  const discardDraft = useCallback(async () => {
    clearDraft();
    try { await clearAllFiles(); } catch {}
    setDraftAvailable(null);
    setDraftFilesSummary({ images: 0, bgm: false });
  }, []);

  /* ─── Poll active job ─── */
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentJob = useMemo(
    () => jobs.find((j) => j.id === activeJobId) || null,
    [jobs, activeJobId]
  );
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
        }
      } catch {}
    }, 1500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeJobId, jobs]);

  /* ─── Image handlers ─── */
  const addImages = useCallback((files: FileList) => {
    const next: LibraryImage[] = Array.from(files).map((f) => ({
      file: f, url: URL.createObjectURL(f), used: false,
    }));
    setImages((prev) => [...prev, ...next]);
  }, []);
  const removeImage = useCallback((i: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, idx) => idx !== i);
    });
    setLines((prev) =>
      prev.filter((l) => l.image_index !== i).map((l) => ({
        ...l, image_index: l.image_index > i ? l.image_index - 1 : l.image_index,
      }))
    );
  }, []);
  useEffect(() => {
    setImages((prev) => {
      const usedSet = new Set(lines.map((l) => l.image_index));
      return prev.map((im, idx) => ({ ...im, used: usedSet.has(idx) }));
    });
  }, [lines]);

  /* ─── Script handlers ─── */
  const changeLine = (i: number, text: string) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, text } : l)));
  const addLine = () =>
    setLines((prev) => [
      ...prev,
      { text: '', image_index: Math.min(images.length - 1, prev.length) },
    ]);
  const removeLine = (i: number) =>
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  const changeEffect = (i: number, effect: Effect) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, effect } : l)));

  const aiGen = useCallback(() => {
    if (!topic.trim() || images.length === 0) return;
    setAiGenerating(true);
    setTimeout(() => {
      const n = images.length;
      const next: ScriptLine[] = [];
      next.push({ text: `Hôm nay, cùng khám phá: ${topic}.`, image_index: 0 });
      for (let i = 0; i < Math.max(0, n - 2); i++) {
        next.push({
          text: `Điểm ${i + 1}: ảnh này thể hiện một khía cạnh quan trọng — hãy chú ý chi tiết.`,
          image_index: i + 1,
        });
      }
      if (n >= 2) {
        next.push({
          text: 'Hy vọng bạn thấy nội dung hữu ích. Đừng quên like và theo dõi.',
          image_index: n - 1,
        });
      }
      setLines(next);
      setAiGenerating(false);
    }, 300);
  }, [topic, images.length]);

  /* ─── Render ─── */
  const startRender = useCallback(async () => {
    if (lines.length === 0 || images.length === 0) return;
    setRendering(true);
    try {
      const job = await api.createJob({
        scenes: lines.map((l) => ({
          text: l.text, image_index: l.image_index,
          effect: !l.effect || l.effect === 'auto' ? null : l.effect,
        })),
        config: {
          aspect, voice, fps, rate,
          subtitle_style: subtitleStyle,
          bgm_volume: bgmVolume,
          preset: presetId,
        },
        files: images.map((i) => i.file),
        bgm,
      });
      setJobs((prev) => [job, ...prev]);
      setActiveJobId(job.id);
      setPreviewMode('static');
    } catch (e: any) {
      alert(`Render lỗi: ${e?.message || e}`);
      setRendering(false);
    }
  }, [lines, images, aspect, voice, fps, rate, subtitleStyle, bgmVolume, presetId, bgm]);

  const switchJob = useCallback((id: string) => {
    setActiveJobId(id);
    setPreviewMode('static');
    setPreviewPlayhead(0);
  }, []);
  const newProject = useCallback(() => {
    images.forEach((im) => URL.revokeObjectURL(im.url));
    setImages([]); setLines([]); setTopic(''); setBgm(null); setActiveJobId(null);
    setPreviewMode('static'); setPreviewPlayhead(0); setSequenceTiming(null);
    clearDraft();
    clearAllFiles().catch(() => {});
  }, [images]);
  const pickPreset = useCallback((p: ExportPreset) => {
    setPresetId(p.id); setAspect(p.aspect); setFps(p.fps);
  }, []);

  /* ─── Derived ─── */
  const selectedLine = lines[selectedScene];
  const previewImg =
    selectedLine && images[selectedLine.image_index]
      ? images[selectedLine.image_index].url
      : null;
  const canRender = lines.length > 0 && images.length > 0 && !rendering && serverOk !== false;
  const activePreset = api.EXPORT_PRESETS.find((p) => p.id === presetId);
  const selectedVoice = VOICE_OPTIONS.find((v) => v.id === voice) ?? VOICE_OPTIONS[0];
  const voicePreviewText =
    selectedLine?.text.trim() ||
    topic.trim() ||
    'Xin chào, đây là bản nghe thử giọng đọc trong AutoVideo Studio.';

  const sequenceScenes = useMemo(
    () =>
      lines
        .filter((l) => l.text.trim() && images[l.image_index])
        .map((l) => ({
          text: l.text,
          imageUrl: images[l.image_index].url,
          effect: l.effect,
        })),
    [lines, images]
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
    <>
      {/* Restore draft banner — gate behind hydrated to avoid SSR mismatch */}
      {hydrated && draftAvailable !== null && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-2.5 text-[11px]">
          <Save size={14} className="shrink-0 text-[var(--accent-2)]" />
          <div className="flex-1">
            <div className="font-medium text-white">
              Phục hồi session cũ
              {draftAvailable && ` · ${draftAvailable.lines.length} scenes`}
              {draftFilesSummary.images > 0 && ` · ${draftFilesSummary.images} ảnh`}
              {draftFilesSummary.bgm && ' · BGM'}
            </div>
            <div className="text-[10px] text-[var(--muted)]">
              {draftAvailable && (
                <>Lưu lần cuối: {new Date(draftAvailable.savedAt).toLocaleString('vi-VN')} · </>
              )}
              Tất cả ảnh + BGM khôi phục đầy đủ (IndexedDB)
            </div>
          </div>
          <button
            onClick={applyDraft}
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-[11px] font-semibold text-white hover:brightness-110"
          >
            Phục hồi
          </button>
          <button
            onClick={discardDraft}
            className="rounded-md border border-[var(--border-subtle)] px-3 py-1.5 text-[11px] text-[var(--muted)] hover:bg-white/[.04] hover:text-white"
          >
            Bỏ qua
          </button>
        </div>
      )}

      {/* Server status banner */}
      {serverOk === false && (
        <div className="mb-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-2 text-[11px] text-rose-200">
          ⚠ Worker chưa chạy tại <code className="font-mono">{api.WORKER_URL}</code>. Boot:{' '}
          <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono">
            cd worker &amp;&amp; .venv/Scripts/uvicorn main:app --port 8021
          </code>
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
            {hydrated && (
              <SaveIndicator savedAt={Math.max(savedAt ?? 0, filesSavedAt ?? 0) || null} />
            )}
            <button
              onClick={() => setPreviewMode('sequence')}
              disabled={!canPreview}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-2 text-xs font-semibold text-[var(--accent-2)] transition hover:bg-[var(--accent)]/20 disabled:opacity-30"
              title="Preview client-side ngay trong khung chính — < 5s"
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
                  Đang render…
                </>
              ) : (
                <>
                  <Sparkles size={13} /> Render MP4
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* BODY: 3-pane full screen */}
      <div className="grid grid-cols-12 gap-2">
        {/* LEFT 3: Library + Scenes mini — compact */}
        <aside className="col-span-3 space-y-2">
          <div className="hub-card flex flex-col">
            <PanelHead icon={<Folder size={13} />} title="Thư viện ảnh" count={images.length} compact />
            <ImageLibrary
              images={images}
              onAdd={addImages}
              onRemove={removeImage}
              selectedIndex={selectedImage}
              onSelect={setSelectedImage}
            />
          </div>

          {lines.length > 0 && (
            <div className="hub-card">
              <PanelHead icon={<ChevronRight size={13} />} title="Scenes" count={lines.length} compact />
              <div className="max-h-44 space-y-0.5 overflow-y-auto p-1.5">
                {lines.map((l, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedScene(i)}
                    className={`flex w-full items-center gap-1.5 rounded p-1 text-left transition ${
                      i === selectedScene
                        ? 'bg-[var(--accent)]/15 ring-1 ring-[var(--accent)]/40'
                        : 'hover:bg-white/[.03]'
                    }`}
                  >
                    <span className="w-4 text-right font-mono text-[9px] text-[var(--muted)]">{i + 1}</span>
                    <div
                      className="h-5 w-8 shrink-0 rounded ring-1 ring-white/10"
                      style={{
                        background: images[l.image_index]
                          ? `url(${images[l.image_index].url}) center/cover`
                          : '#222',
                      }}
                    />
                    <div className="min-w-0 flex-1 line-clamp-1 text-[10px]">{l.text || '(empty)'}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* CENTER 6: Preview + Script */}
        <main className="col-span-6 space-y-2">
          {/* Preview card — 3 modes: sequence canvas / job video / static image */}
          <div className="hub-card overflow-hidden">
            {previewMode === 'sequence' && canPreview ? (
              <SequencePreview
                scenes={sequenceScenes}
                voice={voice}
                rate={rate}
                aspect={aspect}
                onClose={() => setPreviewMode('static')}
                onProgress={handlePreviewProgress}
                onTimingReady={handlePreviewTiming}
              />
            ) : (
              <div
                className="relative grid place-items-center overflow-hidden bg-black"
                style={{ height: 'clamp(240px, 40vh, 360px)' }}
              >
                {currentJob?.status === 'done' && currentJob.output_url ? (
                  <video
                    key={currentJob.id}
                    src={`${api.WORKER_URL}${currentJob.output_url}`}
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
                          {selectedLine.text || '(chưa có lời thoại)'}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-[var(--muted)]">
                    <PlayCircle size={28} className="mx-auto opacity-40" />
                    <div className="mt-1.5 text-sm">Upload ảnh → gen script → preview ngay tại đây</div>
                  </div>
                )}
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[10px] text-white/80 backdrop-blur">
                  <Mic2 size={12} className="text-[var(--accent-2)]" />
                  <span className="font-semibold">{selectedVoice.label}</span>
                  <span className="font-mono text-white/45">{selectedVoice.locale}</span>
                  <span className="text-white/45">{rate}</span>
                </div>
                <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 backdrop-blur">
                  <AudioPreview
                    src={api.voicePreviewUrl(voicePreviewText, voice, rate)}
                    label="Nghe giọng"
                    compact
                  />
                </div>
                {(!currentJob || currentJob.status === 'done' || currentJob.status === 'error') && (
                  <div className="absolute inset-x-0 bottom-3 flex justify-center">
                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-2 py-1.5 backdrop-blur">
                      <button
                        onClick={() => setPreviewMode('sequence')}
                        disabled={!canPreview}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:brightness-110 disabled:opacity-30"
                      >
                        <PlayCircle size={12} /> Preview video
                      </button>
                      <button
                        onClick={startRender}
                        disabled={!canRender}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-30"
                      >
                        <Sparkles size={12} /> Render MP4
                      </button>
                    </div>
                  </div>
                )}
                {currentJob && currentJob.status !== 'done' && currentJob.status !== 'error' && (
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
                  href={`${api.WORKER_URL}${currentJob.output_url}`}
                  download={`${currentJob.id}.mp4`}
                  className="text-[var(--accent-2)] hover:underline"
                >
                  ⬇ Download MP4
                </a>
              </div>
            )}
          </div>

          {/* Script card */}
          <div className="hub-card">
            <PanelHead
              icon={<FileText size={13} />}
              title="Kịch bản"
              count={lines.length}
              compact
            />
            <ScriptPanel
              lines={lines}
              selectedIndex={selectedScene}
              onChange={changeLine}
              onSelect={setSelectedScene}
              onAddLine={addLine}
              onRemoveLine={removeLine}
              onAIGen={aiGen}
              aiTopic={topic}
              onTopicChange={setTopic}
              aiGenerating={aiGenerating}
              imagesCount={images.length}
              voice={voice}
              rate={rate}
            />
          </div>
        </main>

        {/* RIGHT 3: Voice / Subtitle / BGM / Export — ALL DIRECT, compact */}
        <aside className="col-span-3 space-y-2">
          <div className="hub-card">
            <PanelHead icon={<Mic2 size={13} />} title="Giọng đọc" compact />
            <div className="p-2">
              <VoiceSelector
                voice={voice}
                onVoice={setVoice}
                rate={rate}
                onRate={setRate}
                previewText={voicePreviewText}
              />
            </div>
          </div>

          <div className="hub-card">
            <PanelHead
              icon={<Subtitles size={13} />}
              title="Phụ đề"
              compact
            />
            <div className="p-2">
              <SubtitlePanel value={subtitleStyle} onChange={setSubtitleStyle} />
            </div>
          </div>

          <div className="hub-card">
            <PanelHead
              icon={<Music size={13} />}
              title="Nhạc nền"
              compact
              rightSlot={
                bgm && (
                  <span className="rounded bg-[var(--panel-2)] px-1.5 py-0 font-mono text-[9px] text-[var(--accent-2)]">
                    {Math.round(bgmVolume * 100)}%
                  </span>
                )
              }
            />
            <div className="p-2">
              <BGMPanel
                bgm={bgm}
                onSet={setBgm}
                onClear={() => setBgm(null)}
                volume={bgmVolume}
                onVolume={setBgmVolume}
              />
            </div>
          </div>

          {/* Export — collapsed chip by default, click to expand */}
          <div className="hub-card">
            <button
              onClick={() => setExportExpanded((v) => !v)}
              className="flex w-full items-center justify-between border-b border-[var(--border-subtle)] px-3 py-2 hover:bg-white/[.02]"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white">
                <span className="text-[var(--accent-2)]"><Smartphone size={13} /></span>
                Export
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-[var(--panel-2)] px-1.5 py-0 font-mono text-[9px] text-[var(--accent-2)]">
                  {activePreset?.label.split(' ')[0] ?? `${aspect}`} · {fps}fps
                </span>
                <span className={`text-[var(--muted)] transition-transform ${exportExpanded ? 'rotate-90' : ''}`}>
                  <ChevronRight size={12} />
                </span>
              </div>
            </button>
            {exportExpanded && (
              <div className="p-2 space-y-1.5">
                <ExportPresets activeId={presetId} onPick={pickPreset} />
                <div className="flex gap-1 text-[10px]">
                  <select
                    value={aspect}
                    onChange={(e) => { setAspect(e.target.value as Aspect); setPresetId(null); }}
                    className="flex-1 rounded border border-[var(--border-subtle)] bg-[var(--panel-2)] px-1.5 py-0.5 text-white"
                  >
                    <option value="9:16">9:16</option>
                    <option value="16:9">16:9</option>
                    <option value="1:1">1:1</option>
                  </select>
                  <select
                    value={fps}
                    onChange={(e) => setFps(Number(e.target.value))}
                    className="w-16 rounded border border-[var(--border-subtle)] bg-[var(--panel-2)] px-1.5 py-0.5 text-white"
                  >
                    <option value={24}>24fps</option>
                    <option value={30}>30fps</option>
                    <option value={60}>60fps</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* BOTTOM: keyframe timeline */}
      <div className="mt-3">
        <KeyframeTimeline
          lines={lines}
          images={images}
          selectedIndex={selectedScene}
          onSelectScene={setSelectedScene}
          onChangeEffect={changeEffect}
          playheadSec={previewPlayhead}
          audioDurations={sequenceTiming?.durations}
          waveforms={sequenceTiming?.waveforms}
        />
      </div>

    </>
  );
}

/* ─── Helpers ─── */
function PanelHead({
  icon, title, count, rightSlot, compact = false,
}: { icon: React.ReactNode; title: string; count?: number; rightSlot?: React.ReactNode; compact?: boolean }) {
  return (
    <div className={`flex items-center justify-between border-b border-[var(--border-subtle)] ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'}`}>
      <div className={`flex items-center gap-1.5 font-semibold text-white ${compact ? 'text-[10.5px]' : 'text-[11px]'}`}>
        <span className="text-[var(--accent-2)]">{icon}</span>
        {title}
        {typeof count === 'number' && (
          <span className="rounded-full bg-[var(--panel-2)] px-1.5 py-0 font-mono text-[9px] text-[var(--muted)]">
            {count}
          </span>
        )}
      </div>
      {rightSlot}
    </div>
  );
}

/** Subtle live indicator showing latest auto-save time. */
function SaveIndicator({ savedAt }: { savedAt: number | null }) {
  const [, force] = useState(0);
  // Re-render every 10s so the relative label refreshes.
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 10_000);
    return () => clearInterval(id);
  }, []);
  if (!savedAt) {
    return (
      <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-[var(--muted)]" title="Chưa có thay đổi để save">
        <Save size={11} /> idle
      </span>
    );
  }
  return (
    <span
      className="hidden md:inline-flex items-center gap-1 text-[10px] text-[var(--accent-2)]"
      title={`Auto-saved · ${new Date(savedAt).toLocaleString('vi-VN')}`}
    >
      <Save size={11} /> saved {timeAgo(savedAt)}
    </span>
  );
}

