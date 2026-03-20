/**
 * src/pages/VisionOcrReview.tsx
 * Oracle Document sections consumed: 3, 7, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useConfirmOcrMutation, useDismissOcrMutation, useOcrJobQuery } from '@/hooks/vision';
import { normalizeApiError } from '@/utils/errors';
import { uiStore } from '@/stores/uiStore';

export default function VisionOcrReviewPage() {
  const { jobId } = useParams();
  const addToast = uiStore((state) => state.addToast);
  const query = useOcrJobQuery(jobId ?? null);
  const confirmMutation = useConfirmOcrMutation();
  const dismissMutation = useDismissOcrMutation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const confirmItems = useMemo(() => query.data?.items.map((item) => ({ item_id: item.item_id, quantity: item.quantity ?? 1, matched_product_id: item.matched_product_id, unit_price: item.unit_price })) ?? [], [query.data]);

  if (query.isError) {
    return <ErrorState error={normalizeApiError(query.error)} onRetry={() => void query.refetch()} />;
  }

  if (query.isLoading) {
    return <PageFrame title="OCR review" subtitle="Review extracted invoice items."><SkeletonLoader variant="rect" height={320} /></PageFrame>;
  }

  if (!query.data) {
    return <EmptyState title="OCR job not found" body="The selected OCR job is unavailable." />;
  }

  const submitConfirm = async () => {
    try {
      await confirmMutation.mutateAsync({ jobId: jobId ?? '', payload: { confirmed_items: confirmItems } });
      addToast({ title: 'OCR confirmed', message: 'The stock was updated successfully.', variant: 'success' });
      setConfirmOpen(false);
      void query.refetch();
    } catch (error) {
      addToast({ title: 'Confirm failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  const dismiss = async () => {
    try {
      await dismissMutation.mutateAsync(jobId ?? '');
      addToast({ title: 'OCR dismissed', message: 'The job was marked as failed.', variant: 'warning' });
      void query.refetch();
    } catch (error) {
      addToast({ title: 'Dismiss failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  return (
    <PageFrame title={`OCR job ${query.data.job_id}`} subtitle={`Status: ${query.data.status}`} actions={<div className="button-row"><button className="button button--secondary" type="button" onClick={() => void query.refetch()}>Refresh</button><button className="button button--danger" type="button" onClick={() => setConfirmOpen(true)} disabled={query.data.status !== 'REVIEW'}>Confirm</button><button className="button button--ghost" type="button" onClick={() => void dismiss()} disabled={query.data.status === 'COMPLETED'}>Dismiss</button></div>}>
      {query.data.items.length ? (
        <DataTable
          columns={[
            { key: 'text', header: 'Raw text', render: (row) => row.raw_text },
            { key: 'product', header: 'Matched product', render: (row) => row.product_name ?? '—' },
            { key: 'qty', header: 'Qty', render: (row) => row.quantity ?? '—' },
            { key: 'price', header: 'Unit price', render: (row) => row.unit_price ?? '—' },
            { key: 'confidence', header: 'Confidence', render: (row) => row.confidence },
          ]}
          data={query.data.items}
        />
      ) : <EmptyState title="No items extracted" body="This OCR job did not return any line items." />}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirm OCR items?"
        body="This will update stock based on the reviewed OCR results. This cannot be undone."
        confirmLabel={confirmMutation.isPending ? 'Confirming…' : 'Confirm items'}
        destructive
        requireTypedConfirmation="CONFIRM"
        onConfirm={submitConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </PageFrame>
  );
}
