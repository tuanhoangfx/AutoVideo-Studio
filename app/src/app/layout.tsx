import './globals.css';
import { ClientProviders } from '@/components/workspace/ClientProviders';

export const metadata = {
  manifest: "/manifest.json",
  title: 'AutoVideo Studio',
  description: 'Create videos from existing images with the Hub theme',
  other: {
    'app-version': process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0',
  },
  icons: {
    icon: "/favicon.svg?v=c920baa4",
    shortcut: "/favicon.svg?v=c920baa4",
    apple: "/icons/tools/P0021.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="relative min-h-screen overflow-hidden">
        <div className="dot-grid-bg" aria-hidden />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
