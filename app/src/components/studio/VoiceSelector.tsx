'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Bot, Check, ChevronDown, Gauge, Globe2, Search, SlidersHorizontal, Star, UserRound, X } from 'lucide-react';
import type { TTSProvider } from '@/lib/api';
import { voicePreviewUrl } from '@/lib/api';
import { voiceListPreviewText } from '@/lib/voice-preview-text';
import { AudioPreview } from './AudioPreview';

export const VOICE_OPTIONS = [
  { id: 'vi-VN-HoaiMyNeural', label: 'Hoài My', gender: '♀', locale: 'VI', tone: 'warm, natural', recommended: true },
  { id: 'vi-VN-NamMinhNeural', label: 'Nam Minh', gender: '♂', locale: 'VI', tone: 'clear, strong', recommended: true },
  { id: 'en-US-AriaNeural', label: 'Aria', gender: '♀', locale: 'EN-US', tone: 'expressive' },
  { id: 'en-US-JennyNeural', label: 'Jenny', gender: '♀', locale: 'EN-US', tone: 'friendly' },
  { id: 'en-US-GuyNeural', label: 'Guy', gender: '♂', locale: 'EN-US', tone: 'news' },
  { id: 'en-US-DavisNeural', label: 'Davis', gender: '♂', locale: 'EN-US', tone: 'business' },
  { id: 'en-US-JaneNeural', label: 'Jane', gender: '♀', locale: 'EN-US', tone: 'confident' },
  { id: 'en-US-JasonNeural', label: 'Jason', gender: '♂', locale: 'EN-US', tone: 'casual' },
  { id: 'en-US-NancyNeural', label: 'Nancy', gender: '♀', locale: 'EN-US', tone: 'warm' },
  { id: 'en-US-SaraNeural', label: 'Sara', gender: '♀', locale: 'EN-US', tone: 'clear' },
  { id: 'en-US-TonyNeural', label: 'Tony', gender: '♂', locale: 'EN-US', tone: 'narration' },
  { id: 'en-US-AmberNeural', label: 'Amber', gender: '♀', locale: 'EN-US', tone: 'friendly' },
  { id: 'en-US-AnaNeural', label: 'Ana', gender: '♀', locale: 'EN-US', tone: 'young' },
  { id: 'en-US-AshleyNeural', label: 'Ashley', gender: '♀', locale: 'EN-US', tone: 'natural' },
  { id: 'en-US-BrandonNeural', label: 'Brandon', gender: '♂', locale: 'EN-US', tone: 'clear' },
  { id: 'en-US-ChristopherNeural', label: 'Christopher', gender: '♂', locale: 'EN-US', tone: 'deep' },
  { id: 'en-US-CoraNeural', label: 'Cora', gender: '♀', locale: 'EN-US', tone: 'bright' },
  { id: 'en-US-ElizabethNeural', label: 'Elizabeth', gender: '♀', locale: 'EN-US', tone: 'formal' },
  { id: 'en-US-EricNeural', label: 'Eric', gender: '♂', locale: 'EN-US', tone: 'steady' },
  { id: 'en-US-JacobNeural', label: 'Jacob', gender: '♂', locale: 'EN-US', tone: 'calm' },
  { id: 'en-US-MichelleNeural', label: 'Michelle', gender: '♀', locale: 'EN-US', tone: 'smooth' },
  { id: 'en-US-MonicaNeural', label: 'Monica', gender: '♀', locale: 'EN-US', tone: 'news' },
  { id: 'en-US-RogerNeural', label: 'Roger', gender: '♂', locale: 'EN-US', tone: 'authoritative' },
  { id: 'en-US-SteffanNeural', label: 'Steffan', gender: '♂', locale: 'EN-US', tone: 'professional' },
  { id: 'en-GB-LibbyNeural', label: 'Libby', gender: '♀', locale: 'EN-GB', tone: 'natural' },
  { id: 'en-GB-MaisieNeural', label: 'Maisie', gender: '♀', locale: 'EN-GB', tone: 'young' },
  { id: 'en-GB-RyanNeural', label: 'Ryan', gender: '♂', locale: 'EN-GB', tone: 'clear' },
  { id: 'en-GB-SoniaNeural', label: 'Sonia', gender: '♀', locale: 'EN-GB', tone: 'calm' },
  { id: 'en-GB-ThomasNeural', label: 'Thomas', gender: '♂', locale: 'EN-GB', tone: 'steady' },
  { id: 'en-AU-NatashaNeural', label: 'Natasha', gender: '♀', locale: 'EN-AU', tone: 'natural' },
  { id: 'en-AU-WilliamNeural', label: 'William', gender: '♂', locale: 'EN-AU', tone: 'clear' },
  { id: 'en-CA-ClaraNeural', label: 'Clara', gender: '♀', locale: 'EN-CA', tone: 'friendly' },
  { id: 'en-CA-LiamNeural', label: 'Liam', gender: '♂', locale: 'EN-CA', tone: 'warm' },
  { id: 'en-IN-NeerjaNeural', label: 'Neerja', gender: '♀', locale: 'EN-IN', tone: 'expressive' },
  { id: 'en-IN-PrabhatNeural', label: 'Prabhat', gender: '♂', locale: 'EN-IN', tone: 'formal' },
  { id: 'en-IE-ConnorNeural', label: 'Connor', gender: '♂', locale: 'EN-IE', tone: 'calm' },
  { id: 'en-IE-EmilyNeural', label: 'Emily', gender: '♀', locale: 'EN-IE', tone: 'warm' },
  { id: 'en-NZ-MitchellNeural', label: 'Mitchell', gender: '♂', locale: 'EN-NZ', tone: 'clear' },
  { id: 'en-NZ-MollyNeural', label: 'Molly', gender: '♀', locale: 'EN-NZ', tone: 'friendly' },
  { id: 'en-ZA-LeahNeural', label: 'Leah', gender: '♀', locale: 'EN-ZA', tone: 'smooth' },
  { id: 'en-ZA-LukeNeural', label: 'Luke', gender: '♂', locale: 'EN-ZA', tone: 'steady' },
  { id: 'en-HK-SamNeural', label: 'Sam', gender: '♂', locale: 'EN-HK', tone: 'clear' },
  { id: 'en-HK-YanNeural', label: 'Yan', gender: '♀', locale: 'EN-HK', tone: 'natural' },
  { id: 'en-SG-LunaNeural', label: 'Luna', gender: '♀', locale: 'EN-SG', tone: 'friendly' },
  { id: 'en-SG-WayneNeural', label: 'Wayne', gender: '♂', locale: 'EN-SG', tone: 'formal' },
  { id: 'en-PH-JamesNeural', label: 'James', gender: '♂', locale: 'EN-PH', tone: 'bright' },
  { id: 'en-PH-RosaNeural', label: 'Rosa', gender: '♀', locale: 'EN-PH', tone: 'warm' },
  { id: 'ja-JP-NanamiNeural', label: 'Nanami', gender: '♀', locale: 'JA', tone: 'bright' },
  { id: 'ja-JP-KeitaNeural', label: 'Keita', gender: '♂', locale: 'JA', tone: 'clear' },
  { id: 'ko-KR-SunHiNeural', label: 'SunHi', gender: '♀', locale: 'KO', tone: 'warm' },
  { id: 'ko-KR-InJoonNeural', label: 'InJoon', gender: '♂', locale: 'KO', tone: 'steady' },
  { id: 'zh-CN-XiaoxiaoNeural', label: 'Xiaoxiao', gender: '♀', locale: 'ZH', tone: 'soft' },
  { id: 'zh-CN-YunxiNeural', label: 'Yunxi', gender: '♂', locale: 'ZH', tone: 'young' },
  { id: 'th-TH-PremwadeeNeural', label: 'Premwadee', gender: '♀', locale: 'TH', tone: 'smooth' },
  { id: 'id-ID-GadisNeural', label: 'Gadis', gender: '♀', locale: 'ID', tone: 'clear' },
];

