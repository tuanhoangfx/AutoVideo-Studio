'use client';

import { useEffect, useState } from 'react';
import type { VoiceOption } from '@/lib/voice-options';
import {
  ensureStudioVoiceCatalogLoaded,
  getStudioVoiceCatalog,
  getStudioVoiceCatalogSource,
  isStudioVoiceCatalogLoading,
  subscribeStudioVoiceCatalog,
} from '@/lib/voice-catalog-runtime';

export function useStudioVoiceCatalog(): {
  voices: VoiceOption[];
  source: 'static' | 'worker';
  loading: boolean;
} {
  const [voices, setVoices] = useState(() => getStudioVoiceCatalog());
  const [source, setSource] = useState(() => getStudioVoiceCatalogSource());
  const [loading, setLoading] = useState(() => isStudioVoiceCatalogLoading());

  useEffect(() => {
    ensureStudioVoiceCatalogLoaded();
    const sync = () => {
      setVoices(getStudioVoiceCatalog());
      setSource(getStudioVoiceCatalogSource());
      setLoading(isStudioVoiceCatalogLoading());
    };
    return subscribeStudioVoiceCatalog(sync);
  }, []);

  return { voices, source, loading };
}
