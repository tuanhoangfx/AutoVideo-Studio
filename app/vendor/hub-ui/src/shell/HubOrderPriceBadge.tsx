import { formatHubOrderPricePillLabel } from "../lib/format-order-price";
import {
  HUB_ORDER_PRICE_BADGE_CLASS,
  HUB_ORDER_PRICE_BADGE_DEFAULT_TONE,
  type HubOrderPriceBadgeTone,
} from "./hub-order-price-badge";

export type HubOrderPriceBadgeProps = {
  amountCents: number | null | undefined;
  currency?: string;
  tone?: HubOrderPriceBadgeTone;
  className?: string;
};

/**
 * Orders directory Price display — pill tones for design review; `inline` = tabular text.
 * Returns null when amount is missing; caller renders DirectoryEmptyDash.
 */
export function HubOrderPriceBadge({
  amountCents,
  currency = "VND",
  tone = HUB_ORDER_PRICE_BADGE_DEFAULT_TONE,
  className = "",
}: HubOrderPriceBadgeProps) {
  const label = formatHubOrderPricePillLabel(amountCents, currency);
  if (!label) return null;

  const toneClass = `${HUB_ORDER_PRICE_BADGE_CLASS}--${tone}`;

  return (
    <span className={[HUB_ORDER_PRICE_BADGE_CLASS, toneClass, className].filter(Boolean).join(" ")}>
      {label}
    </span>
  );
}
