// =====================================================================
//  AutoVideo Studio — 5 PRO EDITOR directions.
//  Inspired by: Adobe Premiere Pro · DaVinci Resolve · CapCut · Final
//  Cut Pro · Descript. Mỗi variant mượn ngôn ngữ thị giác của 1 NLE thật.
//
//  P1 NLE Multi-panel    — Premiere/Resolve: Source + Program + Bin + Timeline
//  P2 Magnetic Timeline  — Final Cut Pro: 1 magnetic storyline + connected
//  P3 CapCut Desktop     — Hero preview + bottom timeline + right tool dock
//  P4 Descript Script    — Edit script text = edit video (text-driven)
//  P5 Node Graph         — DaVinci Fusion / Blender nodes — pipeline as DAG
// =====================================================================
import Link from 'next/link';

export const dynamic = 'force-static';
export const metadata = { title: 'Design Preview · AutoVideo · Pro Editor' };

// ───────────────────────────────────────────────── MOCK
const MOCK = {
  topic: 'Top 5 mẹo tiết kiệm thời gian khi code với AI',
  duration: 27.3,
  scenes: [
    { i: 1, text: 'Bạn dành quá nhiều thời gian sửa code AI gen? Đây là 5 mẹo giúp tăng tốc.', dur: 4.2, src: 'upload', img: 'from-blue-500/40 to-cyan-500/40' },
    { i: 2, text: 'Mẹo 1: Mô tả context rõ ràng — file paths, line numbers, ý định cụ thể.', dur: 5.1, src: 'upload', img: 'from-pink-500/40 to-rose-500/40' },
    { i: 3, text: 'Mẹo 2: Yêu cầu AI review từng phần trước khi sinh code dài.', dur: 4.8, src: 'upload', img: 'from-amber-500/40 to-orange-500/40' },
    { i: 4, text: 'Mẹo 3: Dùng plan mode để chốt approach trước khi implement.', dur: 4.5, src: 'gen', img: 'from-purple-500/40 to-indigo-500/40' },
    { i: 5, text: 'Mẹo 4: Lưu pattern vào memory để dùng lại sau.', dur: 4.0, src: 'gen', img: 'from-emerald-500/40 to-teal-500/40' },
    { i: 6, text: 'Mẹo 5: Verify bằng cách chạy app, đừng chỉ tin tests pass.', dur: 4.7, src: 'gen', img: 'from-violet-500/40 to-fuchsia-500/40' },
  ],
  bins: [
    { type: '🖼', name: 'cover.jpg', meta: '1920×1080' },
    { type: '🖼', name: 'context.png', meta: '1080×1080' },
    { type: '🖼', name: 'review.jpg', meta: '1920×1080' },
    { type: '🤖', name: 'gen_plan.png', meta: 'SDXL · seed 42' },
    { type: '🤖', name: 'gen_memory.png', meta: 'SDXL · seed 43' },
    { type: '🤖', name: 'gen_verify.png', meta: 'SDXL · seed 44' },
    { type: '🎵', name: 'bgm-upbeat.mp3', meta: '30s · 128kbps' },
    { type: '🎤', name: 'voice-hoaimy.wav', meta: '27.3s · 48kHz' },
  ],
};

// ───────────────────────────────────────────────── PAGE
export default function ProPreview() {
  return (
    <div className="space-y-8 pb-16">
      <header className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold">AutoVideo Studio · Pro Editor directions</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          5 mockup theo ngôn ngữ thị giác của <strong>Premiere · DaVinci · CapCut · FCP · Descript</strong>.
          Trade-off: mạnh về kiểm soát chi tiết, nhưng learning curve cao hơn workflow đơn giản.
        </p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          <Link href="/" className="text-indigo-300 hover:underline">← Home</Link>
          <Link href="/design-preview/auto-video" className="text-indigo-300 hover:underline">← Workflow (V1–V5)</Link>
          <Link href="/design-preview/auto-video-hybrid" className="text-emerald-300 hover:underline">→ Hybrid (H1–H5)</Link>
        </div>
      </header>

      <DS num="P1" title="NLE Multi-panel" lang="Premiere / DaVinci Resolve. 4 panel: Source + Program + Media Bin + Multi-track Timeline. Quen với editor pro.">
        <P1NLE />
      </DS>

      <DS num="P2" title="Magnetic Timeline" lang="Final Cut Pro. 1 storyline chính magnetic, các clip phụ (voice, subtitle, BGM) connect lên trên/dưới. Không gap.">
        <P2Magnetic />
      </DS>

      <DS num="P3" title="CapCut Desktop" lang="Hero preview chiếm trên, timeline gọn dưới, tool dock bên phải (Edit / Audio / Text / Effects / Filters). Mobile-first feel.">
        <P3CapCut />
      </DS>

      <DS num="P4" title="Descript Script" lang="Edit text = edit video. Script bên trái là source of truth, xóa câu = xóa clip. Best cho AI voiceover content.">
        <P4Descript />
      </DS>

      <DS num="P5" title="Node Graph (Fusion)" lang="DaVinci Fusion / Blender. Mỗi step pipeline = 1 node, kết nối thành DAG. Cực kỳ flexible, visual debug.">
        <P5Nodes />
      </DS>
    </div>
  );
}

