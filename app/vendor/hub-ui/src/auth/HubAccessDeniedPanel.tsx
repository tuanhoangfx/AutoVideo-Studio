import type { ReactNode } from "react";

export type HubAccessDeniedPanelProps = {
  title: string;
  message: ReactNode;
  signedInAs?: string;
  onSignOut: () => void;
  signOutLabel?: string;
};

/** Access denied card — golden `auth-inline` shell (P0016 / workspace tools). */
export function HubAccessDeniedPanel({
  title,
  message,
  signedInAs,
  onSignOut,
  signOutLabel = "Sign out",
}: HubAccessDeniedPanelProps) {
  return (
    <div className="auth-inline anim-fade w-full max-w-md">
      <div className="auth-inline-card">
        <div className="auth-inline-title">{title}</div>
        <div className="auth-inline-sub">
          {signedInAs ? (
            <>
              Signed in as <strong>{signedInAs}</strong>.{" "}
            </>
          ) : null}
          {message}
        </div>
        <button type="button" className="auth-inline-btn" onClick={onSignOut}>
          {signOutLabel}
        </button>
      </div>
    </div>
  );
}
