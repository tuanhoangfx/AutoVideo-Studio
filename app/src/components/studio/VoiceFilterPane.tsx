'use client';

import { memo } from 'react';
import { Mic2, Music, Star } from 'lucide-react';
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
}) {
  const voiceMode = audioMode === 'voice';
  const iconSize = hubSegmentIconSize();

  return (
    <HubSplitDirectoryFilterBar
      shortcutScope="voice-rail"
      placeholder="Search voice, code, locale..."
      hideSearch={!voiceMode}
      filters={voiceMode ? filters : []}
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
        voiceMode ? (
          <button
            type="button"
            onClick={onToggleFavoriteOnly}
            className={`hub-filter-chip shrink-0 ${favoriteOnly ? 'active' : ''}`}
            title="Show favorite voices only"
            aria-label="Favorites"
            aria-pressed={favoriteOnly}
          >
            <Star size={12} className={favoriteOnly ? 'fill-amber-300 text-amber-200' : 'text-[var(--muted)]'} />
            <span className="studio-voice-chip-label">Favorites</span>
            <span className="grid h-4 min-w-[var(--hub-count-badge-min-w)] place-items-center rounded-full bg-black/20 px-1 font-mono text-[9px] text-[var(--muted)]">
              {favoriteCount}
            </span>
          </button>
        ) : undefined
      }
    />
  );
});
