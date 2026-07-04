import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hubUiRoot = path.join(__dirname, 'vendor/hub-ui/src/index.ts');
const hubIdentityRoot = path.join(__dirname, 'vendor/hub-identity/src/index.ts');
const pkg = JSON.parse(readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
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
