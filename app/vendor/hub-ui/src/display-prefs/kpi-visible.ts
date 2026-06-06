import type { PrefItem } from "./types";

/** Max KPI tiles per tab row (golden Hub / directory). */
export const MAX_VISIBLE_KPI = 4;

export function defaultKpiKeysFromDefs(defs: PrefItem[], count = MAX_VISIBLE_KPI): Set<string> {
  return new Set(defs.map((d) => d.key).slice(0, count));
}

export function defaultKpiKeysExcluding(
  defs: PrefItem[],
  exclude: string[],
  count = MAX_VISIBLE_KPI,
): Set<string> {
  const keys = defs.map((d) => d.key).filter((k) => !exclude.includes(k));
  return new Set(keys.slice(0, count));
}

/** Resolve stored/default KPI keys in pref order, capped at `max`. */
export function resolveVisibleKpiKeys(
  stored: Set<string> | null,
  defaults: Set<string>,
  defs: PrefItem[],
  max = MAX_VISIBLE_KPI,
): Set<string> {
  const effective = stored ?? defaults;
  const order = defs.map((d) => d.key);
  return new Set(order.filter((k) => effective.has(k)).slice(0, max));
}

/** When enabling a KPI would exceed max, drop earliest visible keys (pref order), keep `addedKey`. */
export function enforceKpiMaxOnAdd(
  visible: Set<string>,
  defs: PrefItem[],
  addedKey: string,
  max = MAX_VISIBLE_KPI,
): Set<string> {
  if (visible.size <= max) return visible;
  const dropCount = visible.size - max;
  const order = defs.map((d) => d.key);
  const result = new Set(visible);
  let dropped = 0;
  for (const k of order) {
    if (dropped >= dropCount) break;
    if (k === addedKey) continue;
    if (result.has(k)) {
      result.delete(k);
      dropped++;
    }
  }
  return result;
}
