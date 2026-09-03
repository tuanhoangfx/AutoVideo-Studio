import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Settings2 } from 'lucide-react';
import { hubSessionLabels, resolveWorkspaceShellSession } from '@tool-workspace/hub-identity';
import { applyFirstVisitNavGroupDefaults } from '@tool-workspace/hub-ui/shell/applyFirstVisitNavGroupDefaults';
import { HubSidebarNavList } from '@tool-workspace/hub-ui/shell/HubSidebarNavList';
import { HubLogButton } from '@tool-workspace/hub-ui/shell/HubLogButton';
import { HubUiZoomControl } from '@tool-workspace/hub-ui/shell/HubUiZoomControl';
import { HubWorkspaceUserShell } from '@tool-workspace/hub-ui/auth/HubWorkspaceUserShell';
import { useNavGroupOpenState } from '@tool-workspace/hub-ui/shell/useNavGroupOpenState';
import { useWorkspaceRoleKey } from '@tool-workspace/hub-ui/auth/useWorkspaceRoleKey';
import { HubSidebarBrandIcon, HubSidebarFooterButton, HubSidebarShell } from '@/lib/hub-ui';
import {
  P0021_NAV_GROUP_IDS,
  P0021_NAV_STRUCTURE,
  P0021_NAV_SUBNAV_PREFIX,
  p0021PathFromScreen,
  p0021ScreenFromPath,
} from '@/lib/p0021-nav-structure';
import { useHubAuth } from '@/features/auth/AuthSessionProvider';
import { getIdentitySupabase, readCachedHubSession } from '@/lib/supabase-identity';
import { P0021_BRAND_ICON } from '@/lib/p0021-brand-icon';
import { StudioDisplayPrefs } from './StudioDisplayPrefs';

/** Golden sidebar — P0020 `WorkspaceSidebar` parity (HubSidebarShell SSOT). */
export function WorkspaceSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { session, hubConfigured, signOut } = useHubAuth();
  const labels = hubSessionLabels(session);
  const activeScreen = p0021ScreenFromPath(pathname);
  const { groupOpen, setGroupSubnavOpen } = useNavGroupOpenState(P0021_NAV_SUBNAV_PREFIX, P0021_NAV_GROUP_IDS);
  const { roleKey } = useWorkspaceRoleKey(session, {
    profileRoleClient: getIdentitySupabase() as never,
    profileRoleUserId: session?.user?.id,
    profileRoleEmail: session?.user?.email,
  });

  useEffect(() => {
    applyFirstVisitNavGroupDefaults({
      prefix: P0021_NAV_SUBNAV_PREFIX,
      structure: P0021_NAV_STRUCTURE,
      activeScreen,
      setGroupSubnavOpen,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount + route screen
  }, [activeScreen, setGroupSubnavOpen]);

  return (
    <HubSidebarShell
      brandLeading={<HubSidebarBrandIcon src={P0021_BRAND_ICON} alt="AutoVideo Studio" />}
      brandTitle="AutoVideo Studio"
      nav={
        <HubSidebarNavList
          structure={P0021_NAV_STRUCTURE}
          activeScreen={activeScreen}
          groupOpen={groupOpen}
          setGroupSubnavOpen={setGroupSubnavOpen}
          showToggleIcon={false}
          onNavigateScreen={(screen) => navigate(p0021PathFromScreen(screen))}
          onSelectView={() => undefined}
        />
      }
      footer={
        <>
          {hubConfigured ? (
            <HubWorkspaceUserShell
              session={resolveWorkspaceShellSession(session, readCachedHubSession())}
              labels={labels}
              roleKey={roleKey}
              getHubClient={() => getIdentitySupabase() as never}
              profileRoleClient={getIdentitySupabase() as never}
              profileRoleUserId={session?.user?.id}
              profileRoleEmail={session?.user?.email}
              footerTitle="Open workspace user information"
              emptyEmailLabel="Not signed in"
              onSignOut={async () => {
                await signOut();
                return true;
              }}
            />
          ) : (
            <HubSidebarFooterButton
              icon={Settings2}
              iconClass="text-violet-400"
              label="User"
              title="Hub login not configured"
              disabled
            />
          )}
          <HubLogButton variant="global" />
          <StudioDisplayPrefs sidebarRow screen={activeScreen} />
          <HubUiZoomControl />
        </>
      }
    />
  );
}
