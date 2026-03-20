/**
 * src/pages/ReceiptsQueue.tsx
 * Oracle Document sections consumed: 3, 7, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { usePrintJobQuery } from '@/hooks/receipts';
import { normalizeApiError } from '@/utils/errors';

export default function ReceiptsQueuePage() {
  const [jobId, setJobId] = useState('');
  const query = usePrintJobQuery(jobId || null);

  if (query.isError) {
    return <ErrorState error={normalizeApiError(query.error)} onRetry={() => void query.refetch()} />;
  }

  if (query.isLoading && jobId) {
    return <PageFrame title="Receipt queue" subtitle="Check print job status."><SkeletonLoader variant="rect" height={220} /></PageFrame>;
  }

  return (
    <PageFrame title="Receipt queue" subtitle="Check print job status.">
      <label className="field">
        <span>Job ID</span>
        <input className="input" value={jobId} onChange={(event) => setJobId(event.target.value)} />
      </label>
      {query.data ? (
        <section className="card"><div className="card__body stack">
          <div><strong>Status:</strong> {query.data.status}</div>
          <div><strong>Transaction:</strong> {query.data.transaction_id ?? '—'}</div>
          <div><strong>Completed:</strong> {query.data.completed_at ?? '—'}</div>
        </div></section>
      ) : null}
    </PageFrame>
  );
}
