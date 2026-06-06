import { useEffect, useState, type ReactNode } from "react";
import { Check } from "lucide-react";

export type MetaTone = "amber" | "cyan" | "emerald" | "indigo" | "muted" | "rose" | "violet";

export function MetaChip({
  icon,
  label,
  tone,
  title,
  className = "",
  labelClassName = "",
}: {
  icon: ReactNode;
  label: string;
  tone: MetaTone;
  title?: string;
  className?: string;
  labelClassName?: string;
}) {
  const toneClass = {
    amber: "border-amber-400/30 bg-amber-500/12 text-amber-100 [&_svg]:text-amber-300",
    cyan: "border-cyan-400/30 bg-cyan-500/12 text-cyan-100 [&_svg]:text-cyan-300",
    emerald: "border-emerald-400/30 bg-emerald-500/12 text-emerald-100 [&_svg]:text-emerald-300",
    indigo: "border-indigo-400/30 bg-indigo-500/12 text-indigo-100 [&_svg]:text-indigo-300",
    muted: "border-white/10 bg-white/[.04] text-[var(--muted)] [&_svg]:text-[var(--muted)]",
    rose: "border-rose-400/30 bg-rose-500/12 text-rose-100 [&_svg]:text-rose-300",
    violet: "border-violet-400/30 bg-violet-500/12 text-violet-100 [&_svg]:text-violet-300",
  }[tone];

  return (
    <span
      className={`inline-flex max-w-[11rem] items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium leading-4 ${toneClass} ${className}`}
      title={title}
    >
      <span className="shrink-0">{icon}</span>
      <span className={labelClassName || "truncate"}>{label}</span>
    </span>
  );
}

export function CopyMetaChip({
  icon,
  label,
  value,
  tone,
  title,
  className = "",
  labelClassName = "",
  onCopied,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: MetaTone;
  title?: string;
  className?: string;
  labelClassName?: string;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      title={title ?? "Copy"}
      className={`group inline-flex max-w-full items-center gap-1 ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        void navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          onCopied?.();
        });
      }}
    >
      <MetaChip
        icon={icon}
        label={label}
        tone={tone}
        className={className}
        labelClassName={labelClassName}
      />
      {copied ? <Check size={10} className="shrink-0 text-emerald-400" aria-hidden /> : null}
    </button>
  );
}
