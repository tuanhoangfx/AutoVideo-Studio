import { describe, expect, it } from 'vitest';
import { resolveP0021BrandIconSrc } from './p0021-brand-icon';

describe('resolveP0021BrandIconSrc', () => {
  it('prefixes hub catalog path with Vite BASE_URL', () => {
    const src = resolveP0021BrandIconSrc();
    expect(src.endsWith('icons/tools/P0021.svg')).toBe(true);
    expect(src.startsWith(import.meta.env.BASE_URL)).toBe(true);
  });
});
