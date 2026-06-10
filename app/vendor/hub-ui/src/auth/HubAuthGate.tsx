import { useState } from "react";
import { HubAuthGateModal, type HubAuthGateModalProps } from "./HubAuthGateModal";

export type HubAuthGateProps = {
  onAuthed?: () => void;
  /** Continue without sign-in (e.g. P0020 anonymous / local mode). */
  onAnonymous?: () => void;
  modal: Omit<HubAuthGateModalProps, "open" | "onClose" | "onAuthed" | "onAnonymous">;
};

/** Golden auth gate — compact login modal with Sign In / Sign Up / Anonymous tabs. */
export function HubAuthGate({ onAuthed, onAnonymous, modal }: HubAuthGateProps) {
  const [open, setOpen] = useState(true);
  const dismissible = Boolean(onAnonymous);

  const finishAnonymous = () => {
    setOpen(false);
    onAnonymous?.();
    onAuthed?.();
  };

  return (
    <HubAuthGateModal
      {...modal}
      open={open}
      dismissible={dismissible}
      onClose={() => {
        if (dismissible) finishAnonymous();
      }}
      onAnonymous={onAnonymous ? finishAnonymous : undefined}
      onAuthed={() => {
        setOpen(false);
        onAuthed?.();
      }}
    />
  );
}
