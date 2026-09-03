import { useMemo, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Settings2 } from 'lucide-react';
import {
  isWorkspaceAnonymousAllowed,
  resolveWorkspaceAuthPaint,
} from '@tool-workspace/hub-identity';
import { HubAuthBootPanel } from '@tool-workspace/hub-ui/auth/HubAuthBootPanel';
import { HubAuthBrandIcon } from '@tool-workspace/hub-ui/auth/HubAuthBrandIcon';
import { HubLoaderRoot } from '@tool-workspace/hub-ui/shell/HubLoaderRoot';
import { hubMainShellClassFromManifest, type ToolManifestUiShell } from '@tool-workspace/hub-ui/shell/hub-main-shell-class';
import { HubAppLogProvider } from '@/lib/hub-ui';
import { p0021ScreenFromPath } from '@/lib/p0021-nav-structure';
import { AppTabHeader } from './AppTabHeader';
import { useHubAuth } from '@/features/auth/AuthSessionProvider';
import { P0021AuthGate } from '@/features/auth/P0021AuthGate';
import { GlobalJobPoller } from './GlobalJobPoller';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { P0021_BRAND_ICON } from '@/lib/p0021-brand-icon';
import toolManifest from '../../../../tool.manifest.json';
const P0021_UI_SHELL = toolManifest.uiShell as ToolManifestUiShell;

/** P0003 StealthAppShell / P0010 Video Lab — hub-app + stealth-hub-main SSOT. */
export function WorkspaceShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const { session, loading, authRequired, policyReady, hubConfigured } = useHubAuth();
  const activeScreen = p0021ScreenFromPath(pathname);
  const isStudio = activeScreen === 'studio';

  const header = useMemo(() => {
    if (activeScreen === 'system') {
      return {
        ariaLabel: 'System tab header',
        titleIcon: Settings2,
        titleIconClass: 'text-violet-300',
        title: 'System',
      };
    }
    return {
      ariaLabel: 'AutoVideo Studio tab header',
      titleIcon: AutoVideoBrandIcon,
      titleIconClass: 'text-indigo-300',
      title: 'AutoVideo Studio',
    };
  }, [activeScreen]);

  const loginMandatory = hubConfigured && !isWorkspaceAnonymousAllowed();
  const effectiveAuthRequired = loginMandatory || authRequired;

  const authPaint = resolveWorkspaceAuthPaint({
    configured: hubConfigured,
    unconfigured: 'app',
    authRequired: effectiveAuthRequired,
    policyReady,
    hasSession: Boolean(session),
    sessionLoading: loading,
  });
  const needsAuthGate = authPaint === 'gate';
  const authBootBlocking = authPaint === 'boot';

  let mainBody: ReactNode = children;
  if (needsAuthGate) {
    mainBody = (
      <div className="flex min-h-[50vh] items-center justify-center py-8">
        <P0021AuthGate />
      </div>
    );
  } else if (authBootBlocking) {
    mainBody = (
      <div className="flex min-h-[50vh] items-center justify-center py-8">
        <HubAuthBootPanel
          title="Welcome to AutoVideo Studio"
          toolInfo={{ name: 'AutoVideo Studio', tagline: 'Local video studio & render jobs' }}
          headerLeading={<HubAuthBrandIcon src={P0021_BRAND_ICON} />}
          status="Checking workspace session…"
        />
      </div>
    );
  }

  const logPersistKey = session?.user?.id ? `P0021:${session.user.id}` : 'P0021:anon';

  return (
    <HubAppLogProvider
      persistKey={logPersistKey}
      activeScreen={activeScreen}
      bootLog={{ scope: 'App', message: 'AutoVideo Studio started', screen: activeScreen }}
    >
      <div className="hub-app theme-hub stealth-hub-app flex h-full min-h-0 min-h-dvh w-full overflow-hidden">
        <GlobalJobPoller />
        <WorkspaceSidebar />

        <main
          ref={mainRef}
          className={hubMainShellClassFromManifest(activeScreen, P0021_UI_SHELL, 'stealth-hub-main')}
        >
          <HubLoaderRoot mainRef={mainRef} />
          {!isStudio && <AppTabHeader {...header} />}
          <div className={isStudio ? 'flex min-h-0 flex-1 flex-col overflow-hidden' : 'py-3'}>
            {mainBody}
          </div>
        </main>
      </div>
    </HubAppLogProvider>
  );
}

function AutoVideoBrandIcon({
  size = 16,
  className = '',
  'aria-hidden': ariaHidden,
}: {
  size?: string | number;
  className?: string;
  'aria-hidden'?: boolean;
}) {
  const dimension = typeof size === 'number' ? size : Number.parseInt(String(size), 10) || 16;

  return (
    <img
      src={P0021_BRAND_ICON}
      alt=""
      width={dimension}
      height={dimension}
      className={`shrink-0 ${className}`}
      aria-hidden={ariaHidden}
      decoding="async"
    />
  );
}
