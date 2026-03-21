import { PageFrame } from '@/components/layout/PageFrame';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { normalizeApiError } from '@/utils/errors';
import { useOfflineSnapshotQuery } from '@/hooks/offline';

export default function OfflinePage() {
  const snapshotQuery = useOfflineSnapshotQuery();

  if (snapshotQuery.isError) {
    return <ErrorState error={normalizeApiError(snapshotQuery.error)} onRetry={() => void snapshotQuery.refetch()} />;
  }

  if (snapshotQuery.isLoading) {
    return (
      <PageFrame title="Offline Analytics" subtitle="Loading snapshot...">
        <div className="grid grid--3">
          <SkeletonLoader variant="rect" height={110} />
          <SkeletonLoader variant="rect" height={110} />
          <SkeletonLoader variant="rect" height={110} />
        </div>
        <SkeletonLoader variant="rect" height={300} />
      </PageFrame>
    );
  }

  const data = snapshotQuery.data;
  if (!data) {
    return (
      <PageFrame title="Offline Analytics" subtitle="">
        <EmptyState title="No snapshot available" body="An offline analytics snapshot has not been generated yet. The system will generate one automatically." />
      </PageFrame>
    );
  }

  const snapshot = data.snapshot ?? (data as unknown as Record<string, unknown>);
  const generatedAt = (snapshot as Record<string, unknown>).generated_at;
  const entries = Object.entries(snapshot as Record<string, unknown>).filter(
    ([key]) => key !== 'generated_at' && key !== 'store_id'
  );

  return (
    <PageFrame title="Offline Analytics" subtitle="Pre-computed analytics snapshot for offline use.">
      <div className="button-row" style={{ marginBottom: '1.5rem' }}>
        <Badge variant="info">Snapshot</Badge>
        {generatedAt != null && <span className="muted">Generated: {String(generatedAt)}</span>}
      </div>

      <div className="grid grid--2" style={{ gap: '1rem' }}>
        {entries.map(([key, value]) => (
          <Card key={key}>
            <CardHeader><CardTitle>{key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</CardTitle></CardHeader>
            <CardContent>
              {typeof value === 'object' && value !== null ? (
                <pre style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap', margin: 0, maxHeight: 200, overflow: 'auto' }}>
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                <h2 style={{ marginBottom: 0 }}>{String(value)}</h2>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </PageFrame>
  );
}
