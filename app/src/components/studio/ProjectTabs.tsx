'use client';
import type { Job } from '@/lib/api';

export function ProjectTabs({
  jobs,
  activeId,
  onSelect,
  onNew,
}: {
  jobs: Job[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const statusTone: Record<string, string> = {
    pending: 'bg-slate-400',
    tts: 'bg-blue-400 animate-pulse',
    audio: 'bg-blue-400 animate-pulse',
    compose: 'bg-amber-400 animate-pulse',
    done: 'bg-emerald-400',
    error: 'bg-rose-400',
  };

  return (
    <div className="flex items-end gap-1 border-b border-white/10 bg-black/30 px-2 pt-2">
      {jobs.length === 0 && (
        <div className="px-3 py-1.5 text-[11px] italic text-white/40">
          No projects yet. Click + to create one.
        </div>
      )}
      {jobs.map((j) => {
        const active = j.id === activeId;
        return (
          <button
            key={j.id}
            onClick={() => onSelect(j.id)}
            className={`group flex max-w-xs items-center gap-2 rounded-t-lg px-3 py-1.5 transition ${
              active
                ? 'border-t border-x border-pink-400/40 bg-white/[.08]'
                : 'bg-white/[.02] hover:bg-white/[.04]'
            }`}
            title={j.id}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${statusTone[j.status] || 'bg-white/30'}`} />
            <span
              className={`truncate text-[11px] ${
                active ? 'font-medium text-white' : 'text-white/60'
              }`}
            >
              {j.id} · {j.scenes_count} scenes
            </span>
          </button>
        );
      })}
      <button
        onClick={onNew}
        className="ml-1 grid h-7 w-7 place-items-center rounded text-white/50 hover:bg-white/10 hover:text-white"
        title="Create new project"
      >
        +
      </button>
    </div>
  );
}
