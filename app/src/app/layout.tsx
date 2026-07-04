import './globals.css';
import { ClientProviders } from '@/components/workspace/ClientProviders';

export const metadata = {
  title: 'AutoVideo Studio',
  description: 'Create videos from existing images with the Hub theme',
  icons: {
    icon: '/icons/tools/P0021.svg',
    shortcut: '/icons/tools/P0021.svg',
    apple: '/icons/tools/P0021.svg',
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
