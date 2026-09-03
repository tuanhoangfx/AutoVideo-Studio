import { describe, expect, it, vi, afterEach } from 'vitest';
import { clearBgmPreviewPreloadCache, preloadBgmPreview, takePreloadedBgmBlob } from '@/lib/bgm-preview-preload';

describe('bgm-preview-preload', () => {
  afterEach(() => {
    clearBgmPreviewPreloadCache();
    vi.restoreAllMocks();
  });

  it('dedupes fetch per src', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      blob: async () => new Blob([new Uint8Array(128)]),
    } as Response);
    preloadBgmPreview('/bgm/SoundHelix-Song-1.mp3');
    preloadBgmPreview('/bgm/SoundHelix-Song-1.mp3');
    const blob = await takePreloadedBgmBlob('/bgm/SoundHelix-Song-1.mp3');
    expect(blob?.size).toBeGreaterThan(64);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
