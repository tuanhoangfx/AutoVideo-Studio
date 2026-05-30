'use client';

import { useCallback, useRef, useState } from 'react';

export function useStudioToast() {
  const toastActionRef = useRef<null | (() => void)>(null);
  const [toast, setToast] = useState<{ open: boolean; text: string; actionLabel?: string }>({
    open: false,
    text: '',
  });

  const showToast = useCallback((text: string, actionLabel?: string, action?: () => void) => {
    toastActionRef.current = action ?? null;
    setToast({ open: true, text, actionLabel });
    window.setTimeout(
      () => setToast((prev) => (prev.open && prev.text === text ? { open: false, text: '' } : prev)),
      2600
    );
  }, []);

  const dismissToast = useCallback(() => setToast({ open: false, text: '' }), []);

  return { toast, toastActionRef, showToast, dismissToast, setToast };
}
