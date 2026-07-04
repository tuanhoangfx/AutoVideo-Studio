import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hubUiRoot = path.join(__dirname, 'vendor/hub-ui/src/index.ts');
const hubIdentityRoot = path.join(__dirname, 'vendor/hub-identity/src/index.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@tool-workspace/hub-ui', '@tool-workspace/hub-identity'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@tool-workspace/hub-ui': hubUiRoot,
      '@tool-workspace/hub-identity': hubIdentityRoot,
    };
    return config;
  },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
  experimental: {
    turbo: {
      resolveAlias: {
        '@tool-workspace/hub-ui': hubUiRoot,
        '@tool-workspace/hub-identity': hubIdentityRoot,
      },
    },
  },
};
export default nextConfig;
