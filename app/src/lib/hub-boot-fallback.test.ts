import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const fallbackPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../public/hub-boot-fallback.js");

describe("hub-boot-fallback desktop splash", () => {
  it("surfaces Retry and DevTools after 90s", () => {
    const src = readFileSync(fallbackPath, "utf8");
    expect(src).toContain("FINAL_TIMEOUT_MS = 90000");
    expect(src).toContain("hub-boot-devtools");
    expect(src).toContain("openDevTools");
  });
});
