// =====================================================================
//  AutoVideo Studio — 5 REFINED directions (upload-only use case).
//
//  Constraint: User upload ảnh có sẵn (không gen AI). Flow đơn giản hơn:
//    Upload ảnh → AI viết script khớp ảnh → TTS → effect → render.
//
//  Style: tinh tế · hiện đại · mượt mà. Ít emoji, nhiều typography,
//  generous whitespace, subtle borders, smooth transitions.
//
//  R1 Linear/Vercel Mono   — Monochrome + 1 accent. Sharp, keyboard-first.
//  R2 Glass Bento Premium  — Apple iOS/Vision. Translucent layered.
//  R3 Notion Document      — Scene blocks · drag handle · slash commands.
//  R4 Studio Hero          — Loom/Riverside. Big preview, peripheral controls.
//  R5 Cinema Filmstrip     — Photography portfolio. Image-driven.
// =====================================================================
import Link from 'next/link';

export const dynamic = 'force-static';
export const metadata = { title: 'Design Preview · AutoVideo · Refined' };

// ───────────────────────────────────────────────── MOCK
const MOCK = {
  project: 'Top 5 mẹo tiết kiệm thời gian khi code với AI',
  duration: 27.3,
  scenes: [
    { i: 1, text: 'Bạn dành quá nhiều thời gian sửa code AI gen? Đây là 5 mẹo giúp tăng tốc.', dur: 4.2, file: 'IMG_4821.jpg', size: '3.2 MB', dim: '1920×1080', img: 'from-slate-700 to-slate-900' },
    { i: 2, text: 'Mẹo 1: Mô tả context rõ ràng — file paths, line numbers, ý định cụ thể.', dur: 5.1, file: 'IMG_4822.jpg', size: '2.8 MB', dim: '1920×1080', img: 'from-blue-900 to-indigo-900' },
    { i: 3, text: 'Mẹo 2: Yêu cầu AI review từng phần trước khi sinh code dài.', dur: 4.8, file: 'IMG_4823.jpg', size: '4.1 MB', dim: '2048×1365', img: 'from-emerald-900 to-teal-900' },
    { i: 4, text: 'Mẹo 3: Dùng plan mode để chốt approach trước khi implement.', dur: 4.5, file: 'IMG_4824.jpg', size: '3.7 MB', dim: '1920×1080', img: 'from-amber-900 to-orange-900' },
    { i: 5, text: 'Mẹo 4: Lưu pattern vào memory để dùng lại sau.', dur: 4.0, file: 'IMG_4825.jpg', size: '2.4 MB', dim: '1920×1080', img: 'from-rose-900 to-pink-900' },
    { i: 6, text: 'Mẹo 5: Verify bằng cách chạy app, đừng chỉ tin tests pass.', dur: 4.7, file: 'IMG_4826.jpg', size: '3.5 MB', dim: '1920×1080', img: 'from-purple-900 to-violet-900' },
  ],
};

