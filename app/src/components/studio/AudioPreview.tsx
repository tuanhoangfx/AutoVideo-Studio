'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Pause, Play } from 'lucide-react';
import { takeVoicePreviewPrefetch } from '@/lib/voice-preview-prefetch';

function mediaErrorLabel(audio: HTMLAudioElement | null): string {
  const code = audio?.error?.code;
  if (code === MediaError.MEDIA_ERR_NETWORK) return 'Network error — check worker is running';
  if (code === MediaError.MEDIA_ERR_DECODE) return 'Audio decode failed';
  if (code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
    return 'Preview unavailable — worker offline or invalid response';
  }
  return 'Preview unavailable';
}

/**
 * Inline audio preview — fetches MP3 via worker on play (clear errors vs raw &lt;audio src&gt;).
 */
export function AudioPreview({
  src,
  label,
  className = '',
  compact = false,
  autoPlayKey,
  warm = false,
}: {
  src: string | null;
  label?: string;
  className?: string;
  compact?: boolean;
  /** Increment to request play (keyboard Enter on active row). */
  autoPlayKey?: number;
  /** Hover prefetch warmed worker cache — subtle play-button hint. */
  warm?: boolean;
}) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    setPlaying(false);
    setError(null);
    setWarning(null);
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
      setError('Worker URL not configured');
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
      setWarning(null);

      const cached = takeVoicePreviewPrefetch(src);
      let blob: Blob;
      let provider: string | null = null;
      if (cached) {
        blob = cached.blob;
        provider = cached.provider;
      } else {
        const resp = await fetch(src);
        if (!resp.ok) {
          throw new Error(`Preview failed (${resp.status})`);
        }
        provider = resp.headers.get('X-TTS-Provider');
        blob = await resp.blob();
      }
      if (provider === 'gtts') {
        setWarning('Generic fallback — edge voice unavailable');
      }
      if (blob.size < 64) {
        throw new Error('Worker did not return audio');
      }

      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
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
      const message = e instanceof Error ? e.message : 'Play failed';
      setError(message);
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
        className={`grid place-items-center rounded-full bg-[var(--accent)]/20 text-[var(--accent-2)] ring-1 ring-[var(--accent)]/40 transition hover:bg-[var(--accent)]/30 disabled:opacity-30 ${
          compact ? 'h-6 w-6' : 'h-7 w-7'
        } ${warm && !loading && !playing ? 'ring-emerald-400/50' : ''}`}
        aria-label={playing ? 'Pause' : 'Play preview'}
        title={playing ? 'Pause' : 'Preview'}
      >
        {loading ? (
          <Loader2 size={compact ? 10 : 12} className="animate-spin" aria-hidden />
        ) : playing ? (
          <Pause size={compact ? 10 : 12} fill="currentColor" />
        ) : (
          <Play size={compact ? 10 : 12} fill="currentColor" />
        )}
      </button>
      {label && <span className="text-[10px] text-[var(--muted)]">{label}</span>}
      {error && (
        <span className="max-w-[9rem] truncate text-[10px] text-[var(--danger)]" title={error}>
          {error}
        </span>
      )}
      {!error && warning && (
        <span className="max-w-[9rem] truncate text-[10px] text-amber-300/90" title={warning}>
          {warning}
        </span>
      )}
      <audio
        ref={ref}
        preload="none"
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
      />
    </div>
  );
}
