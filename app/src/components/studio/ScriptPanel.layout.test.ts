import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const scriptPanel = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'ScriptPanel.tsx'),
  'utf8',
);
const globalsCss = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'app', 'globals.css'),
  'utf8',
);

describe('script panel Note SSOT + metric chips', () => {
  it('uses HubAdmNoteEditorField instead of a resizable textarea', () => {
    expect(scriptPanel).toContain('<HubAdmNoteEditorField');
    expect(scriptPanel).toContain('fillHeight');
    expect(scriptPanel).not.toMatch(/resize-y/);
  });

  it('centers metric chips with labels and distinct tones', () => {
    expect(scriptPanel).toContain('centerSlot={');
    expect(scriptPanel).toContain('KEYFRAME_SCENE_COLUMN_STICKER.scene');
    expect(scriptPanel).toContain('tone="violet"');
    expect(scriptPanel).toContain('label="Words"');
    expect(scriptPanel).toContain('tone="amber"');
    expect(scriptPanel).toContain('durationSecondsEqual');
    expect(scriptPanel).toContain('hideExportChip');
  });

  it('kills native resize grip on script note textarea', () => {
    expect(globalsCss).toContain('.studio-script-note textarea.hub-adm-note-textarea');
    expect(globalsCss).toContain('resize: none');
  });
});
