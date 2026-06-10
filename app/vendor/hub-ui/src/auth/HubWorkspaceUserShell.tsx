import { useMemo, useState, type ReactNode } from "react";
import { hubSessionLabels, type HubSessionLike } from "@tool-workspace/hub-identity";
import { HubSidebarUserFooter } from "./HubSidebarUserFooter";
import { HubWorkspaceUserAvatar } from "./HubWorkspaceUserAvatar";
import { HubWorkspaceUserModal } from "./HubWorkspaceUserModal";
import { resolveWorkspaceRoleKey } from "./hub-workspace-role-icon";
import {
  buildWorkspaceUserProfileRows,
  workspaceUserFooterLabel,
  workspaceUserInitials,
} from "./workspace-user-session";

export type HubWorkspaceUserModalRenderContext = {
  open: boolean;
  onClose: () => void;
  signingOut: boolean;
  displayTitle: string;
  initials: string;
  profileRows: ReturnType<typeof buildWorkspaceUserProfileRows>;
  footerUserLabel: string;
  roleKey: string;
  labels: ReturnType<typeof hubSessionLabels>;
};

export type HubWorkspaceUserShellProps = {
  session: HubSessionLike;
  anonymous?: boolean;
  /** Return false to keep modal open (e.g. sign-out error toast). Omit when using `renderModal`. */
  onSignOut?: () => boolean | void | Promise<boolean | void>;
  /** P0004 — swap in HubFullUserAccountModal while keeping shared footer. */
  renderModal?: (ctx: HubWorkspaceUserModalRenderContext) => ReactNode;
  modalTitle?: string;
  footerTitle?: string;
  footerGuestLabel?: string;
  anonymousFooterLabel?: string;
  workspaceNote?: string;
  includeLoginId?: boolean;
  emptyEmailLabel?: string;
  labels?: ReturnType<typeof hubSessionLabels>;
  roleKey?: string;
};

/** Sidebar User footer + workspace account modal — single config (P0020 / P0016). */
export function HubWorkspaceUserShell({
  session,
  anonymous = false,
  onSignOut,
  modalTitle,
  footerTitle = "Account & sign out",
  footerGuestLabel,
  anonymousFooterLabel,
  workspaceNote,
  includeLoginId = false,
  emptyEmailLabel,
  labels: labelsProp,
  roleKey: roleKeyProp,
  renderModal,
}: HubWorkspaceUserShellProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const labels = labelsProp ?? hubSessionLabels(session);
  const roleKey = roleKeyProp ?? (anonymous ? "anonymous" : resolveWorkspaceRoleKey(session));
  const footerUserLabel = workspaceUserFooterLabel({
    labels,
    session,
    anonymous,
    anonymousLabel: anonymousFooterLabel,
    guestLabel: footerGuestLabel,
  });
  const displayTitle =
    modalTitle ??
    (labels.loginId ||
      labels.email ||
      session?.user?.email?.trim() ||
      footerUserLabel);
  const initials = useMemo(
    () => workspaceUserInitials(labels.email || session?.user?.email, session?.user?.id),
    [labels.email, session?.user?.email, session?.user?.id],
  );
  const profileRows = useMemo(
    () =>
      buildWorkspaceUserProfileRows({
        session,
        labels,
        includeLoginId,
        emptyEmailLabel,
      }),
    [session, labels, includeLoginId, emptyEmailLabel],
  );

  const modalCtx: HubWorkspaceUserModalRenderContext = {
    open,
    onClose: () => setOpen(false),
    signingOut,
    displayTitle,
    initials,
    profileRows,
    footerUserLabel,
    roleKey,
    labels,
  };

  const handleSignOut = () => {
    if (!onSignOut) return;
    void (async () => {
      setSigningOut(true);
      try {
        const ok = await onSignOut();
        if (ok !== false) setOpen(false);
      } finally {
        setSigningOut(false);
      }
    })();
  };

  return (
    <>
      <HubSidebarUserFooter
        footerUserLabel={footerUserLabel}
        title={footerTitle}
        roleKey={roleKey}
        onOpenUser={() => setOpen(true)}
      />
      {renderModal ? (
        renderModal(modalCtx)
      ) : (
        <HubWorkspaceUserModal
          open={open}
          onClose={() => setOpen(false)}
          title={displayTitle}
          userId={session?.user?.id ?? null}
          sessionActive={Boolean(session) && !anonymous}
          signingOut={signingOut}
          onSignOut={handleSignOut}
          workspaceNote={workspaceNote}
          headerLeading={<HubWorkspaceUserAvatar initials={initials} />}
          rows={profileRows}
        />
      )}
    </>
  );
}
