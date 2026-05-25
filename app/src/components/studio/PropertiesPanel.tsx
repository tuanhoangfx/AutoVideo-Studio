'use client';
import type { Job } from '@/lib/api';

const VOICES = [
  { id: 'vi-VN-HoaiMyNeural', label: '♀ Hoài My', tone: 'warm' },
  { id: 'vi-VN-NamMinhNeural', label: '♂ Nam Minh', tone: 'energetic' },
];

const ASPECTS: Array<{ id: '9:16' | '16:9' | '1:1'; label: string }> = [
  { id: '9:16', label: '9:16 · Shorts' },
  { id: '16:9', label: '16:9 · YouTube' },
  { id: '1:1', label: '1:1 · Square' },
];

export function PropertiesPanel({
  voice,
  onVoice,
  aspect,
  onAspect,
  rate,
  onRate,
  currentJob,
}: {
  voice: string;
  onVoice: (v: string) => void;
  aspect: '9:16' | '16:9' | '1:1';
  onAspect: (a: '9:16' | '16:9' | '1:1') => void;
  rate: string;
  onRate: (r: string) => void;
  currentJob: Job | null;
}) {
  return (
    <section className="space-y-2">
      {/* Voice */}
      <div className="rounded-xl border border-white/10 bg-white/[.04] backdrop-blur">
        <div className="border-b border-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white/50">
          Voice
        </div>
        <div className="p-2 space-y-1">
          {VOICES.map((v) => (
            <label
              key={v.id}
              className={`flex cursor-pointer items-center gap-2 rounded p-1.5 transition ${
                voice === v.id ? 'bg-pink-500/15 ring-1 ring-pink-400/40' : 'hover:bg-white/[.04]'
              }`}
            >
              <input
                type="radio"
                name="voice"
                checked={voice === v.id}
                onChange={() => onVoice(v.id)}
                className="accent-pink-400"
              />
              <span className="text-[11px] font-medium">{v.label}</span>
              <span className="ml-auto text-[10px] text-white/40">{v.tone}</span>
            </label>
          ))}
          <div className="mt-2">
            <div className="mb-1 text-[10px] text-white/50">Tốc độ</div>
            <select
              value={rate}
              onChange={(e) => onRate(e.target.value)}
              className="w-full rounded border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-white"
            >
              <option value="-20%">Chậm (−20%)</option>
              <option value="-10%">Hơi chậm (−10%)</option>
              <option value="+0%">Bình thường</option>
              <option value="+10%">Hơi nhanh (+10%)</option>
              <option value="+20%">Nhanh (+20%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Output */}
      <div className="rounded-xl border border-white/10 bg-white/[.04] backdrop-blur">
        <div className="border-b border-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white/50">
          Output
        </div>
        <div className="p-2 space-y-1.5">
          <div>
            <div className="mb-1 text-[10px] text-white/50">Aspect ratio</div>
            <div className="grid grid-cols-3 gap-1">
              {ASPECTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onAspect(a.id)}
                  className={`rounded px-1.5 py-1 text-[10px] transition ${
                    aspect === a.id
                      ? 'bg-white text-black'
                      : 'border border-white/10 bg-white/[.02] text-white/70 hover:bg-white/[.05]'
                  }`}
                >
                  {a.label.split(' · ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Current job status — only show while rendering / errored. After done,
          VideoPreview component (rendered above this panel by /studio page)
          takes over the visual real estate. */}
      {currentJob && currentJob.status !== 'done' && (
        <div className="rounded-xl border border-white/10 bg-white/[.04] backdrop-blur">
          <div className="border-b border-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white/50">
            Job · {currentJob.id}
          </div>
          <div className="p-2 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-white/50">Status</span>
              <span
                className={
                  currentJob.status === 'error'
                    ? 'text-rose-300'
                    : 'text-amber-300'
                }
              >
                {currentJob.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Progress</span>
              <span className="font-mono text-white">{currentJob.progress}%</span>
            </div>
            <div className="h-1 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-400 to-orange-400 transition-all"
                style={{ width: `${currentJob.progress}%` }}
              />
            </div>
            {currentJob.message && (
              <div className="text-[10px] text-white/60 italic">{currentJob.message}</div>
            )}
            {currentJob.error && (
              <div className="rounded bg-rose-500/15 px-2 py-1 text-[10px] text-rose-200 ring-1 ring-rose-500/30">
                {currentJob.error}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
