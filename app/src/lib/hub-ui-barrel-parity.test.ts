import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const barrelPath = path.join(srcRoot, "lib", "hub-ui.ts");
const displayPrefsPath = path.join(srcRoot, "components", "workspace", "StudioDisplayPrefs.tsx");

const HUB_UI_INDEX_IMPORT_RE =
  /from\s+['"]@tool-workspace\/hub-ui['"]|import\s*\(\s*['"]@tool-workspace\/hub-ui['"]\s*\)/;

function walkTs(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "vendor") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkTs(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name) && entry.name !== "hub-ui.ts") out.push(full);
  }
  return out;
}

function namedImportsFromHubUi(source: string): string[] {
  const names: string[] = [];
  const re = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]@\/lib\/hub-ui['"]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    for (const part of match[1].split(",")) {
      const token = part.replace(/\btype\b/g, "").trim();
      if (!token) continue;
      names.push(token.split(/\s+as\s+/)[0].trim());
    }
  }
  return names;
}

function barrelExportNames(source: string): Set<string> {
  const names = new Set<string>();
  const re = /export\s+(?:type\s+)?\{([^}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    for (const part of match[1].split(",")) {
      const token = part.replace(/\btype\b/g, "").trim();
      if (!token) continue;
      names.add(token.split(/\s+as\s+/)[0].trim());
    }
  }
  return names;
}

describe("P0021 hub-ui barrel", () => {
  it("re-exports every named import from @/lib/hub-ui", () => {
    const barrel = readFileSync(barrelPath, "utf8");
    const exported = barrelExportNames(barrel);
    const missing = new Set<string>();
    for (const file of walkTs(srcRoot)) {
      for (const name of namedImportsFromHubUi(readFileSync(file, "utf8"))) {
        if (!exported.has(name)) missing.add(`${name} (${path.relative(srcRoot, file)})`);
      }
    }
    expect([...missing].sort()).toEqual([]);
  });

  it("exports HubDirectorySettings in barrel (regression lock)", () => {
    const barrel = readFileSync(barrelPath, "utf8");
    expect(barrel).toContain("HubDirectorySettings");
    expect(barrelExportNames(barrel).has("HubDirectorySettings")).toBe(true);
  });

  it("StudioDisplayPrefs imports HubDirectorySettings via vendor subpath", () => {
    const src = readFileSync(displayPrefsPath, "utf8");
    expect(src).toMatch(/HubDirectorySettings.*@tool-workspace\/hub-ui\/shell\/HubDirectorySettings|from '@tool-workspace\/hub-ui\/shell\/HubDirectorySettings'/);
    expect(src).not.toMatch(/HubDirectorySettings[\s\S]*from ['"]@\/lib\/hub-ui['"]/);
  });

  it("never imports the full hub-ui package index from app/src", () => {
    const hits: string[] = [];
    for (const file of walkTs(srcRoot)) {
      if (HUB_UI_INDEX_IMPORT_RE.test(readFileSync(file, "utf8"))) {
        hits.push(path.relative(srcRoot, file).replace(/\\/g, "/"));
      }
    }
    expect(hits).toEqual([]);
  });
});
