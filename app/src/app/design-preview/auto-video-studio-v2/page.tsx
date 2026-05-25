// =====================================================================
//  AutoVideo Studio — 5 SINGLE-SCREEN multi-project directions.
//
//  Brief từ user:
//    - R4 Studio Hero thiếu: Image Library, Script Gen, Keyframe Timeline,
//      Multi-project switcher
//    - Tất cả chức năng phải hiển thị TRONG 1 MÀN HÌNH
//    - Hỗ trợ nhiều project song song
//
//  Style: giữ R4 aesthetic (warm gradient + glass) cho consistency,
//  nhưng dày đặc thông tin hơn — pro tool feel.
//
//  S1 Tri-column Studio       — Sidebar trái (projects + media) + center + right
//  S2 Workspace Tabs          — Chrome-like project tabs + 3-pane + bottom timeline
//  S3 Figma Floating Panels   — Preview full-bleed, panels float di chuyển được
//  S4 Mission Control Bento   — Grid bento, mọi panel visible cùng lúc
//  S5 Quadrant Workspace      — 4-quadrant DaVinci-style + project rail trên
// =====================================================================
import Link from 'next/link';

export const dynamic = 'force-static';
export const metadata = { title: 'Design Preview · AutoVideo Studio v2' };

// ───────────────────────────────────────────────── MOCK
const PROJECTS = [
  { id: 'J260525-a3f2c1', title: 'Top 5 mẹo code AI', dur: 27.3, status: 'editing', accent: 'from-pink-500 to-orange-500' },
  { id: 'J260525-b8d11e', title: 'Tour bếp 10m²', dur: 42.0, status: 'draft', accent: 'from-blue-500 to-cyan-500' },
  { id: 'J260524-c019aa', title: 'Unboxing AirPods Pro 3', dur: 35.5, status: 'rendering', accent: 'from-emerald-500 to-teal-500' },
  { id: 'J260524-d4e5f6', title: 'Routine sáng 5h', dur: 60.0, status: 'done', accent: 'from-purple-500 to-fuchsia-500' },
];
const ACTIVE = PROJECTS[0];
const SCENES = [
  { i: 1, text: 'Bạn dành quá nhiều thời gian sửa code AI gen? Đây là 5 mẹo giúp tăng tốc.', dur: 4.2, file: 'IMG_4821.jpg', img: 'from-slate-700 to-slate-900' },
  { i: 2, text: 'Mẹo 1: Mô tả context rõ ràng — file paths, line numbers.', dur: 5.1, file: 'IMG_4822.jpg', img: 'from-blue-900 to-indigo-900' },
  { i: 3, text: 'Mẹo 2: Yêu cầu AI review từng phần trước khi sinh code dài.', dur: 4.8, file: 'IMG_4823.jpg', img: 'from-emerald-900 to-teal-900' },
  { i: 4, text: 'Mẹo 3: Dùng plan mode để chốt approach trước khi implement.', dur: 4.5, file: 'IMG_4824.jpg', img: 'from-amber-900 to-orange-900' },
  { i: 5, text: 'Mẹo 4: Lưu pattern vào memory để dùng lại sau.', dur: 4.0, file: 'IMG_4825.jpg', img: 'from-rose-900 to-pink-900' },
  { i: 6, text: 'Mẹo 5: Verify bằng cách chạy app, đừng chỉ tin tests pass.', dur: 4.7, file: 'IMG_4826.jpg', img: 'from-purple-900 to-violet-900' },
];
const LIBRARY = [
  ...SCENES.map(s => ({ name: s.file, img: s.img, used: true })),
  { name: 'IMG_4827.jpg', img: 'from-cyan-900 to-blue-900', used: false },
  { name: 'IMG_4828.jpg', img: 'from-lime-900 to-emerald-900', used: false },
  { name: 'IMG_4829.jpg', img: 'from-fuchsia-900 to-rose-900', used: false },
  { name: 'IMG_4830.jpg', img: 'from-gray-700 to-slate-800', used: false },
];
const TOTAL = SCENES.reduce((a, b) => a + b.dur, 0);

