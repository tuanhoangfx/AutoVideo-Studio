import { createPortal } from "react-dom";
import { Bot, Cloud, Database, Gauge, LayoutGrid, Palette, Server, Users, type LucideIcon } from "lucide-react";
import { compactIconSize } from "../ui-scale";
import { ensureHubTabLoaderRoot, HUB_TAB_LOADER_ROOT_ID } from "./HubLoaderRoot";

export type HubLoadingViewProps = {
  icon: LucideIcon;
  ariaLabel: string;
  variant?: "full" | "overlay" | "skeleton";
};

function getLoaderRoot() {
  if (typeof document === "undefined") return null;
  return document.getElementById(HUB_TAB_LOADER_ROOT_ID) ?? ensureHubTabLoaderRoot();
}

function HubLoaderOrb({ Icon }: { Icon: LucideIcon }) {
  return (
    <div className="relative mx-auto flex h-24 w-24 shrink-0 items-center justify-center" aria-hidden>
      <span className="absolute inset-0 rounded-full border border-indigo-400/20" />
      <span className="absolute inset-1 rounded-full border border-dashed border-cyan-400/25 anim-spin [animation-duration:12s]" />
      <span className="absolute inset-3 rounded-full border border-indigo-500/30 anim-spin [animation-duration:6s] [animation-direction:reverse]" />
      <span className="absolute inset-5 rounded-full bg-indigo-500/10 shadow-[0_0_24px_rgba(99,102,241,0.35)]" />
      <span className="absolute h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 blur-md" />
      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-400/35 bg-[var(--panel)] shadow-[0_0_20px_rgba(99,102,241,0.25)]">
        <Icon size={compactIconSize(20)} className="text-indigo-300" strokeWidth={1.75} />
      </div>
      <Gauge
        size={compactIconSize(14)}
        className="absolute -right-0.5 -top-0.5 text-cyan-300/90 anim-spin [animation-duration:3s]"
        strokeWidth={2}
      />
    </div>
  );
}

type HubTabLoaderFillProps = {
  Icon: LucideIcon;
  ariaLabel: string;
  dim?: boolean;
};

function HubTabLoaderFill({ Icon, ariaLabel, dim = false }: HubTabLoaderFillProps) {
  const node = (
    <div
      className={`hub-tab-loader-fill${dim ? " hub-tab-loader-fill--dim" : ""}`}
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
    >
      <HubLoaderOrb Icon={Icon} />
    </div>
  );

  const root = getLoaderRoot();
  if (root) return createPortal(node, root);
  return node;
}

export function HubLoadingView({ icon: Icon, ariaLabel, variant = "full" }: HubLoadingViewProps) {
  return <HubTabLoaderFill Icon={Icon} ariaLabel={ariaLabel} dim={variant === "overlay"} />;
}

export function UsersLoadingView({ variant = "full" }: Pick<HubLoadingViewProps, "variant">) {
  return <HubLoadingView icon={Users} ariaLabel="Loading users" variant={variant} />;
}

/** Presets for System sub-tabs (tab icon + aria label). */
export const HUB_LOADING_PRESETS = {
  overview: { icon: LayoutGrid, ariaLabel: "Loading overview" },
  schema: { icon: Database, ariaLabel: "Loading schema" },
  supabaseQuota: { icon: Cloud, ariaLabel: "Loading Supabase quota" },
  server: { icon: Server, ariaLabel: "Loading server inventory" },
  agent: { icon: Bot, ariaLabel: "Loading agent context" },
  template: { icon: Palette, ariaLabel: "Loading design template" },
} as const;
