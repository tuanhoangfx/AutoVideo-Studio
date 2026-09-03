import { useCallback, useEffect, useMemo, useState } from "react";
import type { HubVersionDesktopUpdate, HubVersionUpdateState } from "@/lib/hub-ui";
import type { AutoVideoUpdateStatus } from "@/types/autovideo-desktop";

/** Electron-updater status for the single header Update trigger beside version meta. */
export function useAutoVideoDesktopUpdate(): HubVersionDesktopUpdate | null {
  const [status, setStatus] = useState<AutoVideoUpdateStatus | null>(null);
  const [hasDesktopApi, setHasDesktopApi] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const api = window.autovideo;
    setHasDesktopApi(Boolean(api?.getUpdateStatus));
    if (!api?.getUpdateStatus) return;
    void api.getUpdateStatus().then(setStatus).catch(() => {});
    return api.onUpdateStatus?.(setStatus);
  }, []);

  const rawState = (status?.state ?? "idle") as HubVersionUpdateState;
  // Failed silent GitHub probe must not paint a warning beside version meta when bundle is current.
  const currentState: HubVersionUpdateState =
    rawState === "error" ? "latest" : rawState;
  const progress = Math.round(status?.progress?.percent ?? 0);
  const title =
    status?.message ||
    (currentState === "available"
      ? "New version available"
      : currentState === "latest"
        ? "You are using the latest version"
        : "Check for AutoVideo Studio updates");
  const disabled =
    busy ||
    currentState === "checking" ||
    currentState === "downloading" ||
    currentState === "installing" ||
    currentState === "dev";

  const onAction = useCallback(async () => {
    const api = window.autovideo;
    if (!api || disabled) return;
    setBusy(true);
    try {
      const next =
        currentState === "available"
          ? await api.downloadUpdate()
          : currentState === "downloaded"
            ? await api.installUpdate()
            : await api.checkForUpdates({ userInitiated: true });
      setStatus(next);
    } finally {
      if (currentState !== "downloaded") setBusy(false);
    }
  }, [currentState, disabled]);

  return useMemo(() => {
    if (!hasDesktopApi) return null;
    return { state: currentState, progress, title, disabled, onAction };
  }, [currentState, disabled, hasDesktopApi, onAction, progress, title]);
}
