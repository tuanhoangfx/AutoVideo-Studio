import { describe, expect, it } from 'vitest';
import { BGM_OPTIONS, bgmPreviewUrl, bgmOptionPreviewSrc } from '@/lib/bgm-options';

describe('bgmPreviewUrl', () => {
  it('serves same-origin paths for vite proxy / public mirror', () => {
    expect(bgmPreviewUrl('SoundHelix-Song-1.mp3')).toBe('/bgm/SoundHelix-Song-1.mp3');
    expect(bgmOptionPreviewSrc(BGM_OPTIONS[0]!)).toBe('/bgm/SoundHelix-Song-1.mp3');
  });
});
