/**
 * src/components/ui/ToastProvider.tsx
 * Oracle Document sections consumed: 9, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { Fragment, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Toast } from '@/components/ui/Toast';
import { uiStore } from '@/stores/uiStore';
import type { UiState } from '@/stores/uiStore';
import type { ToastItem } from '@/stores/uiStore';

export function ToastProvider({ children }: { children: ReactNode }) {
  const toasts = uiStore((state: UiState) => state.toasts);
  const removeToast = uiStore((state: UiState) => state.removeToast);

  useEffect(() => {
    const timers: number[] = toasts.map((toast: ToastItem) => window.setTimeout(() => removeToast(toast.id), toast.duration ?? 4500));
    return () => timers.forEach((timer: number) => window.clearTimeout(timer));
  }, [removeToast, toasts]);

  return (
    <>
      {children}
      <div className="toast-stack" aria-label="Notifications">
        {toasts.map((toast: ToastItem) => (
          <Fragment key={toast.id}>
            <Toast toast={toast} onDismiss={removeToast} />
          </Fragment>
        ))}
      </div>
    </>
  );
}
