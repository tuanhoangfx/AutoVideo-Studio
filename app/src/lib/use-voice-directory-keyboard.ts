'use client';

import { useEffect, type RefObject } from 'react';
import { createVoiceDirectoryKeyDownHandler } from '@/lib/voice-directory-keyboard';

export function useVoiceDirectoryKeyboard({
  items,
  activeId,
  onSelect,
  onPreview,
  containerRef,
  enabled = true,
}: {
  items: { id: string }[];
  activeId: string;
  onSelect: (id: string) => void;
  onPreview: () => void;
  containerRef: RefObject<HTMLElement | null>;
  enabled?: boolean;
}) {
  useEffect(() => {
    if (!enabled) return;
    const el = containerRef.current;
    if (!el) return;

    const onKeyDown = createVoiceDirectoryKeyDownHandler({
      items,
      activeId,
      onSelect,
      onPreview,
    });

    el.addEventListener('keydown', onKeyDown);
    return () => el.removeEventListener('keydown', onKeyDown);
  }, [activeId, containerRef, enabled, items, onPreview, onSelect]);
}
