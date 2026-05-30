'use client';

import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type StudioToolbarTone =
  | 'indigo'
  | 'amber'
  | 'cyan'
  | 'sky'
  | 'rose'
  | 'violet'
  | 'emerald'
  | 'neutral';

export const TOOLBAR_ROW = 'rounded-lg border border-white/10 bg-black/25 p-1';
export const TOOLBAR_GROUP =
  'inline-flex w-full items-center gap-0.5 rounded-lg border border-white/10 bg-black/30 p-0.5';
export const TOOLBAR_BTN =
  'inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-semibold leading-none min-h-[32px] transition disabled:cursor-not-allowed disabled:opacity-35';
export const TOOLBAR_SEARCH =
  'flex min-h-[32px] w-full items-center gap-1.5 rounded-md border border-white/10 bg-black/30 px-2.5 py-1.5 text-[10px] text-white/75 outline-none focus-within:border-[var(--accent)]/55 focus-within:shadow-[0_0_0_2px_rgba(99,102,241,0.12)]';

const TONE_CLASS: Record<StudioToolbarTone, string> = {
  indigo: 'border border-indigo-400/25 bg-indigo-500/10 text-indigo-100 hover:bg-indigo-500/16',
  amber: 'border border-amber-400/20 bg-amber-500/8 text-amber-100 hover:bg-amber-500/14',
  cyan: 'border border-cyan-400/20 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/16',
  sky: 'border border-sky-400/20 bg-sky-500/10 text-sky-100 hover:bg-sky-500/16',
  rose: 'border border-rose-400/20 bg-rose-500/10 text-rose-100 hover:bg-rose-500/16',
  violet: 'border border-violet-400/20 bg-violet-500/10 text-violet-100 hover:bg-violet-500/16',
  emerald: 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/16',
  neutral: 'border border-white/10 bg-white/[.03] text-white/70 hover:bg-white/[.06] hover:text-white',
};

const TONE_ACTIVE_CLASS: Partial<Record<StudioToolbarTone, string>> = {
  indigo: 'border-indigo-400/40 bg-indigo-500/20 text-indigo-100',
  amber: 'border-amber-400/35 bg-amber-500/18 text-amber-100',
  cyan: 'border-cyan-400/35 bg-cyan-500/20 text-cyan-100',
  sky: 'border-sky-400/35 bg-sky-500/20 text-sky-100',
  rose: 'border-rose-400/35 bg-rose-500/20 text-rose-100',
  violet: 'border-violet-400/35 bg-violet-500/20 text-violet-100',
  emerald: 'border-emerald-400/35 bg-emerald-500/20 text-emerald-100',
  neutral:
    'border-transparent bg-[var(--accent)] text-white shadow-sm hover:bg-[var(--accent)] hover:brightness-105',
};

export function studioToolbarToneClass(tone: StudioToolbarTone, active = false) {
  if (active) return TONE_ACTIVE_CLASS[tone] ?? TONE_CLASS[tone];
  return TONE_CLASS[tone];
}

export function StudioToolbarRow({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${TOOLBAR_ROW} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function StudioToolbarGroup({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${TOOLBAR_GROUP} ${className}`.trim()} role="group" {...props}>
      {children}
    </div>
  );
}

export function StudioToolbarButton({
  tone = 'neutral',
  active = false,
  icon: Icon,
  iconClassName = '',
  grow = true,
  className = '',
  children,
  ...props
}: {
  tone?: StudioToolbarTone;
  active?: boolean;
  icon?: LucideIcon;
  iconClassName?: string;
  grow?: boolean;
  children?: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`${TOOLBAR_BTN} ${grow ? 'flex-1' : ''} ${studioToolbarToneClass(tone, active)} ${className}`.trim()}
      {...props}
    >
      {Icon ? <Icon size={12} className={`shrink-0 ${iconClassName}`.trim()} strokeWidth={2.25} /> : null}
      {children}
    </button>
  );
}

export function StudioToolbarSearch({
  value,
  onChange,
  placeholder,
  icon,
  className = '',
  inputClassName = '',
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: ReactNode;
  className?: string;
  inputClassName?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'placeholder'>) {
  return (
    <label className={`${TOOLBAR_SEARCH} ${className}`.trim()}>
      <span className="shrink-0 text-white/45">{icon}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`min-w-0 flex-1 bg-transparent text-[10px] text-white/75 outline-none placeholder:text-white/28 ${inputClassName}`.trim()}
        {...props}
      />
    </label>
  );
}
