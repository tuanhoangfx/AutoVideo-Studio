'use client';
import { useMemo } from 'react';
import { voicePreviewUrl } from '@/lib/api';
import { AudioPreview } from './AudioPreview';

const VOICES = [
  { id: 'vi-VN-HoaiMyNeural', label: 'Hoài My', gender: '♀', tone: 'warm' },
  { id: 'vi-VN-NamMinhNeural', label: 'Nam Minh', gender: '♂', tone: 'khoẻ' },
];

const RATE_OPTIONS = [
  { value: '-20%', label: '−20%' },
  { value: '-10%', label: '−10%' },
  { value: '+0%', label: '0' },
  { value: '+10%', label: '+10%' },
  { value: '+20%', label: '+20%' },
];

const PREVIEW_TEXT = 'Xin chào, đây là giọng đọc thử.';

/** Compact voice picker — 2 horizontal radio + rate inline pills. */
export function VoiceSelector({
  voice, onVoice, rate, onRate,
}: {
  voice: string; onVoice: (v: string) => void;
  rate: string; onRate: (r: string) => void;
}) {
  return (
    <div className="space-y-2">
      {/* 2 voices: side-by-side cards */}
      <div className="grid grid-cols-2 gap-1.5">
        {VOICES.map((v) => {
          const active = voice === v.id;
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const previewSrc = useMemo(() => voicePreviewUrl(PREVIEW_TEXT, v.id, rate), [v.id, rate]);
          return (
            <div
              key={v.id}
              className={`relative cursor-pointer rounded-md border p-2 transition ${
                active
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--border-subtle)] bg-[var(--panel-2)] hover:border-[var(--accent)]/40'
              }`}
              onClick={() => onVoice(v.id)}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-white">
                    <span className={active ? 'text-[var(--accent-2)]' : ''}>{v.gender}</span>
                    {v.label}
                  </div>
                  <div className="text-[9px] text-[var(--muted)]">{v.tone}</div>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <AudioPreview src={previewSrc} compact />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Rate pills — 5 buttons 1 row */}
      <div className="flex gap-0.5 rounded-md bg-[var(--panel-2)] p-0.5">
        {RATE_OPTIONS.map((r) => (
          <button
            key={r.value}
            onClick={() => onRate(r.value)}
            className={`flex-1 rounded px-1 py-1 text-[10px] font-mono transition ${
              rate === r.value
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--muted)] hover:text-white hover:bg-white/[.04]'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
