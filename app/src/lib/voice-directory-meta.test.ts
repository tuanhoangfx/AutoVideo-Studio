import { describe, expect, it } from "vitest";
import { buildVoiceDirectoryColumns } from "./voice-directory-meta";

describe("voice directory column widths", () => {
  it("uses rem/px only (no % — hub-ui directory SSOT)", () => {
    const columns = buildVoiceDirectoryColumns();
    for (const [key, col] of Object.entries(columns)) {
      expect(col.width, `${key} width`).not.toMatch(/%$/);
      expect(col.width, `${key} width`).toMatch(/^\d+(\.\d+)?(rem|px)$/);
    }
  });

  it("attaches header hints and compact Voice width", () => {
    const columns = buildVoiceDirectoryColumns();
    expect(columns.name.headerHint?.title).toBe("Voice");
    expect(columns.name.width).toBe("7rem");
    expect(columns.locale.width).toBe("4.25rem");
  });
});
