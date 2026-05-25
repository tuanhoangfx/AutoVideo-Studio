// =====================================================================
//  AutoVideo Studio — 5 HYBRID directions.
//  Combine AI workflow (V1–V5) with pro editor language (P1–P5).
//  Goal: AI tự gen full video, BUT user vẫn có khả năng tinh chỉnh
//        sâu khi cần — không bị khoá vào auto-pilot.
//
//  H1 AI Copilot + Magnetic Timeline   — Chat trái, FCP timeline phải
//  H2 Script-driven Storyboard         — Descript script + V3 storyboard 2-way
//  H3 Wizard with embedded NLE         — Wizard 4 bước, step cuối = mini-NLE
//  H4 Kanban → Drill-down NLE          — Browse jobs Kanban, click = mở NLE modal
//  H5 Script + Node Diagnostics        — Descript edit + collapsible pipeline DAG
// =====================================================================
import Link from 'next/link';

export const dynamic = 'force-static';
export const metadata = { title: 'Design Preview · AutoVideo · Hybrid' };

// ───────────────────────────────────────────────── MOCK
const MOCK = {
  topic: 'Top 5 mẹo tiết kiệm thời gian khi code với AI',
  duration: 27.3,
  scenes: [
    { i: 1, text: 'Bạn dành quá nhiều thời gian sửa code AI gen? Đây là 5 mẹo giúp tăng tốc.', dur: 4.2, src: 'upload', img: 'from-blue-500/40 to-cyan-500/40', status: 'done' },
    { i: 2, text: 'Mẹo 1: Mô tả context rõ ràng — file paths, line numbers, ý định cụ thể.', dur: 5.1, src: 'upload', img: 'from-pink-500/40 to-rose-500/40', status: 'done' },
    { i: 3, text: 'Mẹo 2: Yêu cầu AI review từng phần trước khi sinh code dài.', dur: 4.8, src: 'upload', img: 'from-amber-500/40 to-orange-500/40', status: 'done' },
    { i: 4, text: 'Mẹo 3: Dùng plan mode để chốt approach trước khi implement.', dur: 4.5, src: 'gen', img: 'from-purple-500/40 to-indigo-500/40', status: 'done' },
    { i: 5, text: 'Mẹo 4: Lưu pattern vào memory để dùng lại sau.', dur: 4.0, src: 'gen', img: 'from-emerald-500/40 to-teal-500/40', status: 'warn' },
    { i: 6, text: 'Mẹo 5: Verify bằng cách chạy app, đừng chỉ tin tests pass.', dur: 4.7, src: 'gen', img: 'from-violet-500/40 to-fuchsia-500/40', status: 'done' },
  ],
};

// ───────────────────────────────────────────────── PAGE
export default function HybridPreview() {
  return (
    <div className="space-y-8 pb-16">
      <header className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold">AutoVideo Studio · Hybrid directions</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          5 mockup kết hợp <strong className="text-emerald-300">AI workflow</strong> (auto-gen) với <strong className="text-rose-300">Pro editor</strong> (fine-tune).
          Best of both: AI làm 90%, user chỉnh 10%.
        </p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          <Link href="/" className="text-indigo-300 hover:underline">← Home</Link>
          <Link href="/design-preview/auto-video" className="text-indigo-300 hover:underline">← Workflow (V1–V5)</Link>
          <Link href="/design-preview/auto-video-pro" className="text-rose-300 hover:underline">← Pro Editor (P1–P5)</Link>
        </div>
      </header>

      <DS num="H1" title="AI Copilot + Magnetic Timeline" lang="Chat AI ở sidebar trái auto-gen scenes → đẩy vào FCP magnetic timeline ở phải. User chỉnh sau bằng drag/trim.">
        <H1CopilotTimeline />
      </DS>

      <DS num="H2" title="Script-driven Storyboard" lang="Descript script editor + storyboard cards 2-way binding. Sửa script → card cập nhật. Swap ảnh card → AI note vào script.">
        <H2ScriptStoryboard />
      </DS>

      <DS num="H3" title="Wizard với embedded NLE" lang="Wizard 4 bước cho user mới, nhưng step 'Review' mở mini-NLE pro để tinh chỉnh trước khi render — không bị khoá vào auto-pilot.">
        <H3WizardNLE />
      </DS>

      <DS num="H4" title="Kanban → Drill-down NLE" lang="Outer: Kanban batch (V4) cho creator chạy nhiều video/ngày. Click 1 card → mở modal NLE đầy đủ để chỉnh job đó.">
        <H4KanbanDrill />
      </DS>

      <DS num="H5" title="Script + Node Diagnostics" lang="Descript script editor làm main; bottom panel collapsible hiện node graph pipeline. Khi node fail → highlight đỏ, click để fix tận gốc.">
        <H5ScriptDiagnostics />
      </DS>
    </div>
  );
}

