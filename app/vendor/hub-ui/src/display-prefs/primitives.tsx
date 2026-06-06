import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { compactIconSize } from "../ui-scale";

export function TabButton({
  active,
  onClick,
  icon,
  children,
  scrollable = false,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
  /** When true, tabs sit in a horizontal scroller instead of equal-width columns. */
  scrollable?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium whitespace-nowrap transition-colors ${
        scrollable ? "shrink-0" : "flex-1"
      } ${
        active
          ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-500/30"
          : "text-[var(--muted)]"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

export function SectionIcon({
  icon: Icon,
  className,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
  className: string;
}) {
  return <Icon size={compactIconSize(12)} className={className} aria-hidden />;
}

export function Section({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--muted)]">
        {icon}
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}

export function ToggleRow({ label, on, onChange }: { label: string; on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="hub-settings-toggle flex w-full items-center gap-2 rounded-md px-2 py-0.5 text-left text-[11px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400/45 focus-visible:outline-offset-1"
    >
      <span className={`hub-check-indicator${on ? " is-on" : ""}`} aria-hidden>
        {on ? <Check size={compactIconSize(9)} strokeWidth={2.75} /> : null}
      </span>
      <span className={on ? "text-[var(--text)]" : "text-[var(--muted)]"}>{label}</span>
    </button>
  );
}
