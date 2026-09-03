'use client';

import { memo, useRef } from 'react';
import { Mic2, Music, Star, Upload } from 'lucide-react';
import {
  HubSegmentToggle,
  HubSplitDirectoryFilterBar,
  hubSegmentIconSize,
  type FilterDef,
  type FilterValues,
} from '@/lib/hub-ui';
import type { SubtitleStyle } from '@/lib/api';
import { VoiceRailDisplaySettings } from './VoiceRailDisplaySettings';

export type StudioAudioRailMode = 'voice' | 'music';

/**
 * Audio directory searchbar — 2-row SSOT:
 * Row 1: search · display (columns + subtitle) · voice/bgm toggle
 * Row 2: filters (left) · bulk actions (right)
 */
export const VoiceFilterPane = memo(function VoiceFilterPane({
  audioMode,
  onAudioModeChange,
  filters,
  filterValues,
  onFilterValuesChange,
  query,
  onQueryChange,
  favoriteOnly,
  favoriteCount,
  onToggleFavoriteOnly,
  subtitleStyle,
  onSubtitleStyleChange,
  onUploadBgm,
}: {
  audioMode: StudioAudioRailMode;
  onAudioModeChange: (mode: StudioAudioRailMode) => void;
  filters: FilterDef[];
  filterValues: FilterValues;
  onFilterValuesChange: (values: FilterValues) => void;
  query: string;
  onQueryChange: (value: string) => void;
  favoriteOnly: boolean;
  favoriteCount: number;
  onToggleFavoriteOnly: () => void;
  subtitleStyle: SubtitleStyle;
  onSubtitleStyleChange: (style: SubtitleStyle) => void;
  onUploadBgm?: (file: File) => void;
}) {
  const voiceMode = audioMode === 'voice';
  const iconSize = hubSegmentIconSize();
  const uploadRef = useRef<HTMLInputElement>(null);

  return (
    <HubSplitDirectoryFilterBar
      shortcutScope={voiceMode ? 'voice-rail' : 'bgm-rail'}
      placeholder={voiceMode ? 'Search voice, code, locale...' : 'Search track, mood, genre...'}
      filters={filters}
      query={query}
      onQueryChange={onQueryChange}
      values={filterValues}
      onValuesChange={onFilterValuesChange}
      searchTrailing={
        <VoiceRailDisplaySettings
          voiceMode={voiceMode}
          subtitleStyle={subtitleStyle}
          onSubtitleStyleChange={onSubtitleStyleChange}
        />
      }
      toolbar={
        <HubSegmentToggle
          value={audioMode}
          onChange={onAudioModeChange}
          options={[
            {
              value: 'voice',
              label: 'Voice',
              icon: <Mic2 size={iconSize} />,
              activeTone: 'indigo',
            },
            {
              value: 'music',
              label: 'BGM',
              icon: <Music size={iconSize} />,
              activeTone: 'amber',
            },
          ]}
        />
      }
      row2Actions={
        <>
          <button
            type="button"
            onClick={onToggleFavoriteOnly}
            className={`hub-filter-chip hub-filter-chip--icon-only shrink-0 ${favoriteOnly ? 'active' : ''}`}
            title={
              voiceMode
                ? `Favorites (${favoriteCount})`
                : `Favorite tracks (${favoriteCount})`
            }
            aria-label={`Favorites (${favoriteCount})`}
            aria-pressed={favoriteOnly}
          >
            <Star size={12} className={favoriteOnly ? 'fill-amber-300 text-amber-200' : 'text-[var(--muted)]'} />
            {favoriteCount > 0 ? (
              <span className="grid h-4 min-w-[var(--hub-count-badge-min-w)] place-items-center rounded-full bg-black/20 px-1 font-mono text-[9px] text-[var(--muted)]">
                {favoriteCount}
              </span>
            ) : null}
          </button>
          {!voiceMode && onUploadBgm ? (
            <button
              type="button"
              onClick={() => uploadRef.current?.click()}
              className="hub-filter-chip hub-filter-chip--icon-only shrink-0"
              title="Upload custom BGM (mp3/wav)"
              aria-label="Upload BGM"
            >
              <Upload size={12} className="text-[var(--muted)]" />
            </button>
          ) : null}
          {!voiceMode && onUploadBgm ? (
            <input
              ref={uploadRef}
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/m4a"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadBgm(file);
                e.target.value = '';
              }}
            />
          ) : null}
        </>
      }
    />
  );
});
