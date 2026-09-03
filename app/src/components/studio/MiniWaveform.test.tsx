import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MiniWaveform, pseudoWaveform, silentWaveform } from './MiniWaveform';

describe('MiniWaveform', () => {
  it('paints a smooth filled envelope path (not chunky bar stubs)', () => {
    const html = renderToStaticMarkup(<MiniWaveform values={pseudoWaveform('hello world speech', 64)} />);
    expect(html).toContain('studio-mini-waveform');
    expect(html).toContain('<svg');
    expect(html).toContain('<path');
    expect(html).toContain('h-1.5');
    expect(html).toContain('w-full min-w-0');
    expect(html).not.toContain('max-w-');
    expect(html).not.toContain('<rect');
  });

  it('marks silent variant rows with muted class', () => {
    const html = renderToStaticMarkup(
      <MiniWaveform variant="silent" values={silentWaveform(64)} />,
    );
    expect(html).toContain('studio-mini-waveform--silent');
  });

  it('renders partial export clip with amber + trim divider', () => {
    const html = renderToStaticMarkup(
      <MiniWaveform
        variant="partial"
        partialClipRatio={0.55}
        values={pseudoWaveform('partial export scene', 64)}
      />,
    );
    expect(html).toContain('studio-mini-waveform--partial');
    expect(html).toContain('stroke-dasharray');
  });

  it('exposes interactive seek chrome when enabled', () => {
    const html = renderToStaticMarkup(
      <MiniWaveform
        interactive
        values={pseudoWaveform('seekable', 64)}
        onSeek={vi.fn()}
      />,
    );
    expect(html).toContain('studio-mini-waveform--interactive');
    expect(html).toContain('Click or drag to seek playback');
  });

  it('keeps silent beds soft and above a flat zero line', () => {
    const silent = silentWaveform(24);
    expect(Math.min(...silent)).toBeGreaterThan(0.08);
    expect(Math.max(...silent)).toBeLessThan(0.28);
    expect(Math.max(...silent) - Math.min(...silent)).toBeGreaterThan(0.02);
  });
});
