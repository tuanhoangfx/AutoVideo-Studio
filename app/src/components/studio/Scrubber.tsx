/**
 * Glass transport bar: scrubber (current / total) + 5 transport buttons.
 * Stateless display only. Will wire to a video element / job preview later.
 */
export function Scrubber({
  current,
  total,
}: {
  /** Seconds */
  current: number;
  total: number;
}) {
  const pct = Math.max(0, Math.min(100, (current / Math.max(total, 0.001)) * 100));
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.03] p-3 backdrop-blur">
      <div className="mb-2 flex items-center gap-2 font-mono text-[11px] text-white/60">
        <span>{fmt(current)}</span>
        <div className="relative h-1 flex-1 rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-400 to-orange-400"
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow-lg"
            style={{ left: `${pct}%`, transform: `translate(-50%, -50%)` }}
          />
        </div>
        <span>{fmt(total)}</span>
      </div>
      <div className="flex items-center justify-center gap-2">
        {['⏮', '⏪'].map((b) => (
          <button key={b} aria-label={b} className="grid h-9 w-9 place-items-center rounded-full text-white/70 transition hover:bg-white/10">
            {b}
          </button>
        ))}
        <button
          aria-label="Play"
          className="grid h-11 w-11 place-items-center rounded-full bg-white text-black transition hover:scale-105"
        >
          ▸
        </button>
        {['⏩', '⏭'].map((b) => (
          <button key={b} aria-label={b} className="grid h-9 w-9 place-items-center rounded-full text-white/70 transition hover:bg-white/10">
            {b}
          </button>
        ))}
      </div>
    </div>
  );
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
}
