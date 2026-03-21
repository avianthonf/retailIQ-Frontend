import { useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { useAiForecastMutation } from '@/hooks/aiTools';
import { useSkuForecastQuery, useStoreForecastQuery } from '@/hooks/forecasting';
import { uiStore } from '@/stores/uiStore';
import { normalizeApiError } from '@/utils/errors';
import type { ForecastMeta, ForecastPoint, HistoricalPoint, ReorderSuggestion } from '@/types/models';

function ForecastTable({
  historical,
  forecast,
}: {
  historical: HistoricalPoint[];
  forecast: ForecastPoint[];
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Value</th>
            <th>Lower Bound</th>
            <th>Upper Bound</th>
          </tr>
        </thead>
        <tbody>
          {historical.slice(-7).map((row) => (
            <tr key={`historical-${row.date}`}>
              <td>{row.date}</td>
              <td><Badge variant="secondary">Historical</Badge></td>
              <td>{row.actual.toLocaleString()}</td>
              <td>-</td>
              <td>-</td>
            </tr>
          ))}
          {forecast.map((row) => (
            <tr key={`forecast-${row.date}`}>
              <td>{row.date}</td>
              <td><Badge variant="info">Forecast</Badge></td>
              <td>{row.predicted.toLocaleString()}</td>
              <td>{row.lower_bound?.toLocaleString() ?? '-'}</td>
              <td>{row.upper_bound?.toLocaleString() ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ForecastingPage() {
  const addToast = uiStore((state) => state.addToast);
  const [activeTab, setActiveTab] = useState<'store' | 'sku' | 'ai'>('store');
  const [horizon, setHorizon] = useState(7);
  const [productId, setProductId] = useState('');
  const [aiProductId, setAiProductId] = useState('');
  const [aiForecastResult, setAiForecastResult] = useState<unknown>(null);

  const storeQuery = useStoreForecastQuery(horizon);
  const skuQuery = useSkuForecastQuery(productId ? Number(productId) : 0, horizon);
  const aiForecastMutation = useAiForecastMutation();

  const storeEnvelope = storeQuery.data;
  const skuEnvelope = skuQuery.data;

  const storeInner = (storeEnvelope?.data ?? null) as Record<string, unknown> | null;
  const storeMeta = (storeEnvelope?.meta ?? storeInner?.meta ?? null) as ForecastMeta | null;
  const storeHistorical = (storeInner?.historical ?? []) as HistoricalPoint[];
  const storeForecast = (storeInner?.forecast ?? []) as ForecastPoint[];

  const skuInner = (skuEnvelope?.data ?? null) as Record<string, unknown> | null;
  const skuMeta = (skuEnvelope?.meta ?? skuInner?.meta ?? null) as ForecastMeta | null;
  const skuHistorical = (skuInner?.historical ?? []) as HistoricalPoint[];
  const skuForecast = (skuInner?.forecast ?? []) as ForecastPoint[];
  const reorder = (skuMeta?.reorder_suggestion ?? null) as ReorderSuggestion | null;

  const onRunAiForecast = async () => {
    if (!aiProductId.trim()) {
      addToast({ title: 'Product ID required', message: 'Enter a product ID before calling the AI v2 forecast endpoint.', variant: 'warning' });
      return;
    }

    try {
      const result = await aiForecastMutation.mutateAsync({ product_id: aiProductId.trim() });
      setAiForecastResult(result);
      addToast({ title: 'AI forecast ready', message: `Generated forecast for product ${aiProductId.trim()}.`, variant: 'success' });
    } catch (error) {
      addToast({ title: 'AI forecast failed', message: normalizeApiError(error).message, variant: 'error' });
    }
  };

  return (
    <PageFrame title="Demand Forecasting" subtitle="Store forecasts, SKU forecasts, and direct access to the AI v2 forecast endpoint.">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Button variant={activeTab === 'store' ? 'primary' : 'ghost'} onClick={() => setActiveTab('store')}>Store Forecast</Button>
          <Button variant={activeTab === 'sku' ? 'primary' : 'ghost'} onClick={() => setActiveTab('sku')}>SKU Forecast</Button>
          <Button variant={activeTab === 'ai' ? 'primary' : 'ghost'} onClick={() => setActiveTab('ai')}>AI v2 Forecast</Button>
          <select value={horizon} onChange={(event) => setHorizon(Number(event.target.value))} className="input" style={{ width: 140 }}>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>

        {activeTab === 'store' ? (
          storeQuery.isLoading ? (
            <SkeletonLoader variant="rect" height={300} />
          ) : storeQuery.isError ? (
            <ErrorState error={normalizeApiError(storeQuery.error)} onRetry={() => void storeQuery.refetch()} />
          ) : !storeEnvelope ? (
            <EmptyState title="No forecast data" body="Store-level forecasting returned no payload." />
          ) : (
            <div className="space-y-6">
              {storeMeta ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Forecast Model Info</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3">
                    <Badge variant="info">Regime: {storeMeta.regime}</Badge>
                    <Badge variant="secondary">Model: {storeMeta.model_type}</Badge>
                    <Badge variant="primary">Confidence: {storeMeta.confidence_tier}</Badge>
                    <Badge variant="gray">Window: {storeMeta.training_window_days} days</Badge>
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle>Store Forecast ({horizon}-day horizon)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ForecastTable historical={storeHistorical} forecast={storeForecast} />
                </CardContent>
              </Card>
            </div>
          )
        ) : null}

        {activeTab === 'sku' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SKU Forecast Filter</CardTitle>
              </CardHeader>
              <CardContent className="max-w-xs">
                <Input label="Product ID" value={productId} onChange={(event) => setProductId(event.target.value)} placeholder="Enter a product ID" />
              </CardContent>
            </Card>

            {!productId ? (
              <EmptyState title="Select a product" body="Enter a product ID to load its SKU forecast and reorder suggestion." />
            ) : skuQuery.isLoading ? (
              <SkeletonLoader variant="rect" height={300} />
            ) : skuQuery.isError ? (
              <ErrorState error={normalizeApiError(skuQuery.error)} onRetry={() => void skuQuery.refetch()} />
            ) : !skuEnvelope ? (
              <EmptyState title="No SKU forecast" body="No backend forecast was returned for this product." />
            ) : (
              <div className="space-y-6">
                {reorder ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Reorder Suggestion</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-5">
                      <div><div className="text-sm text-gray-500">Reorder</div><div className="font-semibold">{reorder.should_reorder ? 'Yes' : 'No'}</div></div>
                      <div><div className="text-sm text-gray-500">Current stock</div><div className="font-semibold">{reorder.current_stock}</div></div>
                      <div><div className="text-sm text-gray-500">Forecasted demand</div><div className="font-semibold">{reorder.forecasted_demand}</div></div>
                      <div><div className="text-sm text-gray-500">Lead time</div><div className="font-semibold">{reorder.lead_time_days} days</div></div>
                      <div><div className="text-sm text-gray-500">Suggested order</div><div className="font-semibold">{reorder.suggested_order_qty}</div></div>
                    </CardContent>
                  </Card>
                ) : null}

                <Card>
                  <CardHeader>
                    <CardTitle>SKU Forecast {skuMeta?.product_name ? `- ${skuMeta.product_name}` : ''}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ForecastTable historical={skuHistorical} forecast={skuForecast} />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === 'ai' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI v2 Forecast Endpoint</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <Input label="Product ID" value={aiProductId} onChange={(event) => setAiProductId(event.target.value)} placeholder="Enter a product ID" />
                <Button onClick={() => void onRunAiForecast()} loading={aiForecastMutation.isPending}>
                  Generate AI forecast
                </Button>
              </CardContent>
            </Card>

            {aiForecastResult ? (
              <Card>
                <CardHeader>
                  <CardTitle>AI Forecast Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto rounded-md bg-gray-900 p-4 text-sm text-gray-100">
                    {JSON.stringify(aiForecastResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ) : (
              <EmptyState title="No AI forecast yet" body="Run the AI v2 forecast call to inspect the backend response directly from the UI." />
            )}
          </div>
        ) : null}
      </div>
    </PageFrame>
  );
}
