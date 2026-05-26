'use client';
import { useMemo, useState } from 'react';
import { Clock, ImageIcon, Layers3, Maximize2, Wand2, ZoomIn } from 'lucide-react';
import type { LibraryImage } from './ImageLibrary';
import { EFFECT_OPTIONS, type Effect, type ScriptLine } from './ScriptPanel';

const EFFECTS_CYCLE: Effect[] = ['zoom_in', 'pan_right', 'zoom_out', 'pan_left'];

type ViewMode = 'storyboard' | 'dense';
type ZoomMode = 'fit' | '75' | '100' | '150' | '200';

export function KeyframeTimeline({
  lines,
  images,
  selectedIndex,
  onSelectScene,
  onChangeEffect,
  playheadSec = 0,
  audioDurations,
  waveforms,
}: {
  lines: ScriptLine[];
  images: LibraryImage[];
  selectedIndex: number;
  onSelectScene: (i: number) => void;
  onChangeEffect: (i: number, eff: Effect) => void;
  playheadSec?: number;
  audioDurations?: number[];
  waveforms?: number[][];
}) {
  const [view, setView] = useState<ViewMode>('storyboard');
  const [zoom, setZoom] = useState<ZoomMode>('fit');
  const hasContent = lines.length > 0;
  const estimatedDurations = useMemo(
    () => lines.map((l) => estimateDuration(l.text)),
    [lines]
  );
  const durations =
    audioDurations && audioDurations.length === lines.length
      ? audioDurations
      : estimatedDurations;
  const starts = useMemo(
    () => durations.map((_, i) => durations.slice(0, i).reduce((a, b) => a + b, 0)),
    [durations]
  );
  const total = durations.reduce((a, b) => a + b, 0) || 1;
  const selected = lines[selectedIndex];

  const effectOf = (i: number): Effect => {
    const effect = lines[i]?.effect;
    if (!effect || effect === 'auto') return EFFECTS_CYCLE[i % EFFECTS_CYCLE.length];
    return effect;
  };

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--panel)] shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
      <header className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <div>
            <div className="text-[9px] uppercase tracking-[0.22em] text-[var(--muted)]">Timeline</div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white">
              <Layers3 size={13} className="text-[var(--accent-2)]" />
              <span>{lines.length} scene</span>
              <span className="text-[var(--muted)]">·</span>
              <Clock size={12} className="text-[var(--muted)]" />
              <span className="font-mono">{fmtTime(total)}</span>
            </div>
          </div>
          {selected && (
            <div className="hidden rounded-lg border border-white/10 bg-white/[.03] px-2.5 py-1.5 text-[10px] text-[var(--muted)] md:block">
              Đang chọn <span className="font-mono text-white">S{selectedIndex + 1}</span>
              <span className="mx-1">·</span>
              <span>{effectLabel(effectOf(selectedIndex))}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-black/25 p-0.5 text-[10px]">
            {(['storyboard', 'dense'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setView(m)}
                className={`rounded-md px-2 py-1 capitalize transition ${
                  view === m
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--muted)] hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="hidden items-center gap-1 rounded-lg border border-white/10 bg-black/20 px-1 py-0.5 text-[10px] md:flex">
            <button
              onClick={() => setZoom('fit')}
              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${
                zoom === 'fit' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-white'
              }`}
              title="Auto fit timeline"
            >
              <Maximize2 size={10} /> Fit
            </button>
            {(['75', '100', '150', '200'] as const).map((z) => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={`rounded px-1.5 py-0.5 ${
                  zoom === z ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)] hover:text-white'
                }`}
                title={`Zoom ${z}%`}
              >
                {z}
              </button>
            ))}
            <ZoomIn size={10} className="text-[var(--muted)]" />
          </div>
          <div className="font-mono text-[10px] text-[var(--muted)]">
            {fmtTime(playheadSec)} / {fmtTime(total)}
          </div>
        </div>
      </header>

      <div className="p-3">
        {!hasContent ? (
          <div className="grid h-24 place-items-center rounded-lg border border-dashed border-white/10 bg-black/25 text-[11px] italic text-[var(--muted)]">
            Tạo script trước để xem timeline.
          </div>
        ) : (
          <div className="space-y-3">
            <TimeRuler total={total} playheadSec={playheadSec} />

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20 p-2">
              <div
                className={zoom === 'fit' ? 'grid w-full gap-2' : 'flex min-w-max gap-2'}
                style={zoom === 'fit' ? { gridTemplateColumns: `repeat(${lines.length}, minmax(140px, 1fr))` } : undefined}
              >
                {lines.map((line, i) => {
                  const image = images[line.image_index];
                  const effect = effectOf(i);
                  const active = i === selectedIndex;
                  const baseWidth = view === 'dense'
                    ? 132
                    : Math.max(180, Math.min(320, 150 + durations[i] * 18));
                  const width = zoom === 'fit'
                    ? undefined
                    : Math.round(baseWidth * (Number(zoom) / 100));
                  const waveform = waveforms?.[i] ?? pseudoWaveform(line.text, view === 'dense' ? 18 : 32);
                  return (
                    <button
                      key={i}
                      onClick={() => onSelectScene(i)}
                      className={`group relative overflow-hidden rounded-xl border text-left transition ${
                        active
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-[0_0_0_1px_rgba(99,102,241,0.35)]'
                          : 'border-white/10 bg-[var(--panel-2)] hover:border-[var(--accent)]/50'
                      }`}
                      style={width ? { width } : undefined}
                    >
                      <div className="flex gap-2 p-2">
                        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-black/40 ring-1 ring-white/10">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image.url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full place-items-center text-white/25">
                              <ImageIcon size={18} />
                            </div>
                          )}
                          <div className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-white">
                            S{i + 1}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 text-[10px] text-[var(--muted)]">
                            <span className="rounded bg-black/25 px-1 font-mono">{fmtTime(durations[i])}</span>
                            <span className="truncate">{effectLabel(effect)}</span>
                          </div>
                          <div className={`mt-1 text-[11px] leading-snug text-white ${view === 'dense' ? 'line-clamp-2' : 'line-clamp-3'}`}>
                            {line.text || '(chưa có lời thoại)'}
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-[9px] text-[var(--muted)]">
                            <ImageIcon size={10} />
                            <span>Ảnh #{line.image_index + 1}</span>
                            <span>·</span>
                            <span>{wordCount(line.text)} từ</span>
                          </div>
                        </div>
                      </div>
                      <div className="mx-2 mb-2 flex h-8 items-end gap-px rounded bg-black/25 px-1 py-1">
                        {waveform.map((v, idx) => (
                          <span
                            key={idx}
                            className="flex-1 rounded-t bg-[var(--accent-2)]/70"
                            style={{ height: `${Math.max(10, v * 100)}%` }}
                            title={waveforms?.[i] ? 'Waveform từ TTS preview' : 'Waveform ước lượng'}
                          />
                        ))}
                      </div>
                      <div className="h-1.5 bg-black/35">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]"
                          style={{ width: `${Math.max(8, (durations[i] / total) * 100)}%` }}
                        />
                      </div>
                      {active && <div className="absolute inset-x-0 top-0 h-0.5 bg-[var(--accent-2)]" />}
                      {playheadSec >= starts[i] && playheadSec <= starts[i] + durations[i] && (
                        <div
                          className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                          style={{ left: `${((playheadSec - starts[i]) / durations[i]) * 100}%` }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selected && (
              <div className="grid gap-3 rounded-xl border border-white/10 bg-black/20 p-3 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">
                    <Wand2 size={12} className="text-[var(--accent-2)]" />
                    Scene inspector
                  </div>
                  <div className="line-clamp-2 text-sm font-medium leading-snug text-white">
                    {selected.text || '(chưa có lời thoại)'}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-[var(--muted)]">
                    <span className="rounded bg-white/[.04] px-2 py-0.5">Start {fmtTime(starts[selectedIndex] ?? 0)}</span>
                    <span className="rounded bg-white/[.04] px-2 py-0.5">Duration {fmtTime(durations[selectedIndex] ?? 0)}</span>
                    <span className="rounded bg-white/[.04] px-2 py-0.5">
                      {audioDurations ? 'Audio timing thật' : 'Timing ước lượng'}
                    </span>
                    <span className="rounded bg-white/[.04] px-2 py-0.5">Image #{selected.image_index + 1}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1 md:max-w-md md:justify-end">
                  {EFFECT_OPTIONS.map((opt) => {
                    const active = (selected.effect ?? 'auto') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => onChangeEffect(selectedIndex, opt.id)}
                        className={`rounded-lg border px-2 py-1 text-[10px] transition ${
                          active
                            ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                            : 'border-white/10 bg-white/[.03] text-[var(--muted)] hover:text-white'
                        }`}
                      >
                        <span className="mr-1">{opt.icon}</span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function TimeRuler({ total, playheadSec }: { total: number; playheadSec: number }) {
  return (
    <div className="relative h-8 rounded-lg border border-white/10 bg-black/25">
      {Array.from({ length: 7 }).map((_, i) => {
        const x = (i / 6) * 100;
        return (
          <div key={i} className="absolute top-0 h-full border-l border-white/10" style={{ left: `${x}%` }}>
            <span className="ml-1 font-mono text-[9px] text-[var(--muted)]">
              {fmtTime((i / 6) * total)}
            </span>
          </div>
        );
      })}
      {playheadSec > 0 && (
        <div className="absolute top-0 h-full w-0.5 bg-white" style={{ left: `${Math.min(100, (playheadSec / total) * 100)}%` }}>
          <div className="absolute -left-1.5 top-0 h-3 w-3 rotate-45 bg-white" />
        </div>
      )}
    </div>
  );
}

function estimateDuration(text: string) {
  return Math.max(2, Math.min(12, text.trim().length * 0.055 + 1.2));
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function pseudoWaveform(text: string, samples: number) {
  const seed = text.length || 1;
  return Array.from({ length: samples }, (_, i) => {
    const value = Math.abs(
      Math.sin((i + seed) * 0.42) * 0.62 +
      Math.sin((i + seed) * 1.71) * 0.34
    );
    return Math.max(0.12, Math.min(1, value));
  });
}

function effectLabel(effect: Effect) {
  return EFFECT_OPTIONS.find((o) => o.id === effect)?.label ?? effect;
}

function fmtTime(sec: number) {
  const safe = Math.max(0, sec);
  const min = Math.floor(safe / 60);
  const remain = safe - min * 60;
  return `${String(min).padStart(2, '0')}:${remain.toFixed(1).padStart(4, '0')}`;
}
