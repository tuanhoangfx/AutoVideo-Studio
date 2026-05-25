import './globals.css';
import Link from 'next/link';
import { Boxes, Video, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'AutoVideo Studio',
  description: 'Tự động ghép video từ ảnh có sẵn — Hub theme',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen relative">
        <div className="dot-grid-bg" aria-hidden />
        <header className="relative z-10 border-b border-[var(--border-subtle)] bg-[var(--panel)]/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="brand-icon-wrap grid h-8 w-8 place-items-center rounded-lg text-white">
                <Video size={18} strokeWidth={2} />
              </span>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-white">AutoVideo <span className="text-[var(--accent-2)]">Studio</span></div>
                <div className="text-[10px] text-[var(--muted)]">P0021 · v0.3</div>
              </div>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <NavLink href="/studio" icon={<Sparkles size={14} />}>Studio</NavLink>
              <NavLink href="/" icon={<Boxes size={14} />}>Hub</NavLink>
            </nav>
          </div>
        </header>
        <main className="relative z-10 mx-auto max-w-[1600px] px-6 py-6">{children}</main>
      </body>
    </html>
  );
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[var(--muted)] hover:bg-white/[.04] hover:text-[var(--text)] transition"
    >
      {icon}
      {children}
    </Link>
  );
}
