import { useMemo, useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useAcknowledgeAlertMutation, useComputePriceIndexMutation, useMarketAlertsQuery, useMarketSummaryQuery, usePriceIndicesQuery, usePriceSignalsQuery } from '@/hooks/marketIntelligence';
import { uiStore } from '@/stores/uiStore';
import { normalizeApiError } from '@/utils/errors';
import { formatCurrency } from '@/utils/numbers';
import type { MarketAlert, PriceIndex, PriceSignal } from '@/api/marketIntelligence';

export default function MarketIntelligencePage() {
  const addToast = uiStore((state) => state.addToast);
  const [activeTab, setActiveTab] = useState<'overview' | 'signals' | 'indices' | 'alerts'>('overview');
  const [summaryRegion, setSummaryRegion] = useState('');
  const [signalProductId, setSignalProductId] = useState('');
  const [indexCategory, setIndexCategory] = useState('');
  const [indexRegion, setIndexRegion] = useState('');
  const [indexPeriod, setIndexPeriod] = useState('');
  const [indexProductIds, setIndexProductIds] = useState('');

  const summaryQuery = useMarketSummaryQuery(summaryRegion || undefined);
  const signalsQuery = usePriceSignalsQuery(signalProductId ? { product_id: signalProductId } : undefined);
  const indicesQuery = usePriceIndicesQuery();
  const alertsQuery = useMarketAlertsQuery();

  const acknowledgeAlertMutation = useAcknowledgeAlertMutation();
  const computeIndexMutation = useComputePriceIndexMutation();

  const signalColumns = useMemo<Column<PriceSignal>[]>(
    () => [
      { key: 'product_name', header: 'Signal', render: (row) => row.product_name || row.id },
      { key: 'region', header: 'Region', render: (row) => row.region || 'Unknown' },
      { key: 'current_price', header: 'Observed Value', render: (row) => formatCurrency(row.current_price) },
      { key: 'trend', header: 'Trend', render: (row) => row.trend },
      { key: 'confidence', header: 'Confidence', render: (row) => `${Math.round(row.confidence * 100)}%` },
    ],
    [],
  );

  const indexColumns = useMemo<Column<PriceIndex>[]>(
    () => [
      { key: 'category', header: 'Category', render: (row) => row.category },
      { key: 'region', header: 'Region', render: (row) => row.region || 'Unknown' },
      { key: 'index_value', header: 'Index', render: (row) => row.index_value.toFixed(2) },
      { key: 'change_percent', header: 'Change vs Base', render: (row) => `${row.change_percent.toFixed(2)}%` },
      { key: 'period', header: 'Period', render: (row) => row.period || 'Current' },
    ],
    [],
  );

  const alertColumns = useMemo<Column<MarketAlert>[]>(
    () => [
      { key: 'type', header: 'Type', render: (row) => row.type.replace(/_/g, ' ') },
      { key: 'severity', header: 'Severity', render: (row) => row.severity },
      { key: 'title', header: 'Title', render: (row) => row.title },
      { key: 'message', header: 'Message', render: (row) => row.message || '-' },
      { key: 'status', header: 'Status', render: (row) => (row.is_acknowledged ? 'Acknowledged' : 'Pending') },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          row.is_acknowledged ? (
            'Done'
          ) : (
            <Button
              size="sm"
              onClick={() => {
                void acknowledgeAlertMutation.mutateAsync(row.id, {
                  onSuccess: () => addToast({ title: 'Alert acknowledged', message: row.title, variant: 'success' }),
                  onError: (error) => addToast({ title: 'Acknowledge failed', message: normalizeApiError(error).message, variant: 'error' }),
                });
              }}
              loading={acknowledgeAlertMutation.isPending}
            >
              Acknowledge
            </Button>
          )
        ),
      },
    ],
    [acknowledgeAlertMutation, addToast],
  );

  const onComputeIndex = async () => {
    if (!indexCategory.trim() || !indexRegion.trim() || !indexPeriod.trim()) {
      addToast({ title: 'Missing inputs', message: 'Category, region, and period are required to compute an index.', variant: 'warning' });
      return;
    }

    try {
      const result = await computeIndexMutation.mutateAsync({
        category: indexCategory.trim(),
        region: indexRegion.trim(),
        period: indexPeriod.trim(),
        product_ids: indexProductIds.split(',').map((value) => value.trim()).filter(Boolean),
      });
      addToast({
        title: 'Index computed',
        message: `${result.category} in ${result.region} is now ${result.index_value.toFixed(2)}.`,
        variant: 'success',
      });
      setIndexProductIds('');
    } catch (error) {
      addToast({ title: 'Index compute failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  if (summaryQuery.isLoading) {
    return (
      <PageFrame title="Market Intelligence">
        <SkeletonLoader variant="rect" height={320} />
      </PageFrame>
    );
  }

  if (summaryQuery.isError) {
    return (
      <PageFrame title="Market Intelligence">
        <ErrorState error={normalizeApiError(summaryQuery.error)} onRetry={() => void summaryQuery.refetch()} />
      </PageFrame>
    );
  }

  const summary = summaryQuery.data ?? [];
  const alerts = alertsQuery.data?.alerts ?? [];
  const signals = signalsQuery.data?.signals ?? [];
  const indices = indicesQuery.data ?? [];

  return (
    <PageFrame title="Market Intelligence" subtitle="Live market summaries, price signals, price index computation, and alert operations backed by the production API.">
      <div className="space-y-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            {(['overview', 'signals', 'indices', 'alerts'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-1 py-2 text-sm font-medium capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'overview' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary Filter</CardTitle>
              </CardHeader>
              <CardContent className="max-w-sm">
                <Input label="Region" value={summaryRegion} onChange={(event) => setSummaryRegion(event.target.value)} placeholder="Filter by region" />
              </CardContent>
            </Card>

            {summary.length === 0 ? (
              <EmptyState title="No market summary available" body="The backend returned no market summary rows for the current filter." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summary.map((row) => (
                  <Card key={row.region}>
                    <CardHeader>
                      <CardTitle className="text-base">{row.region}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between"><span>Stores</span><span>{row.total_stores}</span></div>
                      <div className="flex justify-between"><span>Average price</span><span>{formatCurrency(row.average_price)}</span></div>
                      <div className="flex justify-between"><span>Demand index</span><span>{row.demand_index.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Competitors</span><span>{row.competitor_count}</span></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Latest Indices</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable columns={indexColumns} data={indices.slice(0, 5)} emptyMessage="No computed price indices yet." />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Open Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable columns={alertColumns} data={alerts.slice(0, 5)} emptyMessage="No active market alerts." />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}

        {activeTab === 'signals' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Signal Filter</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <Input
                  label="Product ID"
                  value={signalProductId}
                  onChange={(event) => setSignalProductId(event.target.value)}
                  placeholder="Optional product identifier"
                />
                <Button variant="secondary" onClick={() => void signalsQuery.refetch()}>
                  Refresh signals
                </Button>
              </CardContent>
            </Card>

            {signalsQuery.isLoading ? (
              <SkeletonLoader variant="rect" height={260} />
            ) : signalsQuery.isError ? (
              <ErrorState error={normalizeApiError(signalsQuery.error)} onRetry={() => void signalsQuery.refetch()} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Price Signals</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable columns={signalColumns} data={signals} emptyMessage="No price signals matched the current filter." />
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}

        {activeTab === 'indices' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Compute Price Index</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Input label="Category ID" value={indexCategory} onChange={(event) => setIndexCategory(event.target.value)} placeholder="Category identifier" />
                <Input label="Region" value={indexRegion} onChange={(event) => setIndexRegion(event.target.value)} placeholder="Region code or name" />
                <Input label="Period" value={indexPeriod} onChange={(event) => setIndexPeriod(event.target.value)} placeholder="2026-W12" />
                <Input label="Product IDs" value={indexProductIds} onChange={(event) => setIndexProductIds(event.target.value)} placeholder="Optional comma-separated product IDs" />
                <div className="md:col-span-2">
                  <Button onClick={() => void onComputeIndex()} loading={computeIndexMutation.isPending}>
                    Compute index
                  </Button>
                </div>
              </CardContent>
            </Card>

            {indicesQuery.isLoading ? (
              <SkeletonLoader variant="rect" height={260} />
            ) : indicesQuery.isError ? (
              <ErrorState error={normalizeApiError(indicesQuery.error)} onRetry={() => void indicesQuery.refetch()} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Computed Price Indices</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable columns={indexColumns} data={indices} emptyMessage="The backend has not produced any price indices yet." />
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}

        {activeTab === 'alerts' ? (
          alertsQuery.isLoading ? (
            <SkeletonLoader variant="rect" height={260} />
          ) : alertsQuery.isError ? (
            <ErrorState error={normalizeApiError(alertsQuery.error)} onRetry={() => void alertsQuery.refetch()} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Market Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable columns={alertColumns} data={alerts} emptyMessage="No active alerts returned by the backend." />
              </CardContent>
            </Card>
          )
        ) : null}
      </div>
    </PageFrame>
  );
}
