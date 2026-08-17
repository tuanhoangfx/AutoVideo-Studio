'use client';

import { useEffect } from 'react';
import { WorkspaceAuthGate, createWorkspaceAuthGate, HubAuthBrandIcon } from '@tool-workspace/hub-ui';
import {
  createWorkspaceAuthGateHubEnvPartial,
  createWorkspaceAuthGateHubForgotPasswordFromEnv,
  devHubAutoSignIn,
  isDevAutoLoginEnabled,
} from '@tool-workspace/hub-identity';
import { hubAuthEnv } from '@/lib/hub-supabase-env';
import { applyHubIdentitySession, getIdentitySupabase } from '@/lib/supabase-identity';
import { useHubAuth } from './AuthSessionProvider';

const hubEnv = hubAuthEnv;

export function P0021AuthGate() {
  const { signIn, refreshSession } = useHubAuth();

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
        headerLeading: <HubAuthBrandIcon src="/icons/tools/P0021.svg" />,
        ...createWorkspaceAuthGateHubEnvPartial({
          env: hubEnv,
          getHubClient: getIdentitySupabase,
          prepareHubIdentitySession: applyHubIdentitySession,
        }),
        onSubmit: async (login, password, mode) => {
          try {
            await signIn(login, password, mode);
          } catch (err) {
            return { error: err instanceof Error ? err.message : String(err) };
          }
        },
        forgotPassword: createWorkspaceAuthGateHubForgotPasswordFromEnv({ env: hubEnv }),
      })}
    />
  );
}
