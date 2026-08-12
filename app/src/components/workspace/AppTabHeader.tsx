'use client';

import { useMemo } from 'react';
import { GitBranch } from 'lucide-react';
import type { HubGlyphComponent } from '@/lib/hub-ui';
import {
  AppTabHeader as HubAppTabHeader,
  HubHeaderOpsPanels,
  type TabHeaderMetaItem,
  type TabHeaderStatItem,
} from '@/lib/hub-ui';
import { useP0021StudioNotify } from '@/lib/use-p0021-studio-notify';
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

/** Studio tab header — update status beside version; Notify · Log · Output settings. */
export function AppTabHeader(props: AppTabHeaderProps) {
  const notify = useP0021StudioNotify();

  const metaItems = useMemo(() => {
    const items = props.metaItems.map((item) => ({ ...item }));
    const versionIdx = items.findIndex(
      (item) => item.icon === GitBranch || /^v?\d+\.\d+/i.test(String(item.value)),
    );
    const idx = versionIdx >= 0 ? versionIdx : -1;
    if (idx >= 0 && items[idx]) {
      items[idx] = { ...items[idx], after: <HeaderUpdateButton /> };
    }
    return items;
  }, [props.metaItems]);

  return (
    <HubAppTabHeader
      {...props}
      metaItems={metaItems}
      actions={
        <HubHeaderOpsPanels
          log={{ variant: 'tab' }}
          notify={notify}
          trailing={<HeaderOutputSettings />}
        />
      }
    />
  );
}
