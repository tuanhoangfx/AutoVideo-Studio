import type { ReactNode } from 'react';

export function SidePanel({
  label,
  trailing,
  children,
}: {
  label: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[.04] p-4 backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</span>
        {trailing}
      </div>
      {children}
    </section>
  );
}
