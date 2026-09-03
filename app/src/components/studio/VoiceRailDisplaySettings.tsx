'use client';

import { useEffect, useState } from 'react';
import { Captions, Columns3 } from 'lucide-react';
import {
  DirectoryTableColumnsSettings,
  HubDirectoryDisplayPanel,
  HubSegmentToggle,
  hubSegmentIconSize,
} from '@/lib/hub-ui';
import type { SubtitleStyle } from '@/lib/api';
import {
  VOICE_DIRECTORY_COLUMN_ITEMS,
  voiceRailDirectoryColumnPrefs,
} from '@/lib/voice-directory-prefs';
import { SubtitlePanel } from './SubtitlePanel';

type DisplayTab = 'columns' | 'subtitle';

/** Row-1 Display — HubDirectoryDisplayPanel SSOT (columns + subtitle, no count badge). */
export function VoiceRailDisplaySettings({
  voiceMode,
  subtitleStyle,
  onSubtitleStyleChange,
}: {
  voiceMode: boolean;
  subtitleStyle: SubtitleStyle;
  onSubtitleStyleChange: (style: SubtitleStyle) => void;
}) {
  const [tab, setTab] = useState<DisplayTab>(voiceMode ? 'columns' : 'subtitle');
  const iconSize = hubSegmentIconSize();

  useEffect(() => {
    if (!voiceMode && tab === 'columns') setTab('subtitle');
  }, [tab, voiceMode]);

  return (
    <HubDirectoryDisplayPanel
      getScreen={() => 'studio'}
      showPageSize={false}
      tableSectionFirst
      tableSectionLabel={voiceMode ? 'Table columns' : 'Subtitle'}
      tablePanel={
        <>
          {voiceMode ? (
            <div className="mb-3">
              <HubSegmentToggle
                value={tab}
                onChange={setTab}
                className="w-full"
                options={[
                  {
                    value: 'columns',
                    label: 'Columns',
                    icon: <Columns3 size={iconSize} />,
                    activeTone: 'indigo',
                  },
                  {
                    value: 'subtitle',
                    label: 'Subtitle',
                    icon: <Captions size={iconSize} />,
                    activeTone: 'sky',
                  },
                ]}
              />
            </div>
          ) : (
            <div className="mb-2 text-[11px] font-semibold text-white/80">Subtitle</div>
          )}
          {tab === 'columns' && voiceMode ? (
            <DirectoryTableColumnsSettings
              items={VOICE_DIRECTORY_COLUMN_ITEMS}
              prefs={voiceRailDirectoryColumnPrefs}
              showReset
              reorderable={false}
            />
          ) : (
            <SubtitlePanel value={subtitleStyle} onChange={onSubtitleStyleChange} />
          )}
        </>
      }
    />
  );
}
