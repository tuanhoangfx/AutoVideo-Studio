import { useEffect, useMemo, useState, type ReactNode } from "react";
import { KeyRound, LogOut, Mail, RefreshCcw, ShieldCheck, User } from "lucide-react";
import type { HubSessionLike } from "@tool-workspace/hub-identity";
import { canUseEmailPasswordRecovery, hubSessionLabels } from "@tool-workspace/hub-identity";
import {
  HubToolDetailModal,
  HubToolDetailModalPrimaryAction,
  HUB_TOOL_DETAIL_SCROLL_ROOT,
} from "../shell/HubToolDetailModal";
import {
  HubToolDetailSection,
  HUB_TOOL_DETAIL_SECTIONS_CLASS,
} from "../shell/HubToolDetailSection";
import { HubTocSectionNav } from "../shell/HubTocSectionNav";
import { compactIconSize } from "../ui-scale";
import type { HubWorkspaceUserProfileRow } from "./HubWorkspaceUserModal";

export const HUB_FULL_USER_ACCOUNT_TOC = [
  { id: "hub-user-account", label: "Account", emoji: "👤" },
  { id: "hub-user-link-email", label: "Link email", emoji: "✉️" },
  { id: "hub-user-password", label: "Security", emoji: "🔐" },
] as const;

export type HubFullUserAccountTocId = (typeof HUB_FULL_USER_ACCOUNT_TOC)[number]["id"];

export type HubFullUserAccountResult = { ok: boolean; message: string };

