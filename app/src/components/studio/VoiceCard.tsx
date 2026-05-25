import type { Voice } from '@/lib/types';
import { SidePanel } from './SidePanel';

export function VoiceCard({ voice }: { voice: Voice }) {
  return (
    <SidePanel label="Voice">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-pink-400 to-orange-400 text-base text-white ring-1 ring-white/30">
          {voice.gender}
        </div>
        <div>
          <div className="text-sm font-medium text-white">{voice.label}</div>
          <div className="text-[11px] text-white/50">
            {voice.tone} · {voice.engine === 'edge-tts' ? 'vi-VN' : 'EN'}
          </div>
        </div>
        <button className="ml-auto rounded-full bg-white/10 px-3 py-1.5 text-[10px] text-white/80 transition hover:bg-white/15">
          Change
        </button>
      </div>
    </SidePanel>
  );
}
