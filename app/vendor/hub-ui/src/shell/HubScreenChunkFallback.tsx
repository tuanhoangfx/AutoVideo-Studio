import type { LucideIcon } from "lucide-react";
import { HubLoadingView } from "./HubLoadingView";

export type HubScreenChunkFallbackProps = {
  icon: LucideIcon;
  ariaLabel: string;
  variant?: "full" | "overlay" | "skeleton";
  /** When false, skip portal overlay (hidden/inactive tabs must not block the active screen). */
  enabled?: boolean;
};

/** Suspense fallback for lazy route chunks — orb loader instead of plain text. */
export function HubScreenChunkFallback({
  icon,
  ariaLabel,
  variant = "overlay",
  enabled = true,
}: HubScreenChunkFallbackProps) {
  return (
    <div className="flex min-h-[12rem] items-center justify-center">
      <HubLoadingView icon={icon} ariaLabel={ariaLabel} variant={variant} enabled={enabled} />
    </div>
  );
}
