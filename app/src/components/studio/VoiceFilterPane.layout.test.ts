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
  });

  it('row 2 keeps bulk favorites only (display/subtitle moved to row 1)', () => {
    const row2Block = voiceFilterPaneSource.slice(voiceFilterPaneSource.indexOf('row2Actions='));
    expect(row2Block).toContain('Favorites');
    expect(row2Block).not.toContain('VoiceRailColumnSettings');
    expect(row2Block).not.toContain('SubtitleRailSettings');
    expect(voiceFilterPaneSource).not.toContain('VoiceRailColumnSettings');
    expect(voiceFilterPaneSource).not.toContain('SubtitleRailSettings');
  });

  it('icon-only rail hides chip labels below 22rem', () => {
    expect(globalsCss).toContain('@container studio-voice-directory (max-width: 22rem)');
    expect(globalsCss).toContain('.studio-voice-chip-label');
  });

  it('filter and bulk triggers use NBSP-only glyph↔label spacing (no double flex gap)', () => {
    expect(globalsCss).toContain('.studio-voice-directory-frame .hub-filter-bar .hub-filter-trigger');
    expect(globalsCss).toContain('.hub-bulk-action-btn__label::before');
    expect(globalsCss).toMatch(/\.hub-filter-bar \.hub-filter-trigger[\s\S]*gap:\s*0/);
  });

  it('Audio Display uses HubDirectoryDisplayPanel without a hidden-count badge', () => {
    expect(voiceDisplaySource).toContain('HubDirectoryDisplayPanel');
    expect(voiceDisplaySource).not.toContain('hiddenCount');
    expect(voiceDisplaySource).not.toContain('LayoutGrid');
  });

  it('loads hub-inline-emoji + shell gap utilities so filter glyph/label spacing applies', () => {
    expect(globalsCss).toContain('hub-inline-emoji.css');
    expect(globalsCss).toContain('hub-shell-layout.css');
  });
});