// ───────────────────────────────────────────────── PAGE
export default function StudioV2Preview() {
  return (
    <div className="space-y-12 pb-20">
      <header className="border-b border-white/10 pb-6">
        <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Design preview · v2</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Single-screen Studio</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
          R4 nâng cấp: thêm <strong className="text-white">image library</strong>, <strong className="text-white">script generator</strong>, <strong className="text-white">keyframe timeline</strong>, <strong className="text-white">multi-project switcher</strong>. Tất cả trong 1 màn hình.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          <Link href="/" className="text-[var(--muted)] hover:text-white">← Home</Link>
          <Link href="/studio" className="text-pink-300 hover:underline">Studio (R4 chosen)</Link>
          <Link href="/design-preview/auto-video-refined" className="text-[var(--muted)] hover:text-white">Refined (R1–R5)</Link>
        </div>
      </header>

      <DS id="S1" name="Tri-column Studio" lang="3 cột cố định. Left: projects + media library. Center: preview + script + keyframes. Right: scenes + voice + render. Density vừa, đọc trái-sang-phải tự nhiên.">
        <S1TriColumn />
      </DS>

      <DS id="S2" name="Workspace Tabs" lang="Chrome-style project tabs ở top → switch project nhanh. Body 3-pane (media | preview+script | properties). Keyframe timeline full-width dưới cùng.">
        <S2Tabs />
      </DS>

      <DS id="S3" name="Figma Floating Panels" lang="Preview full-bleed. Các panel (Library, Script, Keyframes, Projects) float dạng cards di chuyển được, có thể minimize. Cảm giác canvas-first.">
        <S3Floating />
      </DS>

      <DS id="S4" name="Mission Control Bento" lang="Grid bento dày đặc: 6 panel hiển thị cùng lúc — Projects strip, Preview, Library, Script, Keyframes, Properties. Mọi thứ trong tầm mắt.">
        <S4Bento />
      </DS>

      <DS id="S5" name="Quadrant Workspace" lang="DaVinci/Adobe style — 4 quadrant equal: preview · script · library · keyframes. Project rail nhỏ ở header. Symmetric, balanced, pro tool feel.">
        <S5Quadrant />
      </DS>
    </div>
  );
}

function DS({ id, name, lang, children }: any) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-xs font-semibold tracking-wider text-pink-400">{id}</span>
        <h2 className="text-xl font-semibold tracking-tight">{name}</h2>
      </div>
      <p className="max-w-3xl text-[12px] leading-relaxed text-[var(--muted)]">{lang}</p>
      <div>{children}</div>
    </section>
  );
}

