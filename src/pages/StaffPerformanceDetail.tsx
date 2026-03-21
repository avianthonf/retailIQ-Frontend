import { useParams, useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { normalizeApiError } from '@/utils/errors';
import { useStaffPerformanceDetailQuery } from '@/hooks/staffPerformance';
import type { StaffPerformanceHistory } from '@/types/models';

export default function StaffPerformanceDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const id = userId ?? '';

  const detailQuery = useStaffPerformanceDetailQuery(id);
  const detail = detailQuery.data;

  if (detailQuery.isError) {
    return <ErrorState error={normalizeApiError(detailQuery.error)} onRetry={() => void detailQuery.refetch()} />;
  }

  if (detailQuery.isLoading) {
    return (
      <PageFrame title="Staff Detail" subtitle="Loading...">
        <SkeletonLoader variant="rect" height={400} />
      </PageFrame>
    );
  }

  if (!detail) {
    return <EmptyState title="Staff not found" body="The requested staff member does not exist." />;
  }

  const history = detail.history ?? [];
  const totalRevenue = history.reduce((sum, h) => sum + h.revenue, 0);
  const totalTxns = history.reduce((sum, h) => sum + h.transaction_count, 0);
  const avgDaily = history.length > 0 ? totalRevenue / history.length : 0;

  return (
    <PageFrame title={detail.name} subtitle={`Staff ID: ${detail.user_id} — 30-Day Performance`}>
      <Button variant="ghost" onClick={() => navigate('/staff-performance')} className="mb-4">← Back to Staff</Button>

      {/* Summary cards */}
      <div className="grid grid--3" style={{ marginBottom: '1.5rem' }}>
        <Card>
          <CardHeader><CardTitle>30-Day Revenue</CardTitle></CardHeader>
          <CardContent><h2 style={{ marginBottom: 0 }}>₹{totalRevenue.toLocaleString()}</h2></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Transactions</CardTitle></CardHeader>
          <CardContent><h2 style={{ marginBottom: 0 }}>{totalTxns}</h2></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Avg Daily Revenue</CardTitle></CardHeader>
          <CardContent><h2 style={{ marginBottom: 0 }}>₹{avgDaily.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h2></CardContent>
        </Card>
      </div>

      {/* Daily breakdown table */}
      <Card>
        <CardHeader><CardTitle>Daily Breakdown</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <EmptyState title="No history" body="No performance data available for the last 30 days." />
          ) : (
            <DataTable<StaffPerformanceHistory>
              columns={[
                { key: 'date', header: 'Date', render: (row: StaffPerformanceHistory) => row.date },
                { key: 'revenue', header: 'Revenue', render: (row: StaffPerformanceHistory) => `₹${row.revenue.toLocaleString()}` },
                { key: 'txns', header: 'Transactions', render: (row: StaffPerformanceHistory) => row.transaction_count },
                { key: 'target', header: 'Target', render: (row: StaffPerformanceHistory) => row.target_revenue != null ? `₹${row.target_revenue.toLocaleString()}` : '—' },
                { key: 'achievement', header: 'Achievement', render: (row: StaffPerformanceHistory) => {
                  if (row.target_pct_achieved == null) return <Badge variant="secondary">N/A</Badge>;
                  const color = row.target_pct_achieved >= 100 ? 'success' : row.target_pct_achieved >= 50 ? 'warning' : 'danger';
                  return <Badge variant={color}>{row.target_pct_achieved.toFixed(0)}%</Badge>;
                }},
              ]}
              data={history}
            />
          )}
        </CardContent>
      </Card>
    </PageFrame>
  );
}
