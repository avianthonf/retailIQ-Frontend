import { useQuery } from '@tanstack/react-query';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { getMaintenanceStatus, getPlatformHealth, getPlatformRoot, pingTeam, probeWebsocketEndpoint } from '@/api/platform';
import { normalizeApiError } from '@/utils/errors';

export default function ApiValidationPage() {
  const healthQuery = useQuery({
    queryKey: ['platform', 'health'],
    queryFn: getPlatformHealth,
    staleTime: 30_000,
  });

  const rootQuery = useQuery({
    queryKey: ['platform', 'root'],
    queryFn: getPlatformRoot,
    staleTime: 30_000,
  });

  const maintenanceQuery = useQuery({
    queryKey: ['platform', 'maintenance'],
    queryFn: getMaintenanceStatus,
    staleTime: 30_000,
  });

  const teamPingQuery = useQuery({
    queryKey: ['platform', 'team-ping'],
    queryFn: pingTeam,
    staleTime: 30_000,
  });

  const websocketQuery = useQuery({
    queryKey: ['platform', 'websocket'],
    queryFn: probeWebsocketEndpoint,
    staleTime: 30_000,
  });

  const isLoading = [healthQuery.isLoading, rootQuery.isLoading, maintenanceQuery.isLoading, teamPingQuery.isLoading, websocketQuery.isLoading].some(Boolean);
  const firstError = [healthQuery.error, rootQuery.error, maintenanceQuery.error, teamPingQuery.error, websocketQuery.error].find(Boolean);

  if (isLoading) {
    return (
      <PageFrame title="Platform Diagnostics" subtitle="Live health, maintenance, and operational diagnostics from the deployed backend.">
        <SkeletonLoader variant="rect" height={320} />
      </PageFrame>
    );
  }

  if (firstError) {
    return (
      <PageFrame title="Platform Diagnostics">
        <ErrorState error={normalizeApiError(firstError)} />
      </PageFrame>
    );
  }

  const maintenance = maintenanceQuery.data;
  const diagnosticRows = [
    { endpoint: '/health', status: String(healthQuery.data?.status ?? 'unknown'), detail: JSON.stringify(healthQuery.data) },
    { endpoint: '/', status: String(rootQuery.data?.status ?? rootQuery.data?.message ?? 'ok'), detail: JSON.stringify(rootQuery.data) },
    { endpoint: '/api/v1/ops/maintenance', status: String(maintenance?.system_status ?? 'unknown'), detail: `${maintenance?.scheduled_maintenance.length ?? 0} scheduled / ${maintenance?.ongoing_incidents.length ?? 0} incidents` },
    { endpoint: '/api/v1/team/ping', status: teamPingQuery.data?.success ? 'success' : 'unexpected', detail: JSON.stringify(teamPingQuery.data) },
    { endpoint: '/ws', status: 'reachable', detail: JSON.stringify(websocketQuery.data ?? '') },
  ];

  return (
    <PageFrame
      title="Platform Diagnostics"
      subtitle="Operational health and runtime validation against the deployed backend."
      actions={(
        <Button
          variant="secondary"
            onClick={() => {
              void healthQuery.refetch();
              void rootQuery.refetch();
              void maintenanceQuery.refetch();
              void teamPingQuery.refetch();
              void websocketQuery.refetch();
            }}
          >
          Refresh diagnostics
        </Button>
      )}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">{String(healthQuery.data?.status ?? 'unknown')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Maintenance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">{maintenance?.system_status ?? 'unknown'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Scheduled Windows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">{maintenance?.scheduled_maintenance.length ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Team Ping</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">{teamPingQuery.data?.success ? 'ok' : 'unexpected'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">WebSocket Probe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">{websocketQuery.data !== undefined ? 'reachable' : 'unknown'}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Endpoint Diagnostics</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'endpoint', header: 'Endpoint', render: (row) => row.endpoint },
                { key: 'status', header: 'Status', render: (row) => row.status },
                { key: 'detail', header: 'Detail', render: (row) => row.detail },
              ]}
              data={diagnosticRows}
            />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Payload</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-md bg-gray-900 p-4 text-sm text-gray-100">
                {JSON.stringify(maintenanceQuery.data, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Health Payload</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-md bg-gray-900 p-4 text-sm text-gray-100">
                {JSON.stringify({ health: healthQuery.data, root: rootQuery.data, teamPing: teamPingQuery.data, websocket: websocketQuery.data }, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageFrame>
  );
}
