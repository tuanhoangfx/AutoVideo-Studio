// =====================================================================
//  AutoVideo Studio — 5 design directions for "Create new video" flow.
//  Each variant has a DIFFERENT direction (layout pattern + interaction
//  model + info hierarchy), not just color/spacing tweaks.
//
//  V1 Wizard 4 steps      — Step-by-step (Script → Images → Voice → Render)
//  V2 Single-page form    — All sections on one scrolling page
//  V3 Storyboard timeline — Drag-drop scene cards, frame-by-frame editing
//  V4 Kanban batch        — Multiple jobs flowing across status columns
//  V5 Chat-driven         — Conversational AI gathers requirements
// =====================================================================
import Link from 'next/link';

export const dynamic = 'force-static';
export const metadata = { title: 'Design Preview · AutoVideo · 5 directions' };

// ───────────────────────────────────────────────── MOCK DATA (shared)
const MOCK = {
  topic: 'Top 5 mẹo tiết kiệm thời gian khi code với AI',
  script: [
    { i: 1, text: 'Bạn dành quá nhiều thời gian sửa code AI gen? Đây là 5 mẹo giúp tăng tốc.', dur: 4.2 },
    { i: 2, text: 'Mẹo 1: Mô tả context rõ ràng — file paths, line numbers, ý định cụ thể.', dur: 5.1 },
    { i: 3, text: 'Mẹo 2: Yêu cầu AI review từng phần trước khi sinh code dài.', dur: 4.8 },
    { i: 4, text: 'Mẹo 3: Dùng plan mode để chốt approach trước khi implement.', dur: 4.5 },
    { i: 5, text: 'Mẹo 4: Lưu pattern vào memory để dùng lại sau.', dur: 4.0 },
    { i: 6, text: 'Mẹo 5: Verify bằng cách chạy app, đừng chỉ tin tests pass.', dur: 4.7 },
  ],
  voices: [
    { id: 'vi-HoaiMy', label: 'Hoài My', gender: '♀', tone: 'warm', engine: 'edge-tts', free: true },
    { id: 'vi-NamMinh', label: 'Nam Minh', gender: '♂', tone: 'energetic', engine: 'edge-tts', free: true },
    { id: 'el-rachel', label: 'Rachel (EN)', gender: '♀', tone: 'pro', engine: 'elevenlabs', free: false },
  ],
  effects: ['ken_burns_in', 'ken_burns_out', 'pan_left', 'pan_right', 'zoom_slow', 'none'],
  transitions: ['fade', 'slide', 'cut', 'dissolve'],
  jobs: [
    { id: 'J260525-a3f2c1', topic: 'Top 5 mẹo code AI', status: 'rendering', progress: 67 },
    { id: 'J260525-b8d11e', topic: 'Tour bếp 10m² tối ưu', status: 'queued', progress: 0 },
    { id: 'J260524-c019aa', topic: 'Unboxing AirPods Pro 3', status: 'done', progress: 100 },
    { id: 'J260524-d4e5f6', topic: 'Routine sáng 5h dậy', status: 'tts', progress: 42 },
    { id: 'J260523-e7a8b9', topic: 'Review Macbook M5', status: 'done', progress: 100 },
  ],
};
const STATUS_LABEL: Record<string, string> = {
  draft: '📝 Nháp',
  script: '✍️ Script',
  images: '🖼 Ảnh',
  tts: '🎤 Voice',
  rendering: '🎬 Render',
  queued: '⏳ Queue',
  done: '✅ Xong',
  error: '❌ Lỗi',
};
const STATUS_TONE: Record<string, string> = {
  draft: 'slate', script: 'indigo', images: 'purple', tts: 'cyan',
  rendering: 'amber', queued: 'slate', done: 'emerald', error: 'rose',
};

