'use client';

import { useCallback, useId, useRef } from 'react';

export type MiniWaveformVariant = 'speech' | 'silent' | 'partial';

/** Soft speech envelope — keyframe Transcript cell + timeline cards. */
export function silentWaveform(samples: number) {
  return Array.from({ length: samples }, (_, i) => {
    const breath = 0.1 + Math.abs(Math.sin(i * 0.37)) * 0.05;
    const tick = i % 9 === 4 ? 0.05 : 0;
    return Math.min(0.22, breath + tick);
  });
}

export function pseudoWaveform(text: string, samples: number) {
  const seed = Math.max(1, text.length);
  return Array.from({ length: samples }, (_, i) => {
    const t = i / Math.max(1, samples - 1);
    const envelope = 0.38 + 0.62 * Math.pow(Math.sin(t * Math.PI), 0.82);
    const formant =
      0.55 * Math.abs(Math.sin((i + seed) * 0.91)) +
      0.28 * Math.abs(Math.sin((i + seed * 1.7) * 2.14)) +
      0.17 * Math.abs(Math.sin((i * 0.47 + seed) * 3.6));
    const pause = Math.abs(Math.sin((i + seed) * 0.17)) < 0.09 ? 0.28 : 1;
    return Math.max(0.14, Math.min(1, 0.16 + formant * (0.28 + envelope * 0.56) * pause));
  });
}

function smoothEnvelopePath(
  values: number[],
  width: number,
  height: number,
  variant: 'speech' | 'silent' = 'speech',
): string {
  const n = values.length;
  if (n === 0) return '';
  const mid = height / 2;
  const maxAmp = height * (variant === 'silent' ? 0.26 : 0.34);
  const step = width / Math.max(1, n - 1);

  const point = (i: number, sign: 1 | -1) => {
    const x = i * step;
    const y = mid + sign * values[i]! * maxAmp;
    return { x, y };
  };

  const top = Array.from({ length: n }, (_, i) => point(i, -1));
  const bottom = Array.from({ length: n }, (_, i) => point(n - 1 - i, 1));

  const curveThrough = (pts: { x: number; y: number }[]) => {
    if (pts.length === 1) return `L ${pts[0]!.x.toFixed(2)} ${pts[0]!.y.toFixed(2)}`;
    let d = '';
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)]!;
      const p1 = pts[i]!;
      const p2 = pts[i + 1]!;
      const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
    }
    return d;
  };

  const start = top[0]!;
  return (
    `M ${start.x.toFixed(2)} ${mid.toFixed(2)} ` +
    `L ${start.x.toFixed(2)} ${start.y.toFixed(2)}` +
    curveThrough(top) +
    ` L ${bottom[0]!.x.toFixed(2)} ${bottom[0]!.y.toFixed(2)}` +
    curveThrough(bottom) +
    ' Z'
  );
}

function WaveformPath({
  gid,
  path,
  tone,
  clipPath,
}: {
  gid: string;
  path: string;
  tone: 'speech' | 'silent' | 'amber' | 'dim';
  clipPath?: string;
}) {
  const fillStops =
    tone === 'amber'
      ? [
          ['0%', 'rgba(251,191,36,0.55)'],
          ['45%', 'rgba(245,158,11,0.68)'],
          ['100%', 'rgba(251,191,36,0.48)'],
        ]
      : tone === 'dim'
        ? [
            ['0%', 'rgba(100,116,139,0.22)'],
            ['50%', 'rgba(71,85,105,0.28)'],
            ['100%', 'rgba(100,116,139,0.2)'],
          ]
        : tone === 'silent'
          ? [
              ['0%', 'rgba(148,163,184,0.28)'],
              ['50%', 'rgba(148,163,184,0.36)'],
              ['100%', 'rgba(148,163,184,0.26)'],
            ]
          : [
              ['0%', 'rgba(99,102,241,0.48)'],
              ['45%', 'rgba(45,212,191,0.62)'],
              ['100%', 'rgba(129,140,248,0.5)'],
            ];

  const strokeStops =
    tone === 'amber'
      ? [
          ['0%', 'rgba(253,230,138,0.95)'],
          ['50%', 'rgba(251,191,36,1)'],
          ['100%', 'rgba(253,230,138,0.9)'],
        ]
      : tone === 'dim'
        ? [
            ['0%', 'rgba(148,163,184,0.45)'],
            ['50%', 'rgba(100,116,139,0.55)'],
            ['100%', 'rgba(148,163,184,0.4)'],
          ]
        : tone === 'silent'
          ? [
              ['0%', 'rgba(203,213,225,0.55)'],
              ['50%', 'rgba(203,213,225,0.65)'],
              ['100%', 'rgba(203,213,225,0.5)'],
            ]
          : [
              ['0%', 'rgba(196,181,253,0.92)'],
              ['50%', 'rgba(94,234,212,1)'],
              ['100%', 'rgba(196,181,253,0.88)'],
            ];

  const fillId = `${gid}-fill-${tone}`;
  const strokeId = `${gid}-stroke-${tone}`;

  return (
    <>
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="1" y2="0">
          {fillStops.map(([offset, color]) => (
            <stop key={offset} offset={offset} stopColor={color} />
          ))}
        </linearGradient>
        <linearGradient id={strokeId} x1="0" y1="0" x2="1" y2="0">
          {strokeStops.map(([offset, color]) => (
            <stop key={offset} offset={offset} stopColor={color} />
          ))}
        </linearGradient>
      </defs>
      <path
        d={path}
        fill={`url(#${fillId})`}
        stroke={`url(#${strokeId})`}
        strokeWidth="0.5"
        clipPath={clipPath}
      />
    </>
  );
}

