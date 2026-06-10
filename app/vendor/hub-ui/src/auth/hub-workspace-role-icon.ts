import type { LucideIcon } from "lucide-react";
import { Crown, ShieldCheck, UserRound } from "lucide-react";
import type { HubSessionLike } from "@tool-workspace/hub-identity";

export type HubWorkspaceRoleIconMeta = {
  icon: LucideIcon;
  className: string;
};

const ROLE_ICON: Record<string, HubWorkspaceRoleIconMeta> = {
  admin: { icon: Crown, className: "text-indigo-300" },
  manager: { icon: ShieldCheck, className: "text-purple-300" },
  user: { icon: UserRound, className: "text-emerald-300" },
  employee: { icon: UserRound, className: "text-emerald-300" },
  authenticated: { icon: UserRound, className: "text-emerald-300" },
  anonymous: { icon: UserRound, className: "text-violet-400" },
};

export function resolveWorkspaceRoleKey(session: HubSessionLike, fallback = "user"): string {
  const user = session?.user;
  const raw = String(user?.app_metadata?.role ?? user?.user_metadata?.role ?? fallback);
  return raw.trim().toLowerCase() || fallback;
}

export function resolveWorkspaceRoleIcon(roleKey: string): HubWorkspaceRoleIconMeta {
  const key = roleKey.trim().toLowerCase();
  return ROLE_ICON[key] ?? ROLE_ICON.user;
}
