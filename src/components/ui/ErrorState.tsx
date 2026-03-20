/**
 * src/components/ui/ErrorState.tsx
 * Oracle Document sections consumed: 7, 9, 10
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import type { ApiError } from '@/types/api';
import { formatCorrelationId } from '@/utils/errors';

interface ErrorStateProps {
  error: ApiError;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <section className="card" style={{ padding: '1.25rem' }} role="alert">
      <h3 style={{ marginTop: 0 }}>Something went wrong</h3>
      <p>{error.message}</p>
      {error.correlationId ? <p className="muted">{formatCorrelationId(error.correlationId)}</p> : null}
      {onRetry ? (
        <button className="button" type="button" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </section>
  );
}
