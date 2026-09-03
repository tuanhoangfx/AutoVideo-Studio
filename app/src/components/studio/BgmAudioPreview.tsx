'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { takePreloadedBgmBlob } from '@/lib/bgm-preview-preload';

function mediaErrorLabel(audio: HTMLAudioElement | null): string {
  const code = audio?.error?.code;
  if (code === MediaError.MEDIA_ERR_NETWORK) return 'Network error';
  if (code === MediaError.MEDIA_ERR_DECODE) return 'Audio decode failed';
  if (code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) return 'Preview unavailable';
  return 'Play failed';
}

async function loadBgmBlob(src: string): Promise<Blob> {
  const cached = await takePreloadedBgmBlob(src);
  if (cached) return cached;
  const resp = await fetch(src);
  if (!resp.ok) throw new Error(`Preview failed (${resp.status})`);
  const blob = await resp.blob();
  if (blob.size < 64) throw new Error('Empty audio response');
  return blob;
}

/** BGM catalog preview — fetch → blob URL (same-origin proxy / CORS-safe). */
export function BgmAudioPreview({
  src,
  className = '',
  compact = false,
  autoPlayKey,
}: {
  src: string | null;
  className?: string;
  compact?: boolean;
  autoPlayKey?: number;
}) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPlaying(false);
    setError(null);
    if (ref.current) {
      ref.current.pause();
      ref.current.removeAttribute('src');
      ref.current.load();
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, [src]);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const toggle = useCallback(async () => {
    if (!src?.trim() || !ref.current) {
      setError('Preview unavailable');
      return;
    }
    const audio = ref.current;
    try {
      if (playing) {
        audio.pause();
        setPlaying(false);
        return;
      }
      setLoading(true);
      setError(null);

      const blob = await loadBgmBlob(src);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = URL.createObjectURL(blob);
      audio.src = blobUrlRef.current;
      audio.load();

      await new Promise<void>((resolve, reject) => {
        const onReady = () => {
          cleanup();
          resolve();
        };
        const onFail = () => {
          cleanup();
          reject(new Error(mediaErrorLabel(audio)));
        };
        const cleanup = () => {
          audio.removeEventListener('canplay', onReady);
          audio.removeEventListener('error', onFail);
        };
        audio.addEventListener('canplay', onReady, { once: true });
        audio.addEventListener('error', onFail, { once: true });
        if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
          cleanup();
          resolve();
        }
      });

      await audio.play();
      setPlaying(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Play failed');
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  }, [playing, src]);

  useEffect(() => {
    if (!autoPlayKey || autoPlayKey <= 0 || !src?.trim()) return;
    void toggle();
  }, [autoPlayKey, src, toggle]);

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={!src?.trim() || loading}
        className={`grid place-items-center rounded-full bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/35 transition hover:bg-amber-500/25 disabled:opacity-30 ${
          compact ? 'h-6 w-6' : 'h-7 w-7'
        }`}
        aria-label={playing ? 'Pause BGM preview' : 'Play BGM preview'}
        title={error ?? (playing ? 'Pause' : 'Preview')}
      >
        {loading ? (
          <span className="animate-spin">⋯</span>
        ) : playing ? (
          <Pause size={compact ? 10 : 12} fill="currentColor" />
        ) : (
          <Play size={compact ? 10 : 12} fill="currentColor" />
        )}
      </button>
      {error && !compact ? (
        <span className="max-w-[5rem] truncate text-[10px] text-[var(--danger)]" title={error}>
          {error}
        </span>
      ) : null}
      <audio ref={ref} preload="none" onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} />
    </div>
  );
}
