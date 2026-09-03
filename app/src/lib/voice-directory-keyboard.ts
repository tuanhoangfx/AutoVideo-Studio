export type VoiceDirectoryKeyboardItem = { id: string };

export type VoiceDirectoryKeyboardHandlers = {
  items: VoiceDirectoryKeyboardItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onPreview: () => void;
};

export function createVoiceDirectoryKeyDownHandler({
  items,
  activeId,
  onSelect,
  onPreview,
}: VoiceDirectoryKeyboardHandlers) {
  return (event: KeyboardEvent) => {
    if (items.length === 0) return;

    const target = event.target as HTMLElement | null;
    const inTextField = Boolean(target?.closest('input,textarea,select,[contenteditable="true"]'));
    const activeIndex = items.findIndex((item) => item.id === activeId);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = activeIndex < 0 ? 0 : Math.min(items.length - 1, activeIndex + 1);
      const next = items[nextIndex];
      if (next) onSelect(next.id);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const nextIndex = activeIndex < 0 ? 0 : Math.max(0, activeIndex - 1);
      const next = items[nextIndex];
      if (next) onSelect(next.id);
      return;
    }

    if (event.key === 'Enter' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      if (inTextField || target?.closest('button')) return;
      event.preventDefault();
      onPreview();
    }
  };
}
