import { HubUsageLogPanel } from "./HubUsageLogPanel";
import { useHubAppLog } from "./HubAppLogProvider";

export type HubLogButtonVariant = "tab" | "global";

export type HubLogButtonProps = {
  /** `tab` — header (current tab only, label visible). `global` — sidebar footer (all tabs). */
  variant?: HubLogButtonVariant;
  emptyMessage?: string;
  title?: string;
  subtitle?: string;
};

/** Golden Log trigger — pairs with `HubAppLogProvider` (header tab log + footer session log). */
export function HubLogButton({
  variant = "tab",
  emptyMessage = "Chưa có thao tác trong phiên này.",
  title,
  subtitle,
}: HubLogButtonProps) {
  const { tabLogs, allLogs } = useHubAppLog();
  const logs = variant === "global" ? allLogs : tabLogs;
  const isGlobal = variant === "global";

  return (
    <HubUsageLogPanel
      logs={logs}
      compact={false}
      sidebarRow={isGlobal}
      title={title ?? "Log"}
      subtitle={subtitle ?? (isGlobal ? "All tabs in this session" : "Actions on this tab")}
      emptyMessage={emptyMessage}
    />
  );
}
