import {
  BookOpen,
  Gauge,
  Inbox,
  LayoutGrid,
  LayoutTemplate,
  PanelLeft,
  Settings2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { BadgeSpec } from "../types/filter-badge";
import type { HubUiTemplate } from "../ui-template-types";

export type HubUiTemplateMeta = {
  id: HubUiTemplate;
  /** Agent / ui-patterns.catalog display name */
  label: string;
  icon: LucideIcon;
  iconClassName: string;
  variantClass: string;
};

/** Hub UI screen templates — icons aligned with Agent tab pattern rows. */
export const HUB_UI_TEMPLATE_META: Record<HubUiTemplate, HubUiTemplateMeta> = {
  directory: {
    id: "directory",
    label: "Directory",
    icon: LayoutGrid,
    iconClassName: "text-emerald-300",
    variantClass: "border-emerald-500/35 bg-emerald-500/[.06] text-emerald-200",
  },
  "document-toc": {
    id: "document-toc",
    label: "Document TOC",
    icon: BookOpen,
    iconClassName: "text-amber-300",
    variantClass: "border-amber-500/35 bg-amber-500/[.06] text-amber-200",
  },
  dashboard: {
    id: "dashboard",
    label: "Dashboard",
    icon: Gauge,
    iconClassName: "text-indigo-300",
    variantClass: "border-indigo-500/35 bg-indigo-500/[.06] text-indigo-200",
  },
  "system-panels": {
    id: "system-panels",
    label: "System panels",
    icon: Settings2,
    iconClassName: "text-violet-300",
    variantClass: "border-violet-500/35 bg-violet-500/[.06] text-violet-200",
  },
  "workspace-composer": {
    id: "workspace-composer",
    label: "Workspace composer",
    icon: PanelLeft,
    iconClassName: "text-cyan-300",
    variantClass: "border-cyan-500/35 bg-cyan-500/[.06] text-cyan-200",
  },
  "inbox-split": {
    id: "inbox-split",
    label: "Inbox split",
    icon: Inbox,
    iconClassName: "text-sky-300",
    variantClass: "border-sky-500/35 bg-sky-500/[.06] text-sky-200",
  },
  "auth-gate": {
    id: "auth-gate",
    label: "Auth gate",
    icon: ShieldCheck,
    iconClassName: "text-rose-300",
    variantClass: "border-rose-500/35 bg-rose-500/[.06] text-rose-200",
  },
};

const FALLBACK_META: HubUiTemplateMeta = {
  id: "directory",
  label: "Pattern",
  icon: LayoutTemplate,
  iconClassName: "text-violet-300",
  variantClass: "border-violet-500/35 bg-violet-500/[.06] text-violet-200",
};

export function resolveHubUiTemplateMeta(template: string): HubUiTemplateMeta {
  const key = template as HubUiTemplate;
  return HUB_UI_TEMPLATE_META[key] ?? { ...FALLBACK_META, label: template || "—" };
}

export function resolveHubUiTemplateBadge(template: string): BadgeSpec {
  const meta = resolveHubUiTemplateMeta(template);
  return {
    label: meta.label,
    iconMeta: { icon: meta.icon, className: meta.iconClassName },
    variantClass: meta.variantClass,
  };
}
