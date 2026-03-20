/**
 * src/components/ui/Toast.tsx
 * Oracle Document sections consumed: 9, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import type { ToastItem } from '@/stores/uiStore';
import { formatCorrelationId } from '@/utils/errors';

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  return (
    <article className={`toast toast--${toast.variant}`} role="status" aria-live="polite">
      <div className="toast__title">
        <span>{toast.title}</span>
        <button className="icon-button button--ghost" type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss toast">
          ×
        </button>
      </div>
      <div>{toast.message}</div>
      {toast.correlationId ? <div className="muted" style={{ marginTop: '0.4rem', fontSize: '0.85rem' }}>{formatCorrelationId(toast.correlationId)}</div> : null}
    </article>
  );
}
