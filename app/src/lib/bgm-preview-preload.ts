const preloadCache = new Map<string, Promise<Blob>>();

/** Warm BGM preview bytes on row hover — first click avoids cold fetch. */
export function preloadBgmPreview(src: string): void {
  const url = src?.trim();
  if (!url || preloadCache.has(url)) return;
  preloadCache.set(
    url,
    fetch(url).then(async (resp) => {
      if (!resp.ok) throw new Error(`preload ${resp.status}`);
      const blob = await resp.blob();
      if (blob.size < 64) throw new Error('preload empty');
      return blob;
    }),
  );
  void preloadCache.get(url)!.catch(() => {
    preloadCache.delete(url);
  });
}

export async function takePreloadedBgmBlob(src: string): Promise<Blob | null> {
  const url = src?.trim();
  if (!url) return null;
  const pending = preloadCache.get(url);
  if (!pending) return null;
  try {
    return await pending;
  } catch {
    preloadCache.delete(url);
    return null;
  }
}

export function clearBgmPreviewPreloadCache(): void {
  preloadCache.clear();
}
