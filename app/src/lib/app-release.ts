/**
 * P0021 AutoVideo version clock — hub-ui `resolveHubProductVersionMeta` SSOT
 * (card: hub-version-clock-ssot).
 */
import { resolveHubProductVersionMeta } from "../../vendor/hub-ui/src/lib/hub-product-version-meta";
import type { ToolManifestReleaseSlice } from "../../vendor/hub-ui/src/lib/app-version-release-meta";
import pkg from "../../package.json";
import toolManifest from "../../../tool.manifest.json";

/**
 * Calendar date (YYYY-MM-DD) fallback when clock sources are empty.
 * Keep in sync with `tool.manifest.json` → `release.updatedAt` and CHANGELOG.
 */
export const APP_RELEASE_UPDATED_AT = "2026-05-30";

/** Semver from `app/package.json` (sync with `tool.manifest.json` → `release.version`). */
export const APP_RELEASE_VERSION = pkg.version;

function readBuiltAtIso(): string | undefined {
  const raw =
    typeof import.meta !== "undefined"
      ? (import.meta as ImportMeta & { env?: { VITE_APP_BUILT_AT?: string } }).env?.VITE_APP_BUILT_AT
      : undefined;
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

export function autoVideoHostVersionMeta() {
  return resolveHubProductVersionMeta({
    appVersion: APP_RELEASE_VERSION,
    releaseNotesCode: "P0021",
    manifest: toolManifest as ToolManifestReleaseSlice,
    builtAtIso: readBuiltAtIso(),
  });
}

/** Same clock contract as P0003 `stealthVersionClockInput` — for `buildConsoleVersionMetaItems`. */
export function autoVideoVersionClockInput() {
  return {
    builtAtIso: readBuiltAtIso(),
  };
}

export function formatAppVersionLabel(): string {
  return autoVideoHostVersionMeta().line;
}

/** Header / sidebar: `v0.1.9 · 30/05/2026` */
export function formatAppVersionWithUpdateDate(): string {
  const meta = autoVideoHostVersionMeta();
  const day =
    (meta.publishedAt && formatReleaseDateDisplay(meta.publishedAt.slice(0, 10))) ||
    formatReleaseDateDisplay(APP_RELEASE_UPDATED_AT);
  return `${meta.line} · ${day}`;
}

export function formatReleaseDateDisplay(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}
