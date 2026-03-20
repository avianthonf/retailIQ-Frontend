/**
 * src/pages/Analytics.tsx
 * Oracle Document sections consumed: 3.2, 5.1, 7.2, 12.7
 * Last item from Section 11 risks addressed here: Mixed response envelopes, cached data staleness
 */
import { useQuery } from '@tanstack/react-query';
import { PageFrame } from '@/components/layout/PageFrame';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { DataTable } from '@/components/ui/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { analyticsApi, type TopProductsResponse } from '@/api/analytics';
import { formatCurrency } from '@/utils/numbers';
import type { ApiError } from '@/types/api';

// Analytics data types based on Oracle Section 4.1
interface _RevenueMetrics {
  total_revenue: number;
  total_profit: number;
  total_orders: number;
  average_order_value: number;
  growth_rate?: number;
}

interface _TopProduct {
  product_id: string;
  name: string;
  sku_code: string;
  total_sold: number;
  revenue: number;
}

interface _CategoryBreakdown {
  category_id: string;
  name: string;
  revenue: number;
  profit: number;
  percentage: number;
}

interface _PaymentModeSummary {
  payment_mode: string;
  count: number;
  amount: number;
  percentage: number;
}

export default function Analytics() {
  const {
    data: revenueMetrics,
    isLoading: loadingRevenue,
    error: revenueError,
  } = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: () => analyticsApi.getRevenueMetrics(),
    staleTime: 60000, // 60 seconds cache per Oracle Section 5.12
  });

  const {
    data: topProducts,
    isLoading: loadingProducts,
    error: productsError,
  } = useQuery({
    queryKey: ['analytics', 'top-products'],
    queryFn: () => analyticsApi.getTopProducts(),
    staleTime: 60000,
  });

  const {
    data: categoryBreakdown,
    isLoading: loadingCategories,
    error: categoriesError,
  } = useQuery({
    queryKey: ['analytics', 'categories'],
    queryFn: () => analyticsApi.getCategoryBreakdown(),
    staleTime: 60000,
  });

  const {
    data: paymentModes,
    isLoading: loadingPayments,
    error: paymentsError,
  } = useQuery({
    queryKey: ['analytics', 'payment-modes'],
    queryFn: () => analyticsApi.getPaymentModeSummary(),
    staleTime: 60000,
  });

  const handleRetry = () => {
    window.location.reload();
  };

  // Revenue Metrics Cards
  const renderRevenueCards = () => {
    if (loadingRevenue) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <SkeletonLoader width="60%" height="20px" variant="text" />
              </CardHeader>
              <CardContent>
                <SkeletonLoader width="80%" height="32px" variant="text" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (revenueError) {
      return (
        <ErrorState
          error={revenueError as unknown as ApiError}
          onRetry={handleRetry}
        />
      );
    }

    if (!revenueMetrics) return null;

    const metrics = [
      { label: 'Total Revenue', value: formatCurrency(revenueMetrics.total_revenue), growth: revenueMetrics.growth_rate },
      { label: 'Total Profit', value: formatCurrency(revenueMetrics.total_profit) },
      { label: 'Total Orders', value: revenueMetrics.total_orders.toLocaleString() },
      { label: 'Avg Order Value', value: formatCurrency(revenueMetrics.average_order_value) },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.growth !== undefined && (
                <div className={`text-sm mt-1 ${metric.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.growth >= 0 ? '+' : ''}{metric.growth.toFixed(1)}%
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Top Products Table
  const renderTopProducts = () => {
    const columns = [
      {
        key: 'name',
        header: 'Product Name',
        render: (row: TopProductsResponse) => row.name,
      },
      {
        key: 'sku_code',
        header: 'SKU',
        render: (row: TopProductsResponse) => row.sku_code,
      },
      {
        key: 'total_sold',
        header: 'Units Sold',
        render: (row: TopProductsResponse) => row.total_sold.toLocaleString(),
      },
      {
        key: 'revenue',
        header: 'Revenue',
        render: (row: TopProductsResponse) => formatCurrency(row.revenue),
      },
    ];

    if (loadingProducts) {
      return (
        <Card>
          <CardHeader>
            <SkeletonLoader width="30%" height="24px" variant="text" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between">
                  <SkeletonLoader width="40%" height="20px" variant="text" />
                  <SkeletonLoader width="20%" height="20px" variant="text" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (productsError) {
      return (
        <ErrorState
          error={productsError as unknown as ApiError}
          onRetry={handleRetry}
        />
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={topProducts || []}
          />
        </CardContent>
      </Card>
    );
  };

  // Category Breakdown
  const renderCategoryBreakdown = () => {
    if (loadingCategories) {
      return (
        <Card>
          <CardHeader>
            <SkeletonLoader width="30%" height="24px" variant="text" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <SkeletonLoader width="30%" height="16px" variant="text" />
                    <SkeletonLoader width="15%" height="16px" variant="text" />
                  </div>
                  <SkeletonLoader width="100%" height="8px" variant="rect" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (categoriesError) {
      return (
        <ErrorState
          error={categoriesError as unknown as ApiError}
          onRetry={handleRetry}
        />
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categoryBreakdown?.map((category: {
              category_id: string;
              name: string;
              revenue: number;
              profit: number;
              percentage: number;
            }) => (
              <div key={category.category_id}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{category.name}</span>
                  <span className="text-sm text-gray-600">
                    {formatCurrency(category.revenue)} ({category.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Payment Modes Summary
  const renderPaymentModes = () => {
    if (loadingPayments) {
      return (
        <Card>
          <CardHeader>
            <SkeletonLoader width="30%" height="24px" variant="text" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center">
                  <SkeletonLoader width="80%" height="32px" variant="text" />
                  <SkeletonLoader width="60%" height="16px" variant="text" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (paymentsError) {
      return (
        <ErrorState
          error={paymentsError as unknown as ApiError}
          onRetry={handleRetry}
        />
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {paymentModes?.map((mode: {
              payment_mode: string;
              count: number;
              amount: number;
              percentage: number;
            }) => (
              <div key={mode.payment_mode} className="text-center">
                <div className="text-2xl font-bold">{mode.percentage.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">{mode.payment_mode}</div>
                <div className="text-xs text-gray-500">{mode.count} orders</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <PageFrame title="Analytics" subtitle="Owner-level reporting and cache-backed metrics">
      {/* ⚠️ RISK [MEDIUM]: Analytics data is cached for 60 seconds and may be stale */}
      <div className="space-y-6">
        {renderRevenueCards()}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderTopProducts()}
          {renderPaymentModes()}
        </div>
        
        {renderCategoryBreakdown()}
      </div>
    </PageFrame>
  );
}
