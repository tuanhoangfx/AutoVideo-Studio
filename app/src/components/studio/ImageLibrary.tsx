'use client';
import { useRef } from 'react';

export type LibraryImage = {
  file: File;
  url: string; // ObjectURL
  used: boolean;
};

export function ImageLibrary({
  images,
  onAdd,
  onRemove,
  selectedIndex,
  onSelect,
}: {
  images: LibraryImage[];
  onAdd: (files: FileList) => void;
  onRemove: (i: number) => void;
  selectedIndex: number;
  onSelect: (i: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section>
      <div className="flex items-center justify-end px-2 pt-1.5">
        <button
          onClick={() => inputRef.current?.click()}
          className="text-[10px] text-[var(--accent-2)] hover:underline"
        >
          + Upload
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => e.target.files && onAdd(e.target.files)}
      />
      {images.length === 0 ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="m-2 grid h-20 w-[calc(100%-1rem)] place-items-center rounded-md border border-dashed border-white/20 bg-white/[.02] text-center transition hover:border-[var(--accent)]/60 hover:bg-white/[.04]"
        >
          <div>
            <div className="text-xl opacity-50">📤</div>
            <div className="mt-0.5 text-[10px] text-white/60">Kéo thả ảnh</div>
            <div className="text-[9px] text-white/40">PNG · JPG · WebP</div>
          </div>
        </button>
      ) : (
        <div className="grid max-h-36 grid-cols-4 gap-1 overflow-y-auto p-2">
          {images.map((img, i) => (
            <div
              key={i}
              className={`group relative aspect-[4/3] overflow-hidden rounded-md ring-1 cursor-pointer transition ${
                i === selectedIndex
                  ? 'ring-[var(--accent)] ring-2 shadow-[0_0_0_1px_rgba(99,102,241,0.35)]'
                  : img.used
                  ? 'ring-emerald-400/40'
                  : 'ring-white/10 hover:ring-white/30'
              }`}
              onClick={() => onSelect(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.file.name}
                className="h-full w-full object-cover"
              />
              {img.used && (
                <div className="absolute right-0.5 top-0.5 grid h-3 w-3 place-items-center rounded-full bg-emerald-500/80 text-[7px] font-bold text-white">
                  ✓
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-1 py-0.5">
                <div className="truncate font-mono text-[7px] text-white/85">
                  {String(i + 1).padStart(2, '0')}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(i);
                }}
                className="absolute left-0.5 top-0.5 grid h-3 w-3 place-items-center rounded-full bg-black/60 text-[8px] text-white opacity-0 hover:bg-rose-500 group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
