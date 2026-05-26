'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, Globe2, Search, UserRound, X, Zap } from 'lucide-react';
import { voicePreviewUrl } from '@/lib/api';
import { AudioPreview } from './AudioPreview';

export const VOICE_OPTIONS = [
  { id: 'vi-VN-HoaiMyNeural', label: 'Hoài My', gender: '♀', locale: 'VI', tone: 'ấm, tự nhiên', recommended: true },
  { id: 'vi-VN-NamMinhNeural', label: 'Nam Minh', gender: '♂', locale: 'VI', tone: 'rõ, khỏe', recommended: true },
  { id: 'en-US-JennyNeural', label: 'Jenny', gender: '♀', locale: 'EN-US', tone: 'friendly' },
  { id: 'en-US-GuyNeural', label: 'Guy', gender: '♂', locale: 'EN-US', tone: 'news' },
  { id: 'en-US-AriaNeural', label: 'Aria', gender: '♀', locale: 'EN-US', tone: 'expressive' },
  { id: 'en-GB-SoniaNeural', label: 'Sonia', gender: '♀', locale: 'EN-GB', tone: 'calm' },
  { id: 'ja-JP-NanamiNeural', label: 'Nanami', gender: '♀', locale: 'JA', tone: 'bright' },
  { id: 'ja-JP-KeitaNeural', label: 'Keita', gender: '♂', locale: 'JA', tone: 'clear' },
  { id: 'ko-KR-SunHiNeural', label: 'SunHi', gender: '♀', locale: 'KO', tone: 'warm' },
  { id: 'ko-KR-InJoonNeural', label: 'InJoon', gender: '♂', locale: 'KO', tone: 'steady' },
  { id: 'zh-CN-XiaoxiaoNeural', label: 'Xiaoxiao', gender: '♀', locale: 'ZH', tone: 'soft' },
  { id: 'zh-CN-YunxiNeural', label: 'Yunxi', gender: '♂', locale: 'ZH', tone: 'young' },
  { id: 'th-TH-PremwadeeNeural', label: 'Premwadee', gender: '♀', locale: 'TH', tone: 'smooth' },
  { id: 'id-ID-GadisNeural', label: 'Gadis', gender: '♀', locale: 'ID', tone: 'clear' },
];

const RATE_OPTIONS = [
  { value: '-20%', label: '-20%' },
  { value: '-10%', label: '-10%' },
  { value: '+0%', label: '0' },
  { value: '+10%', label: '+10%' },
  { value: '+20%', label: '+20%' },
];

const LOCALE_OPTIONS = [
  { value: 'all', label: 'All Locale', icon: '⌁' },
  { value: 'vi', label: 'Vietnamese', icon: 'VN' },
  { value: 'en', label: 'English', icon: 'EN' },
  { value: 'asia', label: 'Asian', icon: 'AS' },
] as const;

const GENDER_OPTIONS = [
  { value: 'all', label: 'All Gender', icon: '∅' },
  { value: 'female', label: 'Female', icon: '♀' },
  { value: 'male', label: 'Male', icon: '♂' },
] as const;

const FALLBACK_PREVIEW_TEXT = 'Xin chào, đây là giọng đọc thử.';

type LocaleFilter = (typeof LOCALE_OPTIONS)[number]['value'];
type GenderFilter = (typeof GENDER_OPTIONS)[number]['value'];

