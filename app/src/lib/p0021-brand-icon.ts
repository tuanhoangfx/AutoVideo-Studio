import { resolveHubToolIconSrcForVite } from '@tool-workspace/hub-ui/loading/resolve-hub-tool-icon';

/** Vite-aware tool mark — shared hub-ui SSOT (P0010 app-meta parity). */
export function resolveP0021BrandIconSrc(): string {
  return resolveHubToolIconSrcForVite('P0021');
}

export const P0021_BRAND_ICON = resolveP0021BrandIconSrc();
