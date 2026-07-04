'use client';

import type { ReactNode } from 'react';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';
import { AuthSessionProvider } from '@/features/auth/AuthSessionProvider';

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthSessionProvider>
      <WorkspaceShell>{children}</WorkspaceShell>
    </AuthSessionProvider>
  );
}
