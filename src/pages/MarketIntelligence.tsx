/**
 * src/pages/MarketIntelligence.tsx
 * Market Intelligence Dashboard
 */
import { useState } from 'react';
import { PageFrame } from '@/components/layout/PageFrame';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  useMarketSummaryQuery,
  usePriceSignalsQuery,
  usePriceIndicesQuery,
  useMarketAlertsQuery,
  useCompetitorsQuery,
  useDemandForecastsQuery,
  useMarketTrendsQuery,
  useRecommendationsQuery,
  useAcknowledgeAlertMutation,
  useComputePriceIndexMutation,
  useGenerateForecastMutation,
  useExportSignalsMutation,
  useExportForecastsMutation
} from '@/hooks/marketIntelligence';
import { authStore } from '@/stores/authStore';
import type { Column } from '@/components/ui/DataTable';
import type { PriceSignal, MarketAlert, CompetitorAnalysis, DemandForecast } from '@/api/marketIntelligence';
import { formatCurrency } from '@/utils/numbers';
import { formatDate } from '@/utils/dates';
import { normalizeApiError } from '@/utils/errors';
import type { ApiError } from '@/types/api';

export default function MarketIntelligencePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'signals' | 'competitors' | 'forecasts' | 'alerts' | 'recommendations'>('overview');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<MarketAlert | null>(null);
  const [showAcknowledgeDialog, setShowAcknowledgeDialog] = useState(false);
  const [_showComputeIndexDialog, _setShowComputeIndexDialog] = useState(false);
  const [showGenerateForecastDialog, setShowGenerateForecastDialog] = useState(false);

  // Form states
  const [indexForm, setIndexForm] = useState({
    category: '',
    region: '',
    period: '',
    product_ids: '',
  });
  const [forecastForm, setForecastForm] = useState({
    product_id: '',
    forecast_period: '',
  });

  // Check if user is owner or staff
  const user = authStore.getState().user;
  const canManage = user?.role === 'owner' || user?.role === 'staff';

  // Queries
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useMarketSummaryQuery(selectedRegion || undefined);
  const { data: signals, isLoading: signalsLoading } = usePriceSignalsQuery(
    searchQuery ? { product_id: searchQuery } : undefined
  );
  const { data: _indices, isLoading: _indicesLoading } = usePriceIndicesQuery();
  const { data: alerts, isLoading: alertsLoading } = useMarketAlertsQuery();
  const { data: competitors, isLoading: competitorsLoading } = useCompetitorsQuery(selectedRegion || undefined);
  const { data: forecasts, isLoading: forecastsLoading } = useDemandForecastsQuery();
  const { data: _trends, isLoading: _trendsLoading } = useMarketTrendsQuery();
  const { data: recommendations, isLoading: _recommendationsLoading } = useRecommendationsQuery();

  // Mutations
  const acknowledgeMutation = useAcknowledgeAlertMutation();
  const computeIndexMutation = useComputePriceIndexMutation();
  const generateForecastMutation = useGenerateForecastMutation();
  const exportSignalsMutation = useExportSignalsMutation();
  const exportForecastsMutation = useExportForecastsMutation();

  // Handlers
  const handleAcknowledgeAlert = async () => {
    if (!selectedAlert) return;
    
    try {
      await acknowledgeMutation.mutateAsync(selectedAlert.id);
      setShowAcknowledgeDialog(false);
      setSelectedAlert(null);
      alert('Alert acknowledged successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const _handleComputeIndex = async () => {
    if (!indexForm.category || !indexForm.region || !indexForm.period) return;
    
    try {
      await computeIndexMutation.mutateAsync({
        ...indexForm,
        product_ids: indexForm.product_ids.split(',').map(id => id.trim()).filter(Boolean),
      });
      _setShowComputeIndexDialog(false);
      setIndexForm({ category: '', region: '', period: '', product_ids: '' });
      alert('Price index computed successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleGenerateForecast = async () => {
    if (!forecastForm.product_id || !forecastForm.forecast_period) return;
    
    try {
      await generateForecastMutation.mutateAsync(forecastForm);
      setShowGenerateForecastDialog(false);
      setForecastForm({ product_id: '', forecast_period: '' });
      alert('Forecast generated successfully');
    } catch {
      // Error handled by mutation
    }
  };

  const handleExportSignals = async (format: 'csv' | 'excel' | 'json') => {
    try {
      const blob = await exportSignalsMutation.mutateAsync({ format });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `price-signals.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // Error handled by mutation
    }
  };

  const handleExportForecasts = async (format: 'csv' | 'excel' | 'json') => {
    try {
      const blob = await exportForecastsMutation.mutateAsync({ format });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `demand-forecasts.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // Error handled by mutation
    }
  };

  // Signal columns
  const signalColumns: Column<PriceSignal>[] = [
    {
      key: 'product_name',
      header: 'Product',
      render: (signal) => (
        <div>
          <div className="font-medium">{signal.product_name}</div>
          <div className="text-sm text-gray-500">{signal.sku}</div>
        </div>
      ),
    },
    {
      key: 'current_price',
      header: 'Our Price',
      render: (signal) => formatCurrency(signal.current_price),
    },
    {
      key: 'market_price',
      header: 'Market Price',
      render: (signal) => formatCurrency(signal.market_price),
    },
    {
      key: 'price_difference_percent',
      header: 'Difference',
      render: (signal) => (
        <div className="flex items-center space-x-2">
          <span className={signal.price_difference_percent > 0 ? 'text-green-600' : signal.price_difference_percent < 0 ? 'text-red-600' : 'text-gray-600'}>
            {signal.price_difference_percent > 0 ? '+' : ''}{signal.price_difference_percent.toFixed(1)}%
          </span>
          <Badge variant={signal.trend === 'UP' ? 'success' : signal.trend === 'DOWN' ? 'danger' : 'secondary'}>
            {signal.trend}
          </Badge>
        </div>
      ),
    },
    {
      key: 'confidence',
      header: 'Confidence',
      render: (signal) => `${(signal.confidence * 100).toFixed(0)}%`,
    },
    {
      key: 'region',
      header: 'Region',
      render: (signal) => signal.region,
    },
  ];

  // Alert columns
  const alertColumns: Column<MarketAlert>[] = [
    {
      key: 'type',
      header: 'Type',
      render: (alert) => (
        <Badge variant="primary">{alert.type.replace('_', ' ')}</Badge>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (alert) => (
        <Badge variant={alert.severity === 'CRITICAL' ? 'danger' : alert.severity === 'HIGH' ? 'warning' : 'secondary'}>
          {alert.severity}
        </Badge>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      render: (alert) => alert.title,
    },
    {
      key: 'product_name',
      header: 'Product',
      render: (alert) => alert.product_name || '-',
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (alert) => formatDate(alert.created_at),
    },
    {
      key: 'is_acknowledged',
      header: 'Status',
      render: (alert) => (
        <Badge variant={alert.is_acknowledged ? 'success' : 'warning'}>
          {alert.is_acknowledged ? 'Acknowledged' : 'Pending'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (alert) => (
        !alert.is_acknowledged && canManage && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedAlert(alert);
              setShowAcknowledgeDialog(true);
            }}
          >
            Acknowledge
          </Button>
        )
      ),
    },
  ];

  // Competitor columns
  const competitorColumns: Column<CompetitorAnalysis>[] = [
    {
      key: 'name',
      header: 'Competitor',
      render: (competitor) => (
        <div>
          <div className="font-medium">{competitor.name}</div>
          <div className="text-sm text-gray-500">{competitor.region}</div>
        </div>
      ),
    },
    {
      key: 'total_products',
      header: 'Products',
      render: (competitor) => competitor.total_products.toLocaleString(),
    },
    {
      key: 'average_pricing',
      header: 'Avg Price',
      render: (competitor) => formatCurrency(competitor.average_pricing),
    },
    {
      key: 'pricing_strategy',
      header: 'Strategy',
      render: (competitor) => (
        <Badge variant="primary">{competitor.pricing_strategy}</Badge>
      ),
    },
    {
      key: 'market_share',
      header: 'Market Share',
      render: (competitor) => `${competitor.market_share.toFixed(1)}%`,
    },
    {
      key: 'last_analyzed',
      header: 'Last Analyzed',
      render: (competitor) => formatDate(competitor.last_analyzed),
    },
  ];

  // Forecast columns
  const forecastColumns: Column<DemandForecast>[] = [
    {
      key: 'product_name',
      header: 'Product',
      render: (forecast) => (
        <div>
          <div className="font-medium">{forecast.product_name}</div>
          <div className="text-sm text-gray-500">{forecast.sku}</div>
        </div>
      ),
    },
    {
      key: 'current_demand',
      header: 'Current Demand',
      render: (forecast) => forecast.current_demand.toLocaleString(),
    },
    {
      key: 'forecast_demand',
      header: 'Forecast Demand',
      render: (forecast) => (
        <div className="flex items-center space-x-2">
          <span>{forecast.forecast_demand.toLocaleString()}</span>
          <span className={forecast.forecast_demand > forecast.current_demand ? 'text-green-600' : 'text-red-600'}>
            ({forecast.forecast_demand > forecast.current_demand ? '+' : ''}{((forecast.forecast_demand - forecast.current_demand) / forecast.current_demand * 100).toFixed(1)}%)
          </span>
        </div>
      ),
    },
    {
      key: 'forecast_period',
      header: 'Period',
      render: (forecast) => forecast.forecast_period,
    },
    {
      key: 'confidence_score',
      header: 'Confidence',
      render: (forecast) => `${(forecast.confidence_score * 100).toFixed(0)}%`,
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (forecast) => formatDate(forecast.created_at),
    },
  ];

  if (summaryLoading) {
    return (
      <PageFrame title="Market Intelligence">
        <div className="space-y-6">
          <SkeletonLoader width="100%" height="200px" variant="rect" />
          <SkeletonLoader width="100%" height="400px" variant="rect" />
        </div>
      </PageFrame>
    );
  }

  if (summaryError) {
    return (
      <PageFrame title="Market Intelligence">
        <ErrorState error={normalizeApiError(summaryError as unknown as ApiError)} />
      </PageFrame>
    );
  }

  return (
    <PageFrame title="Market Intelligence">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {(['overview', 'signals', 'competitors', 'forecasts', 'alerts', 'recommendations'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && summary && (
        <div className="space-y-6">
          {/* Region Selector */}
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Filter by region..."
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {summary.map((region, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-500">{region.region}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Stores</span>
                      <span className="font-medium">{region.total_stores}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Price</span>
                      <span className="font-medium">{formatCurrency(region.average_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Demand Index</span>
                      <span className="font-medium">{region.demand_index.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Competitors</span>
                      <span className="font-medium">{region.competitor_count}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Alerts */}
          {alerts && alerts.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts.alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <Badge variant={alert.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                          {alert.severity}
                        </Badge>
                        <span className="font-medium">{alert.title}</span>
                        <span className="text-sm text-gray-500">{formatDate(alert.created_at)}</span>
                      </div>
                      {!alert.is_acknowledged && canManage && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedAlert(alert);
                            setShowAcknowledgeDialog(true);
                          }}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Price Signals Tab */}
      {activeTab === 'signals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Input
              placeholder="Search signals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                onClick={() => handleExportSignals('csv')}
                loading={exportSignalsMutation.isPending}
              >
                Export CSV
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleExportSignals('excel')}
                loading={exportSignalsMutation.isPending}
              >
                Export Excel
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Price Signals</CardTitle>
            </CardHeader>
            <CardContent>
              {signalsLoading ? (
                <SkeletonLoader width="100%" height="400px" variant="rect" />
              ) : signals && signals.signals.length > 0 ? (
                <DataTable
                  columns={signalColumns}
                  data={signals.signals}
                />
              ) : (
                <EmptyState
                  title="No Signals"
                  body="No price signals found."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Competitors Tab */}
      {activeTab === 'competitors' && (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Filter by region..."
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Competitor Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {competitorsLoading ? (
                <SkeletonLoader width="100%" height="400px" variant="rect" />
              ) : competitors && competitors.length > 0 ? (
                <DataTable
                  columns={competitorColumns}
                  data={competitors}
                />
              ) : (
                <EmptyState
                  title="No Competitors"
                  body="No competitor data found."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Forecasts Tab */}
      {activeTab === 'forecasts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {canManage && (
                <Button variant="primary" onClick={() => setShowGenerateForecastDialog(true)}>
                  Generate Forecast
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                onClick={() => handleExportForecasts('csv')}
                loading={exportForecastsMutation.isPending}
              >
                Export CSV
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleExportForecasts('excel')}
                loading={exportForecastsMutation.isPending}
              >
                Export Excel
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Demand Forecasts</CardTitle>
            </CardHeader>
            <CardContent>
              {forecastsLoading ? (
                <SkeletonLoader width="100%" height="400px" variant="rect" />
              ) : forecasts && forecasts.length > 0 ? (
                <DataTable
                  columns={forecastColumns}
                  data={forecasts}
                />
              ) : (
                <EmptyState
                  title="No Forecasts"
                  body="No demand forecasts available."
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <Card>
          <CardHeader>
            <CardTitle>Market Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <SkeletonLoader width="100%" height="400px" variant="rect" />
            ) : alerts && alerts.alerts.length > 0 ? (
              <DataTable
                columns={alertColumns}
                data={alerts.alerts}
              />
            ) : (
              <EmptyState
                title="No Alerts"
                body="No market alerts at this time."
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations Tab */}
      {activeTab === 'recommendations' && recommendations && (
        <div className="space-y-6">
          {recommendations.map((rec) => (
            <Card key={rec.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{rec.title}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant={rec.priority === 'HIGH' ? 'warning' : 'secondary'}>
                      {rec.priority}
                    </Badge>
                    <Badge variant="primary">{rec.type}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{rec.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Expected Impact:</span> {rec.expected_impact}
                  </div>
                  <div>
                    <span className="font-medium">Effort Required:</span> {rec.effort_required}
                  </div>
                  {rec.due_date && (
                    <div>
                      <span className="font-medium">Due Date:</span> {formatDate(rec.due_date)}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge variant={rec.status === 'COMPLETED' ? 'success' : 'warning'}>
                      {rec.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Acknowledge Alert Dialog */}
      <ConfirmDialog
        open={showAcknowledgeDialog}
        title="Acknowledge Alert"
        body={`Are you sure you want to acknowledge this alert: "${selectedAlert?.title}"?`}
        confirmLabel={acknowledgeMutation.isPending ? 'Acknowledging...' : 'Acknowledge'}
        onConfirm={handleAcknowledgeAlert}
        onCancel={() => {
          setShowAcknowledgeDialog(false);
          setSelectedAlert(null);
        }}
      />

      {/* Generate Forecast Dialog */}
      <ConfirmDialog
        open={showGenerateForecastDialog}
        title="Generate Demand Forecast"
        body="Enter the product details and forecast period"
        confirmLabel={generateForecastMutation.isPending ? 'Generating...' : 'Generate'}
        onConfirm={handleGenerateForecast}
        onCancel={() => {
          setShowGenerateForecastDialog(false);
          setForecastForm({ product_id: '', forecast_period: '' });
        }}
      />
    </PageFrame>
  );
}