const LOCALE_OPTIONS = [
  { value: 'all', label: 'All Locale', icon: 'locale-all' },
  { value: 'vi', label: 'Vietnamese', icon: 'VI' },
  { value: 'en', label: 'English', icon: 'EN-GB' },
  { value: 'asia', label: 'Asian', icon: 'locale-asia' },
] as const;

const GENDER_OPTIONS = [
  { value: 'all', label: 'All Gender', icon: 'gender-all' },
  { value: 'female', label: 'Female', icon: 'female' },
  { value: 'male', label: 'Male', icon: 'male' },
] as const;

const PROVIDER_OPTIONS = [
  { value: 'edge', label: 'Edge', icon: 'edge' },
  { value: 'elevenlabs', label: 'ElevenLabs', icon: 'elevenlabs' },
  { value: 'omnivoice-local', label: 'OmniVoice Local', icon: 'omnivoice-local' },
] as const satisfies readonly { value: TTSProvider; label: string; icon: string }[];

const FALLBACK_PREVIEW_TEXT = 'Hello, this is a voice preview.';
const FAVORITE_VOICES_KEY = 'p0021:studio:favorite-voices:v1';
const RATE_STEPS = [-20, -10, 0, 10, 20] as const;

type LocaleFilter = (typeof LOCALE_OPTIONS)[number]['value'];
type GenderFilter = (typeof GENDER_OPTIONS)[number]['value'];

