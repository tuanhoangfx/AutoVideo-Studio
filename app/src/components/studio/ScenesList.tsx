import type { Scene } from '@/lib/types';
import { SidePanel } from './SidePanel';

export function ScenesList({
  scenes,
  selectedIndex,
}: {
  scenes: Scene[];
  selectedIndex: number;
}) {
  return (
    <SidePanel
      label="Scenes"
      trailing={<span className="font-mono text-[10px] text-white/50">{scenes.length}</span>}
    >
      <div className="-mx-1 max-h-56 space-y-1 overflow-y-auto pr-1">
        {scenes.map((s, i) => (
          <div
            key={s.i}
            className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 transition ${
              i === selectedIndex
                ? 'bg-pink-500/15 ring-1 ring-pink-400/40'
                : 'hover:bg-white/5'
            }`}
          >
            <span className="w-5 text-right font-mono text-[10px] text-white/40">{i + 1}</span>
            <div className={`h-8 w-12 shrink-0 rounded bg-gradient-to-br ${s.img} ring-1 ring-white/10`} />
            <div className="min-w-0 flex-1">
              <div className="line-clamp-1 text-[11px] text-white/90">{s.text}</div>
              <div className="font-mono text-[9px] text-white/40">{s.dur.toFixed(1)}s</div>
            </div>
          </div>
        ))}
      </div>
    </SidePanel>
  );
}
