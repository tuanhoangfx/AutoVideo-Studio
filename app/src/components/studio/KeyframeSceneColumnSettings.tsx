'use client';

import {
  DirectoryTableColumnsSettings,
  HubDirectoryDisplayPanel,
} from '@/lib/hub-ui';
import {
  KEYFRAME_SCENE_DIRECTORY_COLUMN_ITEMS,
  keyframeSceneDirectoryColumnPrefs,
} from '@/lib/keyframe-scene-directory-prefs';

/** Search-row Display — HubDirectoryDisplayPanel SSOT (not a row-2 Columns chip). */
export function KeyframeSceneColumnSettings() {
  return (
    <HubDirectoryDisplayPanel
      getScreen={() => 'studio'}
      showPageSize={false}
      tableSectionFirst
      tableSectionLabel="Table columns"
      tablePanel={
        <DirectoryTableColumnsSettings
          items={KEYFRAME_SCENE_DIRECTORY_COLUMN_ITEMS}
          prefs={keyframeSceneDirectoryColumnPrefs}
          showReset
          reorderable={false}
        />
      }
    />
  );
}