export function VoiceSelector({
  voice, onVoice, rate, onRate, provider, onProvider, previewText,
}: {
  voice: string; onVoice: (v: string) => void;
  rate: string; onRate: (r: string) => void;
  provider: TTSProvider; onProvider: (provider: TTSProvider) => void;
  previewText?: string;
}) {
  const text = previewText?.trim() || FALLBACK_PREVIEW_TEXT;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [providerFilters, setProviderFilters] = useState<TTSProvider[]>([provider]);
  const [localeFilters, setLocaleFilters] = useState<LocaleFilter[]>([]);
  const [genderFilters, setGenderFilters] = useState<GenderFilter[]>([]);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [favoriteVoiceIds, setFavoriteVoiceIds] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    try {
      const parsed = JSON.parse(localStorage.getItem(FAVORITE_VOICES_KEY) || '[]');
      const next = Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
      setFavoriteVoiceIds(next);
    } catch {}
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITE_VOICES_KEY, JSON.stringify(favoriteVoiceIds));
    } catch {}
  }, [favoriteVoiceIds]);

  useEffect(() => {
    setProviderFilters((current) => (current.includes(provider) ? current : [provider, ...current]));
  }, [provider]);

  const filteredVoices = useMemo(() => {
    const q = query.trim().toLowerCase();
    const favorites = new Set(favoriteVoiceIds);
    return VOICE_OPTIONS.filter((v) => {
      if (favoriteOnly && !favorites.has(v.id)) return false;
      const providerMatch = providerFilters.length === 0 || providerFilters.includes('edge');
      const localeMatch =
        localeFilters.length === 0 ||
        localeFilters.some((item) =>
          (item === 'vi' && v.locale === 'VI') ||
          (item === 'en' && v.locale.startsWith('EN')) ||
          (item === 'asia' && !v.locale.startsWith('EN') && v.locale !== 'VI')
        );
      const genderMatch =
        genderFilters.length === 0 ||
        genderFilters.some((item) => (item === 'female' && v.gender === '♀') || (item === 'male' && v.gender === '♂'));
      const haystack = `${v.label} ${v.id} ${v.locale} ${v.tone}`.toLowerCase();
      return providerMatch && localeMatch && genderMatch && (!q || haystack.includes(q));
    });
  }, [favoriteOnly, favoriteVoiceIds, genderFilters, localeFilters, providerFilters, query]);

  const localeCounts = useMemo(
    () => ({
      all: VOICE_OPTIONS.length,
      vi: VOICE_OPTIONS.filter((v) => v.locale === 'VI').length,
      en: VOICE_OPTIONS.filter((v) => v.locale.startsWith('EN')).length,
      asia: VOICE_OPTIONS.filter((v) => !v.locale.startsWith('EN') && v.locale !== 'VI').length,
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
  const providerCounts = useMemo(
    () => ({
      edge: VOICE_OPTIONS.length,
      elevenlabs: 0,
      'omnivoice-local': 0,
    }),
    []
  );
  const favoriteSet = useMemo(() => new Set(favoriteVoiceIds), [favoriteVoiceIds]);

  const toggleFavorite = (id: string) => {
    setFavoriteVoiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-2">
      <div className="hub-filter-toolbar">
        <div className="hub-filter-row">
          <label className="hub-search-box grow">
            <Search size={14} className="shrink-0 text-[var(--muted)]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search voice, code, locale..."
            />
            {!query && (
              <span className="pointer-events-none hidden items-center gap-0.5 sm:flex">
                <kbd className="rounded border border-white/15 bg-white/5 px-1 py-0.5 font-mono text-[10px] text-[var(--muted)]">Ctrl</kbd>
                <kbd className="rounded border border-white/15 bg-white/5 px-1 py-0.5 font-mono text-[10px] text-[var(--muted)]">K</kbd>
              </span>
            )}
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="grid h-4 w-4 place-items-center rounded text-white/45 hover:bg-white/10 hover:text-white"
                aria-label="Clear voice search"
              >
                <X size={10} />
              </button>
            )}
          </label>
        </div>

        <div className="hub-filter-row">
          <VoiceFilterDropdown
            icon={<Bot size={12} />}
            label="Provider"
            selected={providerFilters}
            options={PROVIDER_OPTIONS}
            counts={providerCounts}
            onChange={(values) => {
              setProviderFilters(values);
              if (values.length > 0 && !values.includes(provider)) onProvider(values[0]);
            }}
          />
          <VoiceFilterDropdown
            icon={<Globe2 size={12} />}
            label="Locale"
            selected={localeFilters.filter((item) => item !== 'all')}
            options={LOCALE_OPTIONS}
            counts={localeCounts}
            onChange={(values) => setLocaleFilters(values.filter((item) => item !== 'all'))}
          />
          <VoiceFilterDropdown
            icon={<UserRound size={12} />}
            label="Gender"
            selected={genderFilters.filter((item) => item !== 'all')}
            options={GENDER_OPTIONS}
            counts={genderCounts}
            onChange={(values) => setGenderFilters(values.filter((item) => item !== 'all'))}
          />
          <button
            type="button"
            onClick={() => setFavoriteOnly((value) => !value)}
            className={`hub-filter-chip ${favoriteOnly ? 'active' : ''}`}
            title="Show favorite voices only"
          >
            <Star size={12} className={favoriteOnly ? 'fill-amber-300 text-amber-200' : 'text-[var(--muted)]'} />
            Favorites
            <span className="rounded-full bg-black/20 px-1 font-mono text-[9px] text-[var(--muted)]">
              {mounted ? favoriteVoiceIds.length : 0}
            </span>
          </button>
          <div className="hub-filter-meta ml-auto font-mono">
            {filteredVoices.length}/{VOICE_OPTIONS.length}
          </div>
        </div>

        <div className="max-h-64 w-full space-y-0.5 overflow-y-auto pr-1">
          {filteredVoices.map((v) => {
            const active = voice === v.id;
            const favorite = favoriteSet.has(v.id);
            return (
              <div
                role="button"
                tabIndex={0}
                key={v.id}
                onClick={() => onVoice(v.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onVoice(v.id);
                }}
                className={`flex h-7 w-full items-center gap-1.5 rounded-md border px-2 text-left transition ${
                  active
                    ? 'border-[var(--accent)] bg-[var(--accent)]/15'
                    : 'border-transparent hover:border-white/10 hover:bg-white/[.04]'
                }`}
              >
                <Circle checked={active} />
                <GenderIcon gender={v.gender} active={active} />
                <span className="min-w-0 flex flex-1 items-center gap-1.5 overflow-hidden whitespace-nowrap">
                  <span className="min-w-[4.6rem] shrink-0 truncate text-[10px] font-semibold text-white">{v.label}</span>
                  <FlagBadge locale={v.locale} />
                  <span className="min-w-0 truncate text-[9px] text-[var(--muted)]">{v.tone}</span>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(v.id);
                  }}
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full transition ${
                    favorite
                      ? 'bg-amber-400/15 text-amber-200'
                      : 'text-white/25 hover:bg-white/10 hover:text-amber-200'
                  }`}
                  title={favorite ? 'Remove favorite' : 'Add favorite'}
                  aria-label={favorite ? `Remove favorite ${v.label}` : `Favorite ${v.label}`}
                >
                  <Star size={12} className={favorite ? 'fill-amber-300' : ''} />
                </button>
                <span onClick={(e) => e.stopPropagation()}>
                  <AudioPreview
                    src={voicePreviewUrl(voiceListPreviewText(v.id), v.id, rate)}
                    compact
                  />
                </span>
              </div>
            );
          })}
          {filteredVoices.length === 0 && (
            <div className="rounded-md border border-dashed border-white/10 px-3 py-5 text-center text-[11px] text-[var(--muted)]">
              No matching voices.
            </div>
          )}
        </div>
        <VoiceSpeedSlider value={rate} onChange={onRate} />
      </div>
    </div>
  );
}

function VoiceFilterDropdown<T extends string>({
  icon,
  label,
  selected,
  options,
  counts,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  selected: T[];
  options: readonly { value: T; label: string; icon: string }[];
  counts?: Partial<Record<T, number>>;
  onChange: (value: T[]) => void;
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
  const optionValues = options.filter((option) => option.value !== 'all').map((option) => option.value);
  const allSelected = selected.length > 0 && optionValues.every((value) => selected.includes(value));
  const someSelected = selected.length > 0 && !allSelected;
  const selectedSet = new Set(selected);
  const buttonLabel =
    selected.length === 0
      ? `All ${label}`
      : selected.length === 1
      ? `${label}: ${options.find((option) => option.value === selected[0])?.label ?? selected[0]}`
      : `${label}: ${selected.length} selected`;

  const toggle = (value: T) => {
    if (value === 'all') {
      onChange([]);
      return;
    }
    onChange(selectedSet.has(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  const toggleAll = () => onChange(allSelected ? [] : optionValues);

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`hub-filter-chip w-full ${selected.length > 0 ? 'active' : ''}`}
      >
        <span className="shrink-0 opacity-75">{icon}</span>
        <span className="min-w-0 flex-1 truncate text-left">{buttonLabel}</span>
        {selected.length > 1 ? (
          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-white">
            {selected.length}
          </span>
        ) : null}
        <ChevronDown size={12} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-72 rounded-xl border border-white/10 bg-[var(--panel)] shadow-xl shadow-black/40">
          <div className="border-b border-white/5 p-2">
            <label className="hub-search-box">
              <Search size={12} className="shrink-0 text-[var(--muted)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                autoFocus
              />
            </label>
          </div>
          <div className="max-h-72 overflow-auto p-1">
            <button
              type="button"
              onClick={toggleAll}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-white/5"
            >
              <Circle checked={allSelected} indeterminate={someSelected} />
              <span className="grid h-5 min-w-5 place-items-center rounded-md bg-white/[.04] px-1 text-[var(--accent-2)]">
                <SlidersHorizontal size={12} />
              </span>
              <span className="flex-1 text-left">All {label}</span>
              <span className="text-[10px] text-[var(--muted)]">{optionValues.length}</span>
            </button>
            <div className="my-1 border-t border-white/5" />
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggle(option.value)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-white/5"
              >
                <Circle checked={option.value === 'all' ? selected.length === 0 : selectedSet.has(option.value)} />
                <span className="grid h-5 min-w-5 place-items-center rounded-md bg-white/[.04] px-1 text-[var(--accent-2)]">
                  <FilterOptionIcon icon={option.icon} />
                </span>
                <span className="flex-1 truncate text-left">{option.label}</span>
                {counts?.[option.value] != null && (
                  <span className="text-[10px] text-[var(--muted)]">{counts[option.value]}</span>
                )}
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

function Circle({ checked, indeterminate = false }: { checked: boolean; indeterminate?: boolean }) {
  return (
    <span
      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-all ${
        checked ? 'border-[var(--accent-2)] bg-[var(--accent)]' : indeterminate ? 'border-[var(--accent-2)] bg-[var(--accent)]/30' : 'border-white/25'
      }`}
    >
      {checked ? <Check size={9} className="text-white" /> : indeterminate ? <span className="h-1 w-2 rounded-full bg-white" /> : null}
    </span>
  );
}

function FilterOptionIcon({ icon }: { icon: string }) {
  if (icon === 'locale-all') return <Globe2 size={12} />;
  if (icon === 'locale-asia') {
    return (
      <span className="relative grid h-3.5 w-5 place-items-center">
        <FlagBadge locale="JA" />
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-[var(--panel)] bg-emerald-300" />
      </span>
    );
  }
  if (icon === 'female') return <GenderIcon gender="♀" active={false} compact />;
  if (icon === 'male') return <GenderIcon gender="♂" active={false} compact />;
  if (icon === 'gender-all') return <UserRound size={12} />;
  if (icon === 'edge') return <ProviderBadge label="E" />;
  if (icon === 'elevenlabs') return <ProviderBadge label="11" />;
  if (icon === 'omnivoice-local') return <ProviderBadge label="OV" />;
  if (icon === 'VI' || icon.startsWith('EN')) return <FlagBadge locale={icon} />;
  return <span className="font-mono text-[9px]">{icon}</span>;
}

function ProviderBadge({ label }: { label: string }) {
  return (
    <span className="grid h-4 min-w-4 place-items-center rounded bg-indigo-400/15 px-1 font-mono text-[8px] font-bold text-indigo-100">
      {label}
    </span>
  );
}

function GenderIcon({ gender, active, compact = false }: { gender: string; active: boolean; compact?: boolean }) {
  const isFemale = gender === '♀';
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full border ${compact ? 'h-4 w-4' : 'h-5 w-5'} ${
        isFemale
          ? 'border-pink-300/35 bg-pink-400/10 text-pink-200'
          : 'border-sky-300/35 bg-sky-400/10 text-sky-200'
      } ${active ? 'shadow-[0_0_12px_rgba(129,140,248,0.28)]' : ''}`}
      title={isFemale ? 'Female' : 'Male'}
    >
      {isFemale ? <FemaleGlyph /> : <MaleGlyph />}
    </span>
  );
}

function FemaleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4.5" />
      <path d="M12 12.5v8" />
      <path d="M8.5 17h7" />
    </svg>
  );
}

function MaleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="14" r="4.5" />
      <path d="M13.2 10.8 20 4" />
      <path d="M15 4h5v5" />
    </svg>
  );
}

function VoiceSpeedSlider({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const numeric = rateToNumber(value);
  return (
    <div className="flex min-h-8 items-center gap-3 rounded-lg border border-white/10 bg-black/15 px-3 py-1">
      <div className="flex w-20 shrink-0 items-center gap-1.5 text-[10px] font-semibold text-white/75">
        <Gauge size={12} className="text-[var(--accent-2)]" />
        Speed
      </div>
      <input
        type="range"
        min={-20}
        max={20}
        step={10}
        value={numeric}
        onChange={(e) => onChange(formatRate(Number(e.target.value)))}
        className="h-1.5 min-w-40 flex-1 cursor-pointer accent-[var(--accent)]"
        aria-label="Voice speed"
      />
      <span className="w-10 shrink-0 rounded bg-white/[.05] px-1.5 py-0.5 text-center font-mono text-[9px] text-[var(--accent-2)]">
        {formatRate(numeric)}
      </span>
      <div className="hidden min-w-40 justify-between font-mono text-[8px] text-[var(--muted)] sm:flex">
        {RATE_STEPS.map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onChange(formatRate(step))}
            className={`rounded px-1 py-0.5 transition hover:text-white ${
              step === numeric ? 'bg-[var(--accent)]/20 text-indigo-100' : ''
            }`}
          >
            {step > 0 ? `+${step}` : step}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FlagBadge({ locale }: { locale: string }) {
  const code = countryCodeForLocale(locale);
  return (
    <span
      className="h-3 w-4 shrink-0 overflow-hidden rounded-[2px] border border-white/10 bg-cover bg-center shadow-[0_0_0_1px_rgba(0,0,0,0.18)]"
      style={{ backgroundImage: `url("https://flagcdn.com/16x12/${code}.png")` }}
      title={locale}
      aria-label={locale}
    />
  );
}

function countryCodeForLocale(locale: string) {
  if (locale === 'VI') return 'vn';
  const region = locale.includes('-') ? locale.split('-')[1] : locale;
  const map: Record<string, string> = {
    US: 'us',
    GB: 'gb',
    AU: 'au',
    CA: 'ca',
    IN: 'in',
    IE: 'ie',
    NZ: 'nz',
    ZA: 'za',
    HK: 'hk',
    SG: 'sg',
    PH: 'ph',
    JA: 'jp',
    JP: 'jp',
    KO: 'kr',
    KR: 'kr',
    ZH: 'cn',
    CN: 'cn',
    TH: 'th',
    ID: 'id',
  };
  return map[region] ?? 'un';
}

function rateToNumber(value: string) {
  const parsed = Number.parseInt(value.replace('%', ''), 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(-20, Math.min(20, Math.round(parsed / 10) * 10));
}

function formatRate(value: number) {
  const normalized = Math.max(-20, Math.min(20, Math.round(value / 10) * 10));
  return `${normalized >= 0 ? '+' : ''}${normalized}%`;
}
