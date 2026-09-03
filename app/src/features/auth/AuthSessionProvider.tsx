'use client';

import { createAuthSessionProvider } from '@tool-workspace/hub-ui/auth/createAuthSessionProvider';
import { useHubAuthState, type HubAuthState } from './useHubAuthState';

export const { AuthSessionProvider, useAuth: useHubAuth } = createAuthSessionProvider<HubAuthState>(
  useHubAuthState,
  'useHubAuth',
);