function DS({ num, title, lang, children }: any) {
  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-rose-500/20 text-base font-bold text-rose-200 ring-1 ring-rose-500/40">{num}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-tight">{title}</h2>
          <p className="text-xs text-rose-300/80">{lang}</p>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/60 p-2">{children}</div>
    </section>
  );
}

// ───────────────────────────────────────────────── PRIMITIVES
function ToolbarBtn({ children, active }: any) {
  return (
    <button className={`grid h-8 w-8 place-items-center rounded text-base transition ${
      active ? 'bg-indigo-500/40 text-white ring-1 ring-indigo-400/60' : 'text-[var(--muted)] hover:bg-white/10 hover:text-white'
    }`}>{children}</button>
  );
}
function PanelHeader({ title, actions }: any) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 bg-black/60 px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">
      <span className="font-semibold">{title}</span>
      {actions}
    </div>
  );
}
function PreviewMonitor({ label, content, scene }: any) {
  return (
    <div className="flex flex-col rounded-md bg-black ring-1 ring-white/10">
      <PanelHeader title={label} actions={<span className="font-mono text-[9px]">{scene?.dur || '—'}s</span>} />
      <div className={`relative aspect-video flex-1 bg-gradient-to-br ${content || 'from-slate-800 to-black'} grid place-items-center`}>
        <span className="text-5xl opacity-30">🎬</span>
        {scene && (
          <div className="absolute bottom-2 left-2 right-2 rounded bg-black/60 px-2 py-1 text-center text-[10px] backdrop-blur">
            {scene.text}
          </div>
        )}
        <div className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px]">1920×1080 · 30fps</div>
      </div>
      <div className="flex items-center justify-center gap-1 border-t border-white/5 bg-black/60 py-1">
        {['⏮', '⏪', '▶', '⏩', '⏭'].map(b => <button key={b} className="grid h-6 w-6 place-items-center rounded text-xs hover:bg-white/10">{b}</button>)}
        <div className="ml-2 font-mono text-[10px] text-[var(--muted)]">00:00:08:12 / 00:00:27:18</div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  P1 — NLE Multi-panel (Premiere / DaVinci Resolve)
//  Top row: [Source monitor | Program monitor]
//  Mid row: [Project Bin | Effects panel | Inspector]
//  Bot row: Multi-track timeline V1/V2/A1/A2/A3 with playhead
// ═════════════════════════════════════════════════════════════════════
function P1NLE() {
  const tracks = [
    { name: 'V2', label: 'Subtitle', clips: MOCK.scenes.map(s => ({ dur: s.dur, color: 'bg-amber-500/40 border-amber-400/60', text: 'CC' })) },
    { name: 'V1', label: 'Video', clips: MOCK.scenes.map(s => ({ dur: s.dur, color: s.src === 'upload' ? 'bg-cyan-500/40 border-cyan-400/60' : 'bg-purple-500/40 border-purple-400/60', text: `S${s.i}` })) },
    { name: 'A1', label: 'Voice', clips: [{ dur: MOCK.duration, color: 'bg-emerald-500/40 border-emerald-400/60', text: '🎤 voice-hoaimy.wav', wave: true }] },
    { name: 'A2', label: 'BGM', clips: [{ dur: MOCK.duration, color: 'bg-blue-500/30 border-blue-400/50', text: '🎵 upbeat-corp.mp3', wave: true }] },
  ];
  return (
    <div className="rounded-lg bg-[#1a1a1f] ring-1 ring-white/10">
      {/* Menu bar */}
      <div className="flex items-center gap-3 border-b border-white/5 bg-black/40 px-3 py-1 text-[10px] text-[var(--muted)]">
        <span className="font-semibold text-white">AutoVideo Studio Pro</span>
        {['File', 'Edit', 'Clip', 'Sequence', 'Effects', 'Window', 'Help'].map(m => <span key={m} className="hover:text-white cursor-pointer">{m}</span>)}
        <div className="ml-auto flex gap-1">
          {['🤖 AI Assist', '💾 Save', '🎬 Export'].map(b => <span key={b} className="rounded bg-white/5 px-2 py-0.5 hover:bg-white/10 cursor-pointer">{b}</span>)}
        </div>
      </div>

      {/* Top row: Source + Program */}
      <div className="grid grid-cols-2 gap-1 p-1">
        <PreviewMonitor label="Source · cover.jpg" content="from-blue-700/50 to-cyan-600/50" />
        <PreviewMonitor label="Program · AutoVideo_v1" content={MOCK.scenes[1].img} scene={MOCK.scenes[1]} />
      </div>

      {/* Mid row: Bin + Effects + Inspector */}
      <div className="grid grid-cols-12 gap-1 p-1">
        {/* Project Bin */}
        <div className="col-span-5 rounded-md bg-black/40 ring-1 ring-white/10">
          <PanelHeader title="Project · Bin" actions={<span>{MOCK.bins.length} items</span>} />
          <div className="grid grid-cols-4 gap-1 p-1.5">
            {MOCK.bins.map((b, i) => (
              <div key={i} className="rounded bg-white/[.03] p-1.5 text-center hover:bg-white/10 cursor-pointer ring-1 ring-white/5">
                <div className="text-xl">{b.type}</div>
                <div className="truncate text-[9px] font-mono">{b.name}</div>
                <div className="text-[8px] text-[var(--muted)]">{b.meta}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Effects */}
        <div className="col-span-3 rounded-md bg-black/40 ring-1 ring-white/10">
          <PanelHeader title="Effects" />
          <div className="space-y-0.5 p-1.5 text-[10px]">
            {[
              '📁 Video Effects',
              '  ▸ Ken Burns In',
              '  ▸ Ken Burns Out',
              '  ▸ Pan Left/Right',
              '  ▸ Zoom Slow',
              '📁 Transitions',
              '  ▸ Cross Dissolve ✓',
              '  ▸ Slide',
              '  ▸ Fade to Black',
              '📁 Audio',
              '  ▸ Voice Duck',
              '  ▸ Compressor',
            ].map(e => (
              <div key={e} className={`cursor-pointer rounded px-1.5 py-0.5 hover:bg-indigo-500/20 ${e.includes('✓') ? 'bg-indigo-500/15 text-indigo-200' : ''}`}>{e}</div>
            ))}
          </div>
        </div>
        {/* Inspector */}
        <div className="col-span-4 rounded-md bg-black/40 ring-1 ring-white/10">
          <PanelHeader title="Inspector · Scene 2 selected" />
          <div className="space-y-1.5 p-2 text-[10px]">
            <InspectorRow k="Source" v="📤 upload · cover.jpg" />
            <InspectorRow k="Duration" v="5.10s" />
            <InspectorRow k="In / Out" v="00:04.20 → 00:09.30" />
            <InspectorRow k="Effect" v="Ken Burns In" />
            <InspectorRow k="Scale" v="100% → 115%" />
            <InspectorRow k="Position X" v="0px → -20px" />
            <InspectorRow k="Transition" v="Cross Dissolve · 0.4s" />
            <InspectorRow k="Opacity" v="100%" />
            <div className="mt-2 rounded bg-rose-500/10 px-2 py-1 text-[9px] text-rose-200 ring-1 ring-rose-500/30">
              ⚠️ Voice timing: clip ngắn hơn audio 0.2s
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-md bg-black/60 ring-1 ring-white/10 mx-1 mb-1">
        <PanelHeader title="Timeline · AutoVideo_v1" actions={
          <div className="flex gap-1">
            {['🔍-', '🔍+', '⏯', '✂', '🔗'].map(b => <span key={b} className="cursor-pointer hover:text-white">{b}</span>)}
          </div>
        } />
        {/* Time ruler */}
        <div className="relative h-5 border-b border-white/5 bg-black/40">
          {[0, 5, 10, 15, 20, 25].map(t => (
            <div key={t} className="absolute top-0 h-full border-l border-white/10 px-1 text-[8px] font-mono text-[var(--muted)]" style={{ left: `${(t / MOCK.duration) * 100}%` }}>0:{t.toString().padStart(2, '0')}</div>
          ))}
          {/* Playhead */}
          <div className="absolute top-0 h-full w-0.5 bg-rose-400" style={{ left: '30%' }}>
            <div className="absolute -top-0.5 -left-1.5 h-0 w-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-rose-400" />
          </div>
        </div>
        {/* Tracks */}
        {tracks.map((tr, ti) => (
          <div key={tr.name} className="flex border-b border-white/5">
            <div className="flex w-20 shrink-0 items-center justify-between border-r border-white/10 bg-black/60 px-2 py-1.5 text-[10px]">
              <span className="font-mono font-bold">{tr.name}</span>
              <div className="flex gap-0.5 text-[8px] text-[var(--muted)]">
                <span className="cursor-pointer hover:text-white">M</span>
                <span className="cursor-pointer hover:text-white">S</span>
                <span className="cursor-pointer hover:text-white">🔒</span>
              </div>
            </div>
            <div className="relative flex-1 bg-black/40" style={{ height: ti < 2 ? 36 : 32 }}>
              {tr.clips.map((c: any, ci) => {
                const cumDur = tr.clips.slice(0, ci).reduce((a: number, x: any) => a + x.dur, 0);
                const left = (cumDur / MOCK.duration) * 100;
                const width = (c.dur / MOCK.duration) * 100;
                return (
                  <div key={ci} className={`absolute top-1 bottom-1 rounded border ${c.color} px-1 py-0.5 text-[9px] font-medium overflow-hidden`} style={{ left: `${left}%`, width: `calc(${width}% - 2px)` }}>
                    <div className="truncate">{c.text}</div>
                    {c.wave && (
                      <div className="flex h-3 items-end gap-px mt-0.5">
                        {Array.from({ length: 60 }).map((_, i) => <div key={i} className="flex-1 bg-white/50" style={{ height: `${30 + Math.sin(i * 0.6) * 30 + Math.random() * 20}%` }} />)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-white/5 bg-black/40 px-3 py-1 text-[9px] font-mono text-[var(--muted)]">
        <span>Sequence: 1920×1080 · 30fps · 27.30s</span>
        <span>RAM 4.2GB · GPU 32% · ✅ Ready to render</span>
      </div>
    </div>
  );
}
function InspectorRow({ k, v }: any) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-1">
      <span className="text-[var(--muted)]">{k}</span>
      <span className="font-mono text-white/90">{v}</span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  P2 — Magnetic Timeline (Final Cut Pro)
//  Big preview top-left. Inspector top-right. Magnetic primary
//  storyline (no gaps) bottom. Connected clips above/below.
// ═════════════════════════════════════════════════════════════════════
function P2Magnetic() {
  return (
    <div className="rounded-lg bg-[#1c1c1f] ring-1 ring-white/10">
      <div className="flex items-center gap-2 border-b border-white/5 bg-black/40 px-3 py-1.5 text-[10px]">
        <span className="font-bold">Final Cut · AutoVideo</span>
        <div className="ml-auto flex gap-1">
          <ToolbarBtn>📚</ToolbarBtn>
          <ToolbarBtn>🎤</ToolbarBtn>
          <ToolbarBtn>✨</ToolbarBtn>
          <ToolbarBtn active>🧲</ToolbarBtn>
          <ToolbarBtn>✂</ToolbarBtn>
          <span className="mx-2 h-6 w-px bg-white/10" />
          <button className="rounded bg-rose-500/20 px-3 py-1 text-[10px] font-semibold text-rose-200 ring-1 ring-rose-500/40">🎬 Share ▾</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-1 p-1">
        {/* Preview */}
        <div className="col-span-7">
          <PreviewMonitor label="Viewer" content={MOCK.scenes[2].img} scene={MOCK.scenes[2]} />
        </div>
        {/* Inspector */}
        <div className="col-span-5 rounded-md bg-black/40 ring-1 ring-white/10">
          <PanelHeader title="Inspector · Scene 3" actions={
            <div className="flex gap-1 text-[10px]">
              <span className="rounded bg-indigo-500/30 px-1.5 py-0.5">Video</span>
              <span className="cursor-pointer">Audio</span>
              <span className="cursor-pointer">Info</span>
            </div>
          } />
          <div className="space-y-2 p-2 text-[10px]">
            <SliderRow label="Scale" value={115} />
            <SliderRow label="Position X" value={-20} max={50} min={-50} />
            <SliderRow label="Rotation" value={0} max={45} min={-45} />
            <SliderRow label="Opacity" value={100} />
            <div className="border-t border-white/10 pt-2">
              <div className="mb-1 text-[10px] font-semibold uppercase">Ken Burns</div>
              <SliderRow label="Start zoom" value={100} />
              <SliderRow label="End zoom" value={115} />
              <SliderRow label="Direction" value={45} max={360} />
            </div>
          </div>
        </div>
      </div>

      {/* Magnetic timeline */}
      <div className="bg-[#15151a] p-2">
        <div className="mb-1 text-[9px] uppercase tracking-wider text-[var(--muted)]">Magnetic Timeline · auto-shift khi xóa/insert</div>
        {/* Connected: Subtitle */}
        <div className="relative h-7 mb-1">
          {MOCK.scenes.map((s, i) => {
            const cum = MOCK.scenes.slice(0, i).reduce((a, b) => a + b.dur, 0);
            const left = (cum / MOCK.duration) * 100;
            const w = (s.dur / MOCK.duration) * 100;
            return (
              <div key={s.i} className="absolute top-0 h-full rounded bg-amber-500/30 ring-1 ring-amber-400/60 px-1 text-[9px] leading-7 text-amber-100 truncate" style={{ left: `${left}%`, width: `calc(${w}% - 2px)` }}>
                💬 {s.text.slice(0, 28)}...
              </div>
            );
          })}
        </div>
        {/* Primary storyline (magnetic) */}
        <div className="relative h-16">
          <div className="absolute inset-x-0 top-0 h-full rounded-md bg-black/40 ring-2 ring-rose-500/60" />
          {MOCK.scenes.map((s, i) => {
            const cum = MOCK.scenes.slice(0, i).reduce((a, b) => a + b.dur, 0);
            const left = (cum / MOCK.duration) * 100;
            const w = (s.dur / MOCK.duration) * 100;
            return (
              <div key={s.i} className={`absolute top-0.5 bottom-0.5 rounded bg-gradient-to-br ${s.img} ring-1 ring-white/30 px-1 py-1 text-[9px] font-bold`} style={{ left: `calc(${left}% + 1px)`, width: `calc(${w}% - 2px)` }}>
                <div className="flex items-center justify-between">
                  <span>S{s.i}</span>
                  <span className="text-[8px] opacity-70">{s.src === 'gen' ? '🤖' : '📤'}</span>
                </div>
                <div className="mt-3 text-[8px] font-mono opacity-80">{s.dur.toFixed(1)}s</div>
              </div>
            );
          })}
          {/* Playhead */}
          <div className="absolute top-0 h-full w-0.5 bg-white" style={{ left: '40%' }}>
            <div className="absolute -top-1 -left-1 h-3 w-3 rotate-45 bg-white" />
          </div>
        </div>
        {/* Connected: Voice + BGM */}
        <div className="relative h-6 mt-1">
          <div className="absolute inset-0 rounded bg-emerald-500/30 ring-1 ring-emerald-400/60 flex items-center px-2 text-[9px]">
            <span className="font-mono">🎤 voice-hoaimy.wav</span>
            <div className="ml-2 flex h-3 flex-1 items-end gap-px">
              {Array.from({ length: 120 }).map((_, i) => <div key={i} className="w-px bg-emerald-300/70" style={{ height: `${30 + Math.sin(i * 0.4) * 40 + Math.random() * 20}%` }} />)}
            </div>
          </div>
        </div>
        <div className="relative h-5 mt-0.5">
          <div className="absolute inset-0 rounded bg-blue-500/25 ring-1 ring-blue-400/50 flex items-center px-2 text-[9px] text-blue-200">
            🎵 upbeat-corp.mp3 · ducked -12dB under voice
          </div>
        </div>
      </div>
    </div>
  );
}
function SliderRow({ label, value, min = 0, max = 200 }: any) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-[var(--muted)]">{label}</span>
      <div className="relative h-1 flex-1 rounded-full bg-white/10">
        <div className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-indigo-400 ring-2 ring-indigo-400/30" style={{ left: `calc(${pct}% - 6px)` }} />
      </div>
      <span className="w-10 text-right font-mono tabular-nums">{value}</span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  P3 — CapCut Desktop
//  Big hero preview top. Compact horizontal timeline mid. Right-side
//  tool dock with tabs: Edit / Audio / Text / Effects / Filters.
// ═════════════════════════════════════════════════════════════════════
function P3CapCut() {
  const tools = ['Edit', 'Audio', 'Text', 'Effects', 'Filters', 'Stickers', 'Subtitle'];
  return (
    <div className="rounded-lg bg-gradient-to-b from-[#0f0f17] to-[#1a1a25] ring-1 ring-white/10">
      {/* Top bar */}
      <div className="flex items-center gap-2 border-b border-white/5 px-3 py-1.5 text-[10px]">
        <span className="grid h-6 w-6 place-items-center rounded bg-gradient-to-br from-pink-500 to-orange-500 font-bold text-white">C</span>
        <span className="font-semibold">CapCut · AutoVideo</span>
        <div className="ml-auto flex items-center gap-1">
          <button className="rounded bg-white/5 px-2 py-1 text-[10px]">↶ Undo</button>
          <button className="rounded bg-white/5 px-2 py-1 text-[10px]">↷ Redo</button>
          <button className="ml-2 rounded bg-gradient-to-r from-pink-500 to-orange-500 px-3 py-1 text-[10px] font-bold text-white shadow-lg">Export</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-2 p-2">
        {/* Left: media library */}
        <div className="col-span-2 rounded-md bg-black/30 ring-1 ring-white/10">
          <div className="space-y-0.5 p-1 text-[10px]">
            {[
              { icon: '🗂', label: 'Media' },
              { icon: '🎵', label: 'Audio' },
              { icon: '✍️', label: 'Text' },
              { icon: '✨', label: 'Stickers' },
              { icon: '🎨', label: 'Effects' },
              { icon: '🌈', label: 'Filters' },
              { icon: '🔄', label: 'Transitions' },
              { icon: '🤖', label: 'AI Tools', active: true },
            ].map(t => (
              <div key={t.label} className={`flex items-center gap-1.5 rounded px-1.5 py-1.5 cursor-pointer ${t.active ? 'bg-pink-500/20 text-pink-200' : 'hover:bg-white/5'}`}>
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center: preview hero */}
        <div className="col-span-7 space-y-2">
          <div className={`aspect-video rounded-lg bg-gradient-to-br ${MOCK.scenes[3].img} ring-1 ring-white/20 grid place-items-center relative shadow-xl`}>
            <span className="text-6xl opacity-40">🎬</span>
            <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-black/70 px-3 py-2 text-center text-xs backdrop-blur">
              {MOCK.scenes[3].text}
            </div>
            <div className="absolute right-3 top-3 rounded bg-black/70 px-2 py-1 font-mono text-[10px]">9:16 · 1080×1920</div>
          </div>
          {/* Transport */}
          <div className="flex items-center justify-center gap-2 rounded-md bg-black/30 px-3 py-2 ring-1 ring-white/10">
            <button className="grid h-7 w-7 place-items-center rounded hover:bg-white/10">⏮</button>
            <button className="grid h-7 w-7 place-items-center rounded hover:bg-white/10">⏪</button>
            <button className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-lg text-base">▶</button>
            <button className="grid h-7 w-7 place-items-center rounded hover:bg-white/10">⏩</button>
            <button className="grid h-7 w-7 place-items-center rounded hover:bg-white/10">⏭</button>
            <span className="mx-2 h-6 w-px bg-white/10" />
            <span className="font-mono text-[10px] text-[var(--muted)]">00:11 / 00:27</span>
            <div className="ml-auto flex gap-1">
              <button className="rounded bg-white/5 px-2 py-1 text-[10px]">🔊</button>
              <button className="rounded bg-white/5 px-2 py-1 text-[10px]">⛶</button>
            </div>
          </div>
        </div>

        {/* Right: tool dock */}
        <div className="col-span-3 space-y-2">
          <div className="flex gap-0.5 rounded-md bg-black/40 p-0.5 text-[10px]">
            {tools.slice(0, 4).map((t, i) => (
              <button key={t} className={`flex-1 rounded py-1 ${i === 0 ? 'bg-white/10 text-white' : 'text-[var(--muted)]'}`}>{t}</button>
            ))}
          </div>
          <div className="rounded-md bg-black/30 p-2 ring-1 ring-white/10">
            <div className="mb-2 text-[10px] font-semibold uppercase text-[var(--muted)]">Selected: Scene 4</div>
            <div className="space-y-2 text-[10px]">
              <CapCutSlider label="Speed" value="1.0x" />
              <CapCutSlider label="Volume" value="100%" />
              <CapCutSlider label="Scale" value="115%" />
              <CapCutSlider label="Rotate" value="0°" />
              <div className="mt-3 grid grid-cols-3 gap-1">
                {['🌀', '✨', '💫', '🌟', '⚡', '🎆'].map(e => (
                  <button key={e} className="aspect-square rounded bg-white/5 text-lg hover:bg-pink-500/20">{e}</button>
                ))}
              </div>
              <div className="text-center text-[9px] text-[var(--muted)]">Tap effect to apply</div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline strip */}
      <div className="border-t border-white/10 bg-black/40 p-2">
        <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--muted)]">
          <span>Timeline</span>
          <div className="flex gap-2 font-mono">
            <span>27.3s total</span>
            <button className="rounded bg-white/5 px-2 hover:bg-white/10">🔍-</button>
            <button className="rounded bg-white/5 px-2 hover:bg-white/10">🔍+</button>
          </div>
        </div>
        <div className="flex gap-1">
          {MOCK.scenes.map((s, i) => (
            <div key={s.i} className={`relative shrink-0 rounded bg-gradient-to-br ${s.img} ring-1 ring-white/20 overflow-hidden`} style={{ width: `${(s.dur / MOCK.duration) * 100}%`, height: 48 }}>
              <span className="absolute left-1 top-0.5 text-[8px] font-bold drop-shadow">S{s.i}</span>
              <span className="absolute right-1 top-0.5 text-[8px] drop-shadow">{s.src === 'gen' ? '🤖' : '📤'}</span>
              <span className="absolute bottom-0.5 right-1 font-mono text-[8px] drop-shadow">{s.dur.toFixed(1)}s</span>
            </div>
          ))}
        </div>
        <div className="mt-1 h-3 rounded bg-emerald-500/30 ring-1 ring-emerald-400/60 flex items-center px-1.5 text-[8px]">
          🎤 Voice · 27.3s
        </div>
      </div>
    </div>
  );
}
function CapCutSlider({ label, value }: any) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between"><span className="text-[var(--muted)]">{label}</span><span className="font-mono">{value}</span></div>
      <div className="h-1 rounded-full bg-white/10">
        <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-pink-500 to-orange-400" />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  P4 — Descript-style Script Editor
//  Left: script text (editable, each sentence = clip). Right: preview.
//  Bottom: minimal timeline. Killer feature: delete word = cut video.
// ═════════════════════════════════════════════════════════════════════
function P4Descript() {
  return (
    <div className="rounded-lg bg-[#fafafa] text-[#1a1a1a] ring-1 ring-white/10 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-black/10 bg-white px-3 py-2 text-[11px]">
        <span className="font-bold">📝 AutoVideo · Script Mode</span>
        <span className="text-[var(--muted)] !text-gray-500">— sửa text = sửa video</span>
        <div className="ml-auto flex gap-1">
          <button className="rounded border border-gray-300 px-2 py-1 text-[10px]">Listen</button>
          <button className="rounded border border-gray-300 px-2 py-1 text-[10px]">Regenerate voice</button>
          <button className="rounded bg-emerald-500 px-3 py-1 text-[10px] font-semibold text-white">Publish</button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-0">
        {/* Script editor */}
        <div className="col-span-7 max-h-[420px] overflow-y-auto bg-white p-4 text-[12px] leading-relaxed">
          <div className="mb-3 flex items-center gap-2 text-[10px] text-gray-500">
            <span className="rounded bg-gray-100 px-2 py-0.5">🎤 Voice: Hoài My</span>
            <span>•</span>
            <span>27.3s</span>
            <span>•</span>
            <span>6 scenes / 89 words</span>
          </div>
          {MOCK.scenes.map((s, i) => (
            <p key={s.i} className={`group relative mb-2 rounded px-2 py-1.5 cursor-text ${i === 1 ? 'bg-yellow-100/80 ring-1 ring-yellow-300' : 'hover:bg-gray-50'}`}>
              <span className="mr-2 inline-block w-6 text-right text-[10px] font-mono text-gray-400">[{i + 1}]</span>
              {s.text.split(' ').map((word, wi) => (
                <span key={wi} className="hover:bg-yellow-200/60 cursor-pointer">{word} </span>
              ))}
              <span className="ml-2 inline-flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-[9px] font-mono text-gray-400 opacity-0 group-hover:opacity-100 ring-1 ring-gray-200">
                <span>{s.dur.toFixed(1)}s</span>
                <span>·</span>
                <span>{s.src === 'gen' ? '🤖 gen' : '📤 upload'}</span>
              </span>
            </p>
          ))}
          <div className="mt-3 flex gap-1.5">
            <button className="rounded bg-indigo-50 px-3 py-1.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-indigo-200">+ Add scene</button>
            <button className="rounded bg-gray-50 px-3 py-1.5 text-[10px] font-semibold text-gray-700 ring-1 ring-gray-200">🤖 AI: continue writing</button>
            <button className="rounded bg-gray-50 px-3 py-1.5 text-[10px] font-semibold text-gray-700 ring-1 ring-gray-200">📋 Paste script</button>
          </div>
        </div>

        {/* Preview side */}
        <div className="col-span-5 border-l border-black/10 bg-gray-50 p-3 space-y-2">
          <div className={`aspect-[9/16] rounded bg-gradient-to-br ${MOCK.scenes[1].img} ring-1 ring-black/10 grid place-items-center relative max-h-72 mx-auto shadow`}>
            <span className="text-5xl opacity-30">🎬</span>
            <div className="absolute bottom-2 left-2 right-2 rounded bg-black/70 px-2 py-1 text-center text-[10px] text-white backdrop-blur">
              {MOCK.scenes[1].text}
            </div>
          </div>
          <div className="rounded bg-white p-2 ring-1 ring-black/10">
            <div className="mb-1 text-[10px] font-semibold uppercase text-gray-500">Selected sentence</div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <DescriptRow k="Duration" v="5.10s" />
              <DescriptRow k="Source" v="📤 cover.jpg" />
              <DescriptRow k="Effect" v="Ken Burns" />
              <DescriptRow k="Voice" v="Hoài My" />
            </div>
            <div className="mt-2 flex gap-1">
              <button className="flex-1 rounded bg-gray-100 py-1 text-[10px]">🔄 Swap image</button>
              <button className="flex-1 rounded bg-gray-100 py-1 text-[10px]">🤖 Re-gen</button>
            </div>
          </div>
          <div className="rounded bg-emerald-50 p-2 text-[10px] text-emerald-800 ring-1 ring-emerald-200">
            💡 <strong>Tip:</strong> Xóa text → clip tự cắt. Paste text mới → AI gen voice + ảnh.
          </div>
        </div>
      </div>

      {/* Bottom timeline strip */}
      <div className="border-t border-black/10 bg-white p-2">
        <div className="relative h-8">
          {MOCK.scenes.map((s, i) => {
            const cum = MOCK.scenes.slice(0, i).reduce((a, b) => a + b.dur, 0);
            return (
              <div key={s.i} className={`absolute top-0 h-full bg-gradient-to-br ${s.img} ring-1 ring-black/20 px-1 text-[9px] font-bold text-white drop-shadow`} style={{ left: `${(cum / MOCK.duration) * 100}%`, width: `calc(${(s.dur / MOCK.duration) * 100}% - 1px)` }}>
                <span className="leading-none">[{i + 1}]</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
function DescriptRow({ k, v }: any) {
  return (
    <div>
      <div className="text-gray-500">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  P5 — Node Graph (DaVinci Fusion / Blender)
//  Visual DAG: Input → Script → Image gen/upload → TTS → Subtitle →
//  Effects → Compose → Output. User có thể rewire, debug live.
// ═════════════════════════════════════════════════════════════════════
function P5Nodes() {
  const nodes = [
    { id: 'in', x: 20, y: 100, label: 'Input', icon: '📥', tone: 'slate', fields: 'topic + config' },
    { id: 'script', x: 160, y: 100, label: 'Script', icon: '✍️', tone: 'indigo', fields: 'Gemini Flash' },
    { id: 'img-upload', x: 320, y: 30, label: 'Image · Upload', icon: '📤', tone: 'cyan', fields: '3 files' },
    { id: 'img-gen', x: 320, y: 170, label: 'Image · Gen AI', icon: '🤖', tone: 'purple', fields: 'SDXL · seed 42' },
    { id: 'merge', x: 480, y: 100, label: 'Merge images', icon: '🔀', tone: 'amber', fields: '6 scenes' },
    { id: 'tts', x: 640, y: 100, label: 'TTS', icon: '🎤', tone: 'emerald', fields: 'edge-tts · vi-HoaiMy' },
    { id: 'sub', x: 800, y: 100, label: 'Subtitle', icon: '💬', tone: 'cyan', fields: 'whisper base' },
    { id: 'fx', x: 960, y: 100, label: 'Effects', icon: '✨', tone: 'rose', fields: 'Ken Burns + fade' },
    { id: 'out', x: 1120, y: 100, label: 'Output', icon: '🎬', tone: 'emerald', fields: '1080p · MP4' },
  ];
  const edges = [
    ['in', 'script'], ['script', 'img-upload'], ['script', 'img-gen'],
    ['img-upload', 'merge'], ['img-gen', 'merge'], ['script', 'tts'],
    ['merge', 'fx'], ['tts', 'sub'], ['sub', 'fx'], ['fx', 'out'],
  ];
  const toneMap: Record<string, string> = {
    slate: 'from-slate-700 to-slate-800 ring-slate-400/40',
    indigo: 'from-indigo-700 to-indigo-900 ring-indigo-400/60',
    cyan: 'from-cyan-700 to-cyan-900 ring-cyan-400/60',
    purple: 'from-purple-700 to-purple-900 ring-purple-400/60',
    amber: 'from-amber-700 to-amber-900 ring-amber-400/60',
    emerald: 'from-emerald-700 to-emerald-900 ring-emerald-400/60',
    rose: 'from-rose-700 to-rose-900 ring-rose-400/60',
  };
  const NW = 130, NH = 70;
  return (
    <div className="rounded-lg bg-[#0b0d12] ring-1 ring-white/10">
      <div className="flex items-center gap-2 border-b border-white/5 bg-black/40 px-3 py-1.5 text-[10px]">
        <span className="font-bold">🕸 Fusion · Pipeline graph</span>
        <span className="text-[var(--muted)]">— drag nodes, rewire connections, see data flow live</span>
        <div className="ml-auto flex gap-1">
          <ToolbarBtn>+</ToolbarBtn>
          <ToolbarBtn>🔍</ToolbarBtn>
          <ToolbarBtn>▶</ToolbarBtn>
          <ToolbarBtn active>🐛</ToolbarBtn>
        </div>
      </div>

      <div className="relative h-[300px] overflow-auto bg-[radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:20px_20px]">
        <svg className="absolute inset-0 h-full w-full" style={{ minWidth: 1280 }}>
          {edges.map(([a, b], i) => {
            const na = nodes.find(n => n.id === a)!;
            const nb = nodes.find(n => n.id === b)!;
            const x1 = na.x + NW, y1 = na.y + NH / 2;
            const x2 = nb.x, y2 = nb.y + NH / 2;
            const mx = (x1 + x2) / 2;
            return (
              <g key={i}>
                <path d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} fill="none" stroke="rgba(99,102,241,0.5)" strokeWidth="2" />
                <circle cx={x2} cy={y2} r="3" fill="#6366f1" />
              </g>
            );
          })}
        </svg>
        <div className="relative" style={{ minWidth: 1280, height: 280 }}>
          {nodes.map(n => (
            <div key={n.id} className={`absolute rounded-lg bg-gradient-to-br ${toneMap[n.tone]} ring-2 shadow-xl cursor-move`} style={{ left: n.x, top: n.y, width: NW, height: NH }}>
              <div className="flex items-center gap-1.5 border-b border-white/10 px-2 py-1 text-[10px] font-bold">
                <span>{n.icon}</span>
                <span className="truncate">{n.label}</span>
              </div>
              <div className="px-2 py-1.5 text-[9px] text-white/80">{n.fields}</div>
              {/* Input pin */}
              <div className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white ring-2 ring-indigo-500" />
              {/* Output pin */}
              <div className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-indigo-500 ring-2 ring-white" />
            </div>
          ))}
        </div>
      </div>

      {/* Inspector bottom */}
      <div className="grid grid-cols-12 gap-1 border-t border-white/10 bg-black/40 p-2">
        <div className="col-span-4 rounded bg-black/40 p-2 ring-1 ring-white/10">
          <div className="text-[10px] font-semibold uppercase text-[var(--muted)]">Selected: Effects node</div>
          <div className="mt-1.5 space-y-1 text-[10px]">
            <InspectorRow k="Type" v="ken_burns_in" />
            <InspectorRow k="Duration" v="per-scene auto" />
            <InspectorRow k="Easing" v="ease-in-out" />
            <InspectorRow k="Transition" v="fade 0.4s" />
          </div>
        </div>
        <div className="col-span-4 rounded bg-black/40 p-2 ring-1 ring-white/10">
          <div className="text-[10px] font-semibold uppercase text-[var(--muted)]">Data flow · Effects ← Merge</div>
          <div className="mt-1.5 space-y-1 text-[9px] font-mono">
            <div>scenes: [6 items]</div>
            <div>  0: cover.jpg, 4.2s, upload</div>
            <div>  1: context.png, 5.1s, upload</div>
            <div>  2: review.jpg, 4.8s, upload</div>
            <div>  3: gen_plan.png, 4.5s, gen</div>
            <div className="text-[var(--muted)]">  ... 2 more</div>
          </div>
        </div>
        <div className="col-span-4 rounded bg-black/40 p-2 ring-1 ring-white/10">
          <div className="text-[10px] font-semibold uppercase text-[var(--muted)]">Render queue</div>
          <div className="mt-1.5 space-y-1 text-[9px]">
            <div className="flex items-center justify-between"><span>① Script</span><span className="text-emerald-300">✓ 1.2s</span></div>
            <div className="flex items-center justify-between"><span>② Image upload</span><span className="text-emerald-300">✓ 0.3s</span></div>
            <div className="flex items-center justify-between"><span>③ Image gen</span><span className="text-emerald-300">✓ 18.4s</span></div>
            <div className="flex items-center justify-between"><span>④ TTS</span><span className="text-amber-300">⏳ 60%</span></div>
            <div className="flex items-center justify-between text-[var(--muted)]"><span>⑤ Subtitle</span><span>—</span></div>
            <div className="flex items-center justify-between text-[var(--muted)]"><span>⑥ Effects</span><span>—</span></div>
            <div className="flex items-center justify-between text-[var(--muted)]"><span>⑦ Compose</span><span>—</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
