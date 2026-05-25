import type { Scene } from '@/lib/types';

/**
 * Big aspect-video preview with overlay caption + meta badges.
 * Currently shows gradient placeholder (no real <img> wired yet — that comes
 * after worker uploads images and returns URLs).
 */
export function HeroPreview({
  scene,
  index,
  total,
  aspect,
  quality = '1080p',
}: {
  scene: Scene;
  index: number;
  total: number;
  aspect: string;
  quality?: string;
}) {
  return (
    <div className={`relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br ${scene.img} shadow-2xl shadow-black/60`}>
      {/* Play overlay */}
      <div className="absolute inset-0 grid place-items-center">
        <button
          aria-label="Play"
          className="group grid h-20 w-20 place-items-center rounded-full bg-white/15 backdrop-blur-xl ring-1 ring-white/30 transition hover:scale-110 hover:bg-white/25"
        >
          <span className="ml-1.5 text-3xl text-white">▸</span>
        </button>
      </div>
      {/* Caption */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">
          Scene {String(index + 1).padStart(2, '0')} of {String(total).padStart(2, '0')}
        </div>
        <div className="mt-1.5 text-xl font-medium leading-tight text-white drop-shadow">{scene.text}</div>
      </div>
      {/* Top-right meta */}
      <div className="absolute right-4 top-4 flex gap-2">
        <span className="rounded-full bg-black/40 px-3 py-1 text-[10px] font-mono text-white/80 backdrop-blur">{aspect}</span>
        <span className="rounded-full bg-black/40 px-3 py-1 text-[10px] font-mono text-white/80 backdrop-blur">{quality}</span>
      </div>
    </div>
  );
}
