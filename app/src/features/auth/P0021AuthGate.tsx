'use client';

import { useEffect, useMemo } from 'react';
import { WorkspaceAuthGate, createWorkspaceAuthGate, HubAuthBrandIcon } from '@tool-workspace/hub-ui';
import { devHubAutoSignIn, isDevAutoLoginEnabled } from '@tool-workspace/hub-identity';
import { isHubSupabaseConfigured } from '@/lib/hub-supabase-env';
import { applyHubIdentitySession, getIdentitySupabase } from '@/lib/supabase-identity';
import { useHubAuth } from './AuthSessionProvider';

export function P0021AuthGate() {
  const { signIn, refreshSession } = useHubAuth();
  const profileRoleClient = useMemo(
    () => (isHubSupabaseConfigured ? getIdentitySupabase() : null),
    [],
  );

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
        profileRoleClient,
        onPrepareProfileRoleClient: async () => {
          await applyHubIdentitySession();
        },
        onSubmit: async (login, password, mode) => {
          try {
            await signIn(login, password, mode);
          } catch (err) {
            return { error: err instanceof Error ? err.message : String(err) };
          }
        },
        forgotPassword: {
          isHubConfigured: () => isHubSupabaseConfigured,
          resetPasswordForEmail: async (authEmail, redirectTo) => {
            const hub = getIdentitySupabase();
            if (!hub) throw new Error('Tool Hub Supabase is not configured.');
            return hub.auth.resetPasswordForEmail(authEmail, { redirectTo });
          },
        },
      })}
    />
  );
}
