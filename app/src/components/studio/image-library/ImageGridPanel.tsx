'use client';

import { Check, Upload } from 'lucide-react';
import type { LibraryImage } from '@/types/studio';

export type LibraryGridEntry = { img: LibraryImage; index: number };

export function ImageGridPanel({
  images,
  visibleLibraryEntries,
  sourceFilter,
  selectedIndex,
  selectedRenderSet,
  pendingSet,
  pendingIndexes,
  canAddToKeyframe,
  onUploadClick,
  onAddToKeyframe,
  onTogglePending,
  onStartSweep,
  onUpdateSweep,
}: {
  images: LibraryImage[];
  visibleLibraryEntries: LibraryGridEntry[];
  sourceFilter: 'all' | 'local' | 'drive';
  selectedIndex: number;
  selectedRenderSet: Set<number>;
  pendingSet: Set<number>;
  pendingIndexes: number[];
  canAddToKeyframe: boolean;
  onUploadClick: () => void;
  onAddToKeyframe: () => void;
  onTogglePending: (index: number, additive: boolean) => void;
  onStartSweep: (index: number, event: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }) => void;
  onUpdateSweep: (index: number) => void;
}) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {images.length === 0 ? (
        <button
          type="button"
          onClick={onUploadClick}
          className="grid min-h-0 flex-1 place-items-center rounded-b-xl border border-dashed border-transparent bg-white/[.02] text-center transition hover:border-[var(--accent)]/60 hover:bg-white/[.04]"
        >
          <div>
            <Upload size={22} className="mx-auto text-white/35" />
            <div className="mt-1 text-[10px] text-white/60">Upload or import from workspace</div>
            <div className="text-[9px] text-white/40">PNG · JPG · WebP</div>
          </div>
        </button>
      ) : visibleLibraryEntries.length === 0 ? (
        <div className="grid min-h-0 flex-1 place-content-center px-3 text-center text-[10px] text-white/40">
          No {sourceFilter === 'drive' ? 'Drive' : 'local'} images in library. Switch source or import more.
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="grid min-h-0 flex-1 select-none grid-cols-6 content-start gap-1.5 overflow-y-auto p-1.5">
            {visibleLibraryEntries.map(({ img, index: i }) => {
              const renderSelected = selectedRenderSet.has(i);
              const pending = pendingSet.has(i);
              return (
                <div
                  key={i}
                  data-library-index={i}
                  role="button"
                  tabIndex={0}
                  className={`group relative aspect-square cursor-pointer overflow-hidden rounded-md ring-1 transition-all duration-150 ease-out ${
                    pending
                      ? 'ring-emerald-400/80 ring-2 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : i === selectedIndex
                        ? 'ring-[var(--accent)]/70 ring-2'
                        : renderSelected
                          ? 'ring-emerald-400/35'
                          : 'ring-white/10 hover:ring-white/25 hover:brightness-105'
                  }`}
                  onMouseDown={(e) => {
                    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
                    onStartSweep(i, e);
                  }}
                  onMouseEnter={() => onUpdateSweep(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onTogglePending(i, e.ctrlKey || e.metaKey);
                    }
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.file.name}
                    draggable={false}
                    className="pointer-events-none h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    aria-pressed={pending}
                    aria-label={pending ? 'Deselect image' : 'Select image'}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePending(i, e.ctrlKey || e.metaKey);
                    }}
                    className={`absolute left-0.5 top-0.5 z-10 grid h-3.5 w-3.5 place-items-center rounded-full transition-all duration-150 ${
                      pending
                        ? 'bg-emerald-500 text-white shadow-[0_0_6px_rgba(16,185,129,0.45)] ring-1 ring-white/20'
                        : 'bg-black/55 text-white/28 ring-1 ring-white/10 hover:bg-black/70 hover:text-white/50'
                    }`}
                  >
                    <Check size={8} strokeWidth={pending ? 3 : 2} />
                  </button>
                  {img.sourceKind === 'drive' && (
                    <div className="pointer-events-none absolute right-1 top-1 rounded bg-black/70 px-1 py-0.5 text-[6px] font-semibold uppercase tracking-wide text-cyan-100 ring-1 ring-cyan-300/30">
                      {img.cacheStatus === 'cached' ? 'cached' : 'downloaded'}
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-1 py-0.5">
                    <div className="truncate font-mono text-[7px] text-white/85">{String(i + 1).padStart(2, '0')}</div>
                    {img.sourceFolder && <div className="truncate text-[6px] text-white/45">{img.sourceFolder}</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="shrink-0 border-t border-white/10 bg-[#0d1228]/95 p-1 shadow-[0_-8px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm">
            <button
              type="button"
              onClick={onAddToKeyframe}
              disabled={pendingIndexes.length === 0 || !canAddToKeyframe}
              className="w-full rounded bg-[var(--accent)] px-2 py-1.5 text-[10px] font-semibold text-white disabled:opacity-30"
            >
              Add to Keyframe ({pendingIndexes.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
