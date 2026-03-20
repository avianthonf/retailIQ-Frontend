/**
 * src/components/ui/ConfirmDialog.tsx
 * Oracle Document sections consumed: 7, 9, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useMemo, useState } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  requireTypedConfirmation?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  requireTypedConfirmation,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState('');
  const canConfirm = useMemo(() => {
    if (!requireTypedConfirmation) {
      return true;
    }

    return typedValue.trim() === requireTypedConfirmation;
  }, [requireTypedConfirmation, typedValue]);

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" onClick={(event) => event.stopPropagation()}>
        <header className="dialog__header">
          <h2 id="confirm-dialog-title" style={{ margin: 0 }}>{title}</h2>
        </header>
        <div className="dialog__body stack">
          <p style={{ margin: 0 }}>{body}</p>
          {requireTypedConfirmation ? (
            <label className="field">
              <span>Type <strong>{requireTypedConfirmation}</strong> to confirm</span>
              <input
                className="input"
                value={typedValue}
                onChange={(event) => setTypedValue(event.target.value)}
                autoComplete="off"
                placeholder={requireTypedConfirmation}
              />
            </label>
          ) : null}
        </div>
        <footer className="dialog__footer">
          <button className="button button--secondary" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`button ${destructive ? 'button--danger' : ''}`}
            type="button"
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}
