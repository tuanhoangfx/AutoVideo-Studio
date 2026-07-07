/** SSOT class — V2 pill + dark glass amber glow (P0020 OTP palette). */
export const HUB_ORDER_PRICE_BADGE_CLASS = "hub-order-price-badge";

/** Locked design token id — sync with P0005 design-registry ORDER_PRICE_DESIGN_LOCK */
export const HUB_ORDER_PRICE_BADGE_DESIGN_LOCK = "pending-color-review" as const;

export type HubOrderPriceBadgeTone =
  | "inline"
  | "emerald"
  | "slate-glass"
  | "indigo-soft"
  | "amber-glass"
  | "sky-soft";

export const HUB_ORDER_PRICE_BADGE_DEFAULT_TONE: HubOrderPriceBadgeTone = "inline";
