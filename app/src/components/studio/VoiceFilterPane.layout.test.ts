import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const voiceFilterPaneSource = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'VoiceFilterPane.tsx'),
  'utf8',
);
const voiceDisplaySource = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'VoiceRailDisplaySettings.tsx'),
  'utf8',
);
const globalsCss = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'app', 'globals.css'),
  'utf8',
);

describe('voice filter pane searchbar layout SSOT', () => {
  it('row 1 uses searchTrailing for unified display and toolbar for voice/bgm', () => {
    expect(voiceFilterPaneSource).toContain('searchTrailing={');
    expect(voiceFilterPaneSource).toContain('<VoiceRailDisplaySettings');
    expect(voiceFilterPaneSource).toContain('toolbar={');
    expect(voiceFilterPaneSource).toContain('<HubSegmentToggle');
    expect(voiceFilterPaneSource).not.toContain('hideSearch={!voiceMode}');
    expect(voiceFilterPaneSource).toContain("shortcutScope={voiceMode ? 'voice-rail' : 'bgm-rail'}");
  });

  it('row 2 keeps icon-only favorites (+ upload on bgm)', () => {
    const row2Block = voiceFilterPaneSource.slice(voiceFilterPaneSource.indexOf('row2Actions='));
    expect(row2Block).toContain('hub-filter-chip--icon-only');
    expect(row2Block).toContain('Upload');
    expect(row2Block).not.toContain('studio-voice-chip-label');
    expect(row2Block).not.toContain('VoiceRailColumnSettings');
    expect(row2Block).not.toContain('SubtitleRailSettings');
    expect(voiceFilterPaneSource).not.toContain('VoiceRailColumnSettings');
    expect(voiceFilterPaneSource).not.toContain('SubtitleRailSettings');
  });

  it('icon-only rail hides segment toggle labels below 22rem', () => {
    expect(globalsCss).toContain('@container studio-voice-directory (max-width: 22rem)');
    expect(globalsCss).toContain('.hub-segment-toggle__label');
  });

  it('row-2 favorites/upload use icon-only chips', () => {
    expect(voiceFilterPaneSource).toContain('hub-filter-chip--icon-only');
    expect(voiceFilterPaneSource).not.toContain('studio-voice-chip-label');
  });

  it('filter triggers use hub-ui flex gap SSOT (not P0021 gap:0 override)', () => {
    expect(globalsCss).not.toMatch(/\.hub-filter-trigger[\s\S]*gap:\s*0\s*!important/);
  });

  it('Audio Display uses HubDirectoryDisplayPanel without a hidden-count badge', () => {
    expect(voiceDisplaySource).toContain('HubDirectoryDisplayPanel');
    expect(voiceDisplaySource).toContain('triggerIconOnly');
    expect(voiceDisplaySource).not.toContain('hiddenCount');
    expect(voiceDisplaySource).not.toContain('LayoutGrid');
  });

  it('loads hub-inline-emoji + shell gap utilities so filter glyph/label spacing applies', () => {
    expect(globalsCss).toContain('hub-inline-emoji.css');
    expect(globalsCss).toContain('hub-shell-layout.css');
  });
});
