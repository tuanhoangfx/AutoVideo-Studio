import { useEffect, type ReactNode } from 'react';
import { HubToolLoadingProvider } from '@tool-workspace/hub-ui/loading/HubToolLoadingContext';
import { initHubUserZoom } from '@tool-workspace/hub-ui/hub-user-zoom';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { AuthSessionProvider } from '@/features/auth/AuthSessionProvider';
import { P0021_BRAND_ICON } from '@/lib/p0021-brand-icon';

export function ClientProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    initHubUserZoom();
  }, []);

  return (
    <HubToolLoadingProvider toolCode="P0021" toolName="AutoVideo Studio" iconSrc={P0021_BRAND_ICON}>
      <AuthSessionProvider>
        <WorkspaceShell>{children}</WorkspaceShell>
      </AuthSessionProvider>
    </HubToolLoadingProvider>
  );
}
