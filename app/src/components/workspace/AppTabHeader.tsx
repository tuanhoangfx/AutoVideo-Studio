import type { HubGlyphComponent } from '@/lib/hub-ui';
import { useLocation } from 'react-router-dom';
import {
  HubHeaderOpsPanels,
  HubListChromeHeader,
  type TabHeaderStatItem,
} from '@/lib/hub-ui';
import { useHostHeaderStats } from '@/hooks/use-host-header-stats';
import { useP0021VersionMetaItems } from '@/hooks/use-p0021-version-meta-items';
import { useP0021StudioNotify } from '@/lib/use-p0021-studio-notify';
import { p0021ScreenFromPath } from '@/lib/p0021-nav-structure';
import { StudioDisplayPrefs } from './StudioDisplayPrefs';

export type { TabHeaderMetaItem, TabHeaderStatItem } from '@/lib/hub-ui';

type AppTabHeaderProps = {
  ariaLabel: string;
  titleIcon: HubGlyphComponent;
  titleIconClass?: string;
  title: string;
  /** Optional domain stats (e.g. System tab). When omitted, center = CPU/RAM host stats. */
  centerStats?: TabHeaderStatItem[];
};

/**
 * Hub tab header — P0003 Profiles parity:
 * Title · Session · version meta (left) · CPU/RAM (center) · Notify · Log · Settings (right).
 */
export function AppTabHeader(props: AppTabHeaderProps) {
  const { pathname } = useLocation();
  const activeScreen = p0021ScreenFromPath(pathname);
  const notify = useP0021StudioNotify();
  const { metaItems, desktopUpdate } = useP0021VersionMetaItems();
  const hostCenterStats = useHostHeaderStats();
  const centerStats = props.centerStats ?? hostCenterStats;

  return (
    <HubListChromeHeader
      ariaLabel={props.ariaLabel}
      titleIcon={props.titleIcon}
      titleIconClass={props.titleIconClass}
      title={props.title}
      metaItems={metaItems}
      versionReleaseNotesCode="P0021"
      versionReleaseNotesDesktopUpdate={desktopUpdate}
      centerStats={centerStats}
      actions={
        <span className="inline-flex min-w-0 items-center gap-2">
          <HubHeaderOpsPanels
            log={{ variant: 'tab' }}
            notify={notify}
            trailing={<StudioDisplayPrefs screen={activeScreen} />}
          />
        </span>
      }
    />
  );
}
