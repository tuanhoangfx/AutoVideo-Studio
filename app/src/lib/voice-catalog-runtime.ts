import { getWorkerUrl } from '@/lib/api';
import type { VoiceOption } from '@/lib/voice-options';
import { VOICE_OPTIONS } from '@/lib/voice-options';
import { setRuntimeVoiceIds } from '@/lib/voice-catalog';

const LABEL_OVERRIDES: Record<string, string> = {
  'vi-VN-HoaiMyNeural': 'Hoài My',
  'vi-VN-NamMinhNeural': 'Nam Minh',
};

export type WorkerVoiceEntry = {
  ShortName?: string;
  FriendlyName?: string;
  Gender?: string;
  Locale?: string;
};

let catalog: VoiceOption[] = VOICE_OPTIONS;
let catalogSource: 'static' | 'worker' = 'static';
let catalogLoading = false;
let catalogFetchStarted = false;
const listeners = new Set<() => void>();

function localeBucket(short: string): string {
  const parts = short.split('-');
  return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : short;
}

function labelFromWorkerVoice(v: WorkerVoiceEntry): string {
  const short = String(v.ShortName ?? '');
  if (short in LABEL_OVERRIDES) return LABEL_OVERRIDES[short]!;
  let friendly = String(v.FriendlyName ?? '');
  friendly = friendly.replace(/^Microsoft\s+/, '');
  friendly = friendly.replace(/\s+Online.*$/, '');
  friendly = friendly.replace(/\s*\(Natural\).*$/, '');
  let label = friendly.trim() || short.split('-').pop()?.replace('Neural', '') || short;
  label = label.replace('Multilingual', ' (ML)');
  return label;
}

function voiceSortKey(v: WorkerVoiceEntry): [number, string, string] {
  const short = String(v.ShortName ?? '');
  const locale = localeBucket(short);
  const tier = { 'en-US': 0, 'vi-VN': 1 }[locale] ?? (locale.startsWith('en-') ? 2 : 3);
  return [tier, locale, short];
}

/** BCP-47 locale for directory + filters (vi-VN, en-US, de-DE, …). */
export function studioVoiceLocaleCode(locale: string): string {
  const trimmed = locale.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes('-')) {
    const [lang, region, ...rest] = trimmed.split('-');
    if (lang && region) {
      return `${lang.toLowerCase()}-${region.toUpperCase()}${rest.length ? `-${rest.join('-')}` : ''}`;
    }
  }
  return trimmed;
}

/** Map live worker `/voices` rows into studio VoiceOption rows (all Neural voices). */
export function mapWorkerVoicesToOptions(entries: WorkerVoiceEntry[]): VoiceOption[] {
  const neural = entries.filter((v) => String(v.ShortName ?? '').endsWith('Neural'));
  neural.sort((a, b) => {
    const ka = voiceSortKey(a);
    const kb = voiceSortKey(b);
    return ka[0] - kb[0] || ka[1].localeCompare(kb[1]) || ka[2].localeCompare(kb[2]);
  });

  return neural.map((v) => {
    const short = String(v.ShortName);
    const locale = String(v.Locale ?? localeBucket(short));
    const gender = String(v.Gender) === 'Female' ? '♀' : '♂';
    const tone = String(v.Gender) === 'Female' ? 'natural' : 'clear';
    return {
      id: short,
      label: labelFromWorkerVoice(v),
      gender,
      locale: studioVoiceLocaleCode(locale),
      tone,
      ...(short === 'en-US-JennyNeural' ? { recommended: true } : {}),
    };
  });
}

function publishCatalog(next: VoiceOption[], source: 'static' | 'worker') {
  catalog = next;
  catalogSource = source;
  setRuntimeVoiceIds(next.map((voice) => voice.id));
  listeners.forEach((cb) => cb());
}

export function getStudioVoiceCatalog(): VoiceOption[] {
  return catalog;
}

export function getStudioVoiceCatalogSource(): 'static' | 'worker' {
  return catalogSource;
}

export function isStudioVoiceCatalogLoading(): boolean {
  return catalogLoading;
}

export function subscribeStudioVoiceCatalog(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Fetch live edge catalog from worker; falls back to static VOICE_OPTIONS. */
export async function fetchWorkerVoiceCatalog(): Promise<VoiceOption[]> {
  const base = getWorkerUrl();
  if (!base) return VOICE_OPTIONS;

  catalogLoading = true;
  listeners.forEach((cb) => cb());

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const resp = await fetch(`${base.replace(/\/$/, '')}/voices`, {
      signal: controller.signal,
    });
    if (!resp.ok) throw new Error(`voices ${resp.status}`);
    const payload = (await resp.json()) as WorkerVoiceEntry[];
    if (!Array.isArray(payload) || payload.length === 0) throw new Error('empty voices');
    const mapped = mapWorkerVoicesToOptions(payload);
    if (mapped.length === 0) throw new Error('no neural voices');
    if (mapped.length < VOICE_OPTIONS.length) {
      publishCatalog(VOICE_OPTIONS, 'static');
      return VOICE_OPTIONS;
    }
    publishCatalog(mapped, 'worker');
    return mapped;
  } catch {
    publishCatalog(VOICE_OPTIONS, 'static');
    return VOICE_OPTIONS;
  } finally {
    clearTimeout(timeout);
    catalogLoading = false;
    listeners.forEach((cb) => cb());
  }
}

/** Single shared fetch — safe to call from multiple components. */
export function ensureStudioVoiceCatalogLoaded(): void {
  if (catalogFetchStarted) return;
  catalogFetchStarted = true;
  void fetchWorkerVoiceCatalog();
}
