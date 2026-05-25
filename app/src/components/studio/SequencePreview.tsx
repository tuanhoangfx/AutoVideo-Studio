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

export type SequenceScene = {
  text: string;
  imageUrl: string;
  effect?: string;
};

type Status = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';

const EFFECTS_CYCLE = ['zoom_in', 'pan_right', 'zoom_out', 'pan_left'];

/** Crossfade duration giữa các scene — match ffmpeg render (compose.py transition=0.4) */
const TRANSITION_S = 0.4;

export function SequencePreview({
  scenes,
  voice,
  rate,
  aspect,
  onClose,
}: {
  scenes: SequenceScene[];
  voice: string;
  rate: string;
  aspect: '9:16' | '16:9' | '1:1';
  onClose?: () => void;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState({ done: 0, total: scenes.length });
  const [currentScene, setCurrentScene] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<AudioBuffer[]>([]);
  const sourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const startTimeRef = useRef<number>(0);
  const sceneStartsRef = useRef<number[]>([]);
  const totalRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number>(0);

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
    setLoadProgress({ done: 0, total: scenes.length });
    try {
      const ctx =
        ctxRef.current ||
        new (window.AudioContext || (window as any).webkitAudioContext)();
      ctxRef.current = ctx;

      const buffers = await Promise.all(
        scenes.map(async (s) => {
          const url = voicePreviewUrl(s.text, voice, rate);
          const resp = await fetch(url);
          if (!resp.ok) throw new Error(`tts ${resp.status} for "${s.text.slice(0, 30)}…"`);
          const ab = await resp.arrayBuffer();
          const buf = await ctx.decodeAudioData(ab);
          setLoadProgress((p) => ({ ...p, done: p.done + 1 }));
          return buf;
        })
      );
      buffersRef.current = buffers;

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
      for (const b of buffers) {
        starts.push(cum);
        cum += b.duration;
      }
      sceneStartsRef.current = starts;
      totalRef.current = cum;
      pausedAtRef.current = 0;

      // First frame so users see something immediately
      requestAnimationFrame(() => drawFrame(0));

      setStatus('ready');
    } catch (e: any) {
      setError(e?.message || String(e));
      setStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes, voice, rate]);

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

    setStatus('playing');
    loop();
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
    setStatus('ready');
    requestAnimationFrame(() => drawFrame(0));
  }, []);

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
      const sceneDur = buffers[idx].duration;
      const sceneT = e - sceneStart;
      const progress = Math.min(1, sceneT / sceneDur);
      const effect =
        scenes[idx].effect && scenes[idx].effect !== 'auto'
          ? scenes[idx].effect!
          : EFFECTS_CYCLE[idx % EFFECTS_CYCLE.length];

      // Detect crossfade zone: last TRANSITION_S of current scene
      const remaining = sceneDur - sceneT;
      const inCrossfade = remaining < TRANSITION_S && idx < scenes.length - 1;
      const img = imagesRef.current[idx];

      // Reset
      cnvCtx.globalAlpha = 1;
      cnvCtx.clearRect(0, 0, canvas.width, canvas.height);
      cnvCtx.fillStyle = '#000';
      cnvCtx.fillRect(0, 0, canvas.width, canvas.height);

      if (inCrossfade) {
        const fadeProgress = (TRANSITION_S - remaining) / TRANSITION_S; // 0 → 1
        // Out-going: current scene fades 1 → 0
        cnvCtx.globalAlpha = 1 - fadeProgress;
        if (img) drawKenBurns(cnvCtx, canvas, img, progress, effect);
        // In-coming: next scene fades 0 → 1, at its initial progress (start of scene)
        const nextIdx = idx + 1;
        const nextImg = imagesRef.current[nextIdx];
        const nextEffect =
          scenes[nextIdx]?.effect && scenes[nextIdx].effect !== 'auto'
            ? scenes[nextIdx].effect!
            : EFFECTS_CYCLE[nextIdx % EFFECTS_CYCLE.length];
        if (nextImg) {
          cnvCtx.globalAlpha = fadeProgress;
          // Next scene just starting → progress 0
          drawKenBurns(cnvCtx, canvas, nextImg, 0, nextEffect);
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
      drawFrame(total - 0.001);
      setStatus('ended');
      return;
    }
    setElapsed(e);
    drawFrame(e);
    rafRef.current = requestAnimationFrame(loop);
  }, [drawFrame]);

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

  // ─── UI ─────────────────────────────────────────────────────────────
  const total = totalRef.current;
  const pct = total > 0 ? Math.min(100, (elapsed / total) * 100) : 0;

  return (
    <div className="flex flex-col">
      <div
        className="relative grid place-items-center overflow-hidden bg-black"
        style={{ height: 'clamp(240px, 40vh, 360px)' }}
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
            aria-label="Đóng preview"
            className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white/80 backdrop-blur hover:bg-black/80 hover:text-white"
          >
            <X size={14} />
          </button>
        )}

        {/* Status overlays */}
        {status === 'loading' && (
          <Overlay>
            <Loader2 className="animate-spin" size={28} />
            <div className="mt-2 text-sm">Tải voice {loadProgress.done}/{loadProgress.total}</div>
            <div className="mt-2 h-1 w-40 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]"
                style={{ width: `${(loadProgress.done / loadProgress.total) * 100}%` }}
              />
            </div>
          </Overlay>
        )}
        {status === 'ready' && (
          <Overlay>
            <button
              onClick={play}
              className="btn-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              <Play size={14} fill="currentColor" />
              Phát preview ({total.toFixed(1)}s)
            </button>
            <div className="mt-2 text-[10px] text-white/60">
              Ken Burns + crossfade + voice — không BGM/subtitle (chỉ trong render)
            </div>
          </Overlay>
        )}
        {status === 'paused' && (
          <Overlay>
            <button
              onClick={play}
              className="btn-primary inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold"
            >
              <Play size={14} fill="currentColor" /> Tiếp tục
            </button>
          </Overlay>
        )}
        {status === 'ended' && (
          <Overlay>
            <div className="text-sm">✓ Preview xong</div>
            <button
              onClick={() => { pausedAtRef.current = 0; play(); }}
              className="btn-primary mt-2 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
            >
              <RotateCcw size={12} /> Phát lại
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
              Thử lại
            </button>
          </Overlay>
        )}
      </div>

      {/* Compact controls bar */}
      <div className="border-t border-[var(--border-subtle)] bg-[var(--panel)]/80 px-3 py-2 backdrop-blur">
        <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] text-[var(--muted)]">
          <span>{elapsed.toFixed(1)}s</span>
          <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] transition-[width] duration-75"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span>{total.toFixed(1)}s</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 text-[11px]">
            <span className="text-[var(--accent-2)]">S{currentScene + 1}/{scenes.length}</span>
            <span className="ml-2 text-[var(--muted)] truncate inline-block max-w-[300px] align-bottom">
              {scenes[currentScene]?.text.slice(0, 60)}
              {(scenes[currentScene]?.text.length ?? 0) > 60 ? '…' : ''}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {(status === 'ready' || status === 'paused') && (
              <button
                onClick={play}
                className="grid h-7 w-7 place-items-center rounded-full bg-[var(--accent)] text-white hover:brightness-110"
                title="Play"
              >
                <Play size={12} fill="currentColor" />
              </button>
            )}
            {status === 'playing' && (
              <button
                onClick={pause}
                className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white hover:bg-white/15"
                title="Pause"
              >
                <Pause size={12} fill="currentColor" />
              </button>
            )}
            {(status === 'playing' || status === 'paused' || status === 'ended') && (
              <button
                onClick={stop}
                className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white hover:bg-white/15"
                title="Stop"
              >
                <Square size={11} fill="currentColor" />
              </button>
            )}
            {status === 'ended' && (
              <button
                onClick={() => { pausedAtRef.current = 0; play(); }}
                className="grid h-7 w-7 place-items-center rounded-full bg-[var(--accent)]/30 text-[var(--accent-2)] hover:bg-[var(--accent)]/50"
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
    case 'none':
    default:
      zoom = 1.0;
  }
  const drawW = fitW * zoom;
  const drawH = fitH * zoom;
  const drawX = (W - drawW) / 2 + dx;
  const drawY = (H - drawH) / 2 + dy;
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
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
