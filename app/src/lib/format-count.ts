/** Locale-independent thousands separator (SSR-safe). */
export function formatInteger(n: number): string {
  const value = Math.round(Number.isFinite(n) ? n : 0);
  const sign = value < 0 ? '-' : '';
  const digits = Math.abs(value).toString();
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
