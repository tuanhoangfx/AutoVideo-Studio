'use client';

/**
 * Client-side full-video preview WITHOUT rendering on server.
 * Renders INLINE inside the preview card (not modal).
 *
 * Pipeline:
 *   1. Fetch per-scene TTS MP3 via /voices/preview (cached server-side by SHA-1)
 *   2. Decode all MP3s into AudioBuffers via Web Audio API
 *   3. Schedule playback in sequence using BufferSource.start(when)
 *   4. Parallel: canvas draws current image with Ken Burns + crossfade transition
 *      synced to elapsed time
 *
 * Cost: ~3-5s loading vs 30-60s server render. Quality lower (no BGM duck,
 * no subtitle burn-in) — just rough motion preview to validate timing & flow.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, Square, Loader2, AlertCircle, RotateCcw, X } from 'lucide-react';
import { voicePreviewUrl } from '@/lib/api';
import { TRANSITION_S, resolveAutoEffect } from '@/lib/pipeline-constants';

import type { SequenceScene, SequenceTiming } from '@/types/studio';

export type { SequenceScene, SequenceTiming } from '@/types/studio';

type Status = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';

export function SequencePreview({
  scenes,
  voice,
  rate,
  aspect,
  narrationText,
  onClose,
  onProgress,
  onTimingReady,
  autoPlay = false,
}: {
  scenes: SequenceScene[];
  voice: string;
  rate: string;
  aspect: '9:16' | '16:9' | '1:1';
  /** Full narration script (Paste Full Script) when scene lines have no per-image text. */
  narrationText?: string;
  onClose?: () => void;
  onProgress?: (elapsedSec: number) => void;
  onTimingReady?: (timing: SequenceTiming) => void;
  autoPlay?: boolean;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loadProgress, setLoadProgress] = useState({ done: 0, total: scenes.length });
  const [currentScene, setCurrentScene] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<AudioBuffer[]>([]);
  const narrationBufferRef = useRef<AudioBuffer | null>(null);
  const singleNarrationRef = useRef(false);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const startTimeRef = useRef<number>(0);
  const sceneStartsRef = useRef<number[]>([]);
  const totalRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number>(0);
  const drawFrameRef = useRef<(e: number) => void>(() => {});
  const loopRef = useRef<() => void>(() => {});
  const lastProgressEmitRef = useRef(-1);
  const autoStartedRef = useRef(false);

  /** Internal aspect-driven canvas resolution. Display element scales via CSS. */
  const canvasSize = useMemo<[number, number]>(() => {
    if (aspect === '9:16') return [540, 960];
    if (aspect === '1:1') return [720, 720];
    return [960, 540];
  }, [aspect]);

  // ─── Preload ────────────────────────────────────────────────────────
  const preload = useCallback(async () => {
    setStatus('loading');
    setError(null);
    setWarnings([]);
    setLoadProgress({ done: 0, total: scenes.length });
    try {
      const ctx =
        ctxRef.current ||
        new (window.AudioContext || (window as any).webkitAudioContext)();
      ctxRef.current = ctx;

      const nextWarnings: string[] = [];
      const narration = narrationText?.trim() ?? '';
      const hasPerSceneText = scenes.some((s) => s.text.trim());
      singleNarrationRef.current = Boolean(narration && !hasPerSceneText);
      narrationBufferRef.current = null;

      let buffers: AudioBuffer[];

      if (singleNarrationRef.current) {
        const sceneDur = (s: SequenceScene) => Math.max(0.5, s.durationSec ?? estimateDurationSec(s.text));
        try {
          const url = voicePreviewUrl(narration, voice, rate);
          const resp = await fetch(url);
          if (!resp.ok) throw new Error(`tts ${resp.status}`);
          const ab = await resp.arrayBuffer();
          narrationBufferRef.current = await ctx.decodeAudioData(ab);
        } catch {
          nextWarnings.push('Narration preview failed — video timing only (no voice).');
          narrationBufferRef.current = null;
        }
        buffers = scenes.map((s) => makeSilentBuffer(ctx, sceneDur(s)));
        setLoadProgress({ done: scenes.length, total: scenes.length });
      } else {
        buffers = await Promise.all(
          scenes.map(async (s, i) => {
            const slotSec = Math.max(0.5, s.durationSec ?? estimateDurationSec(s.text));
            if (!s.text.trim()) {
              setLoadProgress((p) => ({ ...p, done: p.done + 1 }));
              return makeSilentBuffer(ctx, slotSec);
            }
            const url = voicePreviewUrl(s.text, voice, rate);
            try {
              const resp = await fetch(url);
              if (!resp.ok) throw new Error(`tts ${resp.status}`);
              const ab = await resp.arrayBuffer();
              const buf = await ctx.decodeAudioData(ab);
              setLoadProgress((p) => ({ ...p, done: p.done + 1 }));
              return buf;
            } catch {
              nextWarnings.push(`Scene ${i + 1}: voice preview failed, using estimated timing.`);
              setLoadProgress((p) => ({ ...p, done: p.done + 1 }));
              return makeSilentBuffer(ctx, slotSec);
            }
          })
        );
      }

      buffersRef.current = buffers;
      setWarnings(nextWarnings);
      const durations = buffers.map((b) => b.duration);
      const waveforms = buffers.map((b) => bufferToWaveform(b, 40));

      const images = await Promise.all(
        scenes.map(
          (s) =>
            new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolve(img);
              img.onerror = () => reject(new Error(`image load failed: ${s.imageUrl.slice(0, 40)}`));
              img.src = s.imageUrl;
            })
        )
      );
      imagesRef.current = images;

      let cum = 0;
      const starts: number[] = [];
      for (const s of scenes) {
        starts.push(cum);
        cum += Math.max(0.5, s.durationSec ?? 5);
      }
      sceneStartsRef.current = starts;
      totalRef.current = singleNarrationRef.current
        ? Math.max(cum, narrationBufferRef.current?.duration ?? 0)
        : cum;
      pausedAtRef.current = 0;
      lastProgressEmitRef.current = -1;
      onProgress?.(0);
      onTimingReady?.({ durations, waveforms, total: cum });

      // First frame so users see something immediately
      requestAnimationFrame(() => drawFrameRef.current(0));

      setStatus('ready');
    } catch (e: any) {
      setError(e?.message || String(e));
      setStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrationText, onProgress, onTimingReady, scenes, voice, rate]);

  // ─── Play / Pause / Stop ────────────────────────────────────────────
  const play = useCallback(() => {
    const ctx = ctxRef.current;
    const buffers = buffersRef.current;
    if (!ctx || buffers.length === 0) return;

    sourcesRef.current.forEach((s) => {
      try { s.stop(); } catch {}
    });
    sourcesRef.current = [];
    if (ctx.state === 'suspended') void ctx.resume();

    const offset = pausedAtRef.current;
    startTimeRef.current = ctx.currentTime - offset;

    if (singleNarrationRef.current && narrationBufferRef.current) {
      const src = ctx.createBufferSource();
      src.buffer = narrationBufferRef.current;
      src.connect(ctx.destination);
      const playDuration = Math.min(
        narrationBufferRef.current.duration,
        Math.max(0, totalRef.current - offset)
      );
      if (playDuration > 0) {
        src.start(ctx.currentTime, Math.min(offset, narrationBufferRef.current.duration - 0.05));
      }
      sourcesRef.current.push(src);
    } else {
      buffers.forEach((buf, i) => {
        const sceneStart = sceneStartsRef.current[i];
        const sceneEnd = sceneStart + buf.duration;
        if (sceneEnd <= offset) return;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        if (sceneStart >= offset) {
          src.start(startTimeRef.current + sceneStart);
        } else {
          const inSceneOffset = offset - sceneStart;
          src.start(ctx.currentTime, inSceneOffset);
        }
        sourcesRef.current.push(src);
      });
    }

    setStatus('playing');
    loopRef.current();
  }, []);

  const pause = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    sourcesRef.current.forEach((s) => {
      try { s.stop(); } catch {}
    });
    sourcesRef.current = [];
    pausedAtRef.current = ctx.currentTime - startTimeRef.current;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setStatus('paused');
  }, []);

  const stop = useCallback(() => {
    sourcesRef.current.forEach((s) => {
      try { s.stop(); } catch {}
    });
    sourcesRef.current = [];
    pausedAtRef.current = 0;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setElapsed(0);
    setCurrentScene(0);
    lastProgressEmitRef.current = -1;
    onProgress?.(0);
    setStatus('ready');
    requestAnimationFrame(() => drawFrameRef.current(0));
  }, [onProgress]);

  // ─── Frame draw ─────────────────────────────────────────────────────
  const drawFrame = useCallback(
    (e: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const cnvCtx = canvas.getContext('2d');
      if (!cnvCtx) return;
      const starts = sceneStartsRef.current;
      const buffers = buffersRef.current;
      if (starts.length === 0 || buffers.length === 0) return;

      // Find current scene
      let idx = starts.length - 1;
      for (let i = 0; i < starts.length; i++) {
        if (e < starts[i]) {
          idx = i - 1;
          break;
        }
      }
      idx = Math.max(0, idx);

      const sceneStart = starts[idx];
      const sceneDur =
        idx + 1 < starts.length ? starts[idx + 1] - sceneStart : totalRef.current - sceneStart;
      const sceneT = e - sceneStart;
      const progress = Math.min(1, sceneT / sceneDur);
      const effect = resolveAutoEffect(scenes[idx].effect, idx);

      // Detect transition zone: last TRANSITION_S of current scene
      const remaining = sceneDur - sceneT;
      const inCrossfade = remaining < TRANSITION_S && idx < scenes.length - 1;
      const img = imagesRef.current[idx];
      const transition = resolveTransition(scenes[idx].transition, idx);

      // Reset
      cnvCtx.globalAlpha = 1;
      cnvCtx.clearRect(0, 0, canvas.width, canvas.height);
      cnvCtx.fillStyle = '#000';
      cnvCtx.fillRect(0, 0, canvas.width, canvas.height);

      if (inCrossfade) {
        const fadeProgress = (TRANSITION_S - remaining) / TRANSITION_S; // 0 → 1
        const nextIdx = idx + 1;
        const nextImg = imagesRef.current[nextIdx];
        const nextEffect = resolveAutoEffect(scenes[nextIdx]?.effect, nextIdx);
        if ((transition === 'slide_left' || transition === 'slide_right') && img && nextImg) {
          const direction = transition === 'slide_left' ? -1 : 1;
          cnvCtx.save();
          cnvCtx.translate(direction * fadeProgress * canvas.width, 0);
          drawKenBurns(cnvCtx, canvas, img, progress, effect);
          cnvCtx.restore();
          cnvCtx.save();
          cnvCtx.translate(-direction * (1 - fadeProgress) * canvas.width, 0);
          drawKenBurns(cnvCtx, canvas, nextImg, 0, nextEffect);
          cnvCtx.restore();
        } else {
          cnvCtx.globalAlpha = transition === 'cut' ? 1 : 1 - fadeProgress;
          if (img && (transition !== 'cut' || fadeProgress < 0.5)) drawKenBurns(cnvCtx, canvas, img, progress, effect);
          if (nextImg && (transition !== 'cut' || fadeProgress >= 0.5)) {
            cnvCtx.globalAlpha = transition === 'cut' ? 1 : fadeProgress;
            drawKenBurns(cnvCtx, canvas, nextImg, transition === 'zoom' ? fadeProgress : 0, nextEffect);
          }
        }
        cnvCtx.globalAlpha = 1;
        // Caption: crossfade text too
        if (fadeProgress < 0.5) {
          drawCaption(cnvCtx, canvas, scenes[idx].text, 1 - fadeProgress * 2);
        } else {
          drawCaption(cnvCtx, canvas, scenes[nextIdx]?.text ?? '', (fadeProgress - 0.5) * 2);
        }
      } else {
        if (img) drawKenBurns(cnvCtx, canvas, img, progress, effect);
        drawCaption(cnvCtx, canvas, scenes[idx].text, 1);
      }

      setCurrentScene(idx);
    },
    [scenes]
  );

  const loop = useCallback(() => {
    const ctxAudio = ctxRef.current;
    if (!ctxAudio) return;
    const e = ctxAudio.currentTime - startTimeRef.current;
    const total = totalRef.current;
    if (e >= total) {
      pausedAtRef.current = 0;
      setElapsed(total);
      onProgress?.(total);
      drawFrame(total - 0.001);
      setStatus('ended');
      return;
    }
    setElapsed(e);
    if (Math.abs(e - lastProgressEmitRef.current) >= 0.05) {
      lastProgressEmitRef.current = e;
      onProgress?.(e);
    }
    drawFrame(e);
    rafRef.current = requestAnimationFrame(loop);
  }, [drawFrame, onProgress]);

  useEffect(() => {
    drawFrameRef.current = drawFrame;
    loopRef.current = loop;
  }, [drawFrame, loop]);

  // ─── Lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    preload();
    return () => {
      sourcesRef.current.forEach((s) => {
        try { s.stop(); } catch {}
      });
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!autoPlay || autoStartedRef.current || status !== 'ready') return;
    autoStartedRef.current = true;
    play();
  }, [autoPlay, play, status]);

  // ─── UI ─────────────────────────────────────────────────────────────
  const total = totalRef.current;
  const pct = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0;

  return (
    <div className="flex h-full flex-col">
      <div
        className="relative mx-auto grid min-h-0 flex-1 aspect-video w-full max-w-[420px] place-items-center overflow-hidden bg-black"
      >
        <canvas
          ref={canvasRef}
          width={canvasSize[0]}
          height={canvasSize[1]}
          className="block"
          style={{
            height: '100%',
            aspectRatio: `${canvasSize[0]} / ${canvasSize[1]}`,
            maxWidth: '100%',
          }}
        />
        {/* Top-right close */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white/80 backdrop-blur hover:bg-black/80 hover:text-white"
          >
            <X size={14} />
          </button>
        )}

        {/* Status overlays */}
        {status === 'loading' && (
          <Overlay>
            <Loader2 className="animate-spin" size={28} />
            <div className="mt-2 text-sm">Loading voice {loadProgress.done}/{loadProgress.total}</div>
            <div className="mt-2 h-1 w-40 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]"
                style={{ width: `${(loadProgress.done / loadProgress.total) * 100}%` }}
              />
            </div>
          </Overlay>
        )}
        {status === 'ready' && !autoPlay && (
          <Overlay>
            <button
              onClick={play}
              className="grid h-14 w-14 place-items-center rounded-full bg-black/60 text-white shadow-[0_10px_30px_rgba(0,0,0,0.45)] ring-1 ring-white/20 backdrop-blur transition hover:scale-105 hover:bg-black/75"
              aria-label="Play"
            >
              <Play size={26} className="translate-x-0.5" fill="currentColor" />
            </button>
            {warnings.length > 0 && (
              <div className="mt-2 max-w-sm rounded border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-center text-[10px] text-amber-100">
                Voice preview failed temporarily, so estimated timing is used.
              </div>
            )}
          </Overlay>
        )}
        {status === 'paused' && (
          <Overlay>
            <button
              onClick={play}
              className="grid h-14 w-14 place-items-center rounded-full bg-black/60 text-white shadow-[0_10px_30px_rgba(0,0,0,0.45)] ring-1 ring-white/20 backdrop-blur transition hover:scale-105 hover:bg-black/75"
              aria-label="Continue"
            >
              <Play size={26} className="translate-x-0.5" fill="currentColor" />
            </button>
          </Overlay>
        )}
        {status === 'ended' && (
          <Overlay>
            <div className="text-sm">Preview complete</div>
            <button
              onClick={() => { pausedAtRef.current = 0; play(); }}
              className="btn-primary mt-2 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
            >
              <RotateCcw size={12} /> Replay
            </button>
          </Overlay>
        )}
        {status === 'error' && (
          <Overlay>
            <AlertCircle size={24} className="text-[var(--danger)]" />
            <div className="mt-2 max-w-sm text-center text-xs text-rose-200">{error}</div>
            <button
              onClick={preload}
              className="mt-2 rounded border border-white/15 bg-white/[.04] px-3 py-1 text-xs hover:bg-white/[.08]"
            >
              Retry
            </button>
          </Overlay>
        )}
      </div>

      {/* Compact controls bar */}
      <div className="shrink-0 border-t border-[var(--border-subtle)] bg-[var(--panel)]/80 px-3 py-1 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-[var(--muted)]">{elapsed.toFixed(1)}s</span>
          <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] transition-[width] duration-75"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-mono text-[9px] text-[var(--muted)]">{total.toFixed(1)}s</span>
          <span className="shrink-0 text-[10px] text-[var(--accent-2)]">S{currentScene + 1}/{scenes.length}</span>
          <div className="ml-1 flex shrink-0 items-center gap-1">
            {(status === 'ready' || status === 'paused') && (
              <button
                onClick={play}
                className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-white hover:bg-white/15"
                title="Play"
              >
                <Play size={12} fill="currentColor" />
              </button>
            )}
            {status === 'playing' && (
              <button
                onClick={pause}
                className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-white hover:bg-white/15"
                title="Pause"
              >
                <Pause size={12} fill="currentColor" />
              </button>
            )}
            {(status === 'playing' || status === 'paused' || status === 'ended') && (
              <button
                onClick={stop}
                className="grid h-6 w-6 place-items-center rounded-full bg-white/10 text-white hover:bg-white/15"
                title="Stop"
              >
                <Square size={11} fill="currentColor" />
              </button>
            )}
            {status === 'ended' && (
              <button
                onClick={() => { pausedAtRef.current = 0; play(); }}
                className="grid h-6 w-6 place-items-center rounded-full bg-[var(--accent)]/30 text-[var(--accent-2)] hover:bg-[var(--accent)]/50"
                title="Replay"
              >
                <RotateCcw size={11} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-black/60 text-white backdrop-blur-sm">
      <div className="flex flex-col items-center">{children}</div>
    </div>
  );
}