// ───────────────────────────────────────────────── PAGE
export default function DesignPreview() {
  return (
    <div className="space-y-10 pb-16">
      <header className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold">AutoVideo Studio · 5 design directions</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          5 variant khác <strong>direction</strong> (layout pattern + interaction model + info hierarchy), không chỉ tweak màu/spacing.
          Chọn 1 mẫu rồi promote vào <code className="rounded bg-white/10 px-1.5 py-0.5">/projects/new</code>.
        </p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          <Link href="/" className="text-indigo-300 hover:underline">← Home</Link>
          <Link href="/design-preview/auto-video-pro" className="text-rose-300 hover:underline">→ Pro Editor (P1–P5)</Link>
          <Link href="/design-preview/auto-video-hybrid" className="text-emerald-300 hover:underline">→ Hybrid (H1–H5)</Link>
        </div>
      </header>

      <DS num="V1" title="Wizard 4 bước" lang="Step-by-step linear flow (Script → Images → Voice → Render). Best cho user mới, ít overwhelm.">
        <V1Wizard />
      </DS>

      <DS num="V2" title="Single-page form" lang="Tất cả sections trên 1 page, cuộn dọc. Best cho power user muốn xem toàn bộ context 1 lúc.">
        <V2SinglePage />
      </DS>

      <DS num="V3" title="Storyboard timeline" lang="Mỗi scene = 1 card kéo thả ngang theo timeline. Best để chỉnh từng frame, khớp voice + ảnh.">
        <V3Storyboard />
      </DS>

      <DS num="V4" title="Kanban batch" lang="Nhiều job song song, mỗi cột = 1 status. Best cho creator chạy batch nhiều video/ngày.">
        <V4Kanban />
      </DS>

      <DS num="V5" title="Chat-driven" lang="AI chat hỏi từng requirement (topic, style, voice, length...) rồi auto-gen. Best cho người không biết bắt đầu từ đâu.">
        <V5Chat />
      </DS>
    </div>
  );
}

function DS({ num, title, lang, children }: any) {
  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-500/20 text-base font-bold text-indigo-200 ring-1 ring-indigo-500/40">{num}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-tight">{title}</h2>
          <p className="text-xs text-indigo-300/80">{lang}</p>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/40 p-3">{children}</div>
    </section>
  );
}

