'use client';

/* body-only-directory — FilterBar lives in VoiceFilterPane. */
/* read-only-directory — single active BGM picker; no bulk checkbox column. */

import { memo, useCallback, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import type { BgmOption } from '@/lib/bgm-options';
import { bgmOptionPreviewSrc, formatBgmDuration } from '@/lib/bgm-options';
import { preloadBgmPreview } from '@/lib/bgm-preview-preload';
import {
  BGM_DIRECTORY_COLUMN_KEYS,
  BGM_DIRECTORY_STATIC_COLUMNS,
  BGM_RAIL_PAGE_SIZE,
  buildBgmDirectoryColumns,
  type BgmDirectoryColumnKey,
} from '@/lib/bgm-directory-meta';
import {
  DirectoryTableBodyCell,
  HUB_DIRECTORY_TABLE_PANE_CHROME_SPLIT_CLASS,
  HUB_DIRECTORY_TABLE_SCROLL_FLEX_CLASS,
  HubDirectoryTableShell,
  buildDirectoryColgroupForShell,
  buildDirectoryColumns,
  hubDirectoryTableClass,
  useDirectoryTableSort,
  type HubDirectoryTableColumn,
} from '@/lib/hub-ui';
import { BgmAudioPreview } from './BgmAudioPreview';

const MOOD_EMOJI: Record<BgmOption['mood'], string> = {
  calm: '🌊',
  upbeat: '⚡',
  cinematic: '🎬',
  lofi: '☕',
};

const GENRE_LABEL: Record<BgmOption['genre'], string> = {
  ambient: 'Ambient',
  electronic: 'Electronic',
  acoustic: 'Acoustic',
  corporate: 'Corporate',
};

type BgmDirectoryTableProps = {
  items: BgmOption[];
  activeTrackId: string | null;
  favoriteIds: Set<string>;
  resetKey: string;
  previewNonce?: number;
  onSelect: (trackId: string) => void;
  onToggleFavorite: (trackId: string) => void;
};

function renderBgmDirectoryBodyCell(
  col: HubDirectoryTableColumn<BgmDirectoryColumnKey>,
  track: BgmOption,
) {
  const { key, colClass } = col;
  switch (key) {
    case 'mood':
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          <span className="grid place-items-center text-sm leading-none" aria-hidden>
            {MOOD_EMOJI[track.mood]}
          </span>
        </DirectoryTableBodyCell>
      );
    case 'name':
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          <span className="hub-users-name-title truncate">{track.label}</span>
        </DirectoryTableBodyCell>
      );
    case 'genre':
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass} typographyClass="hub-users-cell-muted">
          <span className="truncate">{GENRE_LABEL[track.genre]}</span>
        </DirectoryTableBodyCell>
      );
    case 'duration':
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass} typographyClass="hub-users-cell-num">
          <span className="font-mono">{formatBgmDuration(track.durationSec)}</span>
        </DirectoryTableBodyCell>
      );
    default:
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          —
        </DirectoryTableBodyCell>
      );
  }
}

export const BgmDirectoryTable = memo(function BgmDirectoryTable({
  items,
  activeTrackId,
  favoriteIds,
  resetKey,
  previewNonce = 0,
  onSelect,
  onToggleFavorite,
}: BgmDirectoryTableProps) {
  const columns = useMemo(() => buildDirectoryColumns(BGM_DIRECTORY_COLUMN_KEYS, buildBgmDirectoryColumns()), []);

  const sortableValue = useCallback((track: BgmOption, key: BgmDirectoryColumnKey) => {
    switch (key) {
      case 'name':
        return track.label;
      case 'genre':
        return track.genre;
      case 'duration':
        return track.durationSec;
      case 'mood':
        return track.mood;
      default:
        return track.id;
    }
  }, []);

  const { sortKey, sortDir, onSort, sorted } = useDirectoryTableSort(
    items,
    'name' as BgmDirectoryColumnKey,
    sortableValue,
    'asc',
  );

  const colgroup = useMemo(
    () =>
      buildDirectoryColgroupForShell(columns, {
        showSelect: false,
        trailingCols: BGM_DIRECTORY_STATIC_COLUMNS.map((col) => ({
          colClass: col.colClass,
          width: '4.75rem',
        })),
      }),
    [columns],
  );

  const renderRowCells = useCallback(
    (track: BgmOption) => <>{columns.map((col) => renderBgmDirectoryBodyCell(col, track))}</>,
    [columns],
  );

  const renderStaticCells = useCallback(
    (track: BgmOption) => {
      const favorite = favoriteIds.has(track.id);
      return (
        <td
          className="hub-users-col--actions studio-bgm-col--actions"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="studio-voice-actions-cell">
            <button
              type="button"
              onClick={() => onToggleFavorite(track.id)}
              className={`grid h-5 w-5 place-items-center rounded-full transition ${
                favorite
                  ? 'bg-amber-400/15 text-amber-200'
                  : 'text-white/25 hover:bg-white/10 hover:text-amber-200'
              }`}
              title={favorite ? 'Remove favorite' : 'Add favorite'}
              aria-label={favorite ? `Remove favorite ${track.label}` : `Favorite ${track.label}`}
            >
              <Star size={12} className={favorite ? 'fill-amber-300' : ''} />
            </button>
            <BgmAudioPreview
              key={track.id}
              src={bgmOptionPreviewSrc(track)}
              compact
              autoPlayKey={track.id === activeTrackId ? previewNonce : undefined}
            />
          </div>
        </td>
      );
    },
    [activeTrackId, favoriteIds, onToggleFavorite, previewNonce],
  );

  const getRowClassName = useCallback(
    (track: BgmOption) => (track.id === activeTrackId ? ' is-detail' : ''),
    [activeTrackId],
  );

  return (
    <HubDirectoryTableShell
      items={sorted}
      ariaLabel="BGM directory"
      tableClassName={`${hubDirectoryTableClass('6')} hub-directory-frame-table studio-bgm-rail-table studio-voice-rail-table`}
      wrapClassName={`${HUB_DIRECTORY_TABLE_SCROLL_FLEX_CLASS} ${HUB_DIRECTORY_TABLE_PANE_CHROME_SPLIT_CLASS}`}
      flushWrap
      colgroup={colgroup}
      columns={columns}
      staticColumns={BGM_DIRECTORY_STATIC_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      getRowKey={(track) => track.id}
      onRowClick={(track) => onSelect(track.id)}
      onRowMouseEnter={(track) => preloadBgmPreview(bgmOptionPreviewSrc(track))}
      getRowClassName={getRowClassName}
      emptyMessage="No matching tracks."
      pageSize={BGM_RAIL_PAGE_SIZE}
      resetKey={`${resetKey}|${sortKey}|${sortDir}`}
      hideWhenSinglePage={false}
      renderRowCells={renderRowCells}
      renderStaticCells={renderStaticCells}
    />
  );
});
