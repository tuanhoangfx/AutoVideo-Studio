import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type PluginOption } from "vite";

const toolRoot = path.dirname(fileURLToPath(import.meta.url));
const productRoot = path.resolve(toolRoot, "..");
const devRoot = path.resolve(toolRoot, "../../..");
const require = createRequire(import.meta.url);
const hubUiSrc = path.resolve(toolRoot, "vendor/hub-ui/src");
const hubIdentitySrc = path.resolve(toolRoot, "vendor/hub-identity/src");

function supabaseResolve(subpath: string): string {
  const bases = [toolRoot, devRoot];
  for (const base of bases) {
    try {
      return createRequire(path.join(base, "package.json")).resolve(subpath);
    } catch {
      /* try next base */
    }
  }
  try {
    const supabaseEntry = createRequire(path.join(toolRoot, "package.json")).resolve(
      "@supabase/supabase-js",
    );
    return createRequire(supabaseEntry).resolve(subpath);
  } catch {
    throw new Error(
      `Cannot resolve ${subpath} — add it to P0021 app dependencies or run pnpm install`,
    );
  }
}

const SUPABASE_ALIASES = [
  "@supabase/supabase-js",
  "@supabase/postgrest-js",
  "@supabase/realtime-js",
  "@supabase/auth-js",
  "@supabase/storage-js",
  "@supabase/functions-js",
].map((pkg) => ({ find: pkg, replacement: supabaseResolve(pkg) }));

const hubUiVendorWatchPluginPath = path.resolve(devRoot, "Tool/scripts/hub-ui-vendor-watch-vite-plugin.mjs");
const hubUiVendorWatchPlugin = fs.existsSync(hubUiVendorWatchPluginPath)
  ? import(pathToFileURL(hubUiVendorWatchPluginPath).href).then((m) =>
      m.hubUiVendorWatchPlugin({ toolRoot: productRoot, devRoot, code: "P0021" }),
    )
  : null;

const hubAuthDevApiPluginPath = path.resolve(devRoot, "Tool/scripts/lib/hub-auth-dev-api-vite-plugin.mjs");
const hubAuthDevApiPlugin = fs.existsSync(hubAuthDevApiPluginPath)
  ? import(pathToFileURL(hubAuthDevApiPluginPath).href).then((m) =>
      m.hubAuthDevApiPlugin({ toolRoot: productRoot, devRoot, code: "P0021" }),
    )
  : null;

const hubAppVersionPluginPath = path.resolve(devRoot, "Tool/scripts/embed-app-version.mjs");
const hubAppVersionPlugin = fs.existsSync(hubAppVersionPluginPath)
  ? import(pathToFileURL(hubAppVersionPluginPath).href).then((m) =>
      m.hubAppVersionPlugin({ root: toolRoot }),
    )
  : null;

const googleDriveDevApiPath = path.resolve(toolRoot, "scripts/google-drive-dev-api.mjs");
const googleDriveDevApiPlugin = fs.existsSync(googleDriveDevApiPath)
  ? import(pathToFileURL(googleDriveDevApiPath).href).then((m) => m.googleDriveDevApiPlugin())
  : null;

export default defineConfig(async () => {
  const plugins: PluginOption[] = [
    react(),
    hubUiVendorWatchPlugin,
    hubAuthDevApiPlugin,
    hubAppVersionPlugin,
    googleDriveDevApiPlugin,
  ];

  const desktopBuild = Boolean(process.env.AUTOVIDEO_DESKTOP_BUILD);

  return {
    plugins,
    base: desktopBuild ? "./" : "/",
    appType: "spa",
    envPrefix: ["VITE_", "NEXT_PUBLIC_"],
    server: {
      host: "127.0.0.1",
      port: 3021,
      strictPort: true,
      proxy: {
        "/bgm": {
          target: "https://www.soundhelix.com/examples/mp3",
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/bgm\//, "/"),
        },
      },
      fs: {
        allow: [toolRoot, productRoot, hubUiSrc, hubIdentitySrc, devRoot],
      },
      watch: {
        ignored: ["**/dist-desktop/**", "**/../worker/dist/**", "**/.runtime/**"],
      },
      warmup: {
        clientFiles: [
          "./index.html",
          "./src/main.tsx",
          "./src/App.tsx",
          "./src/lib/app-router.tsx",
          "./src/components/workspace/ClientProviders.tsx",
          "./src/components/workspace/WorkspaceShell.tsx",
        ],
      },
    },
    optimizeDeps: {
      include: ["react", "react-dom", "lucide-react"],
      exclude: ["@tool-workspace/hub-ui", "@tool-workspace/hub-identity"],
      holdUntilCrawlEnd: false,
    },
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: [
        ...SUPABASE_ALIASES,
        { find: /^@\/(.*)$/, replacement: `${path.join(toolRoot, "src")}/$1` },
        { find: /^@tool-workspace\/hub-ui\/(.+)$/, replacement: `${hubUiSrc}/$1` },
        { find: "@tool-workspace/hub-ui", replacement: path.join(hubUiSrc, "index.ts") },
        { find: "@tool-workspace/hub-identity", replacement: path.join(hubIdentitySrc, "index.ts") },
        { find: /^@tool-workspace\/hub-identity\/(.+)$/, replacement: `${hubIdentitySrc}/$1` },
      ],
    },
    esbuild: {
      target: "es2022",
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
              return "react";
            }
            if (/[\\/]node_modules[\\/](lucide-react)[\\/]/.test(id)) {
              return "vendor";
            }
            if (id.includes("vendor/hub-ui") || id.includes("vendor\\hub-ui")) {
              return "hub-ui";
            }
            return undefined;
          },
        },
      },
    },
  };
});