// ───────────────────────────────────────────────── PRIMITIVES
const TONE: Record<string, string> = {
  indigo:  'bg-indigo-500/15  text-indigo-200  border-indigo-400/30',
  emerald: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30',
  cyan:    'bg-cyan-500/15    text-cyan-200    border-cyan-400/30',
  purple:  'bg-purple-500/15  text-purple-200  border-purple-400/30',
  amber:   'bg-amber-500/15   text-amber-200   border-amber-400/30',
  rose:    'bg-rose-500/15    text-rose-200    border-rose-400/30',
  slate:   'bg-slate-500/15   text-slate-200   border-slate-400/30',
};
const GLOW: Record<string, string> = {
  indigo:  'from-indigo-500/15  via-indigo-500/5  border-indigo-400/30',
  emerald: 'from-emerald-500/15 via-emerald-500/5 border-emerald-400/30',
  cyan:    'from-cyan-500/15    via-cyan-500/5    border-cyan-400/30',
  purple:  'from-purple-500/15  via-purple-500/5  border-purple-400/30',
  amber:   'from-amber-500/15   via-amber-500/5   border-amber-400/30',
  rose:    'from-rose-500/15    via-rose-500/5    border-rose-400/30',
  slate:   'from-slate-500/15   via-slate-500/5   border-slate-400/30',
};
function Glass({ tone = 'indigo', label, children, className = '' }: any) {
  return (
    <section className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${GLOW[tone]} to-transparent p-3 backdrop-blur ${className}`}>
      {label && <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</div>}
      {children}
    </section>
  );
}
function Pill({ children, tone = 'indigo', size = 'sm' }: any) {
  const sz = size === 'lg' ? 'text-sm px-3 py-1.5' : size === 'xs' ? 'text-[10px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1';
  return <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${TONE[tone]} ${sz}`}>{children}</span>;
}
function Btn({ children, variant = 'primary', className = '' }: any) {
  const map: Record<string, string> = {
    primary: 'bg-indigo-500/30 text-indigo-100 ring-1 ring-indigo-500/40 hover:bg-indigo-500/40',
    ghost: 'bg-white/5 text-[var(--muted)] hover:bg-white/10',
    danger: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
  };
  return <button className={`rounded-md px-3 py-1.5 text-[11px] font-medium transition ${map[variant]} ${className}`}>{children}</button>;
}
function Input({ value, placeholder = '', mono = false }: any) {
  return (
    <input defaultValue={value} placeholder={placeholder}
      className={`w-full rounded-md border border-white/10 bg-white/[.03] px-2 py-1.5 text-[11px] ${mono ? 'font-mono' : ''}`} />
  );
}
function TA({ value, rows = 3 }: any) {
  return <textarea defaultValue={value} rows={rows} className="w-full resize-none rounded-md border border-white/10 bg-white/[.03] px-2 py-1.5 text-[11px] leading-relaxed" />;
}
function L({ label, hint, children }: any) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 flex items-center gap-1 text-[10px] font-medium text-[var(--muted)]">
        {label}{hint && <span className="text-[9px] opacity-50">· {hint}</span>}
      </span>
      {children}
    </label>
  );
}
function ProgressBar({ pct, tone = 'indigo' }: any) {
  const barTone: Record<string, string> = {
    indigo: 'bg-indigo-400', emerald: 'bg-emerald-400', amber: 'bg-amber-400', cyan: 'bg-cyan-400',
  };
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[.06]">
      <div className={`h-full transition-all ${barTone[tone] || 'bg-indigo-400'}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
function ImgPlaceholder({ label, accent = 'from-indigo-500/30 to-purple-500/30', source }: any) {
  return (
    <div className={`relative grid h-20 w-full place-items-center rounded-md bg-gradient-to-br ${accent} ring-1 ring-white/10`}>
      <span className="text-2xl opacity-70">🖼</span>
      <span className="absolute bottom-1 left-1 rounded bg-black/40 px-1 py-0.5 text-[8px] uppercase">{source === 'gen' ? '🤖 gen' : '📤 upload'}</span>
      {label && <span className="absolute right-1 top-1 rounded bg-black/40 px-1 py-0.5 text-[8px]">{label}</span>}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  V1 — Wizard 4 bước
//  Top: stepper (1 → 2 → 3 → 4). Body: chỉ hiện step hiện tại (step 2).
//  Bottom: Back / Next.
// ═════════════════════════════════════════════════════════════════════
function V1Wizard() {
  const steps = [
    { i: 1, label: 'Script', icon: '✍️', done: true },
    { i: 2, label: 'Images', icon: '🖼', done: false, active: true },
    { i: 3, label: 'Voice', icon: '🎤', done: false },
    { i: 4, label: 'Render', icon: '🎬', done: false },
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-4 rounded-xl border border-white/10 bg-[var(--surface)]/40 p-5">
      {/* Stepper */}
      <div className="flex items-center justify-between">
        {steps.map((s, idx) => (
          <div key={s.i} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold ring-2 ${
                s.active ? 'bg-indigo-500 text-white ring-indigo-300' :
                s.done ? 'bg-emerald-500/30 text-emerald-200 ring-emerald-500/40' :
                'bg-white/5 text-[var(--muted)] ring-white/10'
              }`}>{s.done ? '✓' : s.i}</div>
              <div className="text-[10px] font-medium">{s.icon} {s.label}</div>
            </div>
            {idx < steps.length - 1 && (
              <div className={`mx-2 h-0.5 flex-1 ${s.done ? 'bg-emerald-500/50' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 2: Images — 2 nguồn ảnh */}
      <Glass tone="purple" label="🖼 Bước 2 / 4 — Chọn nguồn ảnh">
        <div className="grid grid-cols-2 gap-3">
          {/* Source A: Upload */}
          <div className="rounded-lg border-2 border-dashed border-white/15 bg-white/[.02] p-3 hover:border-indigo-400/50">
            <div className="text-center">
              <div className="text-3xl">📤</div>
              <div className="mt-1 text-sm font-semibold">Upload ảnh có sẵn</div>
              <div className="text-[10px] text-[var(--muted)]">Kéo thả / chọn file · PNG, JPG, WebP</div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <ImgPlaceholder source="upload" label="1" accent="from-blue-500/30 to-cyan-500/30" />
              <ImgPlaceholder source="upload" label="2" accent="from-pink-500/30 to-rose-500/30" />
              <ImgPlaceholder source="upload" label="3" accent="from-amber-500/30 to-orange-500/30" />
            </div>
          </div>
          {/* Source B: Gen */}
          <div className="rounded-lg border-2 border-dashed border-indigo-400/40 bg-indigo-500/[.05] p-3">
            <div className="text-center">
              <div className="text-3xl">🤖</div>
              <div className="mt-1 text-sm font-semibold">Auto-gen bằng AI</div>
              <div className="text-[10px] text-[var(--muted)]">SD local / DALL·E / Flux · 1 ảnh/scene</div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <ImgPlaceholder source="gen" label="S1" accent="from-purple-500/30 to-indigo-500/30" />
              <ImgPlaceholder source="gen" label="S2" accent="from-emerald-500/30 to-teal-500/30" />
              <ImgPlaceholder source="gen" label="S3" accent="from-violet-500/30 to-fuchsia-500/30" />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className="text-[var(--muted)]">Model:</span>
              <select className="rounded bg-white/5 px-2 py-1 text-[10px]"><option>Stable Diffusion XL</option><option>DALL·E 3</option><option>Flux Schnell</option></select>
            </div>
          </div>
        </div>
        <div className="mt-3 rounded-md bg-amber-500/10 px-3 py-2 text-[10px] text-amber-200 ring-1 ring-amber-500/30">
          💡 Có thể <strong>mix</strong>: upload 3 ảnh đầu + gen 3 ảnh còn lại. Số ảnh = số scene ({MOCK.script.length}).
        </div>
      </Glass>

      {/* Nav */}
      <div className="flex items-center justify-between">
        <Btn variant="ghost">← Back · Script</Btn>
        <div className="text-[10px] text-[var(--muted)]">Step 2 of 4</div>
        <Btn>Next · Voice →</Btn>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  V2 — Single-page form
//  Mọi section trên 1 trang dài. Sticky CTA "Render" ở dưới.
// ═════════════════════════════════════════════════════════════════════
function V2SinglePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-3 rounded-xl border border-white/10 bg-[var(--surface)]/40 p-5">
      {/* Section 1: Topic + Script */}
      <Glass tone="indigo" label="① ✍️ Nội dung">
        <div className="grid grid-cols-3 gap-2">
          <L label="Topic" hint="1 câu mô tả video"><Input value={MOCK.topic} /></L>
          <L label="Độ dài"><select className="w-full rounded-md border border-white/10 bg-white/[.03] px-2 py-1.5 text-[11px]"><option>30s (Short)</option><option>60s</option><option>3 phút</option></select></L>
          <L label="LLM"><select className="w-full rounded-md border border-white/10 bg-white/[.03] px-2 py-1.5 text-[11px]"><option>Gemini Flash</option><option>GPT-4o-mini</option><option>Ollama local</option></select></L>
          <L label="Script (đã gen)" hint={`${MOCK.script.length} scenes`}>
            <TA value={MOCK.script.map(s => `${s.i}. ${s.text}`).join('\n')} rows={5} />
          </L>
        </div>
      </Glass>

      {/* Section 2: Images — toggle source per scene */}
      <Glass tone="purple" label="② 🖼 Ảnh (mỗi scene)">
        <div className="grid grid-cols-6 gap-1.5">
          {MOCK.script.map((s, i) => (
            <div key={s.i} className="space-y-1">
              <ImgPlaceholder source={i < 3 ? 'upload' : 'gen'} label={`S${s.i}`} accent={i % 2 ? 'from-purple-500/30 to-indigo-500/30' : 'from-emerald-500/30 to-cyan-500/30'} />
              <div className="flex justify-center gap-1">
                <button className={`rounded px-1.5 py-0.5 text-[8px] ${i < 3 ? 'bg-blue-500/30 text-blue-200' : 'bg-white/5 text-[var(--muted)]'}`}>📤</button>
                <button className={`rounded px-1.5 py-0.5 text-[8px] ${i >= 3 ? 'bg-purple-500/30 text-purple-200' : 'bg-white/5 text-[var(--muted)]'}`}>🤖</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-[10px] text-[var(--muted)]">
          Toggle 📤 = upload · 🤖 = gen. Default 3 đầu upload, 3 sau auto-gen.
        </div>
      </Glass>

      {/* Section 3: Voice */}
      <Glass tone="cyan" label="③ 🎤 Voice">
        <div className="grid grid-cols-3 gap-2">
          {MOCK.voices.map(v => (
            <label key={v.id} className={`relative cursor-pointer rounded-md border p-2 text-[11px] ${v.id === 'vi-HoaiMy' ? 'border-cyan-400/60 bg-cyan-500/10' : 'border-white/10 bg-white/[.02] hover:border-white/20'}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">{v.gender} {v.label}</span>
                {v.free && <span className="rounded bg-emerald-500/20 px-1 py-0 text-[8px] text-emerald-300">FREE</span>}
              </div>
              <div className="text-[9px] text-[var(--muted)]">{v.engine} · {v.tone}</div>
            </label>
          ))}
        </div>
      </Glass>

      {/* Section 4: Effects */}
      <Glass tone="amber" label="④ ✨ Hiệu ứng + transition">
        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <L label="Effect (mỗi ảnh)">
            <div className="flex flex-wrap gap-1">
              {MOCK.effects.map(e => <Pill key={e} tone={e === 'ken_burns_in' ? 'amber' : 'slate'} size="xs">{e}</Pill>)}
            </div>
          </L>
          <L label="Transition giữa scene">
            <div className="flex flex-wrap gap-1">
              {MOCK.transitions.map(t => <Pill key={t} tone={t === 'fade' ? 'amber' : 'slate'} size="xs">{t}</Pill>)}
            </div>
          </L>
        </div>
      </Glass>

      {/* Section 5: Output */}
      <Glass tone="emerald" label="⑤ 🎬 Output">
        <div className="grid grid-cols-4 gap-2">
          <L label="Aspect"><select className="w-full rounded-md border border-white/10 bg-white/[.03] px-2 py-1.5 text-[11px]"><option>9:16 (Shorts)</option><option>16:9</option><option>1:1</option></select></L>
          <L label="FPS"><select className="w-full rounded-md border border-white/10 bg-white/[.03] px-2 py-1.5 text-[11px]"><option>30</option><option>24</option><option>60</option></select></L>
          <L label="Quality"><select className="w-full rounded-md border border-white/10 bg-white/[.03] px-2 py-1.5 text-[11px]"><option>1080p</option><option>720p</option><option>4K</option></select></L>
          <L label="BGM"><Input value="upbeat-corp.mp3" /></L>
        </div>
      </Glass>

      {/* Sticky CTA */}
      <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center justify-between border-t border-white/10 bg-[var(--surface)] px-5 py-3 backdrop-blur">
        <div className="text-[11px] text-[var(--muted)]">Ước tính render: <strong className="text-white">~2 phút</strong> · 6 scenes · 27s video</div>
        <div className="flex gap-2">
          <Btn variant="ghost">Lưu nháp</Btn>
          <Btn>🎬 Render ngay</Btn>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  V3 — Storyboard timeline
//  Mỗi scene là 1 card to, sắp ngang, có thể kéo thả. Hiện rõ:
//  ảnh + câu thoại + duration + effect. Timeline ruler ở dưới.
// ═════════════════════════════════════════════════════════════════════
function V3Storyboard() {
  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-[var(--surface)]/40 p-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[var(--muted)]">Topic</div>
          <div className="truncate text-sm font-semibold">{MOCK.topic}</div>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <Pill tone="emerald" size="xs">✅ Script: 6 scenes</Pill>
          <Pill tone="cyan" size="xs">🎤 Voice: Hoài My</Pill>
          <Pill tone="amber" size="xs">⏱ Total: 27.3s</Pill>
        </div>
        <Btn>🎬 Render</Btn>
      </div>

      {/* Storyboard scrollable */}
      <div className="overflow-x-auto">
        <div className="flex gap-2 pb-2" style={{ minWidth: 'max-content' }}>
          {MOCK.script.map((s, i) => {
            const source = i < 3 ? 'upload' : 'gen';
            const tone = source === 'upload' ? 'cyan' : 'purple';
            return (
              <div key={s.i} className={`w-44 shrink-0 rounded-lg border bg-gradient-to-b ${GLOW[tone]} to-transparent p-2`}>
                {/* Scene header */}
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold">#{s.i}</span>
                  <span className="text-[10px] font-mono text-[var(--muted)]">{s.dur.toFixed(1)}s</span>
                </div>
                {/* Image */}
                <ImgPlaceholder source={source} accent={`from-${source === 'upload' ? 'cyan' : 'purple'}-500/30 to-${source === 'upload' ? 'blue' : 'indigo'}-500/30`} />
                {/* Text */}
                <div className="mt-1.5 text-[10px] leading-tight line-clamp-3 text-[var(--text)]/90">
                  {s.text}
                </div>
                {/* Effect chips */}
                <div className="mt-1.5 flex flex-wrap gap-0.5">
                  <Pill tone="amber" size="xs">{i % 2 ? 'pan_R' : 'ken_in'}</Pill>
                  <Pill tone="slate" size="xs">fade</Pill>
                </div>
                {/* Actions */}
                <div className="mt-1.5 flex gap-1">
                  <button className="flex-1 rounded bg-white/5 py-1 text-[9px] hover:bg-white/10">🔄 Swap</button>
                  <button className="flex-1 rounded bg-white/5 py-1 text-[9px] hover:bg-white/10">✏️ Edit</button>
                </div>
              </div>
            );
          })}
          {/* Add scene */}
          <button className="grid w-32 shrink-0 place-items-center rounded-lg border-2 border-dashed border-white/15 text-[var(--muted)] hover:border-indigo-400/50 hover:text-indigo-300">
            <div className="text-center">
              <div className="text-2xl">+</div>
              <div className="text-[10px]">Add scene</div>
            </div>
          </button>
        </div>
      </div>

      {/* Timeline ruler */}
      <Glass tone="slate" label="⏱ Timeline (khớp voice timing)">
        <div className="relative h-12 rounded bg-black/40">
          {(() => {
            const total = MOCK.script.reduce((a, b) => a + b.dur, 0);
            let cum = 0;
            return MOCK.script.map((s, i) => {
              const left = (cum / total) * 100;
              const width = (s.dur / total) * 100;
              cum += s.dur;
              const colors = ['bg-cyan-500/30', 'bg-blue-500/30', 'bg-indigo-500/30', 'bg-purple-500/30', 'bg-fuchsia-500/30', 'bg-pink-500/30'];
              return (
                <div key={s.i} className={`absolute top-1 bottom-1 ${colors[i]} rounded ring-1 ring-white/20`}
                  style={{ left: `${left}%`, width: `${width}%` }}>
                  <div className="px-1 text-[9px] font-bold leading-tight">#{s.i}</div>
                  <div className="px-1 text-[8px] font-mono opacity-70">{s.dur.toFixed(1)}s</div>
                </div>
              );
            });
          })()}
        </div>
        <div className="mt-1 flex justify-between text-[9px] font-mono text-[var(--muted)]">
          <span>0:00</span><span>0:09</span><span>0:18</span><span>0:27</span>
        </div>
      </Glass>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  V4 — Kanban batch
//  4 cột: Queue · Processing · Review · Done. Cards = jobs.
// ═════════════════════════════════════════════════════════════════════
function V4Kanban() {
  const cols = [
    { id: 'queued', label: '⏳ Queue', tone: 'slate', jobs: MOCK.jobs.filter(j => j.status === 'queued') },
    { id: 'processing', label: '🎬 Processing', tone: 'amber', jobs: MOCK.jobs.filter(j => ['rendering', 'tts', 'images', 'script'].includes(j.status)) },
    { id: 'review', label: '👀 Review', tone: 'cyan', jobs: [] },
    { id: 'done', label: '✅ Done', tone: 'emerald', jobs: MOCK.jobs.filter(j => j.status === 'done') },
  ];
  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-[var(--surface)]/40 p-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Batch pipeline</h3>
          <div className="text-[10px] text-[var(--muted)]">5 jobs · 2 đang chạy · 2 done</div>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="ghost">⚙️ Concurrency: 2</Btn>
          <Btn>+ New batch</Btn>
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-4 gap-2">
        {cols.map(col => (
          <div key={col.id} className={`rounded-lg border ${TONE[col.tone]} p-2`}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold">{col.label}</span>
              <span className="rounded bg-white/10 px-1.5 py-0 text-[9px]">{col.jobs.length}</span>
            </div>
            <div className="space-y-1.5">
              {col.jobs.map(j => (
                <div key={j.id} className="rounded-md border border-white/10 bg-black/40 p-2 transition hover:border-white/20">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-[var(--muted)]">{j.id}</span>
                    <Pill tone={STATUS_TONE[j.status]} size="xs">{STATUS_LABEL[j.status]}</Pill>
                  </div>
                  <div className="mt-1 line-clamp-2 text-[11px] font-medium">{j.topic}</div>
                  {j.progress > 0 && j.progress < 100 && (
                    <div className="mt-1.5 space-y-0.5">
                      <ProgressBar pct={j.progress} tone={STATUS_TONE[j.status] as any} />
                      <div className="text-right text-[8px] font-mono text-[var(--muted)]">{j.progress}%</div>
                    </div>
                  )}
                  {j.status === 'done' && (
                    <button className="mt-1.5 w-full rounded bg-emerald-500/20 py-1 text-[9px] text-emerald-200">▶ Preview MP4</button>
                  )}
                </div>
              ))}
              {col.jobs.length === 0 && (
                <div className="rounded-md border border-dashed border-white/10 py-4 text-center text-[10px] text-[var(--muted)]/50">empty</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Stats footer */}
      <Glass tone="indigo" label="📊 Stats hôm nay">
        <div className="grid grid-cols-4 gap-3 text-center">
          <Stat label="Jobs created" value="12" />
          <Stat label="Avg render" value="2m 14s" />
          <Stat label="Success rate" value="92%" />
          <Stat label="Storage used" value="1.4 GB" />
        </div>
      </Glass>
    </div>
  );
}
function Stat({ label, value }: any) {
  return (
    <div>
      <div className="text-base font-bold tabular-nums">{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-[var(--muted)]">{label}</div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  V5 — Chat-driven
//  Conversational UI: AI hỏi từng câu, user trả lời, preview live ở phải.
// ═════════════════════════════════════════════════════════════════════
function V5Chat() {
  const msgs = [
    { who: 'ai', text: '👋 Chào bạn! Mình giúp bạn ghép video nhé. Bạn muốn làm video về chủ đề gì?' },
    { who: 'user', text: 'Top 5 mẹo tiết kiệm thời gian khi code với AI' },
    { who: 'ai', text: 'Hay đó! Video dài cỡ bao nhiêu giây bạn nhỉ? (30s / 60s / 3 phút)' },
    { who: 'user', text: '30 giây cho TikTok' },
    { who: 'ai', text: 'OK. Ảnh thì bạn muốn:\n  📤 Upload sẵn\n  🤖 Mình tự gen bằng AI\n  ⚡ Mix cả 2', sug: ['📤 Upload', '🤖 Gen AI', '⚡ Mix cả 2'] },
    { who: 'user', text: '⚡ Mix cả 2' },
    { who: 'ai', text: 'Got it! Giọng đọc: nữ trẻ ấm áp (Hoài My) hay nam khoẻ khoắn (Nam Minh)?', sug: ['♀ Hoài My', '♂ Nam Minh'] },
  ];
  return (
    <div className="grid grid-cols-5 gap-3 rounded-xl border border-white/10 bg-[var(--surface)]/40 p-4">
      {/* Chat (3/5) */}
      <div className="col-span-3 flex h-[420px] flex-col rounded-lg border border-white/10 bg-black/30">
        <div className="border-b border-white/10 px-3 py-2 text-[11px] font-semibold">🤖 AutoVideo AI</div>
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.who === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-1.5 text-[11px] whitespace-pre-line ${
                m.who === 'user' ? 'bg-indigo-500/30 text-indigo-100' : 'bg-white/[.06] text-[var(--text)]'
              }`}>
                {m.text}
                {m.sug && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.sug.map(s => (
                      <button key={s} className="rounded-full border border-indigo-400/40 bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-200 hover:bg-indigo-500/40">{s}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 p-2">
          <div className="flex gap-1">
            <input placeholder="Trả lời..." className="flex-1 rounded-md border border-white/10 bg-white/[.03] px-3 py-1.5 text-[11px]" />
            <Btn>↑</Btn>
          </div>
        </div>
      </div>

      {/* Live preview (2/5) */}
      <div className="col-span-2 space-y-2">
        <Glass tone="indigo" label="📋 Đang dựng">
          <div className="space-y-1.5 text-[10px]">
            <Row k="Topic" v="Top 5 mẹo code AI" tone="emerald" />
            <Row k="Length" v="30s" tone="emerald" />
            <Row k="Image source" v="⚡ Mix" tone="emerald" />
            <Row k="Voice" v="Đang chọn..." tone="amber" />
            <Row k="BGM" v="—" tone="slate" />
            <Row k="Aspect" v="9:16" tone="slate" />
          </div>
        </Glass>
        <Glass tone="purple" label="🎬 Preview (live)">
          <div className="grid h-32 place-items-center rounded bg-gradient-to-br from-purple-500/20 to-indigo-500/20 ring-1 ring-white/10">
            <div className="text-center">
              <div className="text-3xl opacity-50">📺</div>
              <div className="text-[10px] text-[var(--muted)]">Sẽ render sau khi đủ thông tin</div>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-[var(--muted)]">
            Còn <strong>2 câu hỏi</strong> nữa → bấm 🎬 để gen.
          </div>
        </Glass>
        <Btn className="w-full" variant="ghost">⏭ Bỏ qua các câu sau, dùng default</Btn>
      </div>
    </div>
  );
}
function Row({ k, v, tone }: any) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[var(--muted)]">{k}</span>
      <Pill tone={tone} size="xs">{v}</Pill>
    </div>
  );
}