function DS({ num, title, lang, children }: any) {
  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-emerald-500/30 to-rose-500/30 text-base font-bold text-white ring-1 ring-white/30">{num}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-tight">{title}</h2>
          <p className="text-xs text-emerald-300/80">{lang}</p>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/50 p-2">{children}</div>
    </section>
  );
}

// ───────────────────────────────────────────────── SHARED
function Preview({ scene, aspect = 'video' }: any) {
  const ar = aspect === 'portrait' ? 'aspect-[9/16] max-h-80' : 'aspect-video';
  return (
    <div className={`${ar} rounded bg-gradient-to-br ${scene.img} ring-1 ring-white/20 grid place-items-center relative mx-auto`}>
      <span className="text-5xl opacity-30">🎬</span>
      <div className="absolute bottom-2 left-2 right-2 rounded bg-black/70 px-2 py-1 text-center text-[10px] backdrop-blur">{scene.text}</div>
      <div className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px]">{scene.dur.toFixed(1)}s · {scene.src === 'gen' ? '🤖' : '📤'}</div>
    </div>
  );
}
function MiniTimeline({ scenes, height = 'h-12', showLabels = true }: any) {
  return (
    <div className={`relative ${height} w-full`}>
      {scenes.map((s: any, i: number) => {
        const cum = scenes.slice(0, i).reduce((a: number, b: any) => a + b.dur, 0);
        const total = scenes.reduce((a: number, b: any) => a + b.dur, 0);
        return (
          <div key={s.i} className={`absolute top-0 h-full bg-gradient-to-br ${s.img} ring-1 ring-white/20 overflow-hidden`} style={{ left: `${(cum / total) * 100}%`, width: `calc(${(s.dur / total) * 100}% - 1px)` }}>
            {showLabels && (
              <>
                <span className="absolute left-1 top-0.5 text-[8px] font-bold drop-shadow">S{s.i}</span>
                <span className="absolute right-1 top-0.5 text-[8px] drop-shadow">{s.src === 'gen' ? '🤖' : '📤'}</span>
                <span className="absolute bottom-0.5 right-1 font-mono text-[8px] drop-shadow">{s.dur.toFixed(1)}s</span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  H1 — AI Copilot + Magnetic Timeline
//  Left 30%: chat AI gen + suggestion. Right 70%: preview + magnetic
//  timeline. AI proposes → click "Apply" → clip xuất hiện trên timeline.
// ═════════════════════════════════════════════════════════════════════
function H1CopilotTimeline() {
  const msgs = [
    { who: 'ai', text: '✅ Đã gen 6 scenes từ topic của bạn. Tổng 27.3s. Đẩy lên timeline rồi đó.' },
    { who: 'user', text: 'Scene 5 ngắn quá, kéo dài thêm 2 giây' },
    { who: 'ai', text: '👍 Mình đề xuất 3 cách:\n  ⏱ Slow down audio (4.0→6.0s)\n  ➕ Thêm câu giải thích\n  🔁 Loop ảnh + đổi BGM mood', sug: ['Slow down', 'Thêm câu', 'Loop'] },
  ];
  return (
    <div className="grid grid-cols-12 gap-1 rounded-lg bg-[#0f1117] ring-1 ring-white/10">
      {/* Left: AI Copilot */}
      <aside className="col-span-4 border-r border-white/10">
        <div className="flex items-center gap-2 border-b border-white/5 bg-black/40 px-3 py-1.5 text-[10px]">
          <span className="grid h-5 w-5 place-items-center rounded bg-gradient-to-br from-emerald-400 to-cyan-400 text-[10px]">🤖</span>
          <span className="font-semibold">AI Copilot</span>
          <span className="ml-auto rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] text-emerald-300">online</span>
        </div>
        <div className="flex h-[400px] flex-col">
          <div className="flex-1 space-y-2 overflow-y-auto p-2">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-[10px]">
              <div className="mb-1 font-semibold text-emerald-200">✨ Gợi ý từ AI</div>
              <div>Topic: <strong>{MOCK.topic}</strong></div>
              <div className="mt-1 text-[var(--muted)]">Đề xuất: 9:16 · 27s · giọng Hoài My</div>
              <button className="mt-1.5 w-full rounded bg-emerald-500/30 py-1 text-[10px] font-semibold text-emerald-100">🎬 Auto-gen ngay</button>
            </div>
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.who === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] rounded-lg px-2.5 py-1.5 text-[10px] whitespace-pre-line ${
                  m.who === 'user' ? 'bg-indigo-500/30 text-indigo-100' : 'bg-white/[.06] text-[var(--text)]'
                }`}>
                  {m.text}
                  {m.sug && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {m.sug.map((s: string) => (
                        <button key={s} className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-[9px] text-emerald-200 hover:bg-emerald-500/40">{s}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 p-2">
            <div className="mb-1 flex gap-1 text-[9px]">
              {['Tạo scene', 'Đổi voice', 'Thêm BGM', 'Crop ảnh'].map(s => (
                <button key={s} className="rounded-full bg-white/5 px-2 py-0.5 hover:bg-white/10">{s}</button>
              ))}
            </div>
            <div className="flex gap-1">
              <input placeholder="Hỏi AI hoặc lệnh trực tiếp..." className="flex-1 rounded border border-white/10 bg-white/[.03] px-2 py-1.5 text-[10px]" />
              <button className="rounded bg-emerald-500/30 px-2 text-[11px]">↑</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Right: NLE */}
      <div className="col-span-8">
        <div className="flex items-center gap-2 border-b border-white/5 bg-black/40 px-3 py-1.5 text-[10px]">
          <span className="font-semibold">Magnetic Timeline</span>
          <span className="ml-auto rounded bg-amber-500/20 px-2 py-0.5 text-amber-300">⚠ Scene 5 needs review</span>
          <button className="rounded bg-rose-500/30 px-3 py-1 font-bold text-rose-100">🎬 Render</button>
        </div>
        <div className="p-2">
          <Preview scene={MOCK.scenes[4]} />
        </div>
        <div className="bg-[#15151a] p-2">
          <div className="mb-1 text-[9px] uppercase text-[var(--muted)]">Subtitle</div>
          <div className="relative h-6">
            {MOCK.scenes.map((s, i) => {
              const cum = MOCK.scenes.slice(0, i).reduce((a, b) => a + b.dur, 0);
              return (
                <div key={s.i} className="absolute top-0 h-full rounded bg-amber-500/30 ring-1 ring-amber-400/60 px-1 text-[8px] leading-6 text-amber-100 truncate" style={{ left: `${(cum / MOCK.duration) * 100}%`, width: `calc(${(s.dur / MOCK.duration) * 100}% - 1px)` }}>
                  💬 {s.text.slice(0, 24)}...
                </div>
              );
            })}
          </div>
          <div className="mt-1 mb-1 text-[9px] uppercase text-[var(--muted)]">Video · Magnetic primary</div>
          <div className="relative ring-2 ring-rose-500/60 rounded">
            <MiniTimeline scenes={MOCK.scenes} height="h-14" />
            <div className="absolute top-0 h-full w-0.5 bg-white" style={{ left: '60%' }} />
          </div>
          <div className="mt-1 mb-1 text-[9px] uppercase text-[var(--muted)]">Audio (connected)</div>
          <div className="relative h-5 mb-1">
            <div className="absolute inset-0 rounded bg-emerald-500/30 ring-1 ring-emerald-400/60 flex items-center px-2 text-[8px]">
              <span>🎤 voice-hoaimy.wav</span>
              <div className="ml-2 flex h-3 flex-1 items-end gap-px">
                {Array.from({ length: 80 }).map((_, i) => <div key={i} className="w-px bg-emerald-300/70" style={{ height: `${30 + Math.sin(i * 0.4) * 40 + (i % 7) * 5}%` }} />)}
              </div>
            </div>
          </div>
          <div className="relative h-4">
            <div className="absolute inset-0 rounded bg-blue-500/25 ring-1 ring-blue-400/50 flex items-center px-2 text-[8px] text-blue-200">
              🎵 upbeat-corp.mp3 · auto-ducked
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  H2 — Script-driven Storyboard (2-way binding)
//  Top: editable script (Descript). Middle: storyboard cards (V3 style).
//  Edit script → cards auto-resync. Swap card image → script note updates.
// ═════════════════════════════════════════════════════════════════════
function H2ScriptStoryboard() {
  return (
    <div className="rounded-lg bg-[#1a1a25] ring-1 ring-white/10">
      <div className="flex items-center gap-2 border-b border-white/5 bg-black/30 px-3 py-1.5 text-[10px]">
        <span className="font-semibold">📝 Script ↔ 🎨 Storyboard · 2-way binding</span>
        <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-cyan-200">🔄 Synced 2s ago</span>
        <button className="ml-auto rounded bg-emerald-500/30 px-3 py-1 font-bold text-emerald-100">🎬 Render 27.3s</button>
      </div>

      {/* Top: script editor */}
      <div className="border-b border-white/10 bg-[#fafafa] p-3 text-[#1a1a1a] text-[11px] leading-relaxed">
        <div className="mb-2 flex items-center gap-2 text-[10px] text-gray-500">
          <span className="rounded bg-gray-100 px-2 py-0.5">🎤 Hoài My</span>
          <span>•</span>
          <span>6 sentences / 89 words</span>
          <span className="ml-auto rounded bg-emerald-100 px-2 py-0.5 text-emerald-700">↕ Bound to storyboard</span>
        </div>
        <div className="space-y-1">
          {MOCK.scenes.map((s, i) => (
            <p key={s.i} className={`relative rounded px-2 py-1 ${i === 4 ? 'bg-amber-100/80 ring-1 ring-amber-400' : 'hover:bg-gray-100'}`}>
              <span className="mr-2 inline-block w-5 text-right font-mono text-gray-400">[{i + 1}]</span>
              {s.text}
              <span className="ml-2 inline-flex items-center gap-1 rounded bg-white px-1.5 py-0 text-[9px] font-mono text-gray-500 ring-1 ring-gray-200">
                <span>{s.dur.toFixed(1)}s</span>
                <span>·</span>
                <span>{s.src === 'gen' ? '🤖' : '📤'}</span>
                <span>·</span>
                <span>S{i + 1}</span>
              </span>
            </p>
          ))}
        </div>
      </div>

      {/* Storyboard cards */}
      <div className="p-3">
        <div className="mb-2 flex items-center justify-between text-[10px]">
          <span className="font-semibold uppercase text-[var(--muted)]">Storyboard · click card để chỉnh, sync ngược về script</span>
          <span className="text-[var(--muted)]">⬆ Sửa text trên = card cập nhật / Swap ảnh card = script note</span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {MOCK.scenes.map((s, i) => (
            <div key={s.i} className={`rounded-lg bg-gradient-to-b ${i === 4 ? 'from-amber-500/30 ring-2 ring-amber-400/60' : 'from-white/[.04] ring-1 ring-white/10'} to-transparent p-2`}>
              <div className="mb-1 flex items-center justify-between">
                <span className="rounded bg-white/10 px-1.5 py-0 text-[9px] font-bold">S{s.i}</span>
                <span className="font-mono text-[8px] text-[var(--muted)]">{s.dur.toFixed(1)}s</span>
              </div>
              <div className={`relative grid h-16 place-items-center rounded bg-gradient-to-br ${s.img} ring-1 ring-white/20`}>
                <span className="text-xl opacity-50">🖼</span>
                <span className="absolute right-0.5 top-0.5 rounded bg-black/40 px-1 text-[7px]">{s.src === 'gen' ? '🤖' : '📤'}</span>
              </div>
              <div className="mt-1 line-clamp-2 text-[9px] leading-tight">{s.text}</div>
              <div className="mt-1 flex gap-0.5">
                <button className="flex-1 rounded bg-white/5 py-0.5 text-[8px] hover:bg-white/10">🔄</button>
                <button className="flex-1 rounded bg-white/5 py-0.5 text-[8px] hover:bg-white/10">✏</button>
                <button className="flex-1 rounded bg-white/5 py-0.5 text-[8px] hover:bg-white/10">🤖</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sync footer + timeline */}
      <div className="border-t border-white/10 bg-black/40 p-2">
        <div className="mb-1 flex items-center justify-between text-[10px]">
          <span className="text-[var(--muted)]">Timeline (audio-aligned)</span>
          <span className="font-mono text-[var(--muted)]">27.3s · 6 scenes</span>
        </div>
        <MiniTimeline scenes={MOCK.scenes} height="h-8" />
        <div className="mt-1 h-3 rounded bg-emerald-500/30 ring-1 ring-emerald-400/60 flex items-center px-1.5 text-[8px]">
          🎤 voice · synced với script edit
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  H3 — Wizard với embedded NLE
//  Steps 1-3 simple. Step 4 ("Review & Polish") opens full mini-NLE.
//  User dễ vào, nhưng có thể đào sâu khi cần.
// ═════════════════════════════════════════════════════════════════════
function H3WizardNLE() {
  const steps = [
    { i: 1, label: 'Script', icon: '✍️', done: true },
    { i: 2, label: 'Images', icon: '🖼', done: true },
    { i: 3, label: 'Voice', icon: '🎤', done: true },
    { i: 4, label: 'Review & Polish', icon: '🎬', active: true, badge: 'NLE mode' },
  ];
  return (
    <div className="rounded-lg bg-[#0f1117] ring-1 ring-white/10">
      {/* Stepper */}
      <div className="border-b border-white/10 p-3">
        <div className="flex items-center">
          {steps.map((s, idx) => (
            <div key={s.i} className="flex flex-1 items-center">
              <div className="flex items-center gap-2">
                <div className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ring-2 ${
                  s.active ? 'bg-rose-500 text-white ring-rose-300' :
                  s.done ? 'bg-emerald-500/40 text-emerald-200 ring-emerald-500/60' :
                  'bg-white/5 ring-white/10'
                }`}>{s.done ? '✓' : s.i}</div>
                <div>
                  <div className="text-[11px] font-medium">{s.icon} {s.label}</div>
                  {s.badge && <div className="rounded bg-rose-500/20 px-1.5 py-0 text-[8px] text-rose-200">{s.badge}</div>}
                </div>
              </div>
              {idx < steps.length - 1 && <div className={`mx-2 h-0.5 flex-1 ${s.done ? 'bg-emerald-500/50' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>
        <div className="mt-2 rounded bg-indigo-500/10 px-3 py-1.5 text-[10px] text-indigo-200 ring-1 ring-indigo-500/30">
          💡 Bước 1-3 đã xong tự động bằng AI. Bước 4 chuyển sang chế độ <strong>NLE pro</strong> để bạn tinh chỉnh trước khi xuất.
        </div>
      </div>

      {/* Step 4 body: mini NLE */}
      <div className="grid grid-cols-12 gap-1 p-1">
        <div className="col-span-8">
          <Preview scene={MOCK.scenes[3]} />
        </div>
        <div className="col-span-4 rounded bg-black/40 p-2 ring-1 ring-white/10">
          <div className="mb-1.5 text-[10px] font-semibold uppercase text-[var(--muted)]">Inspector · Scene 4</div>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between"><span className="text-[var(--muted)]">Source</span><span className="font-mono">🤖 gen</span></div>
            <div className="flex items-center justify-between"><span className="text-[var(--muted)]">Duration</span><span className="font-mono">4.5s</span></div>
            <div>
              <div className="mb-0.5 text-[var(--muted)]">Ken Burns scale</div>
              <div className="h-1.5 rounded-full bg-white/10"><div className="h-full w-3/5 rounded-full bg-rose-400" /></div>
            </div>
            <div>
              <div className="mb-0.5 text-[var(--muted)]">Voice volume</div>
              <div className="h-1.5 rounded-full bg-white/10"><div className="h-full w-4/5 rounded-full bg-emerald-400" /></div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1">
              <button className="rounded bg-white/5 py-1 text-[9px]">🔄 Regen image</button>
              <button className="rounded bg-white/5 py-1 text-[9px]">🎤 Retake voice</button>
              <button className="rounded bg-white/5 py-1 text-[9px]">✂ Trim</button>
              <button className="rounded bg-white/5 py-1 text-[9px]">📋 Edit text</button>
            </div>
          </div>
        </div>
        {/* Timeline */}
        <div className="col-span-12 rounded bg-black/60 p-2 ring-1 ring-white/10">
          <div className="mb-1 flex items-center justify-between text-[10px]">
            <span className="font-semibold">Timeline · click clip để select</span>
            <div className="flex gap-1 text-[var(--muted)]">
              <span className="cursor-pointer hover:text-white">🔍-</span>
              <span className="cursor-pointer hover:text-white">🔍+</span>
              <span className="cursor-pointer hover:text-white">✂</span>
            </div>
          </div>
          <div className="relative">
            <MiniTimeline scenes={MOCK.scenes} height="h-10" />
            <div className="absolute top-0 h-full w-0.5 bg-rose-400" style={{ left: '45%' }} />
          </div>
          <div className="mt-1 h-4 rounded bg-emerald-500/30 ring-1 ring-emerald-400/60 flex items-center px-1.5 text-[9px]">🎤 voice 27.3s</div>
          <div className="mt-0.5 h-3 rounded bg-blue-500/25 ring-1 ring-blue-400/50 flex items-center px-1.5 text-[8px] text-blue-200">🎵 BGM</div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between border-t border-white/10 px-3 py-2">
        <button className="rounded bg-white/5 px-3 py-1.5 text-[11px]">← Back · Voice</button>
        <div className="flex gap-2">
          <button className="rounded bg-white/5 px-3 py-1.5 text-[11px]">⏭ Skip polish</button>
          <button className="rounded bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-1.5 text-[11px] font-bold text-white">🎬 Render MP4</button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  H4 — Kanban → Drill-down NLE modal
//  Outer Kanban from V4. Click 1 card → modal slides out with mini-NLE
//  for that job (showing P1 layout compressed).
// ═════════════════════════════════════════════════════════════════════
function H4KanbanDrill() {
  const jobs = [
    { id: 'J260525-a3', topic: 'Top 5 mẹo code AI', col: 'processing', progress: 67, scenes: MOCK.scenes },
    { id: 'J260525-b8', topic: 'Tour bếp 10m²', col: 'queued', progress: 0 },
    { id: 'J260524-c0', topic: 'Unboxing AirPods', col: 'done', progress: 100 },
    { id: 'J260524-d4', topic: 'Routine sáng 5h', col: 'review', progress: 100 },
  ];
  return (
    <div className="rounded-lg bg-[#0f1117] ring-1 ring-white/10">
      <div className="flex items-center gap-2 border-b border-white/5 bg-black/40 px-3 py-1.5 text-[10px]">
        <span className="font-semibold">📋 Batch Pipeline · 4 jobs</span>
        <span className="ml-auto rounded bg-rose-500/20 px-2 py-0.5 text-rose-200">🎬 Job J260525-a3 opened in NLE</span>
        <button className="rounded bg-emerald-500/30 px-3 py-1">+ New job</button>
      </div>

      <div className="grid grid-cols-12 gap-2 p-2">
        {/* Kanban (smaller) */}
        <div className="col-span-4 space-y-2">
          {[
            { id: 'queued', label: '⏳ Queue', tone: 'slate' },
            { id: 'processing', label: '🎬 Processing', tone: 'amber' },
            { id: 'review', label: '👀 Review', tone: 'cyan' },
            { id: 'done', label: '✅ Done', tone: 'emerald' },
          ].map(col => (
            <div key={col.id} className="rounded-md border border-white/10 bg-black/30 p-1.5">
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span className="font-semibold">{col.label}</span>
                <span className="rounded bg-white/10 px-1 text-[8px]">{jobs.filter(j => j.col === col.id).length}</span>
              </div>
              <div className="space-y-1">
                {jobs.filter(j => j.col === col.id).map(j => (
                  <div key={j.id} className={`rounded border bg-black/40 p-1.5 cursor-pointer transition ${j.col === 'processing' ? 'border-rose-400/60 ring-2 ring-rose-500/40' : 'border-white/10 hover:border-white/20'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[8px] text-[var(--muted)]">{j.id}</span>
                      {j.col === 'processing' && <span className="rounded bg-rose-500/30 px-1 text-[8px] text-rose-200">↗ NLE</span>}
                    </div>
                    <div className="line-clamp-1 text-[10px] font-medium">{j.topic}</div>
                    {j.progress > 0 && j.progress < 100 && (
                      <div className="mt-1 h-1 rounded-full bg-white/10"><div className="h-full rounded-full bg-amber-400" style={{ width: `${j.progress}%` }} /></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Drill-down NLE for selected job */}
        <div className="col-span-8 rounded-md bg-[#1a1a25] ring-2 ring-rose-500/40 p-2">
          <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-1.5">
            <div>
              <div className="text-[11px] font-bold">J260525-a3 · Top 5 mẹo code AI</div>
              <div className="text-[9px] text-[var(--muted)]">processing · 67% · ETA 45s</div>
            </div>
            <div className="flex gap-1 text-[10px]">
              <button className="rounded bg-white/5 px-2 py-1">⏸ Pause</button>
              <button className="rounded bg-rose-500/20 px-2 py-1 text-rose-200">✕ Close</button>
            </div>
          </div>
          {/* Compressed NLE */}
          <div className="grid grid-cols-12 gap-1">
            <div className="col-span-7">
              <Preview scene={MOCK.scenes[2]} />
            </div>
            <div className="col-span-5 rounded bg-black/40 p-2 ring-1 ring-white/10">
              <div className="mb-1 text-[10px] font-semibold uppercase text-[var(--muted)]">Status</div>
              <div className="space-y-1 text-[9px]">
                {[
                  { k: '① Script', v: '✓ 1.2s', tone: 'emerald' },
                  { k: '② Images', v: '✓ 18.7s', tone: 'emerald' },
                  { k: '③ TTS', v: '✓ 4.1s', tone: 'emerald' },
                  { k: '④ Subtitle', v: '⏳ 60%', tone: 'amber' },
                  { k: '⑤ Compose', v: '—', tone: 'slate' },
                ].map(r => (
                  <div key={r.k} className="flex items-center justify-between">
                    <span>{r.k}</span>
                    <span className={`font-mono ${r.tone === 'emerald' ? 'text-emerald-300' : r.tone === 'amber' ? 'text-amber-300' : 'text-[var(--muted)]'}`}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-12">
              <MiniTimeline scenes={MOCK.scenes} height="h-8" />
              <div className="mt-0.5 h-3 rounded bg-emerald-500/30 ring-1 ring-emerald-400/60 flex items-center px-1.5 text-[8px]">🎤 voice</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  H5 — Script + Node Diagnostics
//  Top: Descript-style script editor (main). Bottom: collapsible node
//  graph showing pipeline state. When a node fails (red), click → fix.
// ═════════════════════════════════════════════════════════════════════
function H5ScriptDiagnostics() {
  const nodes = [
    { id: 'script', label: 'Script', icon: '✍️', status: 'ok', x: 0 },
    { id: 'img-up', label: 'Upload', icon: '📤', status: 'ok', x: 1 },
    { id: 'img-gen', label: 'Gen AI', icon: '🤖', status: 'warn', x: 1 },
    { id: 'tts', label: 'TTS', icon: '🎤', status: 'ok', x: 2 },
    { id: 'sub', label: 'Subtitle', icon: '💬', status: 'ok', x: 3 },
    { id: 'fx', label: 'Effects', icon: '✨', status: 'running', x: 4 },
    { id: 'out', label: 'Render', icon: '🎬', status: 'pending', x: 5 },
  ];
  const nodeTone: Record<string, string> = {
    ok: 'bg-emerald-500/20 text-emerald-200 ring-emerald-400/60',
    warn: 'bg-amber-500/20 text-amber-200 ring-amber-400/60',
    running: 'bg-blue-500/20 text-blue-200 ring-blue-400/60 animate-pulse',
    pending: 'bg-white/5 text-[var(--muted)] ring-white/10',
    error: 'bg-rose-500/30 text-rose-200 ring-rose-400/80',
  };
  const statusEmoji: Record<string, string> = { ok: '✓', warn: '⚠', running: '⏳', pending: '○', error: '✗' };

  return (
    <div className="rounded-lg bg-[#0f1117] ring-1 ring-white/10">
      <div className="flex items-center gap-2 border-b border-white/5 bg-black/40 px-3 py-1.5 text-[10px]">
        <span className="font-semibold">📝 Script · 🕸 Pipeline Diagnostics</span>
        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-200">⚠ 1 node cần check</span>
        <button className="ml-auto rounded bg-emerald-500/30 px-3 py-1 font-bold text-emerald-100">🎬 Render</button>
      </div>

      {/* Main: Script editor (Descript light theme) */}
      <div className="grid grid-cols-12 gap-1 p-1">
        <div className="col-span-7 rounded bg-[#fafafa] p-3 text-[#1a1a1a] text-[11px] leading-relaxed">
          <div className="mb-2 flex items-center gap-2 text-[10px] text-gray-500">
            <span className="rounded bg-gray-100 px-2 py-0.5">🎤 Hoài My · 27.3s</span>
            <span className="ml-auto rounded bg-amber-100 px-2 py-0.5 text-amber-700">⚠ S5: image gen lỗi</span>
          </div>
          <div className="space-y-1">
            {MOCK.scenes.map((s, i) => (
              <p key={s.i} className={`relative rounded px-2 py-1 ${s.status === 'warn' ? 'bg-amber-100 ring-1 ring-amber-400' : 'hover:bg-gray-100'}`}>
                <span className="mr-2 inline-block w-5 text-right font-mono text-gray-400">[{i + 1}]</span>
                {s.text}
                {s.status === 'warn' && (
                  <button className="ml-2 rounded bg-amber-500 px-2 py-0 text-[9px] font-bold text-white">🔧 Fix gen</button>
                )}
              </p>
            ))}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="col-span-5 rounded bg-black/40 p-2 ring-1 ring-white/10">
          <Preview scene={MOCK.scenes[4]} aspect="portrait" />
          <div className="mt-2 rounded bg-amber-500/10 p-2 text-[10px] text-amber-200 ring-1 ring-amber-500/30">
            ⚠️ Image gen scene 5 trả về ảnh không khớp prompt. AI đề xuất: <strong>retry với seed khác</strong> hoặc <strong>upload thay thế</strong>.
            <div className="mt-1.5 flex gap-1">
              <button className="flex-1 rounded bg-amber-500/30 py-1 text-[9px] font-semibold">🔁 Retry (seed 99)</button>
              <button className="flex-1 rounded bg-white/10 py-1 text-[9px]">📤 Upload</button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: collapsible node graph */}
      <div className="border-t border-white/10 bg-black/60 p-2">
        <div className="mb-2 flex items-center justify-between text-[10px]">
          <span className="font-semibold uppercase text-[var(--muted)]">🕸 Pipeline graph · click node để debug</span>
          <button className="text-[9px] text-[var(--muted)] hover:text-white">▾ Collapse</button>
        </div>
        <div className="relative h-24 overflow-hidden rounded bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:16px_16px]">
          <svg className="absolute inset-0 h-full w-full">
            {[
              ['script', 'img-up'], ['script', 'img-gen'], ['script', 'tts'],
              ['img-up', 'fx'], ['img-gen', 'fx'], ['tts', 'sub'], ['sub', 'fx'], ['fx', 'out'],
            ].map(([a, b], i) => {
              const na = nodes.find(n => n.id === a)!;
              const nb = nodes.find(n => n.id === b)!;
              const colWidth = 100 / 6;
              const x1 = (na.x + 0.5) * colWidth + 6;
              const x2 = (nb.x + 0.5) * colWidth - 6;
              const aIsUp = a === 'img-up' || (a === 'script' && b === 'img-up');
              const aIsGen = a === 'img-gen' || (a === 'script' && b === 'img-gen');
              const y1 = aIsUp ? 28 : aIsGen ? 70 : 48;
              const bIsUp = b === 'img-up';
              const bIsGen = b === 'img-gen';
              const y2 = bIsUp ? 28 : bIsGen ? 70 : 48;
              return <path key={i} d={`M ${x1}% ${y1} C ${(x1 + x2) / 2}% ${y1}, ${(x1 + x2) / 2}% ${y2}, ${x2}% ${y2}`} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />;
            })}
          </svg>
          {nodes.map(n => {
            const colWidth = 100 / 6;
            const left = `${(n.x + 0.5) * colWidth}%`;
            const top = n.id === 'img-up' ? 8 : n.id === 'img-gen' ? 50 : 28;
            return (
              <div key={n.id} className={`absolute -translate-x-1/2 rounded-lg px-2 py-1 ring-2 cursor-pointer ${nodeTone[n.status]}`} style={{ left, top }}>
                <div className="flex items-center gap-1 text-[10px] font-bold">
                  <span>{n.icon}</span>
                  <span>{n.label}</span>
                  <span className="text-[9px]">{statusEmoji[n.status]}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-1 text-[9px] text-[var(--muted)]">
          ✓ ok · ⏳ running · ⚠ warning · ✗ error · ○ pending — pipeline 5/7 done
        </div>
      </div>
    </div>
  );
}
