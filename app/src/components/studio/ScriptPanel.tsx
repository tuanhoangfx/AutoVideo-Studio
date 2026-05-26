'use client';
import { voicePreviewUrl } from '@/lib/api';
import { AudioPreview } from './AudioPreview';

export type Effect = 'auto' | 'zoom_in' | 'zoom_out' | 'pan_right' | 'pan_left' | 'none';

export const EFFECT_OPTIONS: Array<{ id: Effect; label: string; icon: string }> = [
  { id: 'auto', label: 'Auto cycle', icon: '🔄' },
  { id: 'zoom_in', label: 'Zoom in', icon: '🔍+' },
  { id: 'zoom_out', label: 'Zoom out', icon: '🔍−' },
  { id: 'pan_right', label: 'Pan right', icon: '→' },
  { id: 'pan_left', label: 'Pan left', icon: '←' },
  { id: 'none', label: 'Static', icon: '⏸' },
];

export type ScriptLine = {
  text: string;
  image_index: number;
  effect?: Effect; // undefined = auto cycle
};

export function ScriptPanel({
  lines,
  selectedIndex,
  onChange,
  onSelect,
  onAddLine,
  onRemoveLine,
  onAIGen,
  aiTopic,
  onTopicChange,
  aiGenerating,
  imagesCount,
  voice,
  rate,
}: {
  lines: ScriptLine[];
  selectedIndex: number;
  onChange: (i: number, text: string) => void;
  onSelect: (i: number) => void;
  onAddLine: () => void;
  onRemoveLine: (i: number) => void;
  onAIGen: () => void;
  aiTopic: string;
  onTopicChange: (v: string) => void;
  aiGenerating: boolean;
  imagesCount: number;
  /** Voice + rate dùng cho preview per-line. Optional — nếu thiếu nút ▸ bị hide. */
  voice?: string;
  rate?: string;
}) {
  return (
    <section>
      {lines.length === 0 ? (
        <div className="p-2 text-[10px] text-white/50 text-center italic">
          Chưa có lời thoại — gõ chủ đề + Gen hoặc bấm &quot;+ dòng&quot;.
        </div>
      ) : (
        <div className="max-h-40 space-y-0.5 overflow-y-auto p-1.5">
          {lines.map((s, i) => {
            const hasText = s.text.trim().length > 0;
            const previewSrc =
              hasText && voice
                ? voicePreviewUrl(s.text, voice, rate ?? '+0%')
                : null;
            return (
              <div
                key={i}
                className={`group flex items-start gap-1.5 rounded px-1.5 py-1 ${
                  i === selectedIndex
                    ? 'bg-[var(--accent)]/15 ring-1 ring-[var(--accent)]/40'
                    : 'hover:bg-white/[.04]'
                }`}
              >
                <span className="mt-1 w-4 text-right font-mono text-[9px] text-white/40">
                  {i + 1}
                </span>
                <textarea
                  value={s.text}
                  onChange={(e) => onChange(i, e.target.value)}
                  onFocus={() => onSelect(i)}
                  rows={1}
                  className="min-h-[1.75rem] flex-1 resize-none rounded bg-transparent px-1 py-0.5 text-[11px] leading-snug text-white outline-none focus:bg-black/30"
                />
                {/* Per-line audio preview */}
                {voice && (
                  <div className="mt-0.5 shrink-0">
                    <AudioPreview src={previewSrc} compact />
                  </div>
                )}
                <span className="mt-1 font-mono text-[9px] text-white/40">
                  #{s.image_index + 1}
                </span>
                <button
                  onClick={() => onRemoveLine(i)}
                  className="mt-0.5 grid h-4 w-4 place-items-center rounded text-[9px] text-white/30 opacity-0 hover:bg-rose-500/30 hover:text-white group-hover:opacity-100"
                  title="Xóa dòng"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div className="border-t border-[var(--border-subtle)] p-1.5">
        <div className="flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--panel-2)] px-2 py-1">
          <span className="text-[var(--accent-2)]">✨</span>
          <input
            value={aiTopic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="Mô tả video — AI viết script khớp ảnh..."
            className="flex-1 bg-transparent text-[11px] text-white placeholder-white/40 focus:outline-none"
            disabled={aiGenerating}
          />
          <button
            onClick={onAddLine}
            disabled={imagesCount === 0}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--accent)]/50 bg-[var(--accent)]/15 px-2.5 py-1 text-[10px] font-semibold text-[var(--accent-2)] shadow-[0_0_14px_rgba(99,102,241,0.16)] transition hover:bg-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[.03] disabled:text-white/30 disabled:shadow-none"
          >
            <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[var(--accent)] text-[9px] text-white">+</span>
            Thêm dòng
          </button>
          <button
            onClick={onAIGen}
            disabled={aiGenerating || imagesCount === 0 || !aiTopic.trim()}
            className="rounded bg-[var(--accent)] px-2 py-0.5 text-[10px] text-white hover:brightness-110 disabled:opacity-30"
          >
            {aiGenerating ? '...' : 'Gen'}
          </button>
        </div>
      </div>
    </section>
  );
}
