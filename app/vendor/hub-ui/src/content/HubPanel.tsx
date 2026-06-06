import type { ReactNode } from "react";

export function HubPanel({
  title,
  desc,
  actions,
  children,
  className = "",
}: {
  title?: string;
  desc?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-white/5 bg-[var(--panel)] shadow-[0_8px_24px_rgba(0,0,0,0.12)] ${className}`}
    >
      {title ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/5 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>
            {desc ? <p className="mt-0.5 text-xs text-[var(--muted)]">{desc}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      <div className={title ? "p-4" : "p-0"}>{children}</div>
    </section>
  );
}
