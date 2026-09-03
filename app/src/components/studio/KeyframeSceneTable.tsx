'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Copy, ListOrdered, Shuffle } from 'lucide-react';
import {
  narrationTextForSceneWindow,
} from '@/lib/narration-timeline';
import {
  HUB_DIRECTORY_TABLE_PANE_CHROME_SPLIT_CLASS,
  HubDirectoryAdaptiveEditAction,
  HubDirectoryBulkActionBar,
  HubDirectoryDeleteBulkAction,
  HubDirectoryTableShell,
  HubSplitDirectoryPane,
  buildDirectoryColgroupForShell,
  buildDirectoryColumns,
  hubDirectoryFrameTableClass,
  hubSegmentActiveToneClass,
  hubSegmentIconSize,
  useDirectorySearchQuery,
  type FilterValues,
} from '@/lib/hub-ui';
import {
  buildKeyframeSceneFilters,
  matchesKeyframeSceneFilters,
} from '@/lib/keyframe-scene-filters';
import {
  KEYFRAME_SCENE_PAGE_SIZE,
  buildKeyframeSceneHubColumns,
  type KeyframeSceneColumnKey,
} from '@/lib/keyframe-scene-column-meta';
import {
  KEYFRAME_SCENE_DIRECTORY_COLUMNS_CHANGE,
  readKeyframeSceneDirectoryColumns,
} from '@/lib/keyframe-scene-directory-prefs';
import {
  renderKeyframeSceneDirectoryBodyCell,
  type KeyframeSceneRow,
} from '@/lib/keyframe-scene-directory-cells';
import {
  KEYFRAME_SCENE_DIRECTORY_FRAME_CLASS,
  KEYFRAME_SCENE_TOOLBAR_NARROW_MORE_CLASS,
  KEYFRAME_SCENE_TOOLBAR_WIDE_ROW_CLASS,
  type SceneOrderMode,
} from '@/lib/keyframe-scene-table-meta';
import type { SceneExportStatus } from '@/lib/keyframe-scene-export-skip';
import type { ExportDurationMode } from '@/lib/studio-export-settings';
import type { LibraryImage } from './ImageLibrary';
import { KeyframeSceneFilterPane } from './KeyframeSceneFilterPane';
import { StudioToolbarButton } from './StudioToolbar';
import type { Effect, ScriptLine, Transition } from './ScriptPanel';

const TABLE_WRAP_CLASS = HUB_DIRECTORY_TABLE_PANE_CHROME_SPLIT_CLASS;

type KeyframeSceneSortKey = KeyframeSceneColumnKey;

