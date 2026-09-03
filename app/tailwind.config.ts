import type { Config } from 'tailwindcss';
const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    './vendor/hub-ui/src/**/*.{ts,tsx}',
    '../../packages/hub-ui/src/**/*.{ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
};
export default config;
