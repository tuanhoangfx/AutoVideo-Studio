import * as api from '@/lib/api';

export type OutputVerifyResult =
  | { ok: true; size: number; contentType: string }
  | { ok: false; reason: string };

const MIN_OUTPUT_BYTES = 50_000;

export async function verifyJobOutputFile(
  jobId: string,
  minBytes = MIN_OUTPUT_BYTES
): Promise<OutputVerifyResult> {
  const url = api.resolveWorkerAssetUrl(api.outputUrl(jobId));
  try {
    let response = await fetch(url, { method: 'HEAD' });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, { headers: { Range: 'bytes=0-0' } });
    }
    if (!response.ok) {
      return { ok: false, reason: `HTTP ${response.status}` };
    }
    const contentType = response.headers.get('content-type') || '';
    if (contentType && !/video\/|application\/octet-stream/i.test(contentType)) {
      const snippet = contentType.includes('text') ? ' (HTML/error page)' : '';
      return { ok: false, reason: `Invalid content-type: ${contentType}${snippet}` };
    }
    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > 0 && contentLength < minBytes) {
      return { ok: false, reason: `File too small (${contentLength} bytes)` };
    }
    return { ok: true, size: contentLength, contentType };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'Verify failed' };
  }
}

/** Wait until output file size is stable (ffmpeg finished flushing). */
export async function waitForStableJobOutput(
  jobId: string,
  minBytes = MIN_OUTPUT_BYTES,
  attempts = 8,
  intervalMs = 400
): Promise<void> {
  let lastSize = -1;
  let stableHits = 0;
  for (let i = 0; i < attempts; i++) {
    const verify = await verifyJobOutputFile(jobId, minBytes);
    if (!verify.ok) {
      stableHits = 0;
      lastSize = -1;
    } else {
      const size = verify.size > 0 ? verify.size : minBytes;
      if (size === lastSize && size >= minBytes) {
        stableHits += 1;
        if (stableHits >= 2) return;
      } else {
        stableHits = 0;
        lastSize = size;
      }
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

export async function fetchJobOutputBlob(jobId: string, minBytes = MIN_OUTPUT_BYTES): Promise<Blob> {
  await waitForStableJobOutput(jobId, minBytes);
  const verify = await verifyJobOutputFile(jobId, minBytes);
  if (!verify.ok) throw new Error(verify.reason);

  const url = api.resolveWorkerAssetUrl(api.outputUrl(jobId));
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  if (contentType && !/video\/|application\/octet-stream/i.test(contentType)) {
    const text = await response.text().catch(() => '');
    throw new Error(`Unexpected content-type: ${contentType}. ${text.slice(0, 120)}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength < minBytes) {
    throw new Error(`Downloaded file is too small (${arrayBuffer.byteLength} bytes).`);
  }
  const mime =
    contentType && /video\//i.test(contentType)
      ? contentType.split(';')[0].trim()
      : url.toLowerCase().includes('.mov')
      ? 'video/quicktime'
      : 'video/mp4';
  return new Blob([arrayBuffer], { type: mime });
}
