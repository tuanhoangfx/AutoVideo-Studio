'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles, Settings2, Music, Subtitles, Smartphone,
  Folder, FileText, ChevronRight, PlayCircle, Mic2,
  Save, Trash2,
} from 'lucide-react';
import * as api from '@/lib/api';
import type { Job, SubtitleStyle, ExportPreset } from '@/lib/api';
import { useAutoSave, loadDraft, clearDraft, timeAgo, type DraftState } from '@/lib/autosave';
import {
  ProjectTabs,
  ImageLibrary,
  ScriptPanel,
  KeyframeTimeline,
  BGMPanel,
  SubtitlePanel,
  ExportPresets,
  Modal,
  VoiceSelector,
  SequencePreview,
  type LibraryImage,
  type ScriptLine,
  type Effect,
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
  const [allSettingsOpen, setAllSettingsOpen] = useState(false);
  const [exportExpanded, setExportExpanded] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState<DraftState | null>(null);
  const [hydrated, setHydrated] = useState(false);

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

  /* ─── Detect localStorage draft on mount ─── */
  useEffect(() => {
    const draft = loadDraft();
    if (draft && draft.lines.length > 0) {
      setDraftAvailable(draft);
    }
    setHydrated(true);
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

  /* Restore actions */
  const applyDraft = useCallback(() => {
    const d = draftAvailable;
    if (!d) return;
    setTopic(d.topic);
    setLines(d.lines);
    setVoice(d.voice);
    setRate(d.rate);
    setAspect(d.aspect);
    setFps(d.fps);
    setBgmVolume(d.bgmVolume);
    setSubtitleStyle(d.subtitleStyle);
    setPresetId(d.presetId);
    setDraftAvailable(null);
  }, [draftAvailable]);

  const discardDraft = useCallback(() => {
    clearDraft();
    setDraftAvailable(null);
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
  }, []);
  const newProject = useCallback(() => {
    images.forEach((im) => URL.revokeObjectURL(im.url));
    setImages([]); setLines([]); setTopic(''); setBgm(null); setActiveJobId(null);
    clearDraft();
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

  return (
    <>
      {/* Restore draft banner */}
      {draftAvailable && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-2.5 text-[11px]">
          <Save size={14} className="shrink-0 text-[var(--accent-2)]" />
          <div className="flex-1">
            <div className="font-medium text-white">
              Có draft cũ ({draftAvailable.lines.length} scenes · {draftAvailable.imagesCount} ảnh)
            </div>
            <div className="text-[10px] text-[var(--muted)]">
              Lưu lần cuối: {new Date(draftAvailable.savedAt).toLocaleString('vi-VN')} ·
              Ảnh + BGM cần upload lại (file không persist được)
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
            <SaveIndicator savedAt={savedAt} />
            <button
              onClick={() => setAllSettingsOpen(true)}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] text-[var(--muted)] hover:bg-white/[.04] hover:text-white transition"
              title="Mở tất cả settings trong 1 modal"
            >
              <Settings2 size={13} className="text-[var(--accent-2)]" />
              All settings
            </button>
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
                    <div className="mt-1.5 text-sm">Upload ảnh → gen script → bấm Preview</div>
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
              <VoiceSelector voice={voice} onVoice={setVoice} rate={rate} onRate={setRate} />
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
        />
      </div>

      {/* ─── ALL-IN-ONE SETTINGS MODAL (backup, mở khi cần full focus) ─── */}
      <Modal open={allSettingsOpen} onClose={() => setAllSettingsOpen(false)} title="⚙ Tất cả settings" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <SettingSection title="📱 Export preset">
              <ExportPresets activeId={presetId} onPick={pickPreset} />
            </SettingSection>
            <SettingSection title="💬 Phụ đề">
              <SubtitlePanel value={subtitleStyle} onChange={setSubtitleStyle} />
            </SettingSection>
          </div>
          <div className="space-y-3">
            <SettingSection title="🎤 Giọng đọc">
              <VoiceSelector voice={voice} onVoice={setVoice} rate={rate} onRate={setRate} />
            </SettingSection>
            <SettingSection title="🎵 BGM">
              <BGMPanel bgm={bgm} onSet={setBgm} onClear={() => setBgm(null)} volume={bgmVolume} onVolume={setBgmVolume} />
            </SettingSection>
          </div>
        </div>
      </Modal>
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

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--panel-2)]/50 p-3">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{title}</div>
      {children}
    </div>
  );
}
