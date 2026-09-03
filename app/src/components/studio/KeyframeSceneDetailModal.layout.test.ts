import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'KeyframeSceneDetailModal.tsx'),
  'utf8',
);

describe('keyframe scene detail transcript Note SSOT', () => {
  it('uses HubAdmDetailNoteLineField for transcript', () => {
    expect(source).toContain('HubAdmDetailNoteLineField');
    expect(source).toContain('onChangeTranscript');
    expect(source).not.toMatch(/resize-y/);
  });
});
