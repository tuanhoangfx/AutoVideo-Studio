import { LayoutGrid, Settings2, Users, type LucideIcon } from "lucide-react";
import type { BadgeSpec } from "../types/filter-badge";

export type HubAppTabGroup = "hub" | "users" | "system";

export type HubAppTabGroupMeta = {
  id: HubAppTabGroup;
  label: string;
  icon: LucideIcon;
  iconClassName: string;
  variantClass: string;
};

export const HUB_APP_TAB_GROUP_META: Record<HubAppTabGroup, HubAppTabGroupMeta> = {
  hub: {
    id: "hub",
    label: "Hub",
    icon: LayoutGrid,
    iconClassName: "text-indigo-300",
    variantClass: "border-indigo-500/35 bg-indigo-500/[.06] text-indigo-200",
  },
  users: {
    id: "users",
    label: "Users",
    icon: Users,
    iconClassName: "text-sky-300",
    variantClass: "border-sky-500/35 bg-sky-500/[.06] text-sky-200",
  },
  system: {
    id: "system",
    label: "System",
    icon: Settings2,
    iconClassName: "text-violet-300",
    variantClass: "border-violet-500/35 bg-violet-500/[.06] text-violet-200",
  },
};

export function resolveHubAppTabGroupBadge(group: string): BadgeSpec {
  const meta = HUB_APP_TAB_GROUP_META[group as HubAppTabGroup];
  if (!meta) {
    return {
      label: group || "—",
      iconMeta: { icon: LayoutGrid, className: "text-slate-300" },
      variantClass: "border-white/10 bg-white/[0.03] text-[var(--muted)]",
    };
  }
  return {
    label: meta.label,
    iconMeta: { icon: meta.icon, className: meta.iconClassName },
    variantClass: meta.variantClass,
  };
}
