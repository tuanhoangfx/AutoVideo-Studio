'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gauge } from 'lucide-react';
import type { SubtitleStyle, TTSProvider } from '@/lib/api';
import { HubSplitDirectoryPane, useDirectorySearchQuery } from '@/lib/hub-ui';
import { useVoiceDirectoryFilters } from '@/lib/use-voice-directory-filters';
import { useVoiceDirectoryKeyboard } from '@/lib/use-voice-directory-keyboard';
import { VOICE_OPTIONS } from '@/lib/voice-options';
import { BGMPanel } from './BGMPanel';
import { VoiceDirectoryTable } from './VoiceDirectoryTable';
import { VoiceFilterPane, type StudioAudioRailMode } from './VoiceFilterPane';

const FAVORITE_VOICES_KEY = 'p0021:studio:favorite-voices:v1';
const AUDIO_RAIL_MODE_KEY = 'p0021:studio:audio-rail-mode:v1';
const RATE_STEPS = [-20, -10, 0, 10, 20] as const;

export { VOICE_OPTIONS } from '@/lib/voice-options';
export { FlagBadge } from './FlagBadge';

export function VoiceSelector({
  voice,
  onVoice,
  rate,
  onRate,
  provider,
  onProvider,
  bgm,
  onSetBgm,
  onClearBgm,
  bgmVolume,
  onBgmVolume,
  subtitleStyle,
  onSubtitleStyle,
}: {
  voice: string;
  onVoice: (v: string) => void;
  rate: string;
  onRate: (r: string) => void;
  provider: TTSProvider;
  onProvider: (provider: TTSProvider) => void;
  previewText?: string;
  bgm: File | null;
  onSetBgm: (file: File) => void;
  onClearBgm: () => void;
  bgmVolume: number;
  onBgmVolume: (volume: number) => void;
  subtitleStyle: SubtitleStyle;
  onSubtitleStyle: (style: SubtitleStyle) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { queryInput, setQueryInput, query } = useDirectorySearchQuery();
  const [audioMode, setAudioMode] = useState<StudioAudioRailMode>('voice');
  const [localeFilters, setLocaleFilters] = useState<string[]>([]);
  const [genderFilters, setGenderFilters] = useState<string[]>([]);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [previewNonce, setPreviewNonce] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [favoriteVoiceIds, setFavoriteVoiceIds] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    try {
      const parsed = JSON.parse(localStorage.getItem(FAVORITE_VOICES_KEY) || '[]');
      const next = Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
      setFavoriteVoiceIds(next);
    } catch {}
    try {
      const saved = localStorage.getItem(AUDIO_RAIL_MODE_KEY);
      if (saved === 'voice' || saved === 'music') setAudioMode(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITE_VOICES_KEY, JSON.stringify(favoriteVoiceIds));
    } catch {}
  }, [favoriteVoiceIds]);

  useEffect(() => {
    try {
      localStorage.setItem(AUDIO_RAIL_MODE_KEY, audioMode);
    } catch {}
  }, [audioMode]);

  useEffect(() => {
    if (provider !== 'edge') onProvider('edge');
  }, [provider, onProvider]);

  const favoriteSet = useMemo(() => new Set(favoriteVoiceIds), [favoriteVoiceIds]);
  const voiceMode = audioMode === 'voice';

  const { filters, filterValues, filteredVoices, listResetKey, handleFilterValuesChange } =
    useVoiceDirectoryFilters({
      voices: VOICE_OPTIONS,
      query,
      localeFilters,
      genderFilters,
      favoriteOnly,
      favoriteIds: favoriteSet,
      setLocaleFilters,
      setGenderFilters,
    });

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteVoiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const bumpPreview = useCallback(() => {
    setPreviewNonce((value) => value + 1);
  }, []);

  useVoiceDirectoryKeyboard({
    items: filteredVoices,
    activeId: voice,
    onSelect: onVoice,
    onPreview: bumpPreview,
    containerRef,
    enabled: voiceMode,
  });

  return (
    <div
      ref={containerRef}
      tabIndex={voiceMode ? 0 : -1}
      className="flex h-full min-h-0 flex-col gap-2 outline-none focus:outline-none"
    >
      <HubSplitDirectoryPane
        variant="rail"
        className="studio-voice-directory-frame hub-directory-frame min-h-0 flex-1"
        filterBar={
          <VoiceFilterPane
            audioMode={audioMode}
            onAudioModeChange={setAudioMode}
            filters={filters}
            filterValues={filterValues}
            onFilterValuesChange={handleFilterValuesChange}
            query={queryInput}
            onQueryChange={setQueryInput}
            favoriteOnly={favoriteOnly}
            favoriteCount={mounted ? favoriteVoiceIds.length : 0}
            onToggleFavoriteOnly={() => setFavoriteOnly((value) => !value)}
            subtitleStyle={subtitleStyle}
            onSubtitleStyleChange={onSubtitleStyle}
          />
        }
      >
        {voiceMode ? (
          <VoiceDirectoryTable
            items={filteredVoices}
            activeVoiceId={voice}
            favoriteIds={favoriteSet}
            rate={rate}
            resetKey={listResetKey}
            previewNonce={previewNonce}
            onSelect={onVoice}
            onToggleFavorite={toggleFavorite}
          />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col justify-center px-1 py-2">
            <BGMPanel
              bgm={bgm}
              onSet={onSetBgm}
              onClear={onClearBgm}
              volume={bgmVolume}
              onVolume={onBgmVolume}
            />
          </div>
        )}
      </HubSplitDirectoryPane>
      {voiceMode ? <VoiceSpeedSlider value={rate} onChange={onRate} /> : null}
    </div>
  );
}

function VoiceSpeedSlider({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const numeric = rateToNumber(value);
  const fillPct = ((numeric + 20) / 40) * 100;
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-lg border border-white/10 bg-black/15 px-3 py-1">
      <div className="flex w-20 shrink-0 items-center gap-1.5 text-[10px] font-semibold text-white/75">
        <Gauge size={12} className="text-[var(--accent-2)]" />
        Speed
      </div>
      <input
        type="range"
        min={-20}
        max={20}
        step={10}
        value={numeric}
        onChange={(e) => onChange(formatRate(Number(e.target.value)))}
        className="studio-hub-range min-w-40 flex-1"
        style={{ ['--hub-zoom-fill' as string]: `${fillPct}%` }}
        aria-label="Voice speed"
      />
      <span className="w-10 shrink-0 rounded bg-white/[.05] px-1.5 py-0.5 text-center font-mono text-[9px] text-[var(--accent-2)]">
        {formatRate(numeric)}
      </span>
      <div className="hidden min-w-40 justify-between font-mono text-[8px] text-[var(--muted)] sm:flex">
        {RATE_STEPS.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onChange(formatRate(step))}
            className={`rounded px-1 py-0.5 transition hover:text-white ${
              step === numeric ? 'bg-[var(--accent)]/20 text-indigo-100' : ''
            }`}
          >
            {step > 0 ? `+${step}` : step}
          </button>
        ))}
      </div>
    </div>
  );
}

function rateToNumber(value: string) {
  const parsed = Number.parseInt(value.replace('%', ''), 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(-20, Math.min(20, Math.round(parsed / 10) * 10));
}

function formatRate(value: number) {
  const normalized = Math.max(-20, Math.min(20, Math.round(value / 10) * 10));
  return `${normalized >= 0 ? '+' : ''}${normalized}%`;
}
