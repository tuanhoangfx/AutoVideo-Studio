'use client';

/* body-only-directory — FilterBar lives in VoiceFilterPane. */
/* read-only-directory — single active voice picker; no bulk checkbox column. */

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { voicePreviewUrl } from '@/lib/api';
import { voiceListPreviewText } from '@/lib/voice-preview-text';
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
import {
  VOICE_DIRECTORY_STATIC_COLUMNS,
  VOICE_RAIL_PAGE_SIZE,
  buildVoiceDirectoryColumns,
  type VoiceDirectoryColumnKey,
} from '@/lib/voice-directory-meta';
import {
  readVoiceRailDirectoryColumns,
  VOICE_RAIL_DIRECTORY_COLUMNS_CHANGE,
} from '@/lib/voice-directory-prefs';
import { AudioPreview } from './AudioPreview';
import { FlagBadge } from './FlagBadge';
import { GenderIcon } from './GenderIcon';

export type VoiceDirectoryRow = {
  id: string;
  label: string;
  gender: string;
  locale: string;
  tone: string;
  recommended?: boolean;
};

type VoiceDirectoryTableProps = {
  items: VoiceDirectoryRow[];
  activeVoiceId: string;
  favoriteIds: Set<string>;
  rate: string;
  resetKey: string;
  previewNonce?: number;
  onSelect: (voiceId: string) => void;
  onToggleFavorite: (voiceId: string) => void;
};

function renderVoiceDirectoryBodyCell(
  col: HubDirectoryTableColumn<VoiceDirectoryColumnKey>,
  voice: VoiceDirectoryRow,
) {
  const { key, colClass } = col;
  switch (key) {
    case 'gender':
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          <span className="grid place-items-center">
            <GenderIcon gender={voice.gender} />
          </span>
        </DirectoryTableBodyCell>
      );
    case 'name':
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass}>
          <span className="hub-users-name-title truncate">{voice.label}</span>
        </DirectoryTableBodyCell>
      );
    case 'locale':
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass} typographyClass="hub-users-cell-num">
          <span className="grid place-items-center">
            <FlagBadge locale={voice.locale} />
          </span>
        </DirectoryTableBodyCell>
      );
    case 'tone':
      return (
        <DirectoryTableBodyCell key={key} colClass={colClass} typographyClass="hub-users-cell-muted">
          <span className="truncate">{voice.tone}</span>
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

export const VoiceDirectoryTable = memo(function VoiceDirectoryTable({
  items,
  activeVoiceId,
  favoriteIds,
  rate,
  resetKey,
  previewNonce = 0,
  onSelect,
  onToggleFavorite,
}: VoiceDirectoryTableProps) {
  const [visibleKeys, setVisibleKeys] = useState(() => readVoiceRailDirectoryColumns());

  useEffect(() => {
    const sync = () => setVisibleKeys(readVoiceRailDirectoryColumns());
    window.addEventListener(VOICE_RAIL_DIRECTORY_COLUMNS_CHANGE, sync);
    return () => window.removeEventListener(VOICE_RAIL_DIRECTORY_COLUMNS_CHANGE, sync);
  }, []);

  const sortableValue = useCallback(
    (voice: VoiceDirectoryRow, key: VoiceDirectoryColumnKey) => {
      switch (key) {
        case 'name':
          return voice.label;
        case 'locale':
          return voice.locale;
        case 'tone':
          return voice.tone;
        default:
          return voice.id;
      }
    },
    [],
  );

  const { sortKey, sortDir, onSort, sorted } = useDirectoryTableSort(
    items,
    'name' as VoiceDirectoryColumnKey,
    sortableValue,
    'asc',
  );

  const columns = useMemo(
    () => buildDirectoryColumns(visibleKeys, buildVoiceDirectoryColumns()),
    [visibleKeys],
  );

  const colgroup = useMemo(
    () =>
      buildDirectoryColgroupForShell(columns, {
        showSelect: false,
        trailingCols: VOICE_DIRECTORY_STATIC_COLUMNS.map((col) => ({
          colClass: col.colClass,
          width: '4.75rem',
        })),
      }),
    [columns],
  );

  const renderRowCells = useCallback(
    (voice: VoiceDirectoryRow) => <>{columns.map((col) => renderVoiceDirectoryBodyCell(col, voice))}</>,
    [columns],
  );

  const renderStaticCells = useCallback(
    (voice: VoiceDirectoryRow) => {
      const favorite = favoriteIds.has(voice.id);
      return (
        <td
          className="hub-users-col--actions studio-voice-col--actions"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="studio-voice-actions-cell">
            <button
              type="button"
              onClick={() => onToggleFavorite(voice.id)}
              className={`grid h-5 w-5 place-items-center rounded-full transition ${
                favorite
                  ? 'bg-amber-400/15 text-amber-200'
                  : 'text-white/25 hover:bg-white/10 hover:text-amber-200'
              }`}
              title={favorite ? 'Remove favorite' : 'Add favorite'}
              aria-label={favorite ? `Remove favorite ${voice.label}` : `Favorite ${voice.label}`}
            >
              <Star size={12} className={favorite ? 'fill-amber-300' : ''} />
            </button>
            <AudioPreview
              key={voice.id}
              src={voicePreviewUrl(voiceListPreviewText(voice.id, voice.label), voice.id, rate)}
              compact
              autoPlayKey={voice.id === activeVoiceId ? previewNonce : undefined}
            />
          </div>
        </td>
      );
    },
    [activeVoiceId, favoriteIds, onToggleFavorite, previewNonce, rate],
  );

  const getRowClassName = useCallback(
    (voice: VoiceDirectoryRow) => (voice.id === activeVoiceId ? ' is-detail' : ''),
    [activeVoiceId],
  );

  return (
    <HubDirectoryTableShell
      items={sorted}
      ariaLabel="Voice directory"
      tableClassName={`${hubDirectoryTableClass('6')} hub-directory-frame-table studio-voice-rail-table`}
      wrapClassName={`${HUB_DIRECTORY_TABLE_SCROLL_FLEX_CLASS} ${HUB_DIRECTORY_TABLE_PANE_CHROME_SPLIT_CLASS}`}
      flushWrap
      colgroup={colgroup}
      columns={columns}
      staticColumns={VOICE_DIRECTORY_STATIC_COLUMNS}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      getRowKey={(voice) => voice.id}
      onRowClick={(voice) => onSelect(voice.id)}
      getRowClassName={getRowClassName}
      emptyMessage="No matching voices."
      pageSize={VOICE_RAIL_PAGE_SIZE}
      resetKey={`${resetKey}|${sortKey}|${sortDir}`}
      hideWhenSinglePage={false}
      renderRowCells={renderRowCells}
      renderStaticCells={renderStaticCells}
    />
  );
});
