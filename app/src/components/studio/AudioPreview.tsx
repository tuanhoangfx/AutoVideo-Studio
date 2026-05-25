'use client';
import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

/**
 * Inline audio preview button — fetches src lazily on first play.
 * Used cho voice preview + BGM preview.
 */
export function AudioPreview({
  src,
  label,
  className = '',
  compact = false,
}: {
  src: string | null;
  label?: string;
  className?: string;
  compact?: boolean;
}) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPlaying(false);
    setError(null);
    if (ref.current) {
      ref.current.pause();
      ref.current.currentTime = 0;
    }
  }, [src]);

  const toggle = async () => {
    if (!src || !ref.current) return;
    try {
      if (playing) {
        ref.current.pause();
        setPlaying(false);
        return;
      }
      setLoading(true);
      setError(null);
      await ref.current.play();
      setPlaying(true);
    } catch (e: any) {
      setError(e?.message || 'play failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        disabled={!src}
        className={`grid place-items-center rounded-full bg-[var(--accent)]/20 text-[var(--accent-2)] ring-1 ring-[var(--accent)]/40 transition hover:bg-[var(--accent)]/30 disabled:opacity-30 ${
          compact ? 'h-6 w-6' : 'h-7 w-7'
        }`}
        aria-label={playing ? 'Pause' : 'Play preview'}
        title={playing ? 'Pause' : 'Nghe thử'}
      >
        {loading ? (
          <span className="animate-spin">⋯</span>
        ) : playing ? (
          <Pause size={compact ? 10 : 12} fill="currentColor" />
        ) : (
          <Play size={compact ? 10 : 12} fill="currentColor" />
        )}
      </button>
      {label && <span className="text-[10px] text-[var(--muted)]">{label}</span>}
      {error && <span className="text-[10px] text-[var(--danger)]">{error}</span>}
      <audio
        ref={ref}
        src={src ?? undefined}
        preload="none"
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
      />
    </div>
  );
}