export function MiniWaveform({
  values,
  size = 'cell',
  variant = 'speech',
  partialClipRatio,
  playheadRatio,
  interactive = false,
  onSeek,
}: {
  values: number[];
  size?: 'cell' | 'card';
  variant?: MiniWaveformVariant;
  /** 0..1 — exported portion for partial rows (amber left, dim right). */
  partialClipRatio?: number;
  /** 0..1 — playhead position within this waveform window. */
  playheadRatio?: number;
  interactive?: boolean;
  onSeek?: (ratio: number) => void;
}) {
  const gid = `studio-wave-${useId().replace(/:/g, '')}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const tall = size === 'cell';
  const samples = tall ? 64 : 28;
  const bars = values.slice(0, samples);
  const vbW = 120;
  const vbH = tall ? 10 : 8;
  const envelopeVariant = variant === 'silent' ? 'silent' : 'speech';
  const path = smoothEnvelopePath(bars, vbW, vbH, envelopeVariant);
  const clipRatio =
    variant === 'partial' && partialClipRatio != null
      ? Math.max(0.05, Math.min(0.98, partialClipRatio))
      : null;
  const exportedClipId = clipRatio != null ? `${gid}-exported` : undefined;
  const trimmedClipId = clipRatio != null ? `${gid}-trimmed` : undefined;
  const playheadX =
    playheadRatio != null && playheadRatio >= 0 && playheadRatio <= 1
      ? vbW * playheadRatio
      : null;

  const seekAtClientX = useCallback(
    (clientX: number) => {
      if (!onSeek || !rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onSeek(ratio);
    },
    [onSeek],
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!interactive || !onSeek) return;
      e.stopPropagation();
      e.preventDefault();
      seekAtClientX(e.clientX);
      const onMove = (moveEvent: MouseEvent) => seekAtClientX(moveEvent.clientX);
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [interactive, onSeek, seekAtClientX],
  );

  return (
    <div
      ref={rootRef}
      className={`studio-mini-waveform w-full min-w-0 overflow-hidden ${tall ? 'h-1.5' : 'h-2'} ${
        variant === 'silent' ? 'studio-mini-waveform--silent' : ''
      } ${variant === 'partial' ? 'studio-mini-waveform--partial' : ''} ${
        interactive ? 'studio-mini-waveform--interactive' : ''
      }`}
      aria-hidden={!interactive}
      title={interactive ? 'Click or drag to seek playback' : undefined}
      onMouseDown={interactive ? onMouseDown : undefined}
      onClick={interactive ? (e) => e.stopPropagation() : undefined}
    >
      <svg className="block h-full w-full" viewBox={`0 0 ${vbW} ${vbH}`} preserveAspectRatio="none">
        {clipRatio != null ? (
          <defs>
            <clipPath id={exportedClipId}>
              <rect x={0} y={0} width={vbW * clipRatio} height={vbH} />
            </clipPath>
            <clipPath id={trimmedClipId}>
              <rect x={vbW * clipRatio} y={0} width={vbW * (1 - clipRatio)} height={vbH} />
            </clipPath>
          </defs>
        ) : null}
        <line
          x1="0"
          y1={vbH / 2}
          x2={vbW}
          y2={vbH / 2}
          stroke="rgba(148,163,184,0.38)"
          strokeWidth="0.4"
        />
        {clipRatio != null ? (
          <>
            <WaveformPath
              gid={gid}
              path={path}
              tone="amber"
              clipPath={`url(#${exportedClipId})`}
            />
            <WaveformPath
              gid={gid}
              path={path}
              tone="dim"
              clipPath={`url(#${trimmedClipId})`}
            />
            <line
              x1={vbW * clipRatio}
              y1={0}
              x2={vbW * clipRatio}
              y2={vbH}
              stroke="rgba(251,191,36,0.85)"
              strokeWidth="0.55"
              strokeDasharray="1.2 1"
            />
          </>
        ) : (
          <WaveformPath
            gid={gid}
            path={path}
            tone={variant === 'silent' ? 'silent' : 'speech'}
          />
        )}
        {playheadX != null ? (
          <line
            x1={playheadX}
            y1={0}
            x2={playheadX}
            y2={vbH}
            stroke="rgba(255,255,255,0.92)"
            strokeWidth="0.65"
          />
        ) : null}
      </svg>
    </div>
  );
}
