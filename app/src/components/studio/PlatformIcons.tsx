'use client';

type Platform = 'youtube' | 'tiktok' | 'instagram';

const platformMeta: Record<Platform, { label: string; viewBox: string; path: string; className: string }> = {
  youtube: {
    label: 'YouTube',
    viewBox: '0 0 24 24',
    className: 'text-red-400',
    path: 'M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8ZM9.7 15.5v-7l6.2 3.5-6.2 3.5Z',
  },
  tiktok: {
    label: 'TikTok',
    viewBox: '0 0 24 24',
    className: 'text-cyan-300',
    path: 'M16.6 1.5c.4 3 2.1 4.8 5 5v4.1a8.5 8.5 0 0 1-5-1.6v7.1c0 4.5-3 7.4-7.2 7.4A7 7 0 0 1 2.3 17c0-4.5 3.5-7.5 8.1-7.2v4.2c-2-.3-3.7.8-3.7 2.8 0 1.7 1.2 2.8 2.8 2.8 1.8 0 2.8-1.1 2.8-3.3V1.5h4.3Z',
  },
  instagram: {
    label: 'Instagram',
    viewBox: '0 0 24 24',
    className: 'text-pink-300',
    path: 'M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8Zm4.2 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 2a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8Zm5.1-2.3a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z',
  },
};

export function PlatformIcon({ platform, size = 18 }: { platform: Platform; size?: number }) {
  const meta = platformMeta[platform];
  return (
    <svg
      aria-label={meta.label}
      role="img"
      viewBox={meta.viewBox}
      width={size}
      height={size}
      className={meta.className}
      fill="currentColor"
    >
      <path d={meta.path} />
    </svg>
  );
}
