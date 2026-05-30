'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { studioControlClass } from './StudioControl';

export type HubFilterOption<T extends string> = {
  value: T;
  label: string;
  icon: string;
};

type MenuPos = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
  openUp: boolean;
};

export function HubFilterDropdown<T extends string>({
  icon,
  label,
  selected,
  options,
  counts,
  onChange,
  singleSelect = false,
  compact = false,
  variant = 'chip',
  buttonVariant = 'hub',
  className = '',
}: {
  icon: ReactNode;
  label: string;
  selected: T[];
  options: readonly HubFilterOption<T>[];
  counts?: Partial<Record<T, number>>;
  onChange: (value: T[]) => void;
  singleSelect?: boolean;
  compact?: boolean;
  variant?: 'chip' | 'inline';
  buttonVariant?: 'hub' | 'command';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((option) =>
    option.label.toLowerCase().includes(search.trim().toLowerCase())
  );
  const optionValues = options.filter((option) => option.value !== ('all' as T)).map((option) => option.value);
  const allSelected = selected.length > 0 && optionValues.every((value) => selected.includes(value));
  const someSelected = selected.length > 0 && !allSelected;
  const selectedSet = new Set(selected);
  const selectedOption =
    selected.length === 1 ? options.find((option) => option.value === selected[0]) : undefined;
  const buttonLabel =
    selected.length === 0
      ? `All ${label}`
      : selected.length === 1
      ? selectedOption?.label ?? selected[0]
      : `${label}: ${selected.length}`;
  const inlineLabel = selectedOption?.icon ?? '·';

  const applySelection = (next: T[]) => {
    onChange(next);
    if (singleSelect) setOpen(false);
  };

  const toggle = (value: T) => {
    if (value === ('all' as T)) {
      applySelection([]);
      return;
    }
    if (singleSelect) {
      applySelection([value]);
      return;
    }
    applySelection(selectedSet.has(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  const toggleAll = () => applySelection(allSelected ? [] : optionValues);

  const isInline = variant === 'inline';
  const isCommand = buttonVariant === 'command';
  const menuWidth = isInline ? 192 : compact ? 224 : 288;

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    const placeMenu = () => {
      const anchor = buttonRef.current ?? ref.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const gap = 4;
      const margin = 8;
      const preferredMax = 288;
      const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
      const spaceAbove = rect.top - gap - margin;
      const openUp = spaceBelow < 180 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(120, Math.min(preferredMax, openUp ? spaceAbove : spaceBelow));
      const left = Math.min(Math.max(margin, rect.left), window.innerWidth - menuWidth - margin);

      if (openUp) {
        setMenuPos({
          bottom: window.innerHeight - rect.top + gap,
          left,
          width: menuWidth,
          maxHeight,
          openUp: true,
        });
        return;
      }

      setMenuPos({
        top: rect.bottom + gap,
        left,
        width: menuWidth,
        maxHeight,
        openUp: false,
      });
    };
    placeMenu();
    const raf = requestAnimationFrame(placeMenu);
    window.addEventListener('resize', placeMenu);
    window.addEventListener('scroll', placeMenu, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', placeMenu);
      window.removeEventListener('scroll', placeMenu, true);
    };
  }, [open, menuWidth]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const menu =
    open && menuPos && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            className="fixed z-[200] overflow-hidden rounded-lg border border-white/10 bg-[var(--panel)] shadow-xl shadow-black/50"
            style={{
              ...(menuPos.openUp ? { bottom: menuPos.bottom } : { top: menuPos.top }),
              left: menuPos.left,
              width: menuPos.width,
              maxHeight: menuPos.maxHeight,
            }}
            data-filter-menu=""
          >
            <div className="border-b border-white/5 p-1.5">
              <label className="studio-search !h-[24px] !flex">
                <Search size={11} className="shrink-0 text-[var(--muted)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${label.toLowerCase()}...`}
                  autoFocus
                />
              </label>
            </div>
            <div className={`overflow-auto p-1 ${isInline ? 'text-[11px]' : 'text-sm'}`} style={{ maxHeight: menuPos.maxHeight - 44 }}>
              {!singleSelect ? (
                <>
                  <button
                    type="button"
                    onClick={toggleAll}
                    className={`flex w-full items-center gap-2 rounded-md px-2 font-medium transition-colors hover:bg-white/5 ${
                      isInline ? 'py-1 text-[11px]' : 'py-1.5'
                    }`}
                  >
                    <HubFilterCircle checked={allSelected} indeterminate={someSelected} />
                    <span className="grid h-5 min-w-5 place-items-center rounded-md bg-white/[.04] px-1 text-[var(--accent-2)]">
                      <SlidersHorizontal size={12} />
                    </span>
                    <span className="flex-1 text-left">All {label}</span>
                    <span className="text-[10px] text-[var(--muted)]">{optionValues.length}</span>
                  </button>
                  <div className="my-1 border-t border-white/5" />
                </>
              ) : null}
              {filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle(option.value)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 transition-colors hover:bg-white/5 ${
                    isInline ? 'py-1 text-[11px]' : 'py-1.5'
                  }`}
                >
                  <HubFilterCircle
                    checked={option.value === ('all' as T) ? selected.length === 0 : selectedSet.has(option.value)}
                  />
                  <span className="grid h-5 min-w-5 place-items-center rounded-md bg-white/[.04] px-1 text-[var(--accent-2)]">
                    <HubFilterOptionIcon icon={option.icon} />
                  </span>
                  <span className="flex-1 truncate text-left">{option.label}</span>
                  {counts?.[option.value] != null && (
                    <span className="text-[10px] text-[var(--muted)]">{counts[option.value]}</span>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="py-4 text-center text-xs text-[var(--muted)]">No matches</div>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div
      ref={ref}
      data-cell-picker=""
      className={`relative min-w-0 ${isInline ? '' : compact ? '' : 'flex-1'} ${className}`}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          isInline
            ? `inline-flex h-[18px] max-w-[5.5rem] items-center gap-0.5 rounded border px-1 text-[8px] leading-none transition ${
                open
                  ? 'border-indigo-300/45 bg-indigo-500/15 text-indigo-100'
                  : 'border-white/10 bg-black/30 text-white/70 hover:border-white/20 hover:bg-white/[.06] hover:text-white'
              }`
            : isCommand
            ? `${studioControlClass('neutral', open || selected.length > 0)} w-full !justify-start ${
                selected.length > 0 ? 'studio-control--active' : ''
              }`
            : `hub-filter-chip w-full ${selected.length > 0 ? 'active' : ''} ${compact ? '!h-[26px] px-1.5 text-[10px]' : ''}`
        }
        onMouseDown={(e) => e.stopPropagation()}
        title={buttonLabel}
        aria-expanded={open}
      >
        {isInline ? (
          <>
            <span className="shrink-0">{inlineLabel}</span>
            <span className="min-w-0 truncate">{buttonLabel}</span>
            <ChevronDown size={8} className={`shrink-0 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        ) : (
          <>
            <span className="studio-control-icon opacity-75">{icon}</span>
            <span className="min-w-0 flex-1 truncate text-left">{buttonLabel}</span>
            {!singleSelect && selected.length > 1 ? (
              <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-white">
                {selected.length}
              </span>
            ) : null}
            <ChevronDown size={compact ? 10 : 12} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>
      {menu}
    </div>
  );
}

export function HubFilterCircle({ checked, indeterminate = false }: { checked: boolean; indeterminate?: boolean }) {
  return (
    <span
      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-all ${
        checked
          ? 'border-[var(--accent-2)] bg-[var(--accent)]'
          : indeterminate
          ? 'border-[var(--accent-2)] bg-[var(--accent)]/30'
          : 'border-white/25'
      }`}
    >
      {checked ? <Check size={9} className="text-white" /> : indeterminate ? <span className="h-1 w-2 rounded-full bg-white" /> : null}
    </span>
  );
}

export function HubFilterOptionIcon({ icon }: { icon: string }) {
  return <span className="text-[11px] leading-none">{icon}</span>;
}

export function HubSelectAllButton({
  allSelected,
  someSelected,
  onToggle,
  title,
}: {
  allSelected: boolean;
  someSelected: boolean;
  onToggle: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="studio-control !w-[26px] !px-0"
      title={title}
      aria-label={title}
    >
      <HubFilterCircle checked={allSelected} indeterminate={someSelected && !allSelected} />
    </button>
  );
}