export function KeyframeSceneTable({
  lines,
  images,
  selectedIndex,
  selectedRows,
  setSelectedRows,
  onSelectScene,
  onOpenSceneDetail,
  onOpenBulkDetail,
  onDuplicateScenes,
  onRemoveScenes,
  onReorderScenes,
  onShuffleScenes,
  sceneOrderMode,
  onSceneOrderModeChange,
  imageDurationSec,
  exportDurations,
  starts,
  narrationCoverage,
  narrationScript,
  transcriptTimeSec,
  sceneExportStatus,
  resolvedExportDurations,
  useExportTimeline,
  exportDurationMode,
  onChangeTransition,
  onChangeEffect,
  waveforms,
  playheadSec,
  onPlayheadSec,
}: {
  lines: ScriptLine[];
  images: LibraryImage[];
  selectedIndex: number;
  selectedRows: number[];
  setSelectedRows: (rows: number[] | ((prev: number[]) => number[])) => void;
  onSelectScene: (i: number) => void;
  onOpenSceneDetail: (i: number) => void;
  onOpenBulkDetail: (indexes: number[]) => void;
  onDuplicateScenes: (indexes: number[]) => void;
  onRemoveScenes: (indexes: number[]) => void;
  onReorderScenes: (fromIndex: number, toIndex: number) => void;
  onShuffleScenes?: (indexes: number[]) => void;
  sceneOrderMode: SceneOrderMode;
  onSceneOrderModeChange: (mode: SceneOrderMode) => void;
  imageDurationSec: number;
  exportDurations: number[];
  starts: number[];
  narrationCoverage: ReturnType<typeof import('@/lib/narration-timeline').sceneNarrationCoverage>;
  narrationScript: string;
  transcriptTimeSec: number;
  sceneExportStatus: (index: number) => SceneExportStatus;
  resolvedExportDurations: number[];
  useExportTimeline: boolean;
  exportDurationMode: ExportDurationMode;
  onChangeTransition: (index: number, transition: Transition) => void;
  onChangeEffect: (index: number, effect: Effect) => void;
  waveforms?: number[][];
  playheadSec?: number;
  onPlayheadSec?: (sec: number) => void;
}) {
  const dragRowRef = useRef<number | null>(null);
  const { queryInput, setQueryInput, query, queryPending } = useDirectorySearchQuery();
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(() => readKeyframeSceneDirectoryColumns());

  useEffect(() => {
    const sync = () => setVisibleColumnKeys(readKeyframeSceneDirectoryColumns());
    window.addEventListener(KEYFRAME_SCENE_DIRECTORY_COLUMNS_CHANGE, sync);
    return () => window.removeEventListener(KEYFRAME_SCENE_DIRECTORY_COLUMNS_CHANGE, sync);
  }, []);
  const sceneFilters = useMemo(() => buildKeyframeSceneFilters(), []);

  const filterCtx = useMemo(
    () => ({ sceneExportStatus }),
    [sceneExportStatus],
  );

  const visibleIndices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lines.map((_, index) => index).filter((index) => {
      const line = lines[index];
      if (!matchesKeyframeSceneFilters(line, filterValues, { index, ...filterCtx })) return false;
      if (q) {
        const sceneLabel = `s${index + 1}`;
        const transcript = (line.text || '').toLowerCase();
        const coverage = narrationCoverage[index];
        const slice =
          narrationScript.trim() && coverage?.hasVoice
            ? narrationTextForSceneWindow(
                narrationScript,
                coverage.startSec,
                coverage.durationSec,
                transcriptTimeSec,
              ).toLowerCase()
            : '';
        if (!sceneLabel.includes(q) && !transcript.includes(q) && !slice.includes(q)) return false;
      }
      return true;
    });
  }, [filterCtx, filterValues, lines, narrationCoverage, narrationScript, query, transcriptTimeSec]);

  const tableItems = useMemo<KeyframeSceneRow[]>(
    () => visibleIndices.map((index) => ({ index, line: lines[index]! })),
    [lines, visibleIndices],
  );

  const selectedIds = useMemo(
    () => new Set(selectedRows.map((index) => String(index))),
    [selectedRows],
  );

  const allRowsSelected = lines.length > 0 && selectedRows.length === lines.length;

  const toggleSelectAllRows = () => {
    if (allRowsSelected) {
      setSelectedRows([]);
      return;
    }
    setSelectedRows(lines.map((_, index) => index));
  };

  const onToggleSelect = useCallback(
    (id: string) => {
      const index = Number(id);
      if (!Number.isFinite(index)) return;
      setSelectedRows((prev) =>
        prev.includes(index) ? prev.filter((row) => row !== index) : [...prev, index].sort((a, b) => a - b),
      );
    },
    [setSelectedRows],
  );

  const runShuffle = () => {
    if (lines.length <= 1) return;
    onSceneOrderModeChange('shuffle');
    const targets = selectedRows.length > 0 ? selectedRows : lines.map((_, index) => index);
    onShuffleScenes?.(targets);
  };

  const openSingleDetail = () => {
    if (selectedRows.length === 1) onOpenSceneDetail(selectedRows[0]!);
  };

  const openBulkDetail = () => {
    if (selectedRows.length > 1) onOpenBulkDetail(selectedRows);
  };

  const columns = useMemo(
    () =>
      buildDirectoryColumns(visibleColumnKeys, buildKeyframeSceneHubColumns()).map((col) => ({
        ...col,
        sortable: false,
      })),
    [visibleColumnKeys],
  );

  const colgroup = useMemo(
    () => buildDirectoryColgroupForShell(columns, { showSelect: true }),
    [columns],
  );

  const onGripDragStart = useCallback((index: number) => {
    dragRowRef.current = index;
  }, []);

  const onGripDragEnd = useCallback(() => {
    dragRowRef.current = null;
  }, []);

  const onRowDrop = useCallback(
    (toIndex: number) => {
      const from = dragRowRef.current;
      if (from != null && from !== toIndex) {
        onReorderScenes(from, toIndex);
        setSelectedRows([toIndex]);
        onSelectScene(toIndex);
      }
      dragRowRef.current = null;
    },
    [onReorderScenes, onSelectScene, setSelectedRows],
  );

  const renderRowCells = useCallback(
    (row: KeyframeSceneRow) => {
      const { index, line } = row;
      const image = images[line.image_index];
      const exportStatus = sceneExportStatus(index);
      const exportDur = resolvedExportDurations[index] ?? exportDurations[index] ?? imageDurationSec;
      const durationSec = line.durationSec ?? exportDurations[index] ?? imageDurationSec;
      const coverage = narrationCoverage[index];
      const cellCtx = {
        image,
        exportStatus,
        startSec: starts[index] ?? 0,
        durationSec,
        exportDur,
        useExportTimeline,
        exportDurationMode,
        narrationScript,
        transcriptTimeSec,
        coverage,
        waveforms,
        playheadSec,
        onPlayheadSec,
        sceneStartsSec: starts,
        sceneDurationsSec: lines.map(
          (line, rowIndex) => line.durationSec ?? exportDurations[rowIndex] ?? imageDurationSec,
        ),
        onGripDragStart,
        onGripDragEnd,
        onRowDrop,
        onChangeTransition,
        onChangeEffect,
      };
      return (
        <>
          {visibleColumnKeys.map((key) => {
            const col = columns.find((column) => column.key === key);
            return renderKeyframeSceneDirectoryBodyCell(key, col?.colClass ?? '', row, cellCtx);
          })}
        </>
      );
    },
    [
      columns,
      exportDurationMode,
      exportDurations,
      imageDurationSec,
      images,
      sceneExportStatus,
      narrationCoverage,
      narrationScript,
      onGripDragEnd,
      onGripDragStart,
      onRowDrop,
      onChangeEffect,
      onChangeTransition,
      playheadSec,
      onPlayheadSec,
      waveforms,
      resolvedExportDurations,
      starts,
      transcriptTimeSec,
      useExportTimeline,
      visibleColumnKeys,
    ],
  );

  const getRowClassName = useCallback(
    (row: KeyframeSceneRow) => {
      const status = sceneExportStatus(row.index);
      if (status === 'skipped') return 'opacity-60';
      if (status === 'partial') return 'opacity-90';
      if (row.index === selectedIndex) return 'is-detail';
      return '';
    },
    [sceneExportStatus, selectedIndex],
  );

  const resetKey = `${query}|${JSON.stringify(filterValues)}|${lines.length}|${visibleColumnKeys.join(',')}`;

  const bulkActions =
    lines.length > 0 ? (
      <>
        <div className={KEYFRAME_SCENE_TOOLBAR_WIDE_ROW_CLASS}>
          <HubDirectoryBulkActionBar
            selectAll={{
              visibleCount: lines.length,
              selectedCount: selectedRows.length,
              allVisibleSelected: allRowsSelected,
              onToggleSelectAll: toggleSelectAllRows,
              noun: 'scenes',
            }}
          >
            <SceneOrderModeToggle
              value={sceneOrderMode}
              disabled={lines.length <= 1}
              onSequential={() => onSceneOrderModeChange('sequential')}
              onShuffle={runShuffle}
            />
            <HubDirectoryAdaptiveEditAction
              selectedCount={selectedRows.length}
              singleLabel="Detail"
              bulkLabel="Bulk Detail"
              noneTitle="Select scenes to open detail"
              singleTitle="Open detail for selected scene"
              bulkTitle="Bulk-edit duration, transition, and effect"
              onEditSingle={openSingleDetail}
              onEditBulk={openBulkDetail}
            />
            <HubDirectoryDeleteBulkAction
              title="Delete selected scenes"
              disabled={selectedRows.length === 0}
              onClick={() => {
                onRemoveScenes(selectedRows);
                setSelectedRows([]);
              }}
            />
          </HubDirectoryBulkActionBar>
          <StudioToolbarButton
            tone="violet"
            icon={Copy}
            grow={false}
            onClick={() => onDuplicateScenes(selectedRows)}
            disabled={selectedRows.length === 0}
            title="Duplicate selected scenes"
          >
            Duplicate
          </StudioToolbarButton>
        </div>
        <div className={KEYFRAME_SCENE_TOOLBAR_NARROW_MORE_CLASS} />
      </>
    ) : null;

  return (
    <HubSplitDirectoryPane
      variant="rail"
      fixedRows={KEYFRAME_SCENE_PAGE_SIZE}
      partialPagePad="visible"
      className={`${KEYFRAME_SCENE_DIRECTORY_FRAME_CLASS} min-h-0 overflow-hidden rounded-xl`}
      filterBar={
        <KeyframeSceneFilterPane
          filters={sceneFilters}
          filterValues={filterValues}
          onFilterValuesChange={setFilterValues}
          query={queryInput}
          onQueryChange={setQueryInput}
          queryPending={queryPending}
          bulkActions={bulkActions}
        />
      }
    >
      <HubDirectoryTableShell
        items={tableItems}
        ariaLabel="Keyframe scenes"
        tableClassName={`${hubDirectoryFrameTableClass('8')} studio-keyframe-scene-table hub-users-table--directory`}
        wrapClassName={TABLE_WRAP_CLASS}
        flushWrap
        colgroup={colgroup}
        columns={columns}
        sortKey={'scene' as KeyframeSceneSortKey}
        sortDir="asc"
        onSort={() => {}}
        getRowKey={(row) => String(row.index)}
        onRowClick={(row) => {
          onSelectScene(row.index);
          setSelectedRows([row.index]);
        }}
        onRowDoubleClick={(row) => onOpenSceneDetail(row.index)}
        selectedIds={selectedIds}
        onToggleSelect={onToggleSelect}
        selectAllLabel="Select all scenes on this page"
        emptyMessage="No matching scenes."
        pageSize={KEYFRAME_SCENE_PAGE_SIZE}
        resetKey={resetKey}
        padBodyRowsToPageSize
        hideWhenSinglePage={false}
        getRowClassName={getRowClassName}
        renderRowCells={renderRowCells}
      />
    </HubSplitDirectoryPane>
  );
}

