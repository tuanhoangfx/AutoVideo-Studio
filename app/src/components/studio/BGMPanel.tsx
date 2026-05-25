'use client';
import { useEffect, useRef, useState } from 'react';
import { Music, Plus, Trash2 } from 'lucide-react';
import { AudioPreview } from './AudioPreview';

/** Compact BGM panel — empty = nút "+ Chọn nhạc" 1 dòng, filled = 1 row info+slider. */
export function BGMPanel({
  bgm, onSet, onClear,
  volume, onVolume,
}: {
  bgm: File | null;
  onSet: (f: File) => void;
  onClear: () => void;
  volume: number;
  onVolume: (v: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!bgm) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(bgm);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [bgm]);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/m4a"
        hidden
        onChange={(e) => e.target.files?.[0] && onSet(e.target.files[0])}
      />
      {bgm ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 rounded-md bg-[var(--panel-2)] px-2 py-1.5">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-[var(--accent)]/15 text-[var(--accent-2)]">
              <Music size={11} />
            </span>
            <span className="min-w-0 flex-1 truncate text-[11px]" title={bgm.name}>
              {bgm.name}
            </span>
            <AudioPreview src={previewUrl} compact />
            <button
              onClick={onClear}
              className="grid h-5 w-5 place-items-center rounded text-[var(--muted)] hover:bg-[var(--danger)]/20 hover:text-[var(--danger)]"
              title="Xoá"
            >
              <Trash2 size={11} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="shrink-0 text-[var(--muted)]">Vol</span>
            <input
              type="range" min={0} max={1} step={0.01}
              value={volume}
              onChange={(e) => onVolume(parseFloat(e.target.value))}
              className="flex-1 accent-[var(--accent)]"
            />
            <span className="w-9 shrink-0 text-right font-mono text-white">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[var(--border)] bg-[var(--panel-2)]/40 px-3 py-2 text-[11px] text-[var(--muted)] transition hover:border-[var(--accent)]/60 hover:bg-[var(--panel-2)] hover:text-white"
        >
          <Plus size={12} />
          Chọn nhạc nền
          <span className="text-[9px] opacity-50">· mp3/wav</span>
        </button>
      )}
    </div>
  );
}
