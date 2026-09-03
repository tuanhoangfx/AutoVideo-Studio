/** True when two durations round to the same whole second (Read vs Export chip). */
export function durationSecondsEqual(a: number, b: number): boolean {
  return Math.max(0, Math.round(a)) === Math.max(0, Math.round(b));
}

/** Format seconds as m:ss or HhMMm when >= 1 hour. */
export function formatDuration(totalSec: number): string {
  const safe = Math.max(0, Math.round(totalSec));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainMinutes = minutes % 60;
    return `${hours}h${String(remainMinutes).padStart(2, '0')}m`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
