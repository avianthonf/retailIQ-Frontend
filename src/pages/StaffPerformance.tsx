import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/layout/PageFrame';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { normalizeApiError } from '@/utils/errors';
import {
  useAllStaffPerformanceQuery,
  useCurrentSessionQuery,
  useStartSessionMutation,
  useEndSessionMutation,
  useUpsertStaffTargetMutation,
} from '@/hooks/staffPerformance';
import { authStore } from '@/stores/authStore';
import type { StaffPerformanceSummary } from '@/types/models';

export default function StaffPerformancePage() {
  const navigate = useNavigate();
  const role = authStore((s) => s.role);
  const isOwner = role === 'owner';

  const sessionQuery = useCurrentSessionQuery();
  const performanceQuery = useAllStaffPerformanceQuery();
  const startSession = useStartSessionMutation();
  const endSession = useEndSessionMutation();
  const upsertTarget = useUpsertStaffTargetMutation();

  const [targetForm, setTargetForm] = useState({ user_id: '', target_date: '', revenue_target: '' });
  const [showTargetForm, setShowTargetForm] = useState(false);

  const session = sessionQuery.data;
  const staffList = performanceQuery.data ?? [];

  const handleToggleSession = () => {
    if (session?.active) {
      endSession.mutate();
    } else {
      startSession.mutate();
    }
  };

  const handleSetTarget = () => {
    if (!targetForm.user_id || !targetForm.target_date) return;
    upsertTarget.mutate({
      user_id: Number(targetForm.user_id),
      target_date: targetForm.target_date,
      revenue_target: targetForm.revenue_target ? Number(targetForm.revenue_target) : undefined,
    }, {
      onSuccess: () => {
        setShowTargetForm(false);
        setTargetForm({ user_id: '', target_date: '', revenue_target: '' });
      },
    });
  };

  const getAchievementColor = (pct: number | null): 'success' | 'warning' | 'danger' | 'secondary' => {
    if (pct == null) return 'secondary';
    if (pct >= 100) return 'success';
    if (pct >= 50) return 'warning';
    return 'danger';
  };

  if (performanceQuery.isError && isOwner) {
    return <ErrorState error={normalizeApiError(performanceQuery.error)} onRetry={() => void performanceQuery.refetch()} />;
  }

  return (
    <PageFrame title="Staff Performance" subtitle="Track staff sessions, revenue, and daily targets.">
      {/* Session management */}
      <Card className="mb-6">
        <CardHeader><CardTitle>My Shift Session</CardTitle></CardHeader>
        <CardContent>
          {sessionQuery.isLoading ? <SkeletonLoader variant="rect" height={60} /> : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Badge variant={session?.active ? 'success' : 'secondary'}>
                {session?.active ? 'Active' : 'No Active Session'}
              </Badge>
              {session?.active && session.started_at && (
                <span className="muted">Started: {new Date(session.started_at).toLocaleTimeString()}</span>
              )}
              {session?.active && session.target_revenue != null && (
                <span className="muted">Target: ₹{session.target_revenue.toLocaleString()}</span>
              )}
              <Button
                variant={session?.active ? 'destructive' : 'primary'}
                onClick={handleToggleSession}
                disabled={startSession.isPending || endSession.isPending}
              >
                {session?.active ? 'End Shift' : 'Start Shift'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Owner-only: staff leaderboard */}
      {isOwner && (
        <>
          <div className="button-row" style={{ marginBottom: '1rem' }}>
            <h3>Staff Leaderboard — Today</h3>
            <Button variant="secondary" onClick={() => setShowTargetForm(!showTargetForm)}>
              {showTargetForm ? 'Cancel' : 'Set Target'}
            </Button>
          </div>

          {showTargetForm && (
            <Card className="mb-6">
              <CardHeader><CardTitle>Set Daily Target</CardTitle></CardHeader>
              <CardContent>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <Input placeholder="Staff User ID" value={targetForm.user_id} onChange={(e) => setTargetForm({ ...targetForm, user_id: e.target.value })} style={{ maxWidth: 160 }} />
                  <Input type="date" value={targetForm.target_date} onChange={(e) => setTargetForm({ ...targetForm, target_date: e.target.value })} style={{ maxWidth: 180 }} />
                  <Input placeholder="Revenue Target (₹)" value={targetForm.revenue_target} onChange={(e) => setTargetForm({ ...targetForm, revenue_target: e.target.value })} style={{ maxWidth: 180 }} />
                  <Button onClick={handleSetTarget} disabled={upsertTarget.isPending}>
                    {upsertTarget.isPending ? 'Saving...' : 'Save Target'}
                  </Button>
                </div>
                {upsertTarget.isError && <p className="text-danger" style={{ marginTop: '0.5rem' }}>{normalizeApiError(upsertTarget.error).message}</p>}
              </CardContent>
            </Card>
          )}

          {performanceQuery.isLoading ? <SkeletonLoader variant="rect" height={300} /> : staffList.length === 0 ? (
            <EmptyState title="No staff data" body="Staff performance data will appear here once staff members start their shifts." />
          ) : (
            <DataTable<StaffPerformanceSummary>
              columns={[
                { key: 'name', header: 'Staff', render: (row: StaffPerformanceSummary) => row.name },
                { key: 'revenue', header: 'Today Revenue', render: (row: StaffPerformanceSummary) => `₹${row.today_revenue.toLocaleString()}` },
                { key: 'txns', header: 'Transactions', render: (row: StaffPerformanceSummary) => row.today_transaction_count },
                { key: 'discount', header: 'Avg Discount %', render: (row: StaffPerformanceSummary) => `${row.avg_discount_pct.toFixed(1)}%` },
                { key: 'target', header: 'Target', render: (row: StaffPerformanceSummary) => row.target_revenue != null ? `₹${row.target_revenue.toLocaleString()}` : '—' },
                { key: 'achievement', header: 'Achievement', render: (row: StaffPerformanceSummary) => (
                  <Badge variant={getAchievementColor(row.target_pct_achieved)}>
                    {row.target_pct_achieved != null ? `${row.target_pct_achieved.toFixed(0)}%` : 'N/A'}
                  </Badge>
                )},
                { key: 'actions', header: '', render: (row: StaffPerformanceSummary) => (
                  <Button variant="ghost" onClick={() => navigate(`/staff-performance/${row.user_id}`)}>Details</Button>
                )},
              ]}
              data={staffList}
            />
          )}
        </>
      )}
    </PageFrame>
  );
}
