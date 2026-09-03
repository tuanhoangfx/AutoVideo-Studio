import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isVoicePreviewPrefetched,
  prefetchVoicePreview,
  scheduleVoicePreviewPrefetch,
  takeVoicePreviewPrefetch,
} from './voice-preview-prefetch';

describe('voice-preview-prefetch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('prefetches preview mp3 and marks ready', async () => {
    const payload = new Uint8Array(128);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      headers: { get: (key: string) => (key === 'X-TTS-Provider' ? 'edge' : null) },
      blob: async () => new Blob([payload], { type: 'audio/mpeg' }),
    } as Response);

    const src = 'http://127.0.0.1:8021/voices/preview?text=hi&voice=en-US-JennyNeural';
    expect(isVoicePreviewPrefetched(src)).toBe(false);
    await prefetchVoicePreview(src);
    expect(isVoicePreviewPrefetched(src)).toBe(true);
    expect(takeVoicePreviewPrefetch(src)?.provider).toBe('edge');
  });

  it('debounces hover prefetch by ~300ms', async () => {
    vi.useFakeTimers();
    const payload = new Uint8Array(128);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      headers: { get: () => null },
      blob: async () => new Blob([payload], { type: 'audio/mpeg' }),
    } as Response);

    const src = 'http://127.0.0.1:8021/voices/preview?text=warm&voice=en-US-AvaNeural';
    const cancel = scheduleVoicePreviewPrefetch(src, 300);
    expect(fetchMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(299);
    expect(fetchMock).not.toHaveBeenCalled();

    cancel();
    await vi.advanceTimersByTimeAsync(10);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
