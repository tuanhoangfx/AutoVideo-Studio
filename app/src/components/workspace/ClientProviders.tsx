'use client';

import type { ReactNode } from 'react';
import { HubToolLoadingProvider, initHubUserZoom } from '@tool-workspace/hub-ui';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { AuthSessionProvider } from '@/features/auth/AuthSessionProvider';

const P0021_BRAND_ICON = '/icons/tools/P0021.svg';

if (typeof window !== 'undefined') {
  initHubUserZoom();
}

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <HubToolLoadingProvider toolCode="P0021" toolName="AutoVideo Studio" iconSrc={P0021_BRAND_ICON}>
      <AuthSessionProvider>
        <WorkspaceShell>{children}</WorkspaceShell>
      </AuthSessionProvider>
    </HubToolLoadingProvider>
  );
}
