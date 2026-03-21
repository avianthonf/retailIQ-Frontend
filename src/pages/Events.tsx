/**
 * src/pages/Events.tsx
 * Events Page
 */
import { useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { normalizeApiError } from '@/utils/errors';
import {
  useEventsQuery,
  useUpcomingEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} from '@/hooks/events';
import type { EventRecord } from '@/types/models';

const EVENT_TYPE_COLORS: Record<string, 'blue' | 'indigo' | 'green' | 'yellow' | 'red'> = {
  HOLIDAY: 'blue',
  FESTIVAL: 'indigo',
  PROMOTION: 'green',
  SALE_DAY: 'yellow',
  CLOSURE: 'red',
};

export default function EventsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [horizon, setHorizon] = useState(30);
  const [form, setForm] = useState({
    event_name: '', event_type: 'PROMOTION' as string, start_date: '', end_date: '',
    expected_impact_pct: '', is_recurring: false, recurrence_rule: '',
  });

  const eventsQuery = useEventsQuery();
  const upcomingQuery = useUpcomingEventsQuery(horizon);
  const createMutation = useCreateEventMutation();
  const _updateMutation = useUpdateEventMutation();
  const deleteMutation = useDeleteEventMutation();

  const events = eventsQuery.data ?? [];
  const upcoming = upcomingQuery.data ?? [];

  const handleCreate = () => {
    if (!form.event_name || !form.start_date || !form.end_date) return;
    createMutation.mutate({
      event_name: form.event_name,
      event_type: form.event_type,
      start_date: form.start_date,
      end_date: form.end_date,
      expected_impact_pct: form.expected_impact_pct ? Number(form.expected_impact_pct) : null,
      is_recurring: form.is_recurring,
      recurrence_rule: form.recurrence_rule || null,
    }, {
      onSuccess: () => {
        setShowCreate(false);
        setForm({ event_name: '', event_type: 'PROMOTION', start_date: '', end_date: '', expected_impact_pct: '', is_recurring: false, recurrence_rule: '' });
      },
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) });
  };

  if (eventsQuery.isError) {
    return <ErrorState error={normalizeApiError(eventsQuery.error)} onRetry={() => void eventsQuery.refetch()} />;
  }

  return (
    <PageFrame title="Events" subtitle="Manage business events and track their demand impact.">
      {/* Upcoming events */}
      <Card className="mb-6">
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <CardTitle>Upcoming Events</CardTitle>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="muted">Next</span>
              <select value={horizon} onChange={(e) => setHorizon(Number(e.target.value))} className="input" style={{ width: 80 }}>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingQuery.isLoading ? <SkeletonLoader variant="rect" height={100} /> : upcoming.length === 0 ? (
            <p className="muted">No upcoming events in the next {horizon} days.</p>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {upcoming.map((ev) => (
                <div key={ev.id} style={{ padding: '0.5rem 0.75rem', background: '#f9fafb', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Badge variant={EVENT_TYPE_COLORS[ev.event_type] ?? 'secondary'}>{ev.event_type}</Badge>
                  <strong>{ev.event_name}</strong>
                  <span className="muted">{ev.start_date} → {ev.end_date}</span>
                  {ev.expected_impact_pct != null && <Badge variant="info">{ev.expected_impact_pct > 0 ? '+' : ''}{ev.expected_impact_pct}%</Badge>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="button-row" style={{ marginBottom: '1rem' }}>
        <Button variant="secondary" onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Cancel' : '+ New Event'}</Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Create Event</CardTitle></CardHeader>
          <CardContent>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <Input placeholder="Event Name *" value={form.event_name} onChange={(e) => setForm({ ...form, event_name: e.target.value })} />
              <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} className="input">
                <option value="HOLIDAY">Holiday</option>
                <option value="FESTIVAL">Festival</option>
                <option value="PROMOTION">Promotion</option>
                <option value="SALE_DAY">Sale Day</option>
                <option value="CLOSURE">Closure</option>
              </select>
              <Input type="date" placeholder="Start Date *" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              <Input type="date" placeholder="End Date *" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              <Input placeholder="Impact %" value={form.expected_impact_pct} onChange={(e) => setForm({ ...form, expected_impact_pct: e.target.value })} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={form.is_recurring} onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })} />
                <label>Recurring</label>
              </div>
            </div>
            <div className="button-row" style={{ marginTop: '1rem' }}>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create'}</Button>
            </div>
            {createMutation.isError && <p className="text-danger" style={{ marginTop: '0.5rem' }}>{normalizeApiError(createMutation.error).message}</p>}
          </CardContent>
        </Card>
      )}

      {/* All events list */}
      {eventsQuery.isLoading ? <SkeletonLoader variant="rect" height={300} /> : events.length === 0 ? (
        <EmptyState title="No events" body="Create your first business event to start tracking demand impact." />
      ) : (
        <DataTable<EventRecord>
          columns={[
            { key: 'name', header: 'Event', render: (row: EventRecord) => row.event_name },
            { key: 'type', header: 'Type', render: (row: EventRecord) => <Badge variant={EVENT_TYPE_COLORS[row.event_type] ?? 'secondary'}>{row.event_type}</Badge> },
            { key: 'start', header: 'Start', render: (row: EventRecord) => row.start_date },
            { key: 'end', header: 'End', render: (row: EventRecord) => row.end_date },
            { key: 'impact', header: 'Impact', render: (row: EventRecord) => row.expected_impact_pct != null ? `${row.expected_impact_pct}%` : '—' },
            { key: 'recurring', header: 'Recurring', render: (row: EventRecord) => row.is_recurring ? 'Yes' : 'No' },
            { key: 'actions', header: '', render: (row: EventRecord) => (
              <Button variant="ghost" onClick={() => setDeleteTarget(row.id)}>Delete</Button>
            )},
          ]}
          data={events}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete Event"
          body="Are you sure you want to delete this event? This cannot be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </PageFrame>
  );
}
