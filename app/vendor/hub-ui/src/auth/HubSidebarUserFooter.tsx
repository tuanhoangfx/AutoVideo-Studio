import { User } from "lucide-react";
import { HubSidebarFooterButton } from "../shell/HubSidebarFooterButton";
import { compactIconSize } from "../ui-scale";
import { resolveWorkspaceRoleIcon } from "./hub-workspace-role-icon";

export type HubSidebarUserFooterProps = {
  footerUserLabel: string;
  onOpenUser: () => void;
  /** Workspace role key — icon only, shown before email (admin / manager / user). */
  roleKey?: string;
  label?: string;
  title?: string;
};

/** Sidebar User row — role icon + email (no Signed-in pill). */
export function HubSidebarUserFooter({
  footerUserLabel,
  onOpenUser,
  roleKey = "user",
  label = "User",
  title = "Account & sign out",
}: HubSidebarUserFooterProps) {
  const roleMeta = resolveWorkspaceRoleIcon(roleKey);
  const RoleIcon = roleMeta.icon;

  return (
    <HubSidebarFooterButton
      icon={User}
      iconClass="text-violet-400"
      label={label}
      title={title}
      onClick={onOpenUser}
      trailing={
        <span className="flex max-w-[140px] items-center gap-1.5 truncate">
          <RoleIcon
            size={compactIconSize(12)}
            className={`shrink-0 ${roleMeta.className}`}
            aria-hidden
          />
          <span className="truncate text-xs font-medium text-[var(--text)]/80">{footerUserLabel}</span>
        </span>
      }
    />
  );
}
