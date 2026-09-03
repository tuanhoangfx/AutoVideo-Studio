'use client';

import { useEffect } from 'react';
import { HubAuthBrandIcon } from '@tool-workspace/hub-ui/auth/HubAuthBrandIcon';
import { WorkspaceAuthGate, createWorkspaceAuthGate } from '@tool-workspace/hub-ui/auth/WorkspaceAuthGate';
import {
  createHubOnlyAuthGateSubmit,
  createWorkspaceAuthGateHubEnvPartial,
  createWorkspaceAuthGateHubForgotPasswordFromEnv,
  devHubAutoSignIn,
  isDevAutoLoginEnabled,
} from '@tool-workspace/hub-identity';
import { hubAuthEnv } from '@/lib/hub-supabase-env';
import { applyHubIdentitySession, getIdentitySupabase, persistHubSession } from '@/lib/supabase-identity';
import { P0021_BRAND_ICON } from '@/lib/p0021-brand-icon';
import { useHubAuth } from './AuthSessionProvider';

const hubEnv = hubAuthEnv;

export function P0021AuthGate() {
  const { refreshSession } = useHubAuth();

  useEffect(() => {
    if (!isDevAutoLoginEnabled()) return;
    const client = getIdentitySupabase();
    if (!client) return;
    let cancelled = false;
    void (async () => {
      try {
        const ok = await devHubAutoSignIn(client);
        if (cancelled || !ok) return;
        await refreshSession();
      } catch {
        // Fall back to visible auth gate.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  return (
    <WorkspaceAuthGate
      {...createWorkspaceAuthGate({
        code: 'P0021',
        headerLeading: <HubAuthBrandIcon src={P0021_BRAND_ICON} />,
        onAuthed: () => {
          void refreshSession();
        },
        ...createWorkspaceAuthGateHubEnvPartial({
          env: hubEnv,
          getHubClient: getIdentitySupabase,
          prepareHubIdentitySession: applyHubIdentitySession,
        }),
        onSubmit: createHubOnlyAuthGateSubmit({
          getHubClient: getIdentitySupabase,
          persistSession: persistHubSession,
          afterSignup: async ({ hub, resolved, userId }) => {
            if (!resolved.loginId) return;
            await hub
              .from('profiles')
              .update({ login_id: resolved.loginId, updated_at: new Date().toISOString() })
              .eq('id', userId);
          },
        }),
        forgotPassword: createWorkspaceAuthGateHubForgotPasswordFromEnv({ env: hubEnv }),
      })}
    />
  );
}
