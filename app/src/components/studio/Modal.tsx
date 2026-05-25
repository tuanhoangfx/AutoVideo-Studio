'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  open,
  title,
  onClose,
  children,
  size = 'md',
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  // ESC close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const maxW = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-3xl' : 'max-w-xl';

  return (
    <div className="modal-backdrop grid place-items-center p-4" onClick={onClose}>
      <div
        className={`modal-panel relative w-full ${maxW} overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-7 w-7 place-items-center rounded-md text-[var(--muted)] hover:bg-white/[.04] hover:text-white"
          >
            <X size={16} />
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
