import { useState } from "react";
import { HubAuthGateModal } from "./HubAuthGateModal";
import { HubAuthLogoutChip } from "./HubAuthLogoutChip";
import { HubToolAvatar } from "../shell/HubToolAvatar";

type PreviewTool = "P0004" | "P0020";

const PREVIEW: Record<
  PreviewTool,
  {
    title: string;
    toolInfo: { code: string; name: string; tagline: string };
    anonymousHint?: string;
    dismissible: boolean;
    showAnonymous: boolean;
  }
> = {
  P0004: {
    title: "Welcome to Tool Hub",
    toolInfo: { code: "P0004", name: "Tool Hub", tagline: "Workspace login for infi tools" },
    dismissible: false,
    showAnonymous: false,
  },
  P0020: {
    title: "Welcome to Data Box",
    toolInfo: { code: "P0020", name: "Data Box", tagline: "Notes, cookies & 2FA vault" },
    anonymousHint: "Browse with limited features. Cloud sync requires sign-in.",
    dismissible: true,
    showAnonymous: true,
  },
};

/** Design Template / examples — live golden auth gate (modal + E0001 header chip). */
export function HubAuthGateGoldenPreview({ tool = "P0004" }: { tool?: PreviewTool }) {
  const [modalOpen, setModalOpen] = useState(true);
  const cfg = PREVIEW[tool];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-6">
      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          HubAuthLogoutChip — E0001 extension header
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-white/8 bg-white/[.02] px-4 py-5">
          <HubAuthLogoutChip
            email="user@infix1.io.vn"
            linked
            onOpenUser={() => undefined}
            onLogout={() => undefined}
          />
          <HubAuthLogoutChip email="guest" onLogout={() => undefined} />
        </div>
        <p className="text-center text-[10px] text-[var(--muted)]">
          Sidebar User row uses classic trailing email — chip is for extension header only.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            HubAuthGateModal — {cfg.toolInfo.code} · {cfg.showAnonymous ? "3 tabs" : "2 tabs"}
          </h3>
          <button
            type="button"
            className="rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-100"
            onClick={() => setModalOpen(true)}
          >
            Open modal
          </button>
        </div>
        <p className="text-center text-xs text-[var(--muted)]">
          Modal-only · 30rem · blur 8px
          {cfg.showAnonymous ? " · Anonymous tab on P0020" : " · sign-in required on P0004"}
        </p>
      </section>

      <HubAuthGateModal
        open={modalOpen}
        dismissible={cfg.dismissible}
        title={cfg.title}
        toolInfo={cfg.toolInfo}
        anonymousHint={cfg.anonymousHint}
        headerLeading={<HubToolAvatar code={cfg.toolInfo.code} size="sm" />}
        onClose={() => setModalOpen(false)}
        onAnonymous={cfg.showAnonymous ? () => setModalOpen(false) : undefined}
        onAuthed={() => setModalOpen(false)}
        onSubmit={async () => ({ error: "Preview only — wire onSubmit in app gate." })}
        onForgotPassword={async () => "Preview only."}
      />
    </div>
  );
}
