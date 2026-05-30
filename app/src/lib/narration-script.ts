/** Single narration track — independent of per-scene / per-image text slots. */

export function resolveNarrationScript(scriptText: string, fallbackJoined = ''): string {
  const primary = scriptText.trim();
  if (primary) return primary;
  return fallbackJoined.trim();
}
