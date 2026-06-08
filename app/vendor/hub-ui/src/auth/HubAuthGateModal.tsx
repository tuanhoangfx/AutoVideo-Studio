import { useState, type FormEvent, type ReactNode } from "react";
import { LockKeyhole, LogIn, UserPlus } from "lucide-react";
import { HubFormFieldLabel } from "../shell/HubFormFieldLabel";
import {
  HubToolDetailModal,
  HubToolDetailModalPrimaryAction,
  HUB_TOOL_DETAIL_SCROLL_ROOT,
} from "../shell/HubToolDetailModal";
import { normalizeHubAuthError, type NormalizeHubAuthErrorOptions } from "./normalize-hub-auth-error";

type AuthMode = "signin" | "signup";

const AUTH_GATE_TOC: { id: AuthMode; label: string; emoji: string }[] = [
  { id: "signin", label: "Sign In", emoji: "🔐" },
  { id: "signup", label: "Sign Up", emoji: "✨" },
];

function AuthGateTocNav({
  mode,
  onModeChange,
}: {
  mode: AuthMode;
  onModeChange: (next: AuthMode) => void;
}) {
  return (
    <nav className="hub-toc-nav" aria-label="Auth mode">
      <ul className="hub-toc-nav__list space-y-0.5" role="tablist">
        {AUTH_GATE_TOC.map((item) => {
          const active = mode === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                role="tab"
                aria-selected={active}
                className={`hub-toc-nav__item group relative z-[1] min-h-[var(--overview-toc-row-h,2rem)] w-full cursor-pointer text-left text-[13px] transition-colors${
                  active ? " is-active" : ""
                }`}
                onClick={() => onModeChange(item.id)}
              >
                <span className="hub-toc-nav__label flex min-w-0 items-center gap-1.5 truncate rounded-lg px-2 py-1 font-medium text-[var(--muted)] transition-all duration-200 group-hover:text-[var(--text)]">
                  <span className="shrink-0 text-[12px] leading-none opacity-90" aria-hidden>
                    {item.emoji}
                  </span>
                  <span className="truncate">{item.label}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export type HubAuthGateModalProps = {
  open: boolean;
  onClose: () => void;
  onAuthed?: () => void;
  title: string;
  /** @deprecated Subtitle removed — use modal title + field labels only. */
  subtitle?: string;
  headerLeading?: ReactNode;
  /** @deprecated Field hints removed — use placeholders and validation messages. */
  showFieldHints?: boolean;
  /** Inline submit button (P0004) vs footer primary action (P0020/P0016) */
  submitPlacement?: "form" | "footer";
  errorOptions?: NormalizeHubAuthErrorOptions;
  onSubmit: (
    login: string,
    password: string,
    mode: AuthMode,
  ) => Promise<void | { error?: string }>;
  onForgotPassword?: (login: string) => Promise<string | void>;
};

export function HubAuthGateModal({
  open,
  onClose,
  onAuthed,
  title,
  subtitle: _subtitle,
  headerLeading,
  showFieldHints: _showFieldHints = false,
  submitPlacement = "form",
  errorOptions,
  onSubmit,
  onForgotPassword,
}: HubAuthGateModalProps) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await onSubmit(login, password, mode);
      if (result && "error" in result && result.error) {
        setMessage(normalizeHubAuthError(result.error, errorOptions));
        setBusy(false);
        return;
      }
      setBusy(false);
      onAuthed?.();
    } catch (err) {
      setBusy(false);
      setMessage(
        normalizeHubAuthError(err instanceof Error ? err.message : String(err), errorOptions),
      );
    }
  };

  const onForgot = async () => {
    if (!onForgotPassword) return;
    setBusy(true);
    setMessage("");
    try {
      const msg = await onForgotPassword(login);
      setBusy(false);
      if (msg) setMessage(msg);
    } catch (err) {
      setBusy(false);
      setMessage(err instanceof Error ? err.message : "Enter your linked email first.");
    }
  };

  if (!open) return null;

  return (
    <HubToolDetailModal
      open
      onClose={onClose}
      title={title}
      titleId="auth-gate-title"
      headerLeading={headerLeading}
      ariaLabelledBy="auth-gate-title"
      size="detail"
      scrollRootSelector={HUB_TOOL_DETAIL_SCROLL_ROOT}
      toc={
        <AuthGateTocNav
          mode={mode}
          onModeChange={(next) => {
            setMode(next);
            setMessage("");
          }}
        />
      }
      footer={
        submitPlacement === "footer" ? (
          <HubToolDetailModalPrimaryAction
            label={mode === "signin" ? "Sign In" : "Sign Up"}
            onClick={() => void submit()}
            disabled={busy}
            busy={busy}
            icon={mode === "signin" ? LogIn : UserPlus}
          />
        ) : undefined
      }
    >
      <form className="auth-gate-form" onSubmit={(e) => void submit(e)}>
        <label className="block min-w-0">
          <HubFormFieldLabel icon={LogIn} iconClassName="text-indigo-300">
            User ID or email
          </HubFormFieldLabel>
          <input
            className="field auth-gate-field w-full"
            type="text"
            placeholder="Required"
            autoComplete="username"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
          />
        </label>
        <div className="auth-gate-password-wrap">
          <label className="block min-w-0">
            <HubFormFieldLabel icon={LockKeyhole} iconClassName="text-amber-300">
              Password
            </HubFormFieldLabel>
            <input
              className="field auth-gate-field w-full"
              type="password"
              placeholder="Required"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {mode === "signin" && onForgotPassword ? (
            <button
              type="button"
              className="auth-gate-forgot"
              disabled={busy}
              onClick={() => void onForgot()}
            >
              Forgot Password?
            </button>
          ) : null}
        </div>
        {message ? <p className="auth-gate-message">{message}</p> : null}
        {submitPlacement === "form" ? (
          <button type="submit" className="auth-gate-submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        ) : null}
      </form>
    </HubToolDetailModal>
  );
}
