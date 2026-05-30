/** Shorten worker/ffmpeg errors for Studio UI. */
export function formatJobErrorForUi(raw: string | null | undefined): string {
  if (!raw?.trim()) return 'Export failed.';
  const text = raw.trim();
  if (text.startsWith('ffmpeg failed:')) return text;
  if (text.includes('FFmpegRenderError:')) {
    const idx = text.indexOf('FFmpegRenderError:');
    return text.slice(idx + 'FFmpegRenderError:'.length).trim() || text;
  }
  if (text.includes('CalledProcessError')) {
    const ffmpegIdx = text.indexOf('ffmpeg failed:');
    if (ffmpegIdx >= 0) return text.slice(ffmpegIdx);
    return 'Video encode failed. Close other exports and try Export again (desktop uses CPU encoder).';
  }
  if (text.length > 220) return `${text.slice(0, 217)}…`;
  return text;
}
