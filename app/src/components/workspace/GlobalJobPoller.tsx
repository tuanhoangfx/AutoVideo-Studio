'use client';

import { useEffect } from 'react';
import { ensureJobPollCoordinatorStarted } from '@/lib/job-poll-coordinator';

/** Polls worker for all in-progress exports; auto-downloads when done (any route). */
export function GlobalJobPoller() {
  useEffect(() => {
    ensureJobPollCoordinatorStarted();
  }, []);
  return null;
}
