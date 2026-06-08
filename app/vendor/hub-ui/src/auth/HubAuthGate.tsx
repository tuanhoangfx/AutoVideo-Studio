import { useState, type ReactNode } from "react";
import { HubAuthGateModal, type HubAuthGateModalProps } from "./HubAuthGateModal";

export type HubAuthGateProps = {
  inlineTitle: string;
  inlineSub?: string;
  loginButtonLabel?: string;
  extraInlineActions?: ReactNode;
  onAuthed?: () => void;
  modal: Omit<HubAuthGateModalProps, "open" | "onClose" | "onAuthed">;
};

/** Inline sign-in card + login modal — Golden Pattern (P0004 / P0020 / P0016). */
export function HubAuthGate({
  inlineTitle,
  inlineSub,
  loginButtonLabel = "Sign in",
  extraInlineActions,
  onAuthed,
  modal,
}: HubAuthGateProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="auth-inline anim-fade">
        <div className="auth-inline-card">
          <div className="auth-inline-title">{inlineTitle}</div>
          {inlineSub ? <div className="auth-inline-sub">{inlineSub}</div> : null}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="auth-inline-btn" onClick={() => setShowModal(true)}>
              {loginButtonLabel}
            </button>
            {extraInlineActions}
          </div>
        </div>
      </div>
      {showModal ? (
        <HubAuthGateModal
          {...modal}
          open
          onClose={() => setShowModal(false)}
          onAuthed={() => {
            setShowModal(false);
            onAuthed?.();
          }}
        />
      ) : null}
    </>
  );
}
