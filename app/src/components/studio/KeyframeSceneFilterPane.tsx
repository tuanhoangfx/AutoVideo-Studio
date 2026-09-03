'use client';

import { memo, type ReactNode } from 'react';
import { HubSplitDirectoryFilterBar, type FilterDef, type FilterValues } from '@/lib/hub-ui';
import { KeyframeSceneColumnSettings } from './KeyframeSceneColumnSettings';

/**
 * Keyframe scene searchbar — P0005 Orders 2-row SSOT:
 * Row 1: search · Display
 * Row 2: Transition / Effect (left) · bulk actions (right)
 */
export const KeyframeSceneFilterPane = memo(function KeyframeSceneFilterPane({
  filters,
  filterValues,
  onFilterValuesChange,
  query,
  onQueryChange,
  queryPending = false,
  bulkActions,
}: {
  filters: FilterDef[];
  filterValues: FilterValues;
  onFilterValuesChange: (values: FilterValues) => void;
  query: string;
  onQueryChange: (value: string) => void;
  queryPending?: boolean;
  bulkActions?: ReactNode;
}) {
  return (
    <HubSplitDirectoryFilterBar
      shortcutScope="keyframe-scenes"
      placeholder="Search scene, transcript…"
      filters={filters}
      query={query}
      onQueryChange={onQueryChange}
      queryPending={queryPending}
      values={filterValues}
      onValuesChange={onFilterValuesChange}
      searchTrailing={<KeyframeSceneColumnSettings />}
      row2Actions={bulkActions}
    />
  );
});
