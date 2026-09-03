import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
/** Direct vendor subpaths — do not depend on narrow `@/lib/hub-ui` barrel for Display. */
import { HubDirectorySettings } from '@tool-workspace/hub-ui/shell/HubDirectorySettings';
import { patchHubListPrefs, readHubListPrefsCore } from '@tool-workspace/hub-ui/lib/hub-url-prefs';
import { triggerHubSettingsOpen } from '@tool-workspace/hub-ui/keyboard/hub-keyboard-shortcuts';
import {
  STUDIO_JOB_KPI_DEFAULT_KEYS,
  STUDIO_JOB_KPI_PREF_ITEMS,
} from '@/lib/studio/studio-job-kpi-items';
import type { P0021Screen } from '@/lib/p0021-nav-structure';
import { p0021ScreenFromPath } from '@/lib/p0021-nav-structure';
import { StudioOutputSettingsPanel } from './StudioOutputSettingsPanel';
import { SystemStatsIntervalSection } from './SystemStatsIntervalSection';

/** Hub Directory Settings — header (`sidebarRow=false`) + sidebar footer (`sidebarRow`). */
export function StudioDisplayPrefs({
  sidebarRow = false,
  screen,
}: {
  sidebarRow?: boolean;
  screen?: P0021Screen;
}) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const activeScreen = screen ?? p0021ScreenFromPath(pathname);
  const subTab = activeScreen === 'system' ? (searchParams.get('stab') ?? '') : '';

  useEffect(() => {
    const onOpen = () => {
      triggerHubSettingsOpen();
    };
    window.addEventListener('studio-output-settings-open', onOpen);
    return () => window.removeEventListener('studio-output-settings-open', onOpen);
  }, []);

  return (
    <HubDirectorySettings
      sidebarRow={sidebarRow}
      readPrefs={readHubListPrefsCore}
      patchPrefs={(patch) => patchHubListPrefs(patch)}
      getScreen={() => activeScreen}
      getSubTab={() => subTab}
      kpis={STUDIO_JOB_KPI_PREF_ITEMS}
      defaultKpiKeys={new Set(STUDIO_JOB_KPI_DEFAULT_KEYS)}
      toolSections={[
        {
          id: 'output',
          label: 'Output',
          icon: <SlidersHorizontal size={14} aria-hidden />,
          body: <StudioOutputSettingsPanel />,
        },
      ]}
      displayExtras={sidebarRow ? <SystemStatsIntervalSection /> : undefined}
    />
  );
}