function SceneOrderModeToggle({
  value,
  disabled = false,
  onSequential,
  onShuffle,
}: {
  value: SceneOrderMode;
  disabled?: boolean;
  onSequential: () => void;
  onShuffle: () => void;
}) {
  const iconPx = hubSegmentIconSize();
  return (
    <div
      className={`hub-segment-toggle inline-flex h-[var(--hub-control-h)] shrink-0 items-center rounded-lg border border-white/10 bg-[var(--panel)] p-0.5 ${
        disabled ? 'pointer-events-none opacity-40' : ''
      }`}
      role="group"
      aria-label="Scene order mode"
    >
      <button
        type="button"
        onClick={onSequential}
        aria-pressed={value === 'sequential'}
        title="Sequential"
        className={`flex h-full items-center gap-1.5 rounded-md px-2.5 text-xs transition-colors ${
          value === 'sequential'
            ? hubSegmentActiveToneClass('emerald')
            : 'text-[var(--muted)] hover:text-[var(--text)]'
        }`}
      >
        <ListOrdered size={iconPx} aria-hidden />
        <span className="hub-segment-toggle__label">Sequential</span>
      </button>
      <button
        type="button"
        onClick={onShuffle}
        aria-pressed={value === 'shuffle'}
        title="Shuffle scene order (tap again to reshuffle)"
        className={`flex h-full items-center gap-1.5 rounded-md px-2.5 text-xs transition-colors ${
          value === 'shuffle' ? hubSegmentActiveToneClass('indigo') : 'text-[var(--muted)] hover:text-[var(--text)]'
        }`}
      >
        <Shuffle size={iconPx} aria-hidden />
        <span className="hub-segment-toggle__label">Shuffle</span>
      </button>
    </div>
  );
}
