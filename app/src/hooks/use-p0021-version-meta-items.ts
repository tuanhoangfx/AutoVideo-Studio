'use client';

import { useMemo } from 'react';
import { buildConsoleVersionMetaItems } from '@/lib/hub-ui';
import { APP_RELEASE_VERSION, autoVideoVersionClockInput } from '@/lib/app-release';
import toolManifest from '../../../tool.manifest.json';
import { useAutoVideoDesktopUpdate } from './useAutoVideoDesktopUpdate';

/** Version meta rail — Session is rendered by hub-ui AppTabHeader. */
export function useP0021VersionMetaItems() {
  const metaItems = useMemo(
    () => buildConsoleVersionMetaItems(APP_RELEASE_VERSION, toolManifest, autoVideoVersionClockInput()),
    [],
  );
  const desktopUpdate = useAutoVideoDesktopUpdate();
  return { metaItems, desktopUpdate };
}
