import type { EffectPreset } from '@/lib/types';
import { SidePanel } from './SidePanel';

const PRESETS: EffectPreset[] = ['Smooth', 'Cinematic', 'Subtle', 'Dynamic'];

export function PresetCard({ selected }: { selected: EffectPreset }) {
  return (
    <SidePanel label="Effect preset">
      <div className="grid grid-cols-2 gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            className={`rounded-lg px-3 py-2 text-[11px] transition ${
              p === selected
                ? 'bg-white text-black'
                : 'border border-white/10 bg-white/[.03] text-white/70 hover:bg-white/[.08]'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </SidePanel>
  );
}
