/**
 * src/pages/Dashboard.tsx
 * Oracle Document sections consumed: 3, 7, 12
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
import { PageFrame } from '@/components/layout/PageFrame';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { DataTable } from '@/components/ui/DataTable';
import { useStoreProfileQuery } from '@/hooks/store';
import { useDailySummaryQuery, useTransactionsQuery } from '@/hooks/transactions';
import { useProductsQuery } from '@/hooks/inventory';
import { normalizeApiError } from '@/utils/errors';

export default function DashboardPage() {
  const storeProfile = useStoreProfileQuery();
  const dailySummary = useDailySummaryQuery();
  const recentTransactions = useTransactionsQuery({ page: 1, page_size: 5 });
  const recentProducts = useProductsQuery({ page: 1, page_size: 5 });

  if (storeProfile.isError || dailySummary.isError || recentTransactions.isError || recentProducts.isError) {
    const dashboardError = storeProfile.error
      ? normalizeApiError(storeProfile.error)
      : dailySummary.error
        ? normalizeApiError(dailySummary.error)
        : recentTransactions.error
          ? normalizeApiError(recentTransactions.error)
          : recentProducts.error
            ? normalizeApiError(recentProducts.error)
            : { message: 'Unable to load dashboard.', status: 500 };

    return <ErrorState error={dashboardError} onRetry={() => {
      void storeProfile.refetch();
      void dailySummary.refetch();
      void recentTransactions.refetch();
      void recentProducts.refetch();
    }} />;
  }

  if (storeProfile.isLoading || dailySummary.isLoading || recentTransactions.isLoading || recentProducts.isLoading) {
    return (
      <PageFrame title="Dashboard" subtitle="Overview of your store performance and operational status.">
        <div className="grid grid--3">
          <SkeletonLoader variant="rect" height={110} />
          <SkeletonLoader variant="rect" height={110} />
          <SkeletonLoader variant="rect" height={110} />
        </div>
        <SkeletonLoader variant="rect" height={280} />
      </PageFrame>
    );
  }

  const store = storeProfile.data;
  const summary = dailySummary.data;
  const transactions = recentTransactions.data?.data ?? [];
  const products = recentProducts.data?.data ?? [];

  return (
    <PageFrame
      title="Dashboard"
      subtitle={store ? `Welcome back to ${store.store_name}.` : 'Welcome to RetailIQ.'}
    >
      <div className="grid grid--3">
        <section className="card"><div className="card__body"><div className="muted">Today’s sales</div><h2 style={{ marginBottom: 0 }}>{summary?.total_sales ?? 0}</h2></div></section>
        <section className="card"><div className="card__body"><div className="muted">Transactions</div><h2 style={{ marginBottom: 0 }}>{summary?.total_transactions ?? 0}</h2></div></section>
        <section className="card"><div className="card__body"><div className="muted">Returns</div><h2 style={{ marginBottom: 0 }}>{summary?.total_returns ?? 0}</h2></div></section>
      </div>

      <section className="card">
        <div className="card__header"><strong>Recent transactions</strong></div>
        <div className="card__body">
          {transactions.length ? (
            <DataTable
              columns={[
                { key: 'id', header: 'Transaction', render: (row) => row.transaction_id },
                { key: 'created', header: 'Created', render: (row) => row.created_at },
                { key: 'mode', header: 'Mode', render: (row) => row.payment_mode },
                { key: 'return', header: 'Return', render: (row) => (row.is_return ? 'Yes' : 'No') },
              ]}
              data={transactions}
            />
          ) : (
            <EmptyState title="No transactions yet" body="Transactions will appear here once sales are recorded." />
          )}
        </div>
      </section>

      <section className="card">
        <div className="card__header"><strong>Recent products</strong></div>
        <div className="card__body">
          {products.length ? (
            <DataTable
              columns={[
                { key: 'name', header: 'Product', render: (row) => row.name },
                { key: 'sku', header: 'SKU', render: (row) => row.sku_code },
                { key: 'stock', header: 'Stock', render: (row) => row.current_stock },
                { key: 'status', header: 'Status', render: (row) => (row.is_active ? 'Active' : 'Inactive') },
              ]}
              data={products}
            />
          ) : (
            <EmptyState title="No products yet" body="Create inventory items to see them in the dashboard." />
          )}
        </div>
      </section>
    </PageFrame>
  );
}
