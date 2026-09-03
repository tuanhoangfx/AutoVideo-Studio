import { describe, expect, it, vi } from 'vitest';
import { createVoiceDirectoryKeyDownHandler } from './voice-directory-keyboard';

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

function keyEvent(
  key: string,
  target: EventTarget | null = document.body,
  init: Partial<KeyboardEventInit> = {},
) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  Object.defineProperty(event, 'target', { value: target });
  return event;
}

describe('createVoiceDirectoryKeyDownHandler', () => {
  it('moves selection with arrow keys', () => {
    const onSelect = vi.fn();
    const handler = createVoiceDirectoryKeyDownHandler({
      items,
      activeId: 'a',
      onSelect,
      onPreview: vi.fn(),
    });

    handler(keyEvent('ArrowDown'));
    expect(onSelect).toHaveBeenCalledWith('b');

    handler(keyEvent('ArrowUp'));
    expect(onSelect).toHaveBeenLastCalledWith('a');
  });

  it('previews on Enter when focus is not in a text field or button', () => {
    const onPreview = vi.fn();
    const handler = createVoiceDirectoryKeyDownHandler({
      items,
      activeId: 'b',
      onSelect: vi.fn(),
      onPreview,
    });

    handler(keyEvent('Enter', document.body));
    expect(onPreview).toHaveBeenCalledTimes(1);
  });

  it('does not preview on Enter inside an input', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    const onPreview = vi.fn();
    const handler = createVoiceDirectoryKeyDownHandler({
      items,
      activeId: 'b',
      onSelect: vi.fn(),
      onPreview,
    });

    handler(keyEvent('Enter', input));
    expect(onPreview).not.toHaveBeenCalled();
    input.remove();
  });

  it('does not preview on Enter when target is a button', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    const onPreview = vi.fn();
    const handler = createVoiceDirectoryKeyDownHandler({
      items,
      activeId: 'b',
      onSelect: vi.fn(),
      onPreview,
    });

    handler(keyEvent('Enter', button));
    expect(onPreview).not.toHaveBeenCalled();
    button.remove();
  });
});