export function VoiceSelector({
  voice, onVoice, rate, onRate, previewText,
}: {
  voice: string; onVoice: (v: string) => void;
  rate: string; onRate: (r: string) => void;
  previewText?: string;
}) {
  const text = previewText?.trim() || FALLBACK_PREVIEW_TEXT;
  const [query, setQuery] = useState('');
  const [locale, setLocale] = useState<LocaleFilter>('all');
  const [gender, setGender] = useState<GenderFilter>('all');

  const filteredVoices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VOICE_OPTIONS.filter((v) => {
      const localeMatch =
        locale === 'all' ||
        (locale === 'vi' && v.locale === 'VI') ||
        (locale === 'en' && v.locale.startsWith('EN')) ||
        (locale === 'asia' && !['VI', 'EN-US', 'EN-GB'].includes(v.locale));
      const genderMatch =
        gender === 'all' ||
        (gender === 'female' && v.gender === '♀') ||
        (gender === 'male' && v.gender === '♂');
      const haystack = `${v.label} ${v.id} ${v.locale} ${v.tone}`.toLowerCase();
      return localeMatch && genderMatch && (!q || haystack.includes(q));
    });
  }, [gender, locale, query]);

  const localeCounts = useMemo(
    () => ({
      all: VOICE_OPTIONS.length,
      vi: VOICE_OPTIONS.filter((v) => v.locale === 'VI').length,
      en: VOICE_OPTIONS.filter((v) => v.locale.startsWith('EN')).length,
      asia: VOICE_OPTIONS.filter((v) => !['VI', 'EN-US', 'EN-GB'].includes(v.locale)).length,
    }),
    []
  );
  const genderCounts = useMemo(
    () => ({
      all: VOICE_OPTIONS.length,
      female: VOICE_OPTIONS.filter((v) => v.gender === '♀').length,
      male: VOICE_OPTIONS.filter((v) => v.gender === '♂').length,
    }),
    []
  );

  const activeVoice = VOICE_OPTIONS.find((v) => v.id === voice);

  return (
    <div className="space-y-2">
      <div className="space-y-2 rounded-xl border border-white/10 bg-[var(--panel-2)]/70 p-2">
        <div className="flex items-center gap-1.5">
          <div className="relative min-w-0 flex-1">
            <Search size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search voice, code, locale..."
              className="h-[34px] w-full rounded-lg border border-[var(--accent)]/60 bg-[var(--panel)] px-8 text-xs text-white outline-none shadow-[var(--shadow-focus)]/20 placeholder:text-white/35 focus:border-[var(--accent)]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 grid h-4 w-4 -translate-y-1/2 place-items-center rounded text-white/45 hover:bg-white/10 hover:text-white"
                aria-label="Clear voice search"
              >
                <X size={10} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <VoiceFilterDropdown
            icon={<Globe2 size={12} />}
            label={labelFor(LOCALE_OPTIONS, locale)}
            value={locale}
            options={LOCALE_OPTIONS}
            counts={localeCounts}
            onChange={setLocale}
          />
          <VoiceFilterDropdown
            icon={<UserRound size={12} />}
            label={labelFor(GENDER_OPTIONS, gender)}
            value={gender}
            options={GENDER_OPTIONS}
            counts={genderCounts}
            onChange={setGender}
          />
          <div className="ml-auto rounded-full border border-white/10 bg-black/20 px-2 py-1 font-mono text-[10px] text-[var(--muted)]">
            {filteredVoices.length}/{VOICE_OPTIONS.length}
          </div>
        </div>

        {activeVoice && (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2 py-1.5">
            <Zap size={12} className="text-[var(--accent-2)]" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-semibold text-white">
                {activeVoice.label} <span className="font-mono text-[9px] text-[var(--muted)]">{activeVoice.id}</span>
              </div>
              <div className="text-[9px] text-[var(--muted)]">{activeVoice.locale} · {activeVoice.tone} · {rate}</div>
            </div>
            <AudioPreview src={voicePreviewUrl(text, activeVoice.id, rate)} compact />
          </div>
        )}

        <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
          {filteredVoices.map((v) => {
            const active = voice === v.id;
            return (
              <div
                role="button"
                tabIndex={0}
                key={v.id}
                onClick={() => onVoice(v.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onVoice(v.id);
                }}
                className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition ${
                  active
                    ? 'border-[var(--accent)] bg-[var(--accent)]/15'
                    : 'border-transparent hover:border-white/10 hover:bg-white/[.04]'
                }`}
              >
                <Circle checked={active} />
                <span className={`w-4 shrink-0 text-center text-[11px] ${active ? 'text-[var(--accent-2)]' : 'text-[var(--muted)]'}`}>
                  {v.gender}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-[11px] font-medium text-white">
                    <span className="truncate">{v.label}</span>
                    {v.recommended && <span className="rounded bg-emerald-400/15 px-1 text-[8px] text-emerald-200">VN</span>}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1 text-[9px] text-[var(--muted)]">
                    <span className="rounded bg-black/20 px-1 font-mono">{v.locale}</span>
                    <span className="truncate">{v.tone}</span>
                  </span>
                </span>
                <span onClick={(e) => e.stopPropagation()}>
                  <AudioPreview src={voicePreviewUrl(text, v.id, rate)} compact />
                </span>
              </div>
            );
          })}
          {filteredVoices.length === 0 && (
            <div className="rounded-md border border-dashed border-white/10 px-3 py-5 text-center text-[11px] text-[var(--muted)]">
              Không tìm thấy giọng phù hợp.
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-0.5 rounded-md bg-[var(--panel-2)] p-0.5">
        {RATE_OPTIONS.map((r) => (
          <button
            key={r.value}
            onClick={() => onRate(r.value)}
            className={`flex-1 rounded px-1 py-1 text-[10px] font-mono transition ${
              rate === r.value
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--muted)] hover:bg-white/[.04] hover:text-white'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function VoiceFilterDropdown<T extends string>({
  icon,
  label,
  value,
  options,
  counts,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  value: T;
  options: readonly { value: T; label: string; icon: string }[];
  counts: Record<T, number>;
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const filtered = options.filter((option) =>
    option.label.toLowerCase().includes(search.trim().toLowerCase())
  );
  const selectedCount = value === 'all' ? 0 : 1;

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-[34px] w-full items-center gap-1.5 rounded-lg border px-2 text-xs transition-colors ${
          selectedCount > 0
            ? 'border-[var(--accent)]/50 bg-[var(--accent)]/10 text-indigo-200'
            : 'border-white/10 bg-[var(--panel-2)] text-[var(--text)] hover:bg-white/5'
        }`}
      >
        <span className="shrink-0 opacity-75">{icon}</span>
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
        {selectedCount > 0 && (
          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-white">
            {selectedCount}
          </span>
        )}
        <ChevronDown size={12} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-72 rounded-xl border border-white/10 bg-[var(--panel)] shadow-xl shadow-black/40">
          <div className="border-b border-white/5 p-2">
            <div className="relative">
              <Search size={12} className="pointer-events-none absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-[var(--muted)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="h-8 w-full rounded-lg border border-white/10 bg-[var(--panel-2)] py-1 pl-7 pr-2 text-xs text-white outline-none placeholder:text-white/35 focus:border-[var(--accent)]"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-72 overflow-auto p-1">
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange(option.value); setOpen(false); }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-white/5"
              >
                <Circle checked={value === option.value} />
                <span className="grid h-5 min-w-5 place-items-center rounded-md bg-white/[.04] px-1 font-mono text-[9px] text-[var(--accent-2)]">
                  {option.icon}
                </span>
                <span className="flex-1 truncate text-left">{option.label}</span>
                <span className="text-[10px] text-[var(--muted)]">{counts[option.value]}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="py-4 text-center text-xs text-[var(--muted)]">No matches</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Circle({ checked }: { checked: boolean }) {
  return (
    <span
      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-all ${
        checked ? 'border-[var(--accent-2)] bg-[var(--accent)]' : 'border-white/25'
      }`}
    >
      {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
    </span>
  );
}

function labelFor<T extends string>(options: readonly { value: T; label: string }[], value: T) {
  return options.find((option) => option.value === value)?.label ?? value;
}