function estimateDurationSec(text: string) {
  return Math.max(2, Math.min(12, text.trim().length * 0.055 + 1.2));
}

function makeSilentBuffer(ctx: AudioContext, durationSec: number) {
  const frames = Math.max(1, Math.ceil(ctx.sampleRate * durationSec));
  return ctx.createBuffer(1, frames, ctx.sampleRate);
}

function bufferToWaveform(buffer: AudioBuffer, samples: number) {
  const data = buffer.getChannelData(0);
  if (data.length === 0) return Array.from({ length: samples }, () => 0.15);
  const block = Math.max(1, Math.floor(data.length / samples));
  return Array.from({ length: samples }, (_, i) => {
    const start = i * block;
    const end = Math.min(data.length, start + block);
    let sum = 0;
    for (let j = start; j < end; j += 1) sum += Math.abs(data[j]);
    return Math.max(0.08, Math.min(1, (sum / Math.max(1, end - start)) * 4));
  });
}

/* ─────────────────────────────────────────────────
 * Canvas drawing
 * ───────────────────────────────────────────────── */
function drawKenBurns(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  progress: number,
  effect: string
) {
  const W = canvas.width;
  const H = canvas.height;
  // Cover-fit
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const baseScale = Math.max(W / iw, H / ih);
  const fitW = iw * baseScale;
  const fitH = ih * baseScale;

  let zoom = 1.0;
  let dx = 0;
  let dy = 0;
  switch (effect) {
    case 'zoom_in':
      zoom = 1.0 + 0.08 * progress; break;
    case 'zoom_out':
      zoom = 1.08 - 0.08 * progress; break;
    case 'pan_right':
      zoom = 1.08;
      dx = -((fitW * zoom - W) / 2) + (fitW * zoom - W) * progress;
      break;
    case 'pan_left':
      zoom = 1.08;
      dx = -((fitW * zoom - W) / 2) - (fitW * zoom - W) * progress + (fitW * zoom - W);
      break;
    case 'flash':
      zoom = 1.03 + 0.02 * progress;
      break;
    case 'sparkle':
      zoom = 1.05 + 0.03 * Math.sin(progress * Math.PI);
      break;
    case 'none':
    default:
      zoom = 1.0;
  }
  const drawW = fitW * zoom;
  const drawH = fitH * zoom;
  const drawX = (W - drawW) / 2 + dx;
  const drawY = (H - drawH) / 2 + dy;
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  if (effect === 'flash') {
    ctx.save();
    ctx.globalAlpha = Math.max(0, 0.35 * (1 - progress * 4));
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (effect === 'sparkle') {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 10; i += 1) {
      const phase = (progress + i * 0.17) % 1;
      const x = ((i * 97) % W) + Math.sin(phase * Math.PI * 2) * 8;
      const y = ((i * 53) % H) + Math.cos(phase * Math.PI * 2) * 8;
      const r = 1.5 + Math.sin(phase * Math.PI) * 2.5;
      ctx.globalAlpha = Math.max(0, Math.sin(phase * Math.PI));
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function resolveTransition(value: string | undefined, index: number) {
  if (value === 'none') return 'cut';
  if (value === 'random') {
    return (['slide_left', 'slide_right', 'fade', 'zoom'] as const)[index % 4];
  }
  if (value === 'slide') return 'slide_left';
  return value ?? 'slide_left';
}

function drawCaption(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, text: string, alpha = 1) {
  if (!text || alpha <= 0) return;
  const W = canvas.width;
  const H = canvas.height;
  ctx.save();
  ctx.globalAlpha = alpha;
  const gradient = ctx.createLinearGradient(0, H * 0.7, 0, H);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, H * 0.7, W, H * 0.3);

  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(W * 0.04)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 8;

  const maxWidth = W * 0.9;
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  const lineHeight = Math.round(W * 0.055);
  const baseY = H * 0.92 - lineHeight * (lines.length - 1);
  lines.forEach((ln, i) => {
    ctx.fillText(ln, W / 2, baseY + i * lineHeight, maxWidth);
  });
  ctx.restore();
}
