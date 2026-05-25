'use client';
import type { Job } from '@/lib/api';
import { WORKER_URL } from '@/lib/api';

/**
 * Inline MP4 preview using <video controls>. Shows when job.status === 'done'.
 * Also offers download link as fallback.
 */
export function VideoPreview({ job }: { job: Job }) {
  if (job.status !== 'done' || !job.output_url) return null;
  const src = `${WORKER_URL}${job.output_url}`;
  return (
    <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur overflow-hidden">
      <div className="flex items-center justify-between border-b border-emerald-500/20 px-3 py-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-300">
          ✓ Rendered · {job.id}
        </span>
        <a
          href={src}
          download={`${job.id}.mp4`}
          className="text-[10px] text-emerald-300 hover:underline"
        >
          ⬇ Download MP4
        </a>
      </div>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        key={src}
        src={src}
        controls
        preload="metadata"
        className="w-full"
        style={{ background: '#000', maxHeight: 360 }}
      />
      <div className="border-t border-emerald-500/20 px-3 py-1.5 text-[10px] font-mono text-white/50">
        {job.scenes_count} scenes · {job.config.aspect} · {job.config.voice} · {job.config.fps}fps
      </div>
    </section>
  );
}
