'use client';

import type { HubGlyphComponent } from '@/lib/hub-ui';
import { AppTabHeader as HubAppTabHeader, type TabHeaderMetaItem, type TabHeaderStatItem } from '@/lib/hub-ui';
import { HeaderOutputSettings, HeaderUpdateButton } from './AppTabHeaderActions';

export type { TabHeaderMetaItem, TabHeaderStatItem };

type AppTabHeaderProps = {
  ariaLabel: string;
  titleIcon: HubGlyphComponent;
  titleIconClass?: string;
  title: string;
  metaItems: TabHeaderMetaItem[];
  centerStats: TabHeaderStatItem[];
};

/** Studio tab header — canonical hub-ui shell + studio-specific actions slot. */
export function AppTabHeader(props: AppTabHeaderProps) {
  return (
    <HubAppTabHeader
      {...props}
      actions={
        <>
          <HeaderUpdateButton />
          <HeaderOutputSettings />
        </>
      }
    />
  );
}
