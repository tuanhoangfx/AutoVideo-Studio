/** Parse ISO / epoch into Date (invalid → now). */
export function parseJobDate(iso?: string | null): Date {
  if (!iso) return new Date();
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

/** Tab / UI label: `20:45 30/05/26` (local time, hh:mm dd/mm/yy). */
export function formatJobDateTimeLabel(iso?: string | null): string {
  const d = parseJobDate(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${hh}:${mm} ${dd}/${mo}/${yy}`;
}

/** Filesystem-safe stem matching the same clock: `20-45 30-05-26`. */
export function formatJobDateTimeFilePart(iso?: string | null): string {
  const d = parseJobDate(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${hh}-${mm} ${dd}-${mo}-${yy}`;
}
