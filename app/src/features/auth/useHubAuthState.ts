'use client';

import { useCallback, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  isRealHubWorkspaceSession,
  isWorkspaceAnonymousAllowed,
  resolveWithBootTimeout,
  sessionsEqual,
  useDevHubAutoSignInBoot,
  useWorkspaceHubAuthBoot,
  WORKSPACE_AUTH_BOOT_TIMEOUT_MS,
} from '@tool-workspace/hub-identity';
import { ensureHubAuth, signInHubIdentity } from '@/lib/hub-auth-client';
import { API_UNAUTHORIZED_EVENT } from '@/lib/api-auth-token';
import { cacheHubIdentity, clearHubIdentity } from '@/lib/hub-identity-session';
import { isHubSupabaseConfigured } from '@/lib/hub-supabase-env';
import { getIdentitySupabase, persistHubSession, readCachedHubSession } from '@/lib/supabase-identity';

export type HubAuthState = {
  session: Session | null;
  hubEmail: string | null;
  hubUserId: string | null;
  loading: boolean;
  hubConfigured: boolean;
  authRequired: boolean;
  policyReady: boolean;
  refreshSession: (opts?: { boot?: boolean }) => Promise<void>;
  signIn: (loginInput: string, password: string, mode?: 'signin' | 'signup') => Promise<void>;
  signOut: () => Promise<void>;
};

function initialAuthState(): { session: Session | null; loading: boolean } {
  if (!isHubSupabaseConfigured) {
    return { session: null, loading: false };
  }
  const cached = readCachedHubSession();
  if (isRealHubWorkspaceSession(cached)) {
    return { session: cached, loading: !isWorkspaceAnonymousAllowed() };
  }
  return { session: null, loading: !isWorkspaceAnonymousAllowed() };
}

export function useHubAuthState(): HubAuthState {
  const initial = initialAuthState();
  const [session, setSession] = useState<Session | null>(initial.session);
  const [loading, setLoading] = useState(initial.loading);
  const signoutRecoveryRef = useRef(false);
  const authOptional = isWorkspaceAnonymousAllowed();

  const refreshSession = useCallback(async (opts?: { boot?: boolean }) => {
    if (!isHubSupabaseConfigured) {
      setSession(null);
      setLoading(false);
      return;
    }

    const showBlockingLoader = opts?.boot && !readCachedHubSession();
    if (showBlockingLoader) setLoading(true);

    try {
      const resolved = await resolveWithBootTimeout(
        () => ensureHubAuth(),
        opts?.boot,
        null,
        WORKSPACE_AUTH_BOOT_TIMEOUT_MS,
      );
      if (resolved) {
        setSession((prev) => (sessionsEqual(prev, resolved) ? prev : resolved));
        return;
      }
      if (!readCachedHubSession()) setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (loginInput: string, password: string, mode: 'signin' | 'signup' = 'signin') => {
    const next = await signInHubIdentity(loginInput, password, mode);
    setSession(next);
    setLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    clearHubIdentity();
    const client = getIdentitySupabase();
    if (client) await client.auth.signOut();
    setSession(null);
    setLoading(false);
  }, []);

  useDevHubAutoSignInBoot({
    enabled: isHubSupabaseConfigured && !authOptional,
    getClient: getIdentitySupabase,
    readCachedSession: readCachedHubSession,
    onSession: (next) => {
      persistHubSession(next);
      setSession(next);
      setLoading(false);
    },
    onBootLoading: setLoading,
  });

  const { authRequired, policyReady } = useWorkspaceHubAuthBoot({
    isHubConfigured: () => isHubSupabaseConfigured,
    readCachedHubSession,
    resolveAuthRequired: async () => isHubSupabaseConfigured && !authOptional,
    fallbackAuthRequired: () => isHubSupabaseConfigured && !authOptional,
    refreshSession,
    checkToolAccess: async () => true,
    getIdentityClient: getIdentitySupabase,
    persistHubSession,
    onHubSignedOut: () => {
      if (signoutRecoveryRef.current) return;
      const cached = readCachedHubSession();
      if (cached) {
        signoutRecoveryRef.current = true;
        void refreshSession().finally(() => {
          signoutRecoveryRef.current = false;
        });
        return;
      }
      setSession(null);
    },
    onHubSignedIn: (next) => {
      setSession((prev) => (sessionsEqual(prev, next) ? prev : next));
      setLoading(false);
    },
    onAuthNotRequired: () => setLoading(false),
    onBootStart: () => setLoading(true),
    apiUnauthorizedEvent: API_UNAUTHORIZED_EVENT,
    isToolHubOrigin: () => false,
    onHubRelayReceived: (snapshot) => {
      cacheHubIdentity(snapshot);
      void refreshSession();
    },
    tokenScheduler: { start: () => {}, stop: () => {} },
    hubAccessToken: session?.access_token,
  });

  const effectiveLoading = authRequired && (loading || !policyReady);

  return {
    session,
    hubEmail: session?.user?.email ?? null,
    hubUserId: session?.user?.id ?? null,
    loading: effectiveLoading,
    hubConfigured: isHubSupabaseConfigured,
    authRequired,
    policyReady,
    refreshSession,
    signIn,
    signOut,
  };
}
