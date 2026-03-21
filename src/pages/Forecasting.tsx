import { useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { normalizeApiError } from '@/utils/errors';
import { useStoreForecastQuery, useSkuForecastQuery } from '@/hooks/forecasting';
import type { ForecastMeta, ForecastPoint, HistoricalPoint, ReorderSuggestion } from '@/types/models';

export default function ForecastingPage() {
  const [horizon, setHorizon] = useState(7);
  const [productId, setProductId] = useState('');
  const [activeTab, setActiveTab] = useState<'store' | 'sku'>('store');

  const storeQuery = useStoreForecastQuery(horizon);
  const skuQuery = useSkuForecastQuery(productId ? Number(productId) : 0, horizon);

  const storeEnvelope = storeQuery.data;
  const skuEnvelope = skuQuery.data;

  const storeInner = (storeEnvelope?.data ?? null) as unknown as Record<string, unknown> | null;
  const storeMeta = ((storeEnvelope?.meta ?? storeInner?.meta ?? null) as unknown) as ForecastMeta | null;
  const storeHistorical = ((storeInner?.historical ?? []) as unknown) as HistoricalPoint[];
  const storeForecast = ((storeInner?.forecast ?? []) as unknown) as ForecastPoint[];

  const skuInner = (skuEnvelope?.data ?? null) as unknown as Record<string, unknown> | null;
  const skuMeta = ((skuEnvelope?.meta ?? skuInner?.meta ?? null) as unknown) as ForecastMeta | null;
  const skuHistorical = ((skuInner?.historical ?? []) as unknown) as HistoricalPoint[];
  const skuForecast = ((skuInner?.forecast ?? []) as unknown) as ForecastPoint[];
  const reorder = ((skuMeta?.reorder_suggestion ?? null) as unknown) as ReorderSuggestion | null;

  return (
    <PageFrame title="Demand Forecasting" subtitle="AI-powered store-level and SKU-level demand forecasts.">
      {/* Controls */}
      <div className="button-row" style={{ marginBottom: '1.5rem', gap: '0.75rem' }}>
        <Button variant={activeTab === 'store' ? 'primary' : 'ghost'} onClick={() => setActiveTab('store')}>Store Forecast</Button>
        <Button variant={activeTab === 'sku' ? 'primary' : 'ghost'} onClick={() => setActiveTab('sku')}>SKU Forecast</Button>
        <select value={horizon} onChange={(e) => setHorizon(Number(e.target.value))} className="input" style={{ width: 120 }}>
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
          <option value={60}>60 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>

      {/* Store-level forecast */}
      {activeTab === 'store' && (
        <div>
          {storeQuery.isLoading ? <SkeletonLoader variant="rect" height={300} /> : storeQuery.isError ? (
            <ErrorState error={normalizeApiError(storeQuery.error)} onRetry={() => void storeQuery.refetch()} />
          ) : !storeEnvelope ? (
            <EmptyState title="No forecast data" body="Store-level forecast is not available yet." />
          ) : (
            <>
              {/* Meta card */}
              {storeMeta && (
                <Card className="mb-6">
                  <CardHeader><CardTitle>Forecast Model Info</CardTitle></CardHeader>
                  <CardContent>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <Badge variant="info">Regime: {storeMeta.regime}</Badge>
                      <Badge variant="secondary">Model: {storeMeta.model_type}</Badge>
                      <Badge variant={storeMeta.confidence_tier === 'high' ? 'success' : storeMeta.confidence_tier === 'medium' ? 'warning' : 'danger'}>
                        Confidence: {storeMeta.confidence_tier}
                      </Badge>
                      <span className="muted">Training window: {storeMeta.training_window_days} days</span>
                      <span className="muted">Generated: {storeMeta.generated_at}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Historical + Forecast data table */}
              <Card>
                <CardHeader><CardTitle>Forecast Data ({horizon}-day horizon)</CardTitle></CardHeader>
                <CardContent>
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
                        {storeHistorical.slice(-7).map((h) => (
                          <tr key={`h-${h.date}`}>
                            <td>{h.date}</td>
                            <td><Badge variant="secondary">Historical</Badge></td>
                            <td>{h.actual.toLocaleString()}</td>
                            <td>—</td>
                            <td>—</td>
                          </tr>
                        ))}
                        {storeForecast.map((f) => (
                          <tr key={`f-${f.date}`}>
                            <td>{f.date}</td>
                            <td><Badge variant="info">Forecast</Badge></td>
                            <td>{f.predicted.toLocaleString()}</td>
                            <td>{f.lower_bound?.toLocaleString() ?? '—'}</td>
                            <td>{f.upper_bound?.toLocaleString() ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* SKU-level forecast */}
      {activeTab === 'sku' && (
        <div>
          <div className="button-row" style={{ marginBottom: '1rem' }}>
            <Input placeholder="Enter Product ID" value={productId} onChange={(e) => setProductId(e.target.value)} style={{ maxWidth: 200 }} />
          </div>

          {!productId ? (
            <EmptyState title="Select a product" body="Enter a product ID to view its demand forecast and reorder suggestion." />
          ) : skuQuery.isLoading ? (
            <SkeletonLoader variant="rect" height={300} />
          ) : skuQuery.isError ? (
            <ErrorState error={normalizeApiError(skuQuery.error)} onRetry={() => void skuQuery.refetch()} />
          ) : !skuEnvelope ? (
            <EmptyState title="No SKU data" body="No forecast available for this product." />
          ) : (
            <>
              {/* Reorder suggestion */}
              {reorder && (
                <Card className="mb-6">
                  <CardHeader><CardTitle>Reorder Suggestion</CardTitle></CardHeader>
                  <CardContent>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
                      <div>
                        <span className="muted">Should Reorder</span>
                        <div><Badge variant={reorder.should_reorder ? 'danger' : 'success'}>
                          {reorder.should_reorder ? 'YES' : 'NO'}
                        </Badge></div>
                      </div>
                      <div><span className="muted">Current Stock</span><div><strong>{reorder.current_stock}</strong></div></div>
                      <div><span className="muted">Forecasted Demand</span><div><strong>{reorder.forecasted_demand}</strong></div></div>
                      <div><span className="muted">Lead Time (days)</span><div><strong>{reorder.lead_time_days}</strong></div></div>
                      <div><span className="muted">Suggested Order Qty</span><div><strong>{reorder.suggested_order_qty}</strong></div></div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* SKU Forecast data */}
              <Card>
                <CardHeader><CardTitle>SKU Forecast — {skuMeta?.product_name ?? `Product #${productId}`}</CardTitle></CardHeader>
                <CardContent>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                      <thead>
                        <tr><th>Date</th><th>Type</th><th>Value</th><th>Lower</th><th>Upper</th></tr>
                      </thead>
                      <tbody>
                        {skuHistorical.slice(-7).map((h) => (
                          <tr key={`h-${h.date}`}>
                            <td>{h.date}</td><td><Badge variant="secondary">Actual</Badge></td><td>{h.actual.toLocaleString()}</td><td>—</td><td>—</td>
                          </tr>
                        ))}
                        {skuForecast.map((f) => (
                          <tr key={`f-${f.date}`}>
                            <td>{f.date}</td><td><Badge variant="info">Forecast</Badge></td><td>{f.predicted.toLocaleString()}</td>
                            <td>{f.lower_bound?.toLocaleString() ?? '—'}</td><td>{f.upper_bound?.toLocaleString() ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </PageFrame>
  );
}
