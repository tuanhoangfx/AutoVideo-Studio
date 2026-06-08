import type { LucideIcon } from "lucide-react";
import { ExternalLink, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import {
  HubToolDetailModal,
  HubToolDetailModalPrimaryAction,
} from "../shell/HubToolDetailModal";
import { compactIconSize } from "../ui-scale";

export type HubWorkspaceUserProfileRow = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export type HubWorkspaceUserModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  headerLeading?: ReactNode;
  userId?: string | null;
  rows: HubWorkspaceUserProfileRow[];
  toolHubUsersHref?: string;
  toolHubUsersLabel?: string;
  workspaceNote?: string;
  signingOut?: boolean;
  sessionActive?: boolean;
  onSignOut: () => void;
  children?: ReactNode;
};

function ProfileRow({ label, value, icon: Icon }: HubWorkspaceUserProfileRow) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[.025] px-3 py-2.5">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/[.04] text-indigo-200">
        <Icon size={compactIconSize(14)} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{label}</div>
        <div className="mt-0.5 truncate font-medium text-[var(--text)]" title={value}>
          {value}
        </div>
      </div>
    </div>
  );
}

/** Workspace user account modal — profile rows, Tool Hub Users link, sign out (P0020 / P0016). */
export function HubWorkspaceUserModal({
  open,
  onClose,
  title,
  headerLeading,
  userId,
  rows,
  toolHubUsersHref,
  toolHubUsersLabel = "Tool Hub — Users",
  workspaceNote,
  signingOut = false,
  sessionActive = true,
  onSignOut,
  children,
}: HubWorkspaceUserModalProps) {
  return (
    <HubToolDetailModal
      open={open}
      onClose={onClose}
      title={title}
      titleId="hub-workspace-user-modal-title"
      headerLeading={headerLeading}
      shellClassName="hub-header-panel-modal"
      ariaLabelledBy="hub-workspace-user-modal-title"
      footer={
        <HubToolDetailModalPrimaryAction
          label={signingOut ? "Signing out…" : "Sign Out"}
          onClick={onSignOut}
          disabled={!sessionActive || signingOut}
          busy={signingOut}
          danger
          icon={LogOut}
        />
      }
    >
      <div className="space-y-3 px-1">
        {userId ? (
          <p className="font-mono text-[10px] text-[var(--muted)]">{userId}</p>
        ) : (
          <p className="text-xs text-[var(--muted)]">No active session</p>
        )}
        {workspaceNote ? <p className="text-xs text-[var(--muted)]">{workspaceNote}</p> : null}
        <div className="grid gap-2 text-sm">
          {rows.map((row) => (
            <ProfileRow key={row.label} {...row} />
          ))}
        </div>
        {toolHubUsersHref ? (
          <a
            href={toolHubUsersHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-indigo-300 hover:text-indigo-200"
          >
            <ExternalLink size={14} />
            {toolHubUsersLabel}
          </a>
        ) : null}
        {children}
      </div>
    </HubToolDetailModal>
  );
}
