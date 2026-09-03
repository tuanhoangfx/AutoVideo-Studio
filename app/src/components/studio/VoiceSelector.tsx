'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gauge, Volume2 } from 'lucide-react';
import type { SubtitleStyle, TTSProvider } from '@/lib/api';
import { HubSplitDirectoryPane, useDirectorySearchQuery } from '@/lib/hub-ui';
import { BGM_OPTIONS, bgmOptionToFile, bgmTrackIdFromFile } from '@/lib/bgm-options';
import { useBgmDirectoryFilters } from '@/lib/use-bgm-directory-filters';
import { useVoiceDirectoryFilters } from '@/lib/use-voice-directory-filters';
import { useVoiceDirectoryKeyboard } from '@/lib/use-voice-directory-keyboard';
import { useStudioVoiceCatalog } from '@/lib/use-studio-voice-catalog';
import { BgmDirectoryTable } from './BgmDirectoryTable';
import { VoiceDirectoryTable } from './VoiceDirectoryTable';
import { VoiceFilterPane, type StudioAudioRailMode } from './VoiceFilterPane';

const FAVORITE_VOICES_KEY = 'p0021:studio:favorite-voices:v1';
const FAVORITE_BGM_KEY = 'p0021:studio:favorite-bgm:v1';
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
  const { voices: voiceCatalog } = useStudioVoiceCatalog();
  const { queryInput, setQueryInput, query } = useDirectorySearchQuery();
  const [audioMode, setAudioMode] = useState<StudioAudioRailMode>('voice');
  const [localeFilters, setLocaleFilters] = useState<string[]>([]);
  const [genderFilters, setGenderFilters] = useState<string[]>([]);
  const [moodFilters, setMoodFilters] = useState<string[]>([]);
  const [genreFilters, setGenreFilters] = useState<string[]>([]);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [previewNonce, setPreviewNonce] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [favoriteVoiceIds, setFavoriteVoiceIds] = useState<string[]>([]);
  const [favoriteBgmIds, setFavoriteBgmIds] = useState<string[]>([]);
  const [bgmSelecting, setBgmSelecting] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const parsed = JSON.parse(localStorage.getItem(FAVORITE_VOICES_KEY) || '[]');
      const next = Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
      setFavoriteVoiceIds(next);
    } catch {}
    try {
      const parsed = JSON.parse(localStorage.getItem(FAVORITE_BGM_KEY) || '[]');
      const next = Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
      setFavoriteBgmIds(next);
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
      localStorage.setItem(FAVORITE_BGM_KEY, JSON.stringify(favoriteBgmIds));
    } catch {}
  }, [favoriteBgmIds]);

  useEffect(() => {
    try {
      localStorage.setItem(AUDIO_RAIL_MODE_KEY, audioMode);
    } catch {}
  }, [audioMode]);

  useEffect(() => {
    if (provider !== 'edge') onProvider('edge');
  }, [provider, onProvider]);

  const voiceMode = audioMode === 'voice';
  const favoriteVoiceSet = useMemo(() => new Set(favoriteVoiceIds), [favoriteVoiceIds]);
  const favoriteBgmSet = useMemo(() => new Set(favoriteBgmIds), [favoriteBgmIds]);
  const activeBgmTrackId = bgmTrackIdFromFile(bgm);

  const voiceFiltersState = useVoiceDirectoryFilters({
    voices: voiceCatalog,
    query,
    localeFilters,
    genderFilters,
    favoriteOnly: voiceMode && favoriteOnly,
    favoriteIds: favoriteVoiceSet,
    setLocaleFilters,
    setGenderFilters,
  });

  const bgmFiltersState = useBgmDirectoryFilters({
    tracks: BGM_OPTIONS,
    query,
    moodFilters,
    genreFilters,
    favoriteOnly: !voiceMode && favoriteOnly,
    favoriteIds: favoriteBgmSet,
    setMoodFilters,
    setGenreFilters,
  });

  const toggleVoiceFavorite = useCallback((id: string) => {
    setFavoriteVoiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const toggleBgmFavorite = useCallback((id: string) => {
    setFavoriteBgmIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const bumpPreview = useCallback(() => {
    setPreviewNonce((value) => value + 1);
  }, []);

  const selectBgmTrack = useCallback(
    async (trackId: string) => {
      const track = BGM_OPTIONS.find((item) => item.id === trackId);
      if (!track) return;
      setBgmSelecting(true);
      try {
        const file = await bgmOptionToFile(track);
        onSetBgm(file);
      } catch (e) {
        console.warn('[bgm] select track failed:', e);
      } finally {
        setBgmSelecting(false);
      }
    },
    [onSetBgm],
  );

  useVoiceDirectoryKeyboard({
    items: voiceFiltersState.filteredVoices,
    activeId: voice,
    onSelect: onVoice,
    onPreview: bumpPreview,
    containerRef,
    enabled: voiceMode,
  });

  useVoiceDirectoryKeyboard({
    items: bgmFiltersState.filteredTracks,
    activeId: activeBgmTrackId ?? '',
    onSelect: (id) => void selectBgmTrack(id),
    onPreview: bumpPreview,
    containerRef,
    enabled: !voiceMode,
  });

  const activeFilters = voiceMode ? voiceFiltersState : bgmFiltersState;
  const favoriteCount = voiceMode
    ? mounted
      ? favoriteVoiceIds.length
      : 0
    : mounted
      ? favoriteBgmIds.length
      : 0;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="flex h-full min-h-0 flex-col gap-2 outline-none focus:outline-none"
    >
      <HubSplitDirectoryPane
        variant="rail"
        className="studio-voice-directory-frame hub-directory-frame min-h-0 flex-1"
        filterBar={
          <VoiceFilterPane
            audioMode={audioMode}
            onAudioModeChange={setAudioMode}
            filters={activeFilters.filters}
            filterValues={activeFilters.filterValues}
            onFilterValuesChange={activeFilters.handleFilterValuesChange}
            query={queryInput}
            onQueryChange={setQueryInput}
            favoriteOnly={favoriteOnly}
            favoriteCount={favoriteCount}
            onToggleFavoriteOnly={() => setFavoriteOnly((value) => !value)}
            subtitleStyle={subtitleStyle}
            onSubtitleStyleChange={onSubtitleStyle}
            onUploadBgm={voiceMode ? undefined : onSetBgm}
          />
        }
      >
        {voiceMode ? (
          <VoiceDirectoryTable
            items={voiceFiltersState.filteredVoices}
            activeVoiceId={voice}
            favoriteIds={favoriteVoiceSet}
            rate={rate}
            resetKey={voiceFiltersState.listResetKey}
            previewNonce={previewNonce}
            onSelect={onVoice}
            onToggleFavorite={toggleVoiceFavorite}
          />
        ) : (
          <BgmDirectoryTable
            items={bgmFiltersState.filteredTracks}
            activeTrackId={activeBgmTrackId}
            favoriteIds={favoriteBgmSet}
            resetKey={bgmFiltersState.listResetKey}
            previewNonce={previewNonce}
            onSelect={(id) => void selectBgmTrack(id)}
            onToggleFavorite={toggleBgmFavorite}
          />
        )}
      </HubSplitDirectoryPane>
      {voiceMode ? (
        <VoiceSpeedSlider value={rate} onChange={onRate} />
      ) : (
        <BgmVolumeSlider value={bgmVolume} onChange={onBgmVolume} selecting={bgmSelecting} hasBgm={Boolean(bgm)} />
      )}
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

function BgmVolumeSlider({
  value,
  onChange,
  selecting,
  hasBgm,
}: {
  value: number;
  onChange: (volume: number) => void;
  selecting: boolean;
  hasBgm: boolean;
}) {
  const fillPct = value * 100;
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-lg border border-white/10 bg-black/15 px-3 py-1">
      <div className="flex w-20 shrink-0 items-center gap-1.5 text-[10px] font-semibold text-white/75">
        <Volume2 size={12} className="text-amber-300" />
        Volume
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="studio-hub-range min-w-40 flex-1 accent-amber-400"
        style={{ ['--hub-zoom-fill' as string]: `${fillPct}%` }}
        aria-label="BGM volume"
        disabled={!hasBgm || selecting}
      />
      <span className="w-10 shrink-0 rounded bg-white/[.05] px-1.5 py-0.5 text-center font-mono text-[9px] text-amber-200">
        {Math.round(value * 100)}%
      </span>
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
