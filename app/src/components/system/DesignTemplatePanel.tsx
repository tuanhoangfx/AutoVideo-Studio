'use client';

import { Palette } from 'lucide-react';

export function DesignTemplatePanel() {
  return (
    <section className="flex min-h-[42vh] items-center justify-center rounded-2xl border border-white/10 bg-[var(--panel)] p-6 text-center">
      <div>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-100">
          <Palette size={24} />
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-white">No active designs</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
          Timeline scene table locked as <strong className="text-indigo-200/90">V1 Fixed grid</strong> in Studio.
        </p>
      </div>
    </section>
  );
}
