import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const hubDirectoryTableCss = readFileSync(
  path.resolve(here, '../../../../../packages/hub-ui/src/styles/hub-directory-table.css'),
  'utf8',
);

describe('voice directory header glyph spacing', () => {
  it('inherits hub-ui NBSP-only emoji header SSOT (no P0021 globals override)', () => {
    const globalsCss = readFileSync(path.resolve(here, '../app/globals.css'), 'utf8');
    expect(hubDirectoryTableCss).toContain('thead th:has(.hub-users-th-emoji) .hub-users-th-heading');
    expect(hubDirectoryTableCss).toMatch(
      /thead th:has\(\.hub-users-th-emoji\)[\s\S]*?gap:\s*0;/,
    );
    expect(globalsCss).not.toContain(
      'studio-voice-rail-table thead th:has(.hub-users-th-emoji)',
    );
  });
});