// ───────────────────────────────────────────────── PAGE
export default function RefinedPreview() {
  return (
    <div className="space-y-12 pb-20">
      <header className="border-b border-white/10 pb-6">
        <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Design preview</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Refined directions</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          Năm hướng giao diện tinh tế cho use case <span className="text-white">upload ảnh có sẵn</span>. Không có AI gen ảnh — flow rút gọn: ảnh → script → voice → render.
          Mỗi mẫu mượn ngôn ngữ thị giác từ một sản phẩm best-in-class.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          <Link href="/" className="text-[var(--muted)] hover:text-white">← Home</Link>
          <Link href="/design-preview/auto-video" className="text-[var(--muted)] hover:text-white">Workflow (V1–V5)</Link>
          <Link href="/design-preview/auto-video-pro" className="text-[var(--muted)] hover:text-white">Pro Editor (P1–P5)</Link>
          <Link href="/design-preview/auto-video-hybrid" className="text-[var(--muted)] hover:text-white">Hybrid (H1–H5)</Link>
        </div>
      </header>

      <DS id="R1" name="Mono Sharp" muse="Linear · Vercel" lang="Monochrome + 1 accent. Typography-forward. Generous whitespace. Sharp borders. Keyboard-first." accent="#FF6B35">
        <R1Mono />
      </DS>

      <DS id="R2" name="Glass Bento" muse="Apple iOS · Vision Pro" lang="Translucent layered cards với heavy backdrop blur. Smooth corners. Floating elements." accent="#A78BFA">
        <R2Glass />
      </DS>

      <DS id="R3" name="Notion Document" muse="Notion · Craft" lang="Mỗi scene = 1 block. Drag handle hover. Slash commands. Inline editing tự nhiên." accent="#FBBF24">
        <R3Notion />
      </DS>

      <DS id="R4" name="Studio Hero" muse="Loom · Riverside" lang="Big preview chiếm center stage. Controls peripheral, minimal. Warm gradient." accent="#F472B6">
        <R4Studio />
      </DS>

      <DS id="R5" name="Cinema Filmstrip" muse="VSCO · Glass Photos" lang="Image-driven layout. Filmstrip dọc bên trái. Mỗi ảnh = hero, text overlay subtle." accent="#10B981">
        <R5Cinema />
      </DS>
    </div>
  );
}

function DS({ id, name, muse, lang, accent, children }: any) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-xs font-semibold tracking-wider" style={{ color: accent }}>{id}</span>
        <h2 className="text-xl font-semibold tracking-tight">{name}</h2>
        <span className="text-[11px] text-[var(--muted)]">— inspired by {muse}</span>
      </div>
      <p className="max-w-3xl text-[12px] leading-relaxed text-[var(--muted)]">{lang}</p>
      <div>{children}</div>
    </section>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  R1 — Mono Sharp (Linear / Vercel)
