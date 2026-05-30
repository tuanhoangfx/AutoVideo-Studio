'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type StudioControlTone = 'neutral' | 'sky' | 'violet' | 'rose' | 'amber' | 'indigo';

const TONE_CLASS: Record<StudioControlTone, string> = {
  neutral: 'border-white/10 bg-white/[.03] text-white/70 hover:bg-white/[.06] hover:text-white',
  sky: 'border-sky-400/20 bg-sky-500/10 text-sky-100 hover:bg-sky-500/18',
  violet: 'border-violet-400/20 bg-violet-500/10 text-violet-100 hover:bg-violet-500/18',
  rose: 'border-rose-400/20 bg-rose-500/10 text-rose-100 hover:bg-rose-500/18',
  amber: 'border-amber-400/20 bg-amber-500/8 text-amber-100 hover:bg-amber-500/14',
  indigo: 'border-indigo-400/35 bg-indigo-500/15 text-indigo-100 hover:bg-indigo-500/20',
};

export function studioControlClass(tone: StudioControlTone = 'neutral', active = false) {
  return `studio-control ${active ? 'studio-control--active' : TONE_CLASS[tone]}`;
}

export function StudioBtn({
  tone = 'neutral',
  active = false,
  icon,
  children,
  className = '',
  ...props
}: {
  tone?: StudioControlTone;
  active?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`${studioControlClass(tone, active)} ${className}`} {...props}>
      {icon ? <span className="studio-control-icon">{icon}</span> : null}
      {children}
    </button>
  );
}

export function StudioSearch({
  value,
  onChange,
  placeholder,
  icon,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <label className={`studio-search ${className}`}>
      <span className="studio-control-icon text-white/45">{icon}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent outline-none"
      />
    </label>
  );
}