export type HubFullUserAccountModalProps = {
  open: boolean;
  onClose: () => void;
  session: HubSessionLike;
  title?: string;
  headerLeading?: ReactNode;
  headerTrailing?: ReactNode;
  initials: string;
  roleLabel: string;
  rows?: HubWorkspaceUserProfileRow[];
  onResolveRole?: (userId: string) => Promise<string | null>;
  onLinkEmail: (email: string) => Promise<HubFullUserAccountResult>;
  onSendOtp: (email: string) => Promise<HubFullUserAccountResult>;
  onConfirmPassword: (email: string, code: string, password: string) => Promise<HubFullUserAccountResult>;
  onSignOut: () => Promise<HubFullUserAccountResult>;
  onSignOutError?: (title: string, message: string) => void;
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

/** Full account modal — profile, link email, OTP password (P0004 Tool Hub admin). */
export function HubFullUserAccountModal({
  open,
  onClose,
  session,
  title,
  headerLeading,
  headerTrailing,
  initials,
  roleLabel,
  rows: rowsOverride,
  onResolveRole,
  onLinkEmail,
  onSendOtp,
  onConfirmPassword,
  onSignOut,
  onSignOutError,
}: HubFullUserAccountModalProps) {
  const [signingOut, setSigningOut] = useState(false);
  const [resolvedRole, setResolvedRole] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkMsg, setLinkMsg] = useState<string | null>(null);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpStep, setOtpStep] = useState<"idle" | "sent">("idle");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpMsg, setOtpMsg] = useState<string | null>(null);

  const user = session?.user ?? null;
  const labels = hubSessionLabels(session);
  const provider = String(user?.app_metadata?.provider ?? "email");
  const createdAt = user?.created_at ? new Date(user.created_at).toLocaleString("vi-VN") : "—";
  const lastSignIn = user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("vi-VN") : "—";
  const displayName = title ?? labels.loginId ?? labels.email ?? user?.id?.slice(0, 8) ?? "User";

  const recoveryEmail = useMemo(() => {
    if (labels.email) return labels.email;
    if (canUseEmailPasswordRecovery(labels.authEmail)) return labels.authEmail;
    return "";
  }, [labels.authEmail, labels.email]);

  const tocItems = useMemo(() => {
    const items = HUB_FULL_USER_ACCOUNT_TOC.filter((item) => {
      if (item.id === "hub-user-account") return true;
      return Boolean(session);
    });
    return items.map((item) => ({ id: item.id, label: item.label, emoji: item.emoji }));
  }, [session]);

  const sectionIds = useMemo(() => tocItems.map((item) => item.id), [tocItems]);

  const defaultRows: HubWorkspaceUserProfileRow[] = useMemo(
    () => [
      { label: "User ID", value: labels.loginId || "—", icon: User },
      {
        label: "Email",
        value: labels.email || (labels.hasSyntheticAuth ? "Not linked" : labels.authEmail) || "—",
        icon: Mail,
      },
      { label: "Role", value: resolvedRole ?? roleLabel, icon: ShieldCheck },
      { label: "Provider", value: provider, icon: KeyRound },
      { label: "Created", value: createdAt, icon: User },
      { label: "Last sign in", value: lastSignIn, icon: RefreshCcw },
    ],
    [
      labels.loginId,
      labels.email,
      labels.hasSyntheticAuth,
      labels.authEmail,
      resolvedRole,
      roleLabel,
      provider,
      createdAt,
      lastSignIn,
    ],
  );

  const rows = rowsOverride ?? defaultRows;

  useEffect(() => {
    if (!open || !user?.id || !onResolveRole) {
      setResolvedRole(null);
      return;
    }
    let cancelled = false;
    void onResolveRole(user.id).then((r) => {
      if (!cancelled && r) setResolvedRole(r);
    });
    return () => {
      cancelled = true;
    };
  }, [open, user?.id, onResolveRole]);

  useEffect(() => {
    if (!open) return;
    setLinkEmail(labels.email);
    setOtpEmail(recoveryEmail);
    setLinkMsg(null);
    setOtpMsg(null);
    setOtpStep("idle");
    setOtpCode("");
    setNewPassword("");
  }, [open, labels.email, recoveryEmail]);

  const handleSignOut = () => {
    void (async () => {
      setSigningOut(true);
      const result = await onSignOut();
      setSigningOut(false);
      if (!result.ok) {
        onSignOutError?.("Sign out failed", result.message);
        return;
      }
      onClose();
    })();
  };

  return (
    <HubToolDetailModal
      open={open}
      onClose={onClose}
      title={displayName}
      titleId="hub-user-modal-title"
      headerLeading={
        headerLeading ?? (
          <span
            className="user-access-modal__avatar grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-indigo-300/25 bg-indigo-500/20 text-xs font-bold text-indigo-100"
            aria-hidden
          >
            {initials}
          </span>
        )
      }
      headerTrailing={
        headerTrailing ?? (
          <span className="truncate font-mono text-[10px] text-[var(--muted)]">
            {labels.loginId ? `ID: ${labels.loginId}` : user?.id?.slice(0, 8) ?? "—"}
          </span>
        )
      }
      shellClassName="hub-header-panel-modal"
      sectionIds={sectionIds}
      toc={
        <div className="hub-toc-nav">
          <HubTocSectionNav items={tocItems} scrollRootSelector={HUB_TOOL_DETAIL_SCROLL_ROOT} />
        </div>
      }
      footer={
        <HubToolDetailModalPrimaryAction
          label={signingOut ? "Signing out…" : "Sign Out"}
          onClick={handleSignOut}
          disabled={!session || signingOut}
          busy={signingOut}
          danger
          icon={LogOut}
        />
      }
      ariaLabelledBy="hub-user-modal-title"
    >
      <div className={HUB_TOOL_DETAIL_SECTIONS_CLASS}>
        <HubToolDetailSection id="hub-user-account" title="Account">
          <div className="grid gap-2 text-sm">
            {rows.map((row) => (
              <ProfileRow key={row.label} {...row} />
            ))}
          </div>
        </HubToolDetailSection>

        {session ? (
          <HubToolDetailSection id="hub-user-link-email" title="Link email">
            <p className="mb-2 text-[10px] text-[var(--muted)]">
              Add or change your contact email. A confirmation link is sent before it becomes active.
            </p>
            <input
              className="field mb-2 w-full text-xs"
              type="email"
              placeholder="you@company.com"
              value={linkEmail}
              onChange={(e) => setLinkEmail(e.target.value)}
              autoComplete="email"
            />
            <button
              type="button"
              className="btn w-full text-xs"
              disabled={linkBusy}
              onClick={() => {
                void (async () => {
                  setLinkBusy(true);
                  setLinkMsg(null);
                  const result = await onLinkEmail(linkEmail.trim().toLowerCase());
                  setLinkBusy(false);
                  setLinkMsg(result.message);
                })();
              }}
            >
              {linkBusy ? "Sending…" : labels.email ? "Update linked email" : "Link email"}
            </button>
            {linkMsg ? <p className="mt-2 text-[10px] text-indigo-200">{linkMsg}</p> : null}
          </HubToolDetailSection>
        ) : null}

        {session ? (
          <HubToolDetailSection id="hub-user-password" title="Security">
            <p className="mb-2 text-[10px] text-[var(--muted)]">
              We send a 6-digit code to your linked email. Works after email is confirmed.
            </p>
            <input
              className="field mb-2 w-full text-xs"
              type="email"
              placeholder="Linked email"
              value={otpEmail}
              onChange={(e) => setOtpEmail(e.target.value)}
              disabled={otpStep === "sent"}
            />
            {otpStep === "sent" ? (
              <>
                <input
                  className="field mb-2 w-full text-xs"
                  placeholder="6-digit code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
                <input
                  className="field mb-2 w-full text-xs"
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </>
            ) : null}
            <div className="flex gap-2">
              {otpStep === "idle" ? (
                <button
                  type="button"
                  className="btn flex-1 text-xs"
                  disabled={otpBusy || !recoveryEmail}
                  onClick={() => {
                    void (async () => {
                      setOtpBusy(true);
                      setOtpMsg(null);
                      const result = await onSendOtp(otpEmail.trim().toLowerCase());
                      setOtpBusy(false);
                      setOtpMsg(result.message);
                      if (result.ok) setOtpStep("sent");
                    })();
                  }}
                >
                  {otpBusy ? "Sending…" : "Send code"}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn flex-1 text-xs"
                  disabled={otpBusy}
                  onClick={() => {
                    void (async () => {
                      setOtpBusy(true);
                      setOtpMsg(null);
                      const result = await onConfirmPassword(
                        otpEmail.trim().toLowerCase(),
                        otpCode.trim(),
                        newPassword,
                      );
                      setOtpBusy(false);
                      setOtpMsg(result.message);
                      if (result.ok) {
                        setOtpStep("idle");
                        setOtpCode("");
                        setNewPassword("");
                      }
                    })();
                  }}
                >
                  {otpBusy ? "Saving…" : "Set new password"}
                </button>
              )}
            </div>
            {otpMsg ? <p className="mt-2 text-[10px] text-amber-100">{otpMsg}</p> : null}
          </HubToolDetailSection>
        ) : null}
      </div>
    </HubToolDetailModal>
  );
}