//  Pure black/white/gray + 1 accent #FF6B35. Inter typography.
//  Sharp 4px corners, hairline borders, no shadows. Generous space.
// ═════════════════════════════════════════════════════════════════════
function R1Mono() {
  return (
    <div className="overflow-hidden rounded bg-[#0a0a0a] ring-1 ring-white/10">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-6 w-6 place-items-center rounded-sm bg-[#FF6B35] text-[10px] font-bold text-black">A</div>
          <nav className="flex gap-5 text-[12px] text-[var(--muted)]">
            <span className="text-white">Project</span>
            <span className="hover:text-white">Library</span>
            <span className="hover:text-white">Settings</span>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="rounded border border-white/10 bg-white/[.02] px-1.5 py-0.5 text-[10px] font-mono text-[var(--muted)]">⌘K</kbd>
          <button className="rounded-sm bg-[#FF6B35] px-4 py-1.5 text-[11px] font-medium text-black hover:bg-[#FF7E54] transition">Render</button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-0">
        {/* Sidebar */}
        <aside className="col-span-3 border-r border-white/10 px-4 py-5">
          <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">Project</div>
          <h3 className="mt-1 text-base font-semibold leading-tight tracking-tight">{MOCK.project}</h3>
          <div className="mt-1 font-mono text-[11px] text-[var(--muted)]">27.3s · 6 scenes · 9:16</div>

          <div className="mt-8 space-y-1 text-[11px]">
            <StepRow label="Upload images" status="done" count="6 files · 19.7 MB" />
            <StepRow label="Generate script" status="done" count="89 words · auto-matched" />
            <StepRow label="Voice synthesis" status="done" count="Hoài My · 27.3s" />
            <StepRow label="Effects" status="active" count="Ken Burns + fade" />
            <StepRow label="Render output" status="pending" count="—" />
          </div>

          <div className="mt-8 border-t border-white/10 pt-4">
            <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">Shortcuts</div>
            <div className="mt-2 space-y-1.5 text-[11px]">
              {[
                ['New scene', '⌘N'],
                ['Reorder', '⌘D'],
                ['Preview', 'Space'],
                ['Render', '⌘↵'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-[var(--muted)]">
                  <span>{k}</span>
                  <kbd className="rounded border border-white/10 bg-white/[.02] px-1.5 py-0.5 font-mono text-[10px]">{v}</kbd>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-9 px-8 py-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Scenes</h2>
            <div className="font-mono text-[11px] text-[var(--muted)]">6 / 6 · synced</div>
          </div>

          <div className="mt-4 divide-y divide-white/5 border-y border-white/5">
            {MOCK.scenes.map((s, i) => (
              <div key={s.i} className={`group grid grid-cols-12 items-center gap-4 px-2 py-3 transition hover:bg-white/[.02] ${i === 3 ? 'bg-white/[.02]' : ''}`}>
                <div className="col-span-1 font-mono text-[11px] text-[var(--muted)]">{String(s.i).padStart(2, '0')}</div>
                <div className={`col-span-2 aspect-video rounded-sm bg-gradient-to-br ${s.img} ring-1 ring-white/10`} />
                <div className="col-span-7">
                  <div className="text-[13px] leading-snug">{s.text}</div>
                  <div className="mt-1 flex items-center gap-3 font-mono text-[10px] text-[var(--muted)]">
                    <span>{s.file}</span>
                    <span>·</span>
                    <span>{s.dim}</span>
                    <span>·</span>
                    <span>{s.dur.toFixed(1)}s</span>
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                  <IconBtn label="Edit" />
                  <IconBtn label="Swap" />
                  <IconBtn label="Delete" />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
            <div className="flex items-center gap-3 text-[11px] text-[var(--muted)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B35]" />
                Ready to render
              </span>
              <span>·</span>
              <span>Estimated 2m 14s</span>
            </div>
            <div className="flex gap-2">
              <button className="rounded-sm border border-white/10 px-3 py-1.5 text-[11px] hover:bg-white/[.04]">Preview</button>
              <button className="rounded-sm bg-[#FF6B35] px-4 py-1.5 text-[11px] font-medium text-black">Render MP4</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
function StepRow({ label, status, count }: any) {
  const tone = status === 'done' ? 'text-white' : status === 'active' ? 'text-[#FF6B35]' : 'text-[var(--muted)]';
  const dot = status === 'done' ? 'bg-white' : status === 'active' ? 'bg-[#FF6B35]' : 'bg-white/20';
  return (
    <div className="flex items-center gap-2 py-1">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <div className="flex-1">
        <div className={`font-medium ${tone}`}>{label}</div>
        <div className="font-mono text-[10px] text-[var(--muted)]">{count}</div>
      </div>
    </div>
  );
}
function IconBtn({ label }: any) {
  const icons: Record<string, string> = { Edit: '✎', Swap: '⇄', Delete: '×' };
  return <button title={label} className="grid h-6 w-6 place-items-center rounded-sm text-[12px] text-[var(--muted)] hover:bg-white/10 hover:text-white">{icons[label]}</button>;
}

// ═════════════════════════════════════════════════════════════════════
//  R2 — Glass Bento Premium (Apple iOS · Vision Pro)
//  Translucent cards with heavy backdrop-blur. Smooth 16px corners.
//  Multi-layered gradient mesh background.
// ═════════════════════════════════════════════════════════════════════
function R2Glass() {
  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10">
      {/* Gradient mesh background */}
      <div className="absolute inset-0 bg-[#0a0a14]" />
      <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-purple-500/30 blur-3xl" />
      <div className="absolute -right-20 top-20 h-80 w-80 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-60 w-60 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative p-6">
        {/* Pill nav */}
        <div className="mb-6 flex items-center justify-between">
          <div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[.06] p-1 backdrop-blur-xl">
            {['Compose', 'Voice', 'Effects', 'Output'].map((t, i) => (
              <button key={t} className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition ${i === 0 ? 'bg-white text-black' : 'text-white/70 hover:text-white'}`}>{t}</button>
            ))}
          </div>
          <button className="rounded-full bg-white/10 px-5 py-2 text-[12px] font-medium text-white backdrop-blur-xl ring-1 ring-white/20 hover:bg-white/20">
            ✨ Render
          </button>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-12 gap-3">
          {/* Hero preview */}
          <GlassCard className="col-span-7 row-span-2 p-0 overflow-hidden">
            <div className={`relative aspect-video bg-gradient-to-br ${MOCK.scenes[2].img}`}>
              <div className="absolute inset-0 grid place-items-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-white/20 backdrop-blur-xl ring-1 ring-white/30">
                  <span className="ml-1 text-2xl text-white">▸</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="text-[11px] uppercase tracking-wider text-white/60">Scene 03</div>
                <div className="mt-1 text-base font-medium leading-tight text-white">{MOCK.scenes[2].text}</div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5 text-[11px] font-mono text-white/70">
              <span>00:09.4 / 00:27.3</span>
              <div className="flex items-center gap-1.5 text-white/40">
                <span>1:1</span><span>·</span><span>9:16</span><span>·</span><span className="text-white">16:9</span>
              </div>
            </div>
          </GlassCard>

          {/* Upload stats */}
          <GlassCard className="col-span-5">
            <div className="text-[10px] uppercase tracking-wider text-white/50">Library</div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-4xl font-light tracking-tight">6</div>
              <div className="text-[11px] text-white/60">images uploaded</div>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-1.5">
              {MOCK.scenes.map(s => (
                <div key={s.i} className={`aspect-square rounded-md bg-gradient-to-br ${s.img} ring-1 ring-white/10`} />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="text-white/50">19.7 MB total</span>
              <button className="rounded-full bg-white/10 px-3 py-1 text-white/90 ring-1 ring-white/15 hover:bg-white/15">+ Add</button>
            </div>
          </GlassCard>

          {/* Voice */}
          <GlassCard className="col-span-5">
            <div className="text-[10px] uppercase tracking-wider text-white/50">Voice</div>
            <div className="mt-2 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-pink-400/40 to-purple-500/40 ring-1 ring-white/20 text-base">♀</div>
              <div>
                <div className="text-sm font-medium">Hoài My</div>
                <div className="font-mono text-[11px] text-white/60">vi-VN · warm</div>
              </div>
              <div className="ml-auto flex h-7 items-end gap-px">
                {Array.from({ length: 20 }).map((_, i) => <div key={i} className="w-1 rounded-full bg-white/40" style={{ height: `${30 + Math.sin(i * 0.6) * 40 + i * 1.5}%` }} />)}
              </div>
            </div>
          </GlassCard>

          {/* Scenes (compact) */}
          <GlassCard className="col-span-12 p-0">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <div className="text-[11px] uppercase tracking-wider text-white/50">Storyboard · 6 scenes</div>
              <div className="font-mono text-[11px] text-white/50">27.3s</div>
            </div>
            <div className="grid grid-cols-6 divide-x divide-white/5">
              {MOCK.scenes.map((s, i) => (
                <div key={s.i} className={`group p-3 transition hover:bg-white/[.04] ${i === 2 ? 'bg-white/[.04]' : ''}`}>
                  <div className={`relative aspect-video overflow-hidden rounded bg-gradient-to-br ${s.img} ring-1 ring-white/10`}>
                    <div className="absolute left-1.5 top-1.5 rounded-full bg-black/40 px-1.5 py-0 font-mono text-[9px] text-white/80 backdrop-blur">{String(s.i).padStart(2, '0')}</div>
                  </div>
                  <div className="mt-2 line-clamp-2 text-[10px] leading-tight text-white/80">{s.text.slice(0, 50)}</div>
                  <div className="mt-1.5 font-mono text-[9px] text-white/40">{s.dur.toFixed(1)}s</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
function GlassCard({ className = '', children }: any) {
  return (
    <div className={`rounded-2xl border border-white/15 bg-white/[.07] p-4 backdrop-blur-2xl ${className}`}>
      {children}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  R3 — Notion Document (Notion · Craft)
//  Document-as-canvas. Each scene = a block. Drag handle on hover.
//  Slash commands. Inline editing feels natural.
// ═════════════════════════════════════════════════════════════════════
function R3Notion() {
  return (
    <div className="overflow-hidden rounded-lg bg-[#1a1a1a] ring-1 ring-white/10">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/5 px-8 py-3">
        <div className="flex items-center gap-2 text-[12px] text-[var(--muted)]">
          <span>📁</span>
          <span>Projects</span>
          <span>/</span>
          <span className="text-white">AI Code Tips</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
          <span>Last edited 2m ago</span>
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          <button className="rounded bg-white px-3 py-1 text-[11px] font-medium text-black hover:bg-white/90">Share</button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-8 py-10">
        {/* Title */}
        <div className="mb-1 inline-flex h-12 w-12 items-center justify-center rounded text-3xl">🎬</div>
        <h1 className="text-3xl font-bold tracking-tight">{MOCK.project}</h1>
        <div className="mt-3 grid grid-cols-3 gap-x-8 gap-y-2 text-[12px]">
          <PropertyRow label="Status" value="● In review" />
          <PropertyRow label="Duration" value="27.3s · 9:16" />
          <PropertyRow label="Voice" value="Hoài My (VN)" />
          <PropertyRow label="Scenes" value="6 blocks" />
          <PropertyRow label="Created" value="May 25, 2026" />
          <PropertyRow label="Render" value="Ready" />
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-white/5" />

        {/* Block: H2 */}
        <BlockH2>Storyboard</BlockH2>
        <p className="text-[12px] text-[var(--muted)]">Mỗi block là một scene. Drag handle bên trái để sắp xếp. Gõ <kbd className="rounded bg-white/10 px-1 font-mono text-[10px]">/</kbd> để thêm command.</p>

        <div className="mt-4 space-y-1">
          {MOCK.scenes.map((s, i) => (
            <SceneBlock key={s.i} scene={s} index={i} focused={i === 1} />
          ))}
          <button className="group mt-1 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-[var(--muted)] hover:bg-white/[.03]">
            <span className="grid h-5 w-5 place-items-center rounded text-base">+</span>
            <span>Click to add scene, or type <kbd className="rounded bg-white/10 px-1 font-mono text-[10px]">/scene</kbd></span>
          </button>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-white/5" />

        {/* Callout */}
        <div className="flex gap-3 rounded-md bg-amber-500/10 px-4 py-3 ring-1 ring-amber-500/20">
          <div className="text-base">💡</div>
          <div className="flex-1 text-[12px] leading-relaxed">
            <strong>Tip:</strong> AI tự viết câu thoại khớp với ảnh bạn upload. Bạn có thể edit text inline — voice + duration sẽ re-sync tự động.
          </div>
        </div>

        {/* Toggle: Advanced */}
        <details className="mt-6 group">
          <summary className="cursor-pointer text-[12px] font-medium text-[var(--muted)] hover:text-white">
            <span className="mr-1 transition group-open:rotate-90 inline-block">▸</span>
            Advanced settings
          </summary>
          <div className="mt-3 ml-4 space-y-1.5 border-l border-white/10 pl-4 text-[11px]">
            <PropertyRow label="Effect preset" value="Ken Burns + fade 0.4s" />
            <PropertyRow label="Background music" value="upbeat-corp.mp3 · -18dB" />
            <PropertyRow label="Output codec" value="H.264 · 1080p · 30fps" />
          </div>
        </details>
      </div>

      {/* Floating action */}
      <div className="sticky bottom-4 mx-auto flex w-fit items-center gap-2 rounded-full border border-white/15 bg-black/80 px-2 py-1.5 backdrop-blur-xl">
        <button className="rounded-full px-3 py-1 text-[11px] text-white/70 hover:bg-white/10">Preview</button>
        <button className="rounded-full bg-white px-4 py-1 text-[11px] font-medium text-black">Render →</button>
      </div>
    </div>
  );
}
function PropertyRow({ label, value }: any) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-20 shrink-0 text-[var(--muted)]">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}
function BlockH2({ children }: any) {
  return <h2 className="mb-2 text-lg font-semibold tracking-tight">{children}</h2>;
}
function SceneBlock({ scene, index, focused }: any) {
  return (
    <div className={`group relative flex items-start gap-2 rounded px-2 py-2 transition ${focused ? 'bg-white/[.04]' : 'hover:bg-white/[.02]'}`}>
      {/* Drag handle */}
      <div className="flex items-center gap-0.5 pt-1.5 opacity-0 transition group-hover:opacity-100">
        <span className="cursor-grab text-[var(--muted)]">⋮⋮</span>
      </div>
      <span className="w-6 shrink-0 pt-1 font-mono text-[11px] text-[var(--muted)]">{String(index + 1).padStart(2, '0')}</span>
      <div className={`mt-0.5 h-12 w-20 shrink-0 rounded bg-gradient-to-br ${scene.img} ring-1 ring-white/10`} />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] leading-snug">{scene.text}</div>
        <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-[var(--muted)]">
          <span>{scene.file}</span>
          <span>·</span>
          <span>{scene.dim}</span>
          <span>·</span>
          <span className="text-emerald-400/80">{scene.dur.toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  R4 — Studio Hero (Loom · Riverside)
//  Big preview center stage. Warm gradient background. Peripheral
//  controls minimal. Premium recording-studio feel.
// ═════════════════════════════════════════════════════════════════════
function R4Studio() {
  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10">
      {/* Warm gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0d1f] via-[#1c1419] to-[#0f0a13]" />
      <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />

      <div className="relative p-6">
        {/* Top */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Studio</div>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight">{MOCK.project}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 items-center gap-3 rounded-full border border-white/15 bg-white/[.06] px-4 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-pink-400 animate-pulse" />
              <span className="text-[11px] text-white/80">Auto-saved</span>
            </div>
            <button className="h-9 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-6 text-[12px] font-semibold text-white shadow-lg shadow-pink-500/30">
              Export ↗
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* HERO preview */}
          <div className="col-span-8">
            <div className={`relative aspect-video overflow-hidden rounded-2xl bg-gradient-to-br ${MOCK.scenes[3].img} shadow-2xl shadow-black/60`}>
              {/* play overlay */}
              <div className="absolute inset-0 grid place-items-center">
                <button className="group grid h-20 w-20 place-items-center rounded-full bg-white/15 backdrop-blur-xl ring-1 ring-white/30 transition hover:scale-110 hover:bg-white/25">
                  <span className="ml-1.5 text-3xl text-white">▸</span>
                </button>
              </div>
              {/* caption */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">Scene 04 of 06</div>
                <div className="mt-1.5 text-xl font-medium leading-tight text-white drop-shadow">{MOCK.scenes[3].text}</div>
              </div>
              {/* top-right meta */}
              <div className="absolute right-4 top-4 flex gap-2">
                <span className="rounded-full bg-black/40 px-3 py-1 text-[10px] font-mono text-white/80 backdrop-blur">9:16</span>
                <span className="rounded-full bg-black/40 px-3 py-1 text-[10px] font-mono text-white/80 backdrop-blur">1080p</span>
              </div>
            </div>

            {/* Scrubber */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.03] p-3 backdrop-blur">
              <div className="flex items-center gap-2 mb-2 font-mono text-[11px] text-white/60">
                <span>00:11.2</span>
                <div className="relative flex-1 h-1 rounded-full bg-white/10">
                  <div className="h-full w-[41%] rounded-full bg-gradient-to-r from-pink-400 to-orange-400" />
                  <div className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow-lg" style={{ left: '41%' }} />
                </div>
                <span>00:27.3</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                {['⏮', '⏪'].map(b => <button key={b} className="grid h-9 w-9 place-items-center rounded-full text-white/70 hover:bg-white/10">{b}</button>)}
                <button className="grid h-11 w-11 place-items-center rounded-full bg-white text-black hover:scale-105 transition">▸</button>
                {['⏩', '⏭'].map(b => <button key={b} className="grid h-9 w-9 place-items-center rounded-full text-white/70 hover:bg-white/10">{b}</button>)}
              </div>
            </div>
          </div>

          {/* Right rail */}
          <aside className="col-span-4 space-y-3">
            {/* Voice */}
            <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4 backdrop-blur">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Voice</div>
              <div className="mt-2 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-pink-400 to-orange-400 text-base ring-1 ring-white/30">♀</div>
                <div>
                  <div className="text-sm font-medium">Hoài My</div>
                  <div className="text-[11px] text-white/50">warm · vi-VN</div>
                </div>
                <button className="ml-auto rounded-full bg-white/10 px-3 py-1.5 text-[10px] text-white/80 hover:bg-white/15">Change</button>
              </div>
            </div>

            {/* Scenes list */}
            <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4 backdrop-blur">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Scenes</span>
                <span className="font-mono text-[10px] text-white/50">{MOCK.scenes.length}</span>
              </div>
              <div className="-mx-1 max-h-56 space-y-1 overflow-y-auto">
                {MOCK.scenes.map((s, i) => (
                  <div key={s.i} className={`flex items-center gap-2.5 rounded-lg px-2 py-2 cursor-pointer transition ${i === 3 ? 'bg-pink-500/15 ring-1 ring-pink-400/40' : 'hover:bg-white/5'}`}>
                    <span className="w-5 text-right font-mono text-[10px] text-white/40">{i + 1}</span>
                    <div className={`h-8 w-12 shrink-0 rounded bg-gradient-to-br ${s.img} ring-1 ring-white/10`} />
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-1 text-[11px]">{s.text}</div>
                      <div className="font-mono text-[9px] text-white/40">{s.dur.toFixed(1)}s</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Effect preset */}
            <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4 backdrop-blur">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Effect preset</div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {['Smooth', 'Cinematic', 'Subtle', 'Dynamic'].map((p, i) => (
                  <button key={p} className={`rounded-lg px-3 py-2 text-[11px] transition ${i === 1 ? 'bg-white text-black' : 'border border-white/10 bg-white/[.03] text-white/70 hover:bg-white/[.08]'}`}>{p}</button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  R5 — Cinema Filmstrip (VSCO · Glass Photos)
//  Image-driven. Filmstrip column left. Each image hero-sized, text
//  overlay subtle, serif typography for editorial feel.
// ═════════════════════════════════════════════════════════════════════
function R5Cinema() {
  return (
    <div className="overflow-hidden rounded-lg bg-[#0e0e0e] ring-1 ring-white/10">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-white/[.06] px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="font-serif text-base italic tracking-tight">Studio</div>
          <span className="text-white/20">/</span>
          <span className="text-[12px] text-white/60">{MOCK.project}</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-white/50">
          <span className="font-mono">27.3 SEC · 6 FRAMES</span>
          <button className="rounded-none border-b border-emerald-400 px-1 pb-0.5 text-[11px] font-medium uppercase tracking-wider text-emerald-300 hover:text-emerald-200">Render →</button>
        </div>
      </header>

      <div className="grid grid-cols-12">
        {/* Filmstrip column */}
        <aside className="col-span-2 border-r border-white/[.06] bg-black/40">
          <div className="space-y-0">
            {MOCK.scenes.map((s, i) => (
              <div key={s.i} className={`group relative cursor-pointer border-b border-white/[.04] p-2 transition ${i === 2 ? 'bg-emerald-500/[.08]' : 'hover:bg-white/[.03]'}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`font-mono text-[10px] ${i === 2 ? 'text-emerald-400' : 'text-white/30'}`}>0{s.i}</span>
                  <span className="font-mono text-[9px] text-white/30">{s.dur.toFixed(1)}s</span>
                  {i === 2 && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                </div>
                <div className={`relative aspect-[16/10] overflow-hidden bg-gradient-to-br ${s.img} ring-1 ring-white/10 transition group-hover:ring-white/30 ${i === 2 ? 'ring-emerald-400/60' : ''}`}>
                  {/* film perforations */}
                  <div className="absolute inset-x-0 top-0 flex justify-around opacity-30">
                    {Array.from({ length: 6 }).map((_, j) => <div key={j} className="h-1 w-1 bg-black mt-0.5" />)}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex justify-around opacity-30">
                    {Array.from({ length: 6 }).map((_, j) => <div key={j} className="h-1 w-1 bg-black mb-0.5" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main canvas */}
        <main className="col-span-10 p-8">
          {/* Hero image */}
          <div className={`relative aspect-[21/9] overflow-hidden rounded bg-gradient-to-br ${MOCK.scenes[2].img} ring-1 ring-white/10`}>
            {/* Vignette overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            {/* Caption */}
            <div className="absolute bottom-8 left-8 right-8 max-w-2xl">
              <div className="mb-2 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-emerald-300">
                <span>Scene 03</span>
                <span className="h-px w-12 bg-emerald-300/50" />
                <span className="font-mono">04.8s</span>
              </div>
              <p className="font-serif text-2xl leading-tight italic text-white drop-shadow">"{MOCK.scenes[2].text}"</p>
            </div>
            {/* Top-right info */}
            <div className="absolute right-8 top-8 text-right text-[10px] uppercase tracking-wider text-white/50">
              <div>{MOCK.scenes[2].file}</div>
              <div className="font-mono">{MOCK.scenes[2].dim}</div>
              <div className="mt-1 text-emerald-300">● in frame</div>
            </div>
          </div>

          {/* Bottom: metadata + actions */}
          <div className="mt-6 grid grid-cols-12 gap-6 text-[12px]">
            <div className="col-span-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Voice</div>
              <div className="mt-1 font-serif text-lg italic">Hoài My</div>
              <div className="mt-0.5 font-mono text-[10px] text-white/40">VI-VN · WARM</div>
            </div>
            <div className="col-span-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Effect</div>
              <div className="mt-1 font-serif text-lg italic">Ken Burns</div>
              <div className="mt-0.5 font-mono text-[10px] text-white/40">SLOW ZOOM · 4.8S</div>
            </div>
            <div className="col-span-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Aspect</div>
              <div className="mt-1 font-serif text-lg italic">21:9 / 16:9 / 9:16</div>
              <div className="mt-0.5 font-mono text-[10px] text-white/40">3 OUTPUTS</div>
            </div>
            <div className="col-span-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Audio</div>
              <div className="mt-1 flex h-7 items-end gap-px">
                {Array.from({ length: 40 }).map((_, i) => <div key={i} className="w-0.5 bg-emerald-400/60" style={{ height: `${30 + Math.sin(i * 0.5) * 40 + (i % 5) * 4}%` }} />)}
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-white/40">VOICE + BGM</div>
            </div>
          </div>

          {/* Continuous timeline ribbon */}
          <div className="mt-8 border-t border-white/[.06] pt-4">
            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/40">
              <span>Sequence</span>
              <span className="font-mono">00:00 — 00:27.3</span>
            </div>
            <div className="relative h-12 overflow-hidden rounded">
              {MOCK.scenes.map((s, i) => {
                const cum = MOCK.scenes.slice(0, i).reduce((a, b) => a + b.dur, 0);
                return (
                  <div key={s.i} className={`absolute top-0 h-full bg-gradient-to-br ${s.img} ${i === 2 ? 'ring-2 ring-emerald-400 ring-inset' : ''}`} style={{ left: `${(cum / MOCK.duration) * 100}%`, width: `calc(${(s.dur / MOCK.duration) * 100}% - 1px)` }}>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                      <span className="font-mono text-[9px] text-white/80">0{i + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