// ───────────────────────────────────────────────── SHARED PRIMITIVES
function GradientBg() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0d1f] via-[#1c1419] to-[#0f0a13]" />
      <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
    </>
  );
}
function Glass({ children, className = '' }: any) {
  return <div className={`rounded-xl border border-white/10 bg-white/[.04] backdrop-blur ${className}`}>{children}</div>;
}
function PanelTitle({ children, trailing }: any) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
      <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">{children}</span>
      {trailing}
    </div>
  );
}
function ProjectChip({ p, active }: any) {
  return (
    <div className={`group flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition cursor-pointer ${active ? 'border-pink-400/60 bg-pink-500/15' : 'border-white/10 bg-white/[.03] hover:bg-white/[.06]'}`}>
      <div className={`h-2 w-2 shrink-0 rounded-full bg-gradient-to-br ${p.accent}`} />
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-[11px] font-medium">{p.title}</div>
        <div className="font-mono text-[9px] text-white/40">{p.dur}s · {p.status}</div>
      </div>
      {active && <span className="text-[10px] text-pink-300">●</span>}
    </div>
  );
}
function ImageThumb({ item, used, sel }: any) {
  return (
    <div className={`group relative aspect-video overflow-hidden rounded-md bg-gradient-to-br ${item.img} ring-1 transition cursor-grab ${sel ? 'ring-pink-400 ring-2' : used ? 'ring-emerald-400/40' : 'ring-white/10 hover:ring-white/30'}`}>
      {used && <div className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500/80 text-[9px] font-bold text-white">✓</div>}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1">
        <div className="font-mono text-[8px] text-white/80 truncate">{item.name}</div>
      </div>
    </div>
  );
}
function KeyframeRuler({ scenes, total, playhead = 40, dense = false }: any) {
  return (
    <div className={`relative w-full ${dense ? 'h-20' : 'h-16'} rounded-md bg-black/40 ring-1 ring-white/10 overflow-hidden`}>
      {/* time ruler */}
      <div className="relative h-4 border-b border-white/5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="absolute top-0 h-full border-l border-white/10" style={{ left: `${(i / 6) * 100}%` }}>
            <span className="ml-1 font-mono text-[8px] text-white/40">0:{String(Math.round((i / 6) * total)).padStart(2, '0')}</span>
          </div>
        ))}
      </div>
      {/* scene clips */}
      <div className="relative h-7 border-b border-white/5">
        {scenes.map((s: any, i: number) => {
          const cum = scenes.slice(0, i).reduce((a: number, b: any) => a + b.dur, 0);
          return (
            <div key={s.i} className={`absolute top-0.5 bottom-0.5 rounded-sm bg-gradient-to-br ${s.img} ring-1 ring-white/20`} style={{ left: `${(cum / total) * 100}%`, width: `calc(${(s.dur / total) * 100}% - 1px)` }}>
              <span className="absolute left-1 top-0 font-mono text-[8px] text-white/80 drop-shadow">S{s.i}</span>
            </div>
          );
        })}
      </div>
      {/* keyframes track */}
      <div className="relative h-7">
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
        {scenes.flatMap((s: any, i: number) => {
          const cum = scenes.slice(0, i).reduce((a: number, b: any) => a + b.dur, 0);
          const x1 = (cum / total) * 100;
          const x2 = ((cum + s.dur) / total) * 100;
          return [
            <div key={`${s.i}-a`} className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-pink-300 bg-pink-500" style={{ left: `${x1}%` }} title="zoom: 100%" />,
            <div key={`${s.i}-b`} className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-pink-300 bg-pink-500/70" style={{ left: `${x2}%` }} title="zoom: 115%" />,
          ];
        })}
      </div>
      {/* playhead */}
      <div className="absolute top-0 h-full w-0.5 bg-white" style={{ left: `${playhead}%` }}>
        <div className="absolute -top-1 -left-1.5 h-3 w-3 rotate-45 bg-white" />
      </div>
    </div>
  );
}
function HeroPreview({ scene, idx, total }: any) {
  return (
    <div className={`relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br ${scene.img} shadow-2xl shadow-black/60`}>
      <div className="absolute inset-0 grid place-items-center">
        <button className="grid h-14 w-14 place-items-center rounded-full bg-white/15 backdrop-blur-xl ring-1 ring-white/30 hover:scale-110 transition">
          <span className="ml-1 text-xl text-white">▸</span>
        </button>
      </div>
      <div className="absolute bottom-3 left-3 right-3">
        <div className="text-[9px] uppercase tracking-[0.2em] text-white/60">Scene {String(idx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</div>
        <div className="mt-1 text-sm font-medium leading-tight text-white drop-shadow line-clamp-2">{scene.text}</div>
      </div>
      <div className="absolute right-2 top-2 flex gap-1">
        <span className="rounded-full bg-black/40 px-2 py-0.5 font-mono text-[9px] text-white/80 backdrop-blur">9:16</span>
        <span className="rounded-full bg-black/40 px-2 py-0.5 font-mono text-[9px] text-white/80 backdrop-blur">1080p</span>
      </div>
    </div>
  );
}
function ScriptEditor({ compact = false }: any) {
  return (
    <div className={`space-y-1 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
      {SCENES.map((s, i) => (
        <div key={s.i} className={`group flex items-start gap-1.5 rounded px-1.5 py-1 ${i === 3 ? 'bg-pink-500/15 ring-1 ring-pink-400/40' : 'hover:bg-white/[.04]'}`}>
          <span className="mt-0.5 w-4 text-right font-mono text-[9px] text-white/40">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="leading-snug text-white/90">{s.text}</div>
            <div className="mt-0.5 font-mono text-[9px] text-white/40">{s.file} · {s.dur.toFixed(1)}s</div>
          </div>
        </div>
      ))}
    </div>
  );
}
function AIPromptBar() {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[.04] p-1.5">
      <span className="grid h-6 w-6 place-items-center rounded bg-gradient-to-br from-pink-400 to-orange-400 text-[10px] text-white">✨</span>
      <input placeholder="Mô tả video bạn muốn — AI gen script khớp ảnh..." className="flex-1 bg-transparent text-[11px] placeholder-white/40 focus:outline-none" />
      <button className="rounded bg-white/10 px-2 py-1 text-[10px] hover:bg-white/15">Gen</button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  S1 — Tri-column Studio
//  Left 220px: projects (top) + image library (bottom).
//  Center: preview + script editor + keyframes.
//  Right 280px: scenes + voice + render.
// ═════════════════════════════════════════════════════════════════════
function S1TriColumn() {
  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10">
      <GradientBg />
      <div className="relative grid grid-cols-12 gap-2 p-2">

        {/* LEFT */}
        <aside className="col-span-3 space-y-2">
          <Glass>
            <PanelTitle trailing={<button className="text-[10px] text-white/60 hover:text-white">+</button>}>Projects · {PROJECTS.length}</PanelTitle>
            <div className="space-y-1 p-2">
              {PROJECTS.map((p, i) => <ProjectChip key={p.id} p={p} active={i === 0} />)}
            </div>
          </Glass>
          <Glass>
            <PanelTitle trailing={<span className="font-mono text-[9px] text-white/40">{LIBRARY.length} files</span>}>Image Library</PanelTitle>
            <div className="grid grid-cols-2 gap-1.5 p-2">
              {LIBRARY.slice(0, 8).map((img, i) => <ImageThumb key={img.name} item={img} used={img.used} sel={i === 3} />)}
            </div>
            <button className="m-2 w-[calc(100%-1rem)] rounded-md border border-dashed border-white/20 bg-white/[.02] py-1.5 text-[10px] text-white/60 hover:bg-white/[.05]">+ Upload ảnh</button>
          </Glass>
        </aside>

        {/* CENTER */}
        <main className="col-span-6 space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 backdrop-blur">
            <div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-white/40">Editing</div>
              <div className="text-sm font-medium">{ACTIVE.title}</div>
            </div>
            <button className="rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-4 py-1.5 text-[11px] font-semibold text-white shadow-lg shadow-pink-500/30">Export ↗</button>
          </div>
          <HeroPreview scene={SCENES[3]} idx={3} total={SCENES.length} />
          <Glass>
            <PanelTitle trailing={<span className="font-mono text-[9px] text-white/40">{TOTAL.toFixed(1)}s</span>}>Keyframes · Timeline</PanelTitle>
            <div className="p-2"><KeyframeRuler scenes={SCENES} total={TOTAL} /></div>
          </Glass>
          <Glass>
            <PanelTitle trailing={<button className="text-[10px] text-pink-300 hover:underline">✨ Re-gen</button>}>Script · AI generated</PanelTitle>
            <div className="p-2 max-h-32 overflow-y-auto"><ScriptEditor /></div>
            <div className="border-t border-white/5 p-2"><AIPromptBar /></div>
          </Glass>
        </main>

        {/* RIGHT */}
        <aside className="col-span-3 space-y-2">
          <Glass>
            <PanelTitle>Voice</PanelTitle>
            <div className="flex items-center gap-2 p-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-pink-400 to-orange-400 text-sm text-white">♀</div>
              <div className="flex-1">
                <div className="text-[11px] font-medium">Hoài My</div>
                <div className="text-[10px] text-white/50">warm · vi-VN</div>
              </div>
            </div>
          </Glass>
          <Glass>
            <PanelTitle trailing={<span className="font-mono text-[9px] text-white/40">{SCENES.length}</span>}>Scenes</PanelTitle>
            <div className="max-h-56 space-y-1 overflow-y-auto p-2">
              {SCENES.map((s, i) => (
                <div key={s.i} className={`flex items-center gap-1.5 rounded p-1 ${i === 3 ? 'bg-pink-500/15' : 'hover:bg-white/[.04]'}`}>
                  <span className="w-4 text-right font-mono text-[9px] text-white/40">{i + 1}</span>
                  <div className={`h-6 w-9 rounded bg-gradient-to-br ${s.img} ring-1 ring-white/10`} />
                  <div className="min-w-0 flex-1 line-clamp-1 text-[10px]">{s.text}</div>
                  <span className="font-mono text-[9px] text-white/40">{s.dur.toFixed(1)}s</span>
                </div>
              ))}
            </div>
          </Glass>
          <Glass>
            <PanelTitle>Effect preset</PanelTitle>
            <div className="grid grid-cols-2 gap-1 p-2">
              {['Smooth', 'Cinematic', 'Subtle', 'Dynamic'].map((p, i) => (
                <button key={p} className={`rounded-md px-2 py-1.5 text-[10px] ${i === 1 ? 'bg-white text-black' : 'border border-white/10 bg-white/[.02] text-white/70 hover:bg-white/[.05]'}`}>{p}</button>
              ))}
            </div>
          </Glass>
        </aside>

      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  S2 — Workspace Tabs (Chrome-style)
//  Top: project tabs (drag-able, close-able). Body: 3-pane.
//  Bottom: full-width keyframe timeline với playhead controls.
// ═════════════════════════════════════════════════════════════════════
function S2Tabs() {
  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10">
      <GradientBg />
      <div className="relative">
        {/* Tab bar */}
        <div className="flex items-end gap-1 border-b border-white/10 bg-black/30 px-2 pt-2">
          {PROJECTS.map((p, i) => (
            <div key={p.id} className={`group flex items-center gap-2 rounded-t-lg px-3 py-1.5 transition ${i === 0 ? 'bg-white/[.08] border-t border-x border-pink-400/40' : 'bg-white/[.02] hover:bg-white/[.04]'}`}>
              <div className={`h-2 w-2 rounded-full bg-gradient-to-br ${p.accent}`} />
              <span className={`text-[11px] ${i === 0 ? 'text-white font-medium' : 'text-white/60'}`}>{p.title}</span>
              <button className="text-[10px] text-white/40 opacity-0 group-hover:opacity-100 hover:text-white">×</button>
            </div>
          ))}
          <button className="ml-1 grid h-7 w-7 place-items-center rounded text-white/50 hover:bg-white/10 hover:text-white">+</button>
          <div className="ml-auto flex items-center gap-2 pb-1">
            <span className="font-mono text-[9px] text-white/40">⌘1–4 switch</span>
            <button className="rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-4 py-1 text-[11px] font-semibold text-white">Export ↗</button>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-12 gap-2 p-2">
          {/* Media library */}
          <Glass className="col-span-3">
            <PanelTitle trailing={<button className="text-[10px] text-white/60">+</button>}>Library</PanelTitle>
            <div className="grid grid-cols-2 gap-1.5 p-2 max-h-72 overflow-y-auto">
              {LIBRARY.map((img, i) => <ImageThumb key={img.name} item={img} used={img.used} sel={i === 3} />)}
            </div>
            <div className="border-t border-white/5 p-2 text-[10px] text-white/50">
              <div className="flex justify-between"><span>{LIBRARY.length} files</span><span className="font-mono">26.4 MB</span></div>
            </div>
          </Glass>

          {/* Center: preview + script */}
          <main className="col-span-6 space-y-2">
            <HeroPreview scene={SCENES[3]} idx={3} total={SCENES.length} />
            <Glass>
              <PanelTitle trailing={<div className="flex gap-1"><button className="text-[10px] text-pink-300">✨ AI</button><span className="text-white/30">·</span><button className="text-[10px] text-white/60">Edit</button></div>}>Script</PanelTitle>
              <div className="p-2 max-h-36 overflow-y-auto"><ScriptEditor /></div>
              <div className="border-t border-white/5 p-2"><AIPromptBar /></div>
            </Glass>
          </main>

          {/* Properties */}
          <aside className="col-span-3 space-y-2">
            <Glass>
              <PanelTitle>Properties · Scene 04</PanelTitle>
              <div className="space-y-1.5 p-2 text-[10px]">
                {[
                  ['File', 'IMG_4824.jpg'],
                  ['Duration', '4.5s'],
                  ['Effect', 'Ken Burns'],
                  ['Scale', '100 → 115%'],
                  ['Position', 'center'],
                  ['Transition', 'fade 0.4s'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-white/50">{k}</span>
                    <span className="font-mono text-white/90">{v}</span>
                  </div>
                ))}
              </div>
            </Glass>
            <Glass>
              <PanelTitle>Voice & BGM</PanelTitle>
              <div className="p-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-pink-400 to-orange-400 text-[11px] text-white">♀</div>
                  <span className="text-[11px]">Hoài My</span>
                  <span className="ml-auto text-[9px] text-white/40">warm</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-white/50">BGM</span>
                  <span className="font-mono text-white/80">upbeat-corp.mp3</span>
                </div>
                <div className="text-[9px] text-white/40">Auto-ducked −12dB under voice</div>
              </div>
            </Glass>
          </aside>
        </div>

        {/* Bottom: keyframe timeline full-width */}
        <div className="border-t border-white/10 bg-black/40 p-3 backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/50">Timeline · Keyframes</div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-white/60">
              <span>00:11.2 / 00:{TOTAL.toFixed(1)}</span>
              <div className="flex gap-1">
                {['⏮', '⏪', '▸', '⏩', '⏭'].map(b => <button key={b} className="grid h-6 w-6 place-items-center rounded text-white/70 hover:bg-white/10">{b}</button>)}
              </div>
            </div>
          </div>
          <KeyframeRuler scenes={SCENES} total={TOTAL} dense />
          {/* Audio tracks */}
          <div className="mt-1.5 h-4 rounded bg-emerald-500/25 ring-1 ring-emerald-400/40 flex items-center px-2 text-[9px] text-emerald-100">🎤 voice · waveform</div>
          <div className="mt-0.5 h-3 rounded bg-blue-500/20 ring-1 ring-blue-400/30 flex items-center px-2 text-[8px] text-blue-200">🎵 BGM · ducked</div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  S3 — Figma Floating Panels
//  Preview chiếm full canvas. Các panel float dạng floating cards,
//  có thể drag, minimize. Cảm giác canvas-first / Figma.
// ═════════════════════════════════════════════════════════════════════
function S3Floating() {
  return (
    <div className="relative h-[520px] overflow-hidden rounded-2xl ring-1 ring-white/10">
      <GradientBg />
      {/* Full-bleed preview center */}
      <div className="absolute inset-0 grid place-items-center p-12">
        <div className="w-full max-w-2xl">
          <HeroPreview scene={SCENES[3]} idx={3} total={SCENES.length} />
        </div>
      </div>

      {/* TOP-LEFT: Project switcher */}
      <div className="absolute left-3 top-3 w-52 rounded-xl border border-white/15 bg-black/60 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">Projects · {PROJECTS.length}</span>
          <div className="flex gap-1 text-white/40 text-[10px]">
            <button>−</button>
            <button>+</button>
          </div>
        </div>
        <div className="space-y-1 p-2">
          {PROJECTS.map((p, i) => <ProjectChip key={p.id} p={p} active={i === 0} />)}
        </div>
      </div>

      {/* TOP-RIGHT: Properties */}
      <div className="absolute right-3 top-3 w-56 rounded-xl border border-white/15 bg-black/60 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">Scene 04 · Properties</span>
          <button className="text-white/40 text-[10px]">−</button>
        </div>
        <div className="space-y-1.5 p-2 text-[10px]">
          {[
            ['Image', 'IMG_4824.jpg'],
            ['Duration', '4.5s'],
            ['Effect', 'Ken Burns'],
            ['Scale', '100→115%'],
            ['Voice', 'Hoài My'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-white/50">{k}</span>
              <span className="font-mono text-white/90">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* LEFT: Image library */}
      <div className="absolute left-3 top-48 w-52 rounded-xl border border-white/15 bg-black/60 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">Library</span>
          <button className="text-[10px] text-pink-300">+ Upload</button>
        </div>
        <div className="grid grid-cols-3 gap-1 p-2 max-h-48 overflow-y-auto">
          {LIBRARY.map((img, i) => <ImageThumb key={img.name} item={img} used={img.used} sel={i === 3} />)}
        </div>
      </div>

      {/* RIGHT: Script */}
      <div className="absolute right-3 top-48 w-64 rounded-xl border border-white/15 bg-black/60 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">Script</span>
          <button className="text-[10px] text-pink-300">✨ AI</button>
        </div>
        <div className="p-2 max-h-44 overflow-y-auto"><ScriptEditor compact /></div>
      </div>

      {/* BOTTOM: Keyframe timeline */}
      <div className="absolute inset-x-3 bottom-3 rounded-xl border border-white/15 bg-black/70 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">Timeline · Keyframes</span>
          <div className="flex items-center gap-1.5 text-[10px] text-white/60 font-mono">
            <span>00:11.2 / 00:{TOTAL.toFixed(1)}</span>
            <button className="ml-2 rounded bg-white/10 px-1.5">▸</button>
          </div>
        </div>
        <div className="p-2"><KeyframeRuler scenes={SCENES} total={TOTAL} /></div>
      </div>

      {/* FAB: Export */}
      <button className="absolute right-72 top-3 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-4 py-1.5 text-[11px] font-semibold text-white shadow-lg shadow-pink-500/30">Export ↗</button>

      {/* Floating note */}
      <div className="absolute bottom-44 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-[10px] text-white/60 backdrop-blur ring-1 ring-white/15">
        Drag panels to rearrange · ⌘B to toggle visibility
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  S4 — Mission Control Bento
//  Grid bento, mọi panel visible cùng lúc. Dày đặc thông tin nhưng
//  có hierarchy: Preview lớn nhất, các panel secondary nhỏ hơn.
// ═════════════════════════════════════════════════════════════════════
function S4Bento() {
  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10">
      <GradientBg />
      <div className="relative p-3">
        {/* Top strip: projects */}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Active</span>
          <div className="flex flex-1 gap-1 overflow-x-auto">
            {PROJECTS.map((p, i) => (
              <button key={p.id} className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-[11px] transition ${i === 0 ? 'border-pink-400 bg-pink-500/15 text-white' : 'border-white/15 bg-white/[.03] text-white/70 hover:bg-white/[.06]'}`}>
                <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-br ${p.accent}`} />
                {p.title}
                <span className="font-mono text-[9px] text-white/40">{p.dur}s</span>
              </button>
            ))}
            <button className="grid h-7 w-7 place-items-center rounded-full border border-white/10 text-white/50 hover:bg-white/10">+</button>
          </div>
          <button className="rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-4 py-1.5 text-[11px] font-semibold text-white">Export ↗</button>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-12 grid-rows-[auto_auto_auto] gap-2">

          {/* Hero preview — col 7 row 2 */}
          <div className="col-span-7 row-span-2">
            <HeroPreview scene={SCENES[3]} idx={3} total={SCENES.length} />
          </div>

          {/* Library — col 5 row 1 */}
          <Glass className="col-span-5">
            <PanelTitle trailing={<button className="text-[10px] text-pink-300">+ Upload</button>}>Library · {LIBRARY.length}</PanelTitle>
            <div className="grid grid-cols-5 gap-1 p-2">
              {LIBRARY.slice(0, 10).map((img, i) => <ImageThumb key={img.name} item={img} used={img.used} sel={i === 3} />)}
            </div>
          </Glass>

          {/* Voice + presets — col 5 row 1 */}
          <Glass className="col-span-5">
            <PanelTitle>Voice & Effects</PanelTitle>
            <div className="grid grid-cols-2 gap-2 p-2">
              <div>
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-pink-400 to-orange-400 text-sm text-white">♀</div>
                  <div>
                    <div className="text-[11px] font-medium">Hoài My</div>
                    <div className="text-[9px] text-white/50">warm · vi-VN</div>
                  </div>
                </div>
                <div className="mt-1.5 flex h-5 items-end gap-px">
                  {Array.from({ length: 25 }).map((_, i) => <div key={i} className="w-1 bg-pink-400/40 rounded-full" style={{ height: `${30 + Math.sin(i * 0.5) * 40 + i % 5 * 5}%` }} />)}
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-white/40">Preset</div>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  {['Smooth', 'Cinematic', 'Subtle', 'Dynamic'].map((p, i) => (
                    <button key={p} className={`rounded px-1.5 py-1 text-[9px] ${i === 1 ? 'bg-white text-black' : 'border border-white/10 bg-white/[.02] text-white/70'}`}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
          </Glass>

          {/* Script — col 5 row 1 */}
          <Glass className="col-span-5">
            <PanelTitle trailing={<button className="text-[10px] text-pink-300">✨ Re-gen</button>}>Script · 6 lines</PanelTitle>
            <div className="p-2 max-h-32 overflow-y-auto"><ScriptEditor compact /></div>
          </Glass>

          {/* Keyframe timeline full-width — col 12 row 1 */}
          <Glass className="col-span-12">
            <PanelTitle trailing={
              <div className="flex items-center gap-2 font-mono text-[10px] text-white/60">
                <span>00:11.2 / 00:{TOTAL.toFixed(1)}</span>
                <div className="flex gap-1">
                  {['⏮', '▸', '⏭'].map(b => <button key={b} className="grid h-5 w-5 place-items-center rounded text-white/70 hover:bg-white/10">{b}</button>)}
                </div>
              </div>
            }>Timeline · Keyframes · Audio</PanelTitle>
            <div className="space-y-1 p-2">
              <KeyframeRuler scenes={SCENES} total={TOTAL} dense />
              <div className="h-4 rounded bg-emerald-500/25 ring-1 ring-emerald-400/40 flex items-center px-2 text-[9px] text-emerald-100">🎤 voice waveform</div>
              <div className="h-3 rounded bg-blue-500/20 ring-1 ring-blue-400/30 flex items-center px-2 text-[8px] text-blue-200">🎵 BGM · ducked</div>
            </div>
          </Glass>

        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  S5 — Quadrant Workspace
//  DaVinci/Adobe-style 4-quadrant symmetric layout. Project rail trên.
//  Q1 Preview · Q2 Script · Q3 Library · Q4 Keyframes.
// ═════════════════════════════════════════════════════════════════════
function S5Quadrant() {
  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10">
      <GradientBg />
      <div className="relative">
        {/* Project rail */}
        <header className="flex items-center justify-between border-b border-white/10 bg-black/30 px-3 py-2 backdrop-blur">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Studio</span>
            <span className="text-white/30">/</span>
            <div className="flex gap-1">
              {PROJECTS.map((p, i) => (
                <button key={p.id} className={`flex items-center gap-1.5 rounded px-2 py-1 transition ${i === 0 ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/[.05]'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-br ${p.accent}`} />
                  <span>{p.title}</span>
                </button>
              ))}
            </div>
            <button className="ml-1 grid h-6 w-6 place-items-center rounded text-white/40 hover:bg-white/10">+</button>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-full bg-white/10 px-3 py-1 text-[10px] text-white/80 backdrop-blur">⌘S Save</button>
            <button className="rounded-full bg-gradient-to-r from-pink-500 to-orange-500 px-4 py-1.5 text-[11px] font-semibold text-white shadow-lg shadow-pink-500/30">Export ↗</button>
          </div>
        </header>

        {/* 4 Quadrant grid */}
        <div className="grid grid-cols-2 grid-rows-2 gap-1 p-1">

          {/* Q1: Preview */}
          <Glass>
            <PanelTitle trailing={<span className="font-mono text-[9px] text-white/40">9:16 · 1080p</span>}>Preview</PanelTitle>
            <div className="p-2">
              <HeroPreview scene={SCENES[3]} idx={3} total={SCENES.length} />
            </div>
          </Glass>

          {/* Q2: Script + AI */}
          <Glass>
            <PanelTitle trailing={<div className="flex gap-2"><button className="text-[10px] text-pink-300">✨ AI gen</button><button className="text-[10px] text-white/50">Edit raw</button></div>}>Script · Content</PanelTitle>
            <div className="p-2 max-h-44 overflow-y-auto"><ScriptEditor /></div>
            <div className="border-t border-white/5 p-2"><AIPromptBar /></div>
          </Glass>

          {/* Q3: Library */}
          <Glass>
            <PanelTitle trailing={
              <div className="flex gap-2 text-[10px]">
                <button className="text-pink-300">+ Upload</button>
                <span className="text-white/30">·</span>
                <span className="font-mono text-white/40">{LIBRARY.length} files</span>
              </div>
            }>Image Library</PanelTitle>
            <div className="grid grid-cols-4 gap-1.5 p-2 max-h-44 overflow-y-auto">
              {LIBRARY.map((img, i) => <ImageThumb key={img.name} item={img} used={img.used} sel={i === 3} />)}
            </div>
            <div className="border-t border-white/5 px-2 py-1.5 text-[9px] text-white/50 flex justify-between">
              <span>{LIBRARY.filter(i => i.used).length} used in project</span>
              <span className="font-mono">26.4 MB</span>
            </div>
          </Glass>

          {/* Q4: Keyframes + audio */}
          <Glass>
            <PanelTitle trailing={
              <div className="flex items-center gap-2 font-mono text-[10px] text-white/60">
                <span>11.2 / {TOTAL.toFixed(1)}s</span>
                <div className="flex gap-1">
                  {['⏮', '▸', '⏭'].map(b => <button key={b} className="grid h-5 w-5 place-items-center rounded text-white/70 hover:bg-white/10">{b}</button>)}
                </div>
              </div>
            }>Keyframes · Audio</PanelTitle>
            <div className="space-y-1 p-2">
              <KeyframeRuler scenes={SCENES} total={TOTAL} />
              <div className="h-3.5 rounded bg-emerald-500/25 ring-1 ring-emerald-400/40 flex items-center px-2 text-[9px] text-emerald-100">🎤 Hoài My · waveform</div>
              <div className="h-3 rounded bg-blue-500/20 ring-1 ring-blue-400/30 flex items-center px-2 text-[8px] text-blue-200">🎵 upbeat-corp.mp3 · −12dB ducked</div>
            </div>
          </Glass>

        </div>

        {/* Footer status */}
        <footer className="flex items-center justify-between border-t border-white/10 bg-black/30 px-3 py-1.5 backdrop-blur text-[10px] text-white/50">
          <div className="flex gap-3">
            <span>✓ Auto-saved 2s ago</span>
            <span>·</span>
            <span>{SCENES.length} scenes · {LIBRARY.length} images · 89 words</span>
          </div>
          <div className="flex gap-2 font-mono">
            <span>CPU 12%</span>
            <span>·</span>
            <span>RAM 280MB</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
