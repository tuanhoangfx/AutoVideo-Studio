import type { ElementType } from "react";

export type FilterIconMeta = {
  icon: ElementType<{ size?: number; className?: string }>;
  className: string;
};

export type FilterIconResolver = {
  resolveOption: (filterKey: string, value: string) => FilterIconMeta | null;
  resolveAll: (filterKey: string) => FilterIconMeta | null;
};

let resolver: FilterIconResolver = {
  resolveOption: () => null,
  resolveAll: () => null,
};

export function configureFilterIcons(next: FilterIconResolver) {
  resolver = next;
}

export function resolveFilterOptionIcon(filterKey: string, value: string) {
  return resolver.resolveOption(filterKey, value);
}

export function resolveFilterAllIcon(filterKey: string) {
  return resolver.resolveAll(filterKey);
}
