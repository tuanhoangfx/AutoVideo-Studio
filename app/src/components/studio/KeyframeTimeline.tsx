'use client';
import { useState } from 'react';
import type { LibraryImage } from './ImageLibrary';
import { EFFECT_OPTIONS, type Effect, type ScriptLine } from './ScriptPanel';

const EFFECTS_CYCLE: Effect[] = ['zoom_in', 'pan_right', 'zoom_out', 'pan_left'];

type ViewMode = 'compact' | 'full' | 'waveform';

export function KeyframeTimeline({
  lines,
  images,
  selectedIndex,
  onSelectScene,
  onChangeEffect,
  playheadSec = 0,
}: {
  lines: ScriptLine[];
  images: LibraryImage[];
  selectedIndex: number;
  onSelectScene: (i: number) => void;
  onChangeEffect: (i: number, eff: Effect) => void;
  playheadSec?: number;
}) {
  const hasContent = lines.length > 0;
  const [view, setView] = useState<ViewMode>('full');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Estimated duration: 0.07s/char + 1s base, clamped 2-12s
  const durations = lines.map((l) =>
    Math.max(2, Math.min(12, l.text.length * 0.07 + 1))
  );
  const total = durations.reduce((a, b) => a + b, 0) || 1;

  // Effective effect (auto-cycle if undefined or 'auto')
  const effectOf = (i: number): Effect => {
    const e = lines[i]?.effect;
    if (!e || e === 'auto') return EFFECTS_CYCLE[i % EFFECTS_CYCLE.length];
    return e;
  };

  // Stable pseudo-waveform amplitudes from text length
  const waveOf = (i: number, samples: number): number[] => {
    const text = lines[i]?.text ?? '';
    const seed = text.length || 1;
    return Array.from({ length: samples }, (_, k) => {
      const v = Math.abs(Math.sin((k + seed) * 0.41) * 0.6 + Math.sin((k + seed) * 1.7) * 0.35);
      return Math.max(0.15, Math.min(1, v));
    });
  };

  return (
    <section className="rounded-xl border border-white/10 bg-white/[.04] backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">
            Timeline · Keyframes
          </span>
          {hasContent && (
            <div className="flex gap-0.5 rounded bg-black/30 p-0.5 text-[9px]">
              {(['compact', 'full', 'waveform'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setView(m)}
                  className={`rounded px-1.5 py-0.5 transition ${
                    view === m
                      ? 'bg-white/15 text-white'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-white/60">
          <span>
            {fmtTime(playheadSec)} / {fmtTime(total)}
          </span>
          <div className="flex gap-1">
            {['⏮', '⏪', '▸', '⏩', '⏭'].map((b) => (
              <button
                key={b}
                className="grid h-5 w-5 place-items-center rounded text-white/70 hover:bg-white/10"
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-2">
        {!hasContent ? (
          <div className="grid h-20 place-items-center rounded-md bg-black/30 text-[11px] italic text-white/40">
            Tạo script trước để xem timeline.
          </div>
        ) : (
          <>
            {/* Time ruler */}
            <div className="relative h-4 rounded-t bg-black/40 ring-1 ring-white/10">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full border-l border-white/10"
                  style={{ left: `${(i / 6) * 100}%` }}
                >
                  <span className="ml-1 font-mono text-[8px] text-white/40">
                    {fmtTime((i / 6) * total)}
                  </span>
                </div>
              ))}
            </div>

            {/* Scene clips (size depends on view mode) */}
            <div
              className={`relative bg-black/30 ring-1 ring-white/10 ${
                view === 'compact' ? 'h-10' : view === 'waveform' ? 'h-20' : 'h-16'
              }`}
            >
              {lines.map((l, i) => {
                const cum = durations.slice(0, i).reduce((a, b) => a + b, 0);
                const w = durations[i];
                const img = images[l.image_index];
                const isSel = i === selectedIndex;
                const isHover = i === hoverIdx;
                const eff = effectOf(i);
                const effIcon = EFFECT_OPTIONS.find((o) => o.id === eff)?.icon ?? '';
                return (
                  <button
                    key={i}
                    onClick={() => onSelectScene(i)}
                    onMouseEnter={() => setHoverIdx(i)}
                    onMouseLeave={() => setHoverIdx(null)}
                    className={`group absolute top-0.5 bottom-0.5 cursor-pointer overflow-hidden rounded-sm text-left ring-1 transition ${
                      isSel ? 'ring-2 ring-pink-400 z-10' : 'ring-white/20 hover:ring-white/40'
                    }`}
                    style={{
                      left: `${(cum / total) * 100}%`,
                      width: `calc(${(w / total) * 100}% - 1px)`,
                      background: img ? `url(${img.url}) center/cover` : '#222',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
                    {/* Top row: scene # + effect */}
                    <div className="absolute inset-x-1 top-0.5 flex items-center justify-between">
                      <span className="font-mono text-[8px] font-bold text-white drop-shadow">
                        S{i + 1}
                      </span>
                      <span className="font-mono text-[8px] text-white/80 drop-shadow">
                        {effIcon}
                      </span>
                    </div>
                    {/* Waveform overlay */}
                    {view === 'waveform' && (
                      <div className="absolute inset-x-1 bottom-3 top-4 flex items-end gap-px">
                        {waveOf(i, Math.max(20, Math.floor((w / total) * 200))).map(
                          (v, k) => (
                            <div
                              key={k}
                              className="flex-1 bg-pink-300/70"
                              style={{ height: `${v * 100}%` }}
                            />
                          )
                        )}
                      </div>
                    )}
                    {/* Bottom row: duration */}
                    <div className="absolute inset-x-1 bottom-0">
                      <div className="flex items-center justify-between">
                        {view !== 'compact' && (
                          <span className="line-clamp-1 text-[8px] text-white/70 drop-shadow">
                            {l.text.slice(0, 20)}
                          </span>
                        )}
                        <span className="ml-auto font-mono text-[8px] text-white drop-shadow">
                          {w.toFixed(1)}s
                        </span>
                      </div>
                    </div>
                    {/* Hover tooltip */}
                    {isHover && (
                      <div className="pointer-events-none absolute left-0 top-0 z-20 -translate-y-full whitespace-nowrap rounded bg-black/90 px-2 py-1 text-[10px] text-white shadow-lg ring-1 ring-white/10">
                        <div>Scene {i + 1} · {w.toFixed(1)}s · {effIcon} {eff}</div>
                        <div className="text-white/60">{l.text}</div>
                      </div>
                    )}
                  </button>
                );
              })}
              {/* Playhead */}
              {playheadSec > 0 && (
                <div
                  className="pointer-events-none absolute top-0 h-full w-0.5 bg-white z-20"
                  style={{ left: `${(playheadSec / total) * 100}%` }}
                >
                  <div className="absolute -top-1 -left-1.5 h-3 w-3 rotate-45 bg-white" />
                </div>
              )}
            </div>

            {/* Keyframe markers track */}
            <div className="relative h-5 rounded-b bg-black/40 ring-1 ring-white/10">
              <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
              {lines.flatMap((_, i) => {
                const cum = durations.slice(0, i).reduce((a, b) => a + b, 0);
                const x1 = (cum / total) * 100;
                const x2 = ((cum + durations[i]) / total) * 100;
                return [
                  <div
                    key={`${i}-a`}
                    className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-pink-300 bg-pink-500"
                    style={{ left: `${x1}%` }}
                    title={`keyframe start · scene ${i + 1}`}
                  />,
                  <div
                    key={`${i}-b`}
                    className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-pink-300 bg-pink-500/60"
                    style={{ left: `${x2}%` }}
                    title={`keyframe end · scene ${i + 1}`}
                  />,
                ];
              })}
            </div>

            {/* Selected scene inspector — effect selector */}
            {selectedIndex >= 0 && selectedIndex < lines.length && (
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                <span className="text-[10px] uppercase tracking-wider text-white/40">
                  Scene {selectedIndex + 1} · effect
                </span>
                <div className="flex flex-wrap gap-1">
                  {EFFECT_OPTIONS.map((opt) => {
                    const active = (lines[selectedIndex].effect ?? 'auto') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => onChangeEffect(selectedIndex, opt.id)}
                        className={`rounded px-2 py-0.5 text-[10px] transition ${
                          active
                            ? 'bg-white text-black'
                            : 'border border-white/10 bg-white/[.02] text-white/70 hover:bg-white/[.06]'
                        }`}
                      >
                        <span className="mr-1">{opt.icon}</span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <div className="ml-auto font-mono text-[10px] text-white/50">
                  Auto = {effectOf(selectedIndex)} (cycle)
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function fmtTime(sec: number) {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = (s - m * 60).toFixed(1);
  return `${String(m).padStart(2, '0')}:${r.padStart(4, '0')}`;
}
