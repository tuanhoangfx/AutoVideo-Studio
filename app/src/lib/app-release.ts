import pkg from '../../package.json';

/**
 * Calendar date (YYYY-MM-DD) of the latest release.
 * Keep in sync with `tool.manifest.json` → `release.updatedAt` and CHANGELOG.
 */
export const APP_RELEASE_UPDATED_AT = '2026-05-30';

/** Semver from `app/package.json` (sync with `tool.manifest.json` → `release.version`). */
export const APP_RELEASE_VERSION = pkg.version;

export function formatAppVersionLabel(): string {
  return `v${APP_RELEASE_VERSION}`;
}

/** Header / sidebar: `v0.1.9 · 30/05/2026` */
export function formatAppVersionWithUpdateDate(): string {
  return `${formatAppVersionLabel()} · ${formatReleaseDateDisplay(APP_RELEASE_UPDATED_AT)}`;
}

export function formatReleaseDateDisplay(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return isoDate;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}
