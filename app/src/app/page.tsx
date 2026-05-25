import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">AutoVideo Studio</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Tự động ghép video từ ảnh có sẵn. Upload ảnh → AI viết script → giọng TTS Việt → Ken Burns → MP4.
        </p>
        <p className="mt-1 text-xs text-emerald-300/80">
          ✓ Design chốt: <strong>S2 Workspace Tabs</strong> · ✓ Worker functional (edge-tts + ffmpeg) · ✓ End-to-end render verified
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PrimaryCard
          href="/studio"
          icon="◆"
          title="Open Studio"
          desc="Upload ảnh · gen script · render MP4. Cần worker chạy tại 127.0.0.1:8021."
        />
        <InfoCard
          icon="⚙"
          title="Worker"
          rows={[
            ['Start', <code key="c" className="text-white/80">cd worker && .venv/Scripts/uvicorn main:app --port 8021</code>],
            ['Status', <a key="a" href="http://127.0.0.1:8021/" target="_blank" className="text-pink-300 hover:underline">localhost:8021/</a>],
            ['Pipeline', 'edge-tts (VN) + ffmpeg Ken Burns'],
            ['Concurrency', '2 jobs song song (ThreadPool)'],
          ]}
        />
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">Design archive</h2>
          <span className="text-[10px] text-[var(--muted)]">25 mockups · 5 directions</span>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <ArchiveLink href="/design-preview/auto-video" label="Workflow" sub="V1–V5" />
          <ArchiveLink href="/design-preview/auto-video-pro" label="Pro Editor" sub="P1–P5" />
          <ArchiveLink href="/design-preview/auto-video-hybrid" label="Hybrid" sub="H1–H5" />
          <ArchiveLink href="/design-preview/auto-video-refined" label="Refined" sub="R1–R5" />
          <ArchiveLink href="/design-preview/auto-video-studio-v2" label="Studio v2" sub="S1–S5 · ★ S2 chosen" />
        </div>
      </section>
    </div>
  );
}

function PrimaryCard({ href, icon, title, desc }: any) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-xl border border-pink-400/30 bg-gradient-to-br from-pink-500/15 via-orange-500/10 to-transparent p-5 transition hover:scale-[1.01] hover:border-pink-400/60 hover:shadow-xl hover:shadow-pink-500/10"
    >
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-pink-500/20 blur-3xl transition group-hover:bg-pink-500/30" />
      <div className="relative">
        <div className="text-3xl">{icon}</div>
        <div className="mt-3 text-base font-semibold">{title}</div>
        <div className="mt-1 text-xs text-[var(--muted)]">{desc}</div>
        <div className="mt-2 inline-block text-[10px] uppercase tracking-wider text-pink-300">Open →</div>
      </div>
    </Link>
  );
}

function InfoCard({ icon, title, rows }: any) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.03] p-5">
      <div className="text-3xl">{icon}</div>
      <div className="mt-3 text-base font-semibold">{title}</div>
      <div className="mt-3 space-y-2 text-xs">
        {rows.map(([k, v]: any) => (
          <div key={k} className="flex items-baseline gap-3">
            <span className="w-20 shrink-0 text-[var(--muted)]">{k}</span>
            <span className="min-w-0 flex-1 break-all">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArchiveLink({ href, label, sub }: any) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-white/10 bg-white/[.02] p-3 transition hover:border-white/20 hover:bg-white/[.05]"
    >
      <div className="text-[11px] text-[var(--muted)] group-hover:text-white">{label}</div>
      <div className="mt-0.5 font-mono text-[10px] text-[var(--muted)]/60">{sub}</div>
    </Link>
  );
}
