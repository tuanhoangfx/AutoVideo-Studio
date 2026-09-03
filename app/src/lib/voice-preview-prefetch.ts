type PrefetchedPreview = {
  blob: Blob;
  provider: string | null;
};

const prefetched = new Map<string, PrefetchedPreview>();
const inflight = new Map<string, Promise<PrefetchedPreview | null>>();
const readyListeners = new Map<string, Set<() => void>>();

function notifyReady(src: string) {
  readyListeners.get(src)?.forEach((cb) => cb());
}

export function isVoicePreviewPrefetched(src: string): boolean {
  return Boolean(src && prefetched.has(src));
}

export function takeVoicePreviewPrefetch(src: string): PrefetchedPreview | null {
  if (!src) return null;
  const entry = prefetched.get(src);
  if (!entry) return null;
  return entry;
}

export function subscribeVoicePreviewReady(src: string, listener: () => void): () => void {
  if (!src) return () => {};
  let set = readyListeners.get(src);
  if (!set) {
    set = new Set();
    readyListeners.set(src, set);
  }
  set.add(listener);
  return () => {
    set?.delete(listener);
    if (set && set.size === 0) readyListeners.delete(src);
  };
}

/** Warm worker TTS preview cache (SHA-1 mp3 on disk) without playing audio. */
export async function prefetchVoicePreview(src: string): Promise<void> {
  if (!src?.trim() || prefetched.has(src) || inflight.has(src)) {
    await inflight.get(src);
    return;
  }

  const task = (async (): Promise<PrefetchedPreview | null> => {
    try {
      const resp = await fetch(src);
      if (!resp.ok) return null;
      const blob = await resp.blob();
      if (blob.size < 64) return null;
      const entry: PrefetchedPreview = {
        blob,
        provider: resp.headers.get('X-TTS-Provider'),
      };
      prefetched.set(src, entry);
      notifyReady(src);
      return entry;
    } catch {
      return null;
    } finally {
      inflight.delete(src);
    }
  })();

  inflight.set(src, task);
  await task;
}

const hoverTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Debounced hover prefetch (~300ms). Returns cancel fn for mouseleave. */
export function scheduleVoicePreviewPrefetch(src: string, delayMs = 300): () => void {
  if (!src?.trim()) return () => {};
  const existing = hoverTimers.get(src);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    hoverTimers.delete(src);
    void prefetchVoicePreview(src);
  }, delayMs);
  hoverTimers.set(src, timer);

  return () => {
    const pending = hoverTimers.get(src);
    if (pending) {
      clearTimeout(pending);
      hoverTimers.delete(src);
    }
  };
}
