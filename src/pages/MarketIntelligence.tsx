import { useMemo, useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import {
  useAcknowledgeAlertMutation,
  useCompetitorDetailQuery,
  useCompetitorsQuery,
  useComputePriceIndexMutation,
  useDemandForecastsQuery,
  useGenerateForecastMutation,
  useMarketAlertsQuery,
  useMarketSummaryQuery,
  usePriceIndicesQuery,
  usePriceSignalsQuery,
  useRecommendationsQuery,
} from '@/hooks/marketIntelligence';
import { uiStore } from '@/stores/uiStore';
import { formatDate } from '@/utils/dates';
import { normalizeApiError } from '@/utils/errors';
import { formatCurrency } from '@/utils/numbers';
import type { CompetitorAnalysis, DemandForecast, MarketAlert, MarketRecommendation, PriceIndex, PriceSignal } from '@/api/marketIntelligence';

export default function MarketIntelligencePage() {
  const addToast = uiStore((state) => state.addToast);
  const [activeTab, setActiveTab] = useState<'overview' | 'signals' | 'indices' | 'alerts' | 'competitors' | 'forecasts' | 'recommendations'>('overview');
  const [summaryRegion, setSummaryRegion] = useState('');
  const [signalProductId, setSignalProductId] = useState('');
  const [indexCategory, setIndexCategory] = useState('');
  const [indexRegion, setIndexRegion] = useState('');
  const [indexPeriod, setIndexPeriod] = useState('');
  const [indexProductIds, setIndexProductIds] = useState('');
  const [competitorRegion, setCompetitorRegion] = useState('');
  const [selectedCompetitorId, setSelectedCompetitorId] = useState('');
  const [forecastProductId, setForecastProductId] = useState('');
  const [forecastPeriod, setForecastPeriod] = useState('next_30_days');
  const [forecastCategory, setForecastCategory] = useState('');
  const [forecastRegion, setForecastRegion] = useState('');
  const [recommendationType, setRecommendationType] = useState<'PRICING' | 'STOCK' | 'MARKETING' | ''>('');
  const [recommendationCategory, setRecommendationCategory] = useState('');
  const [recommendationRegion, setRecommendationRegion] = useState('');

  const summaryQuery = useMarketSummaryQuery(summaryRegion || undefined);
  const signalsQuery = usePriceSignalsQuery(signalProductId ? { product_id: signalProductId } : undefined);
  const indicesQuery = usePriceIndicesQuery();
  const alertsQuery = useMarketAlertsQuery();
  const competitorsQuery = useCompetitorsQuery(competitorRegion || undefined);
  const competitorDetailQuery = useCompetitorDetailQuery(selectedCompetitorId);
  const forecastsQuery = useDemandForecastsQuery({
    product_id: forecastProductId || undefined,
    category: forecastCategory || undefined,
    region: forecastRegion || undefined,
  });
  const recommendationsQuery = useRecommendationsQuery({
    type: recommendationType || undefined,
    region: recommendationRegion || undefined,
    category: recommendationCategory || undefined,
  });

  const acknowledgeAlertMutation = useAcknowledgeAlertMutation();
  const computeIndexMutation = useComputePriceIndexMutation();
  const generateForecastMutation = useGenerateForecastMutation();

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

  const competitorColumns = useMemo<Column<CompetitorAnalysis>[]>(
    () => [
      { key: 'name', header: 'Competitor', render: (row) => row.name },
      { key: 'region', header: 'Region', render: (row) => row.region },
      { key: 'total_products', header: 'Products', render: (row) => row.total_products.toLocaleString() },
      { key: 'average_pricing', header: 'Average Price', render: (row) => formatCurrency(row.average_pricing) },
      { key: 'pricing_strategy', header: 'Strategy', render: (row) => row.pricing_strategy },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <Button size="sm" variant="secondary" onClick={() => setSelectedCompetitorId(row.competitor_id)}>
            View detail
          </Button>
        ),
      },
    ],
    [],
  );

  const forecastColumns = useMemo<Column<DemandForecast>[]>(
    () => [
      { key: 'product_name', header: 'Product', render: (row) => row.product_name },
      { key: 'sku', header: 'SKU', render: (row) => row.sku },
      { key: 'current_demand', header: 'Current', render: (row) => row.current_demand.toFixed(2) },
      { key: 'forecast_demand', header: 'Forecast', render: (row) => row.forecast_demand.toFixed(2) },
      { key: 'forecast_period', header: 'Period', render: (row) => row.forecast_period },
      { key: 'confidence_score', header: 'Confidence', render: (row) => `${Math.round(row.confidence_score * 100)}%` },
    ],
    [],
  );

  const recommendationColumns = useMemo<Column<MarketRecommendation>[]>(
    () => [
      { key: 'title', header: 'Title', render: (row) => row.title },
      { key: 'type', header: 'Type', render: (row) => row.type },
      { key: 'priority', header: 'Priority', render: (row) => row.priority },
      { key: 'expected_impact', header: 'Impact', render: (row) => row.expected_impact },
      { key: 'status', header: 'Status', render: (row) => row.status },
      { key: 'due_date', header: 'Due', render: (row) => row.due_date ? formatDate(row.due_date) : '-' },
    ],
    [],
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
  const competitors = competitorsQuery.data ?? [];
  const forecasts = forecastsQuery.data ?? [];
  const recommendations = recommendationsQuery.data ?? [];

  return (
    <PageFrame title="Market Intelligence" subtitle="Live market summaries, price signals, price index computation, and alert operations backed by the production API.">
      <div className="space-y-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            {(['overview', 'signals', 'indices', 'alerts', 'competitors', 'forecasts', 'recommendations'] as const).map((tab) => (
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

        {activeTab === 'competitors' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Competitor Filter</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <Input
                  label="Region"
                  value={competitorRegion}
                  onChange={(event) => setCompetitorRegion(event.target.value)}
                  placeholder="Optional region filter"
                />
                <Button variant="secondary" onClick={() => void competitorsQuery.refetch()}>
                  Refresh competitors
                </Button>
              </CardContent>
            </Card>

            {competitorsQuery.isLoading ? (
              <SkeletonLoader variant="rect" height={260} />
            ) : competitorsQuery.isError ? (
              <ErrorState error={normalizeApiError(competitorsQuery.error)} onRetry={() => void competitorsQuery.refetch()} />
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Competitor Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable columns={competitorColumns} data={competitors} emptyMessage="No competitor analysis returned by the backend." />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Competitor Detail</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedCompetitorId && competitorDetailQuery.isLoading ? (
                      <SkeletonLoader variant="rect" height={160} />
                    ) : selectedCompetitorId && competitorDetailQuery.isError ? (
                      <ErrorState error={normalizeApiError(competitorDetailQuery.error)} onRetry={() => void competitorDetailQuery.refetch()} />
                    ) : competitorDetailQuery.data ? (
                      <div className="space-y-3 text-sm">
                        <div><span className="text-gray-500">Name:</span> {competitorDetailQuery.data.name}</div>
                        <div><span className="text-gray-500">Region:</span> {competitorDetailQuery.data.region}</div>
                        <div><span className="text-gray-500">Strategy:</span> {competitorDetailQuery.data.pricing_strategy}</div>
                        <div><span className="text-gray-500">Market share:</span> {competitorDetailQuery.data.market_share.toFixed(2)}%</div>
                        <div>
                          <div className="text-gray-500 mb-1">Strengths</div>
                          <div className="flex flex-wrap gap-2">
                            {competitorDetailQuery.data.strengths.map((strength) => (
                              <Badge key={strength} variant="success">{strength}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 mb-1">Weaknesses</div>
                          <div className="flex flex-wrap gap-2">
                            {competitorDetailQuery.data.weaknesses.length ? competitorDetailQuery.data.weaknesses.map((weakness) => (
                              <Badge key={weakness} variant="warning">{weakness}</Badge>
                            )) : <span className="text-gray-500">None</span>}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <EmptyState title="No competitor selected" body="Choose a competitor from the table to inspect its breakdown." />
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === 'forecasts' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Forecast Inputs</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Input label="Product ID" value={forecastProductId} onChange={(event) => setForecastProductId(event.target.value)} placeholder="Optional product ID" />
                <Input label="Forecast period" value={forecastPeriod} onChange={(event) => setForecastPeriod(event.target.value)} placeholder="next_30_days" />
                <Input label="Category" value={forecastCategory} onChange={(event) => setForecastCategory(event.target.value)} placeholder="Optional category" />
                <Input label="Region" value={forecastRegion} onChange={(event) => setForecastRegion(event.target.value)} placeholder="Optional region" />
                <div className="md:col-span-2">
                  <Button
                    onClick={() => void (async () => {
                      if (!forecastProductId.trim()) {
                        addToast({ title: 'Missing product ID', message: 'Enter a product ID before generating a forecast.', variant: 'warning' });
                        return;
                      }

                      try {
                        await generateForecastMutation.mutateAsync({
                          product_id: forecastProductId.trim(),
                          forecast_period: forecastPeriod.trim() || 'next_30_days',
                        });
                        addToast({ title: 'Forecast generated', message: 'The backend returned a fresh demand forecast.', variant: 'success' });
                        await forecastsQuery.refetch();
                      } catch (error) {
                        addToast({ title: 'Forecast generation failed', message: normalizeApiError(error).message, variant: 'error' });
                      }
                    })()}
                    loading={generateForecastMutation.isPending}
                  >
                    Generate forecast
                  </Button>
                </div>
              </CardContent>
            </Card>

            {forecastsQuery.isLoading ? (
              <SkeletonLoader variant="rect" height={260} />
            ) : forecastsQuery.isError ? (
              <ErrorState error={normalizeApiError(forecastsQuery.error)} onRetry={() => void forecastsQuery.refetch()} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Demand Forecasts</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable columns={forecastColumns} data={forecasts} emptyMessage="No forecast rows returned by the backend." />
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}

        {activeTab === 'recommendations' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recommendation Filters</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={recommendationType}
                    onChange={(event) => setRecommendationType(event.target.value as typeof recommendationType)}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                  >
                    <option value="">All</option>
                    <option value="PRICING">Pricing</option>
                    <option value="STOCK">Stock</option>
                    <option value="MARKETING">Marketing</option>
                  </select>
                </div>
                <Input label="Category" value={recommendationCategory} onChange={(event) => setRecommendationCategory(event.target.value)} placeholder="Optional category filter" />
                <Input label="Region" value={recommendationRegion} onChange={(event) => setRecommendationRegion(event.target.value)} placeholder="Optional region filter" />
              </CardContent>
            </Card>

            {recommendationsQuery.isLoading ? (
              <SkeletonLoader variant="rect" height={260} />
            ) : recommendationsQuery.isError ? (
              <ErrorState error={normalizeApiError(recommendationsQuery.error)} onRetry={() => void recommendationsQuery.refetch()} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Action Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <DataTable columns={recommendationColumns} data={recommendations} emptyMessage="No recommendations returned by the backend." />
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </PageFrame>
  );
}
